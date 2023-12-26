const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const CloudFlareDB = require('./db.js');
const { max } = require('lodash');

var requests = 0;//Need to keep track of our api request amounts to ensure we are within the limit!
const maxRequests = 1200 //Limit to allow atleast 200 requests to be performed from the dashboard incase we need to flush or restore etc..!
/*Also we will use a backup and restore dns Record system
*/
//To ensure this doesnt get heavily flooded we will potentially put a wait list functionality in so it doesnt await the generateSubDomain inside the main websocket instance and potentially halt new Nodes from connecting
//
const timer = setInterval(()=> {requests = 0;}, 5 * 60 * 1000);//Request limit reset every 5 minutes! // Might include a last epoch check to ensure server hasn't froze!

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSubDomain(clientId, ip){
  return new Promise(async (resolve, reject) => {
    const maxRetries = 43; // Adjust as needed //this will allow no more then 12 minutes of retrying which it really shouldnt go that far but just incase!

    const attemptRequest = async () => {
    try {
        if (requests<maxRequests){
          requests=requests+1;
          const zoneIdentifier = process.env.CLOUDFLARE_ZONE_ID;
          const apiKey = process.env.CLOUDFLARE_API;
          const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneIdentifier}/dns_records`;
        
          const headers = {
            'Content-Type': 'application/json',
            'X-Auth-Email': 'john1234brown23@gmail.com',
            'Authorization': `Bearer ${apiKey}`
          };
        
          const dnsRecordData = {
            "content": ip,
            "name": "relay-"+clientId+".dblockbuster.com",
            "proxied": true,
            "type": "A",
            "comment": "Automated SubDomain provided by us for a Peer Hosted Video Relay Server for our service.",
            "tags": [],
            "ttl": 3600
          };
        
          axios.post(apiUrl, dnsRecordData, { headers }).then(response => {
            console.log('Response:', response.data);
            if (response.data.success === true){
              // Extract and store the id in ListOfRecordIds
              const recordId = response.data.result.id;
              CloudFlareDB.prepare('INSERT INTO "generatedSubDomains"("clientId","subDomain","subDomainId","clientIp") VALUES (?,?,?,?)').run(clientId, 'relay-'+clientId+'.dblockbuster.com', recordId, ip);
              console.log('Added RecordId:', recordId, 'For Client:', clientId, 'With the ip of:', ip);
              resolve(true);
            }else {
                console.log('Error adding Subdomain for relay:', clientId,"\nWith the ip address:", ip,"\nData:",response.data);
                reject(false);
            }
          }).catch(error => {
              console.error('Error adding Subdomain for relay:', clientId, "\nWith the ip address:", ip, "Error Messages:\n", error.response ? error.response.data : error.message);
              reject(false);
          });
        }else {
        //Set a timeout and also await the timed out promise this will generate a infinite retry promise that will stop when request amount is exceeded!
        await delay(15*1000);
        resolve(await generateSubDomain(clientId, ip));
        }
    }catch (error){
      console.log(error);
      // Retry if retry count is less than the maximum allowed retries
      if (retryCount < maxRetries) {
        retryCount = retryCount+1;
        console.log(`Retrying (${retryCount}/${maxRetries})...`);
        await delay(15 * 1000);
        await attemptRequest();
      } else {
        console.log(`Exceeded maximum retries (${maxRetries}). Giving up.`);
        reject(false);
      }
    }
    };

    //Start the first attempt
    let retryCount = 0;
    await attemptRequest();
  });
}

async function removeSubDomain(clientId) {
  return new Promise(async (resolve, reject) => {
    const result = CloudFlareDB.prepare('SELECT "subDomainId" FROM "generatedSubDomains" WHERE "clientId"=?').get(clientId);
    const subDomainId = result.subDomainId;
    const maxRetries = 43; // Adjust as needed

    const attemptRequest = async (clientId, subDomainId) => {
      try {
        if (requests < maxRequests) {
          requests = requests + 1;

          const zoneIdentifier = process.env.CLOUDFLARE_ZONE_ID;
          const apiKey = process.env.CLOUDFLARE_API;
          const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneIdentifier}/dns_records/${subDomainId}`;

          const headers = {
            'Content-Type': 'application/json',
            'X-Auth-Email': 'john1234brown23@gmail.com',
            'Authorization': `Bearer ${apiKey}`
          };

          const response = await axios.delete(apiUrl, { headers });

          if (response.data.success === true) {
            // Remove from the database after successful Cloudflare fetch
            CloudFlareDB.prepare('DELETE FROM "generatedSubDomains" WHERE "clientId" = ? AND "subDomainId" = ?').run(clientId, subDomainId);

            console.log('Removed SubdomainId:', subDomainId, 'For Client:', clientId);
            resolve(true);
          } else {
            console.log('Error removing Subdomain for relay:', clientId, '\nData:', response.data);
            resolve(false);
          }
        } else {
          //Set a timeout and also await the timed out promise this will generate a infinite retry promise that will stop when request amount is exceeded!
          console.log('Max requests reached. Waiting for the rate limits to reset.');
          await delay(1 * 15 * 1000); // Wait for 15 seconds before checking again
          resolve(await attemptRequest(clientId, subDomainId));
        }
      } catch (error) {
        console.error('Error removing subdomain:', error.message);

        // Retry if retry count is less than the maximum allowed retries
        if (retryCount < maxRetries) {
          retryCount = retryCount+1;
          console.log(`Retrying (${retryCount}/${maxRetries})...`);
          await delay(15 * 1000);
          await attemptRequest(clientId, subDomainId);
        } else {
          console.log(`Exceeded maximum retries (${maxRetries}). Giving up.`);
          reject(false);
        }
      }
    };

    
    let retryCount = 0;
    await attemptRequest(clientId, subDomainId); // Start the first attempt
  });
}



async function removeSubDomains() {
  return new Promise(async (resolve, reject) => {
    const maxRetries = 43; // Adjust as needed
    let retries = 0;

    const attemptRequest = async (clientId, subDomainId) => {
      try {
        if (requests < maxRequests) {
          requests = requests + 1;

          const zoneIdentifier = process.env.CLOUDFLARE_ZONE_ID;
          const apiKey = process.env.CLOUDFLARE_API;
          const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneIdentifier}/dns_records/${subDomainId}`;

          const headers = {
            'Content-Type': 'application/json',
            'X-Auth-Email': 'john1234brown23@gmail.com',
            'Authorization': `Bearer ${apiKey}`
          };

          const response = await axios.delete(apiUrl, { headers });

          if (response.data.success === true) {
            // Remove from the database after successful Cloudflare fetch
            CloudFlareDB.prepare('DELETE FROM "generatedSubDomains" WHERE "clientId" = ? AND "subDomainId" = ?').run(clientId, subDomainId);

            console.log('Removed SubdomainId:', subDomainId, 'For Client:', clientId);
            return true;
          } else {
            console.log('Error removing Subdomain for relay:', clientId, '\nData:', response.data);
            return false;
          }
        } else {
          console.log('Max requests reached. Waiting for the rate limits to reset.');
          await delay(1 * 15 * 1000); // Wait for 15 seconds before checking again
          return await attemptRequest(clientId, subDomainId);
        }
      } catch (error) {
        console.error('Error removing subdomain:', error.message);
        return false;
      }
    };

    try {
      const generatedSubDomains = CloudFlareDB.prepare('SELECT * FROM "generatedSubDomains" ORDER BY "clientId" ASC LIMIT 0, 49999').all();

      for (const obj of generatedSubDomains) {
        let success = false;
        while (!success && retries < maxRetries) {
          try {
            success = await attemptRequest(obj.clientId, obj.subDomainId);
          } catch (e) {
            console.log(e);
          } finally {
            retries = retries+1;
          }
        }

        if (!success) {
          console.log(`Failed to remove SubdomainId: ${obj.subDomainId} after ${maxRetries} retries. For Client: ${obj.clientId}`);
        }
      }

      resolve('Operation completed successfully');
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}


function exportDNSRecordsToCloudFlare(filePath) {
  return new Promise(async (resolve, reject) => {
    if (requests<maxRequests){
      requests = requests+1;//Increment regardless if its a failed send to ensure no rate limits are exceeded!
      try {
        const zoneIdentifier = process.env.CLOUDFLARE_ZONE_ID;
        const apiKey = process.env.CLOUDFLARE_API;
        const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneIdentifier}/dns_records/import`;

        const form = new FormData();
        const dnsRecords = await fs.promises.readFile(filePath, 'utf8');

        form.append('file', dnsRecords);

        const headers = {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${apiKey}`
        };

        const response = await axios.post(apiUrl, form, { headers });

        console.log('Response:', response.data);
        resolve(response.data);
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        reject(error);
      }
    }else if(requests===maxRequests){
      //Set Timeout to retry again in a minute because request limits have been reached!
      setTimeout(await exportDNSRecordsToCloudFlare(filePath), (1*60*1000));
    }
  });
}


async function importDNSRecordsFromCloudflare(filePath) {
  if (requests<maxRequests){
    requests = requests+1;//Increment regardless if its a failed send to ensure no rate limits are exceeded!
    const zoneIdentifier = process.env.CLOUDFLARE_ZONE_ID;
    const apiKey = process.env.CLOUDFLARE_API;
    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneIdentifier}/dns_records/export`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    try {
      const response = await axios.get(apiUrl, { headers });

      // Write the raw response data to the specified file
      fs.writeFileSync(filePath, response.data);

      console.log(`DNS records exported successfully to ${filePath}`);
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  }else if(requests===maxRequests){
    //Set Timeout to retry again in a minute because request limits have been reached!
    setTimeout(await importDNSRecordsFromCloudflare(filePath), (1*60*1000));
  }
}

async function cleanUpCloudFlareAndExit(){
  try {
    //console.log('Exporting local records to cloudflare!');
    //const filePath = path.join(process.cwd(), 'Cloudflare-Backups', 'dnsrecords.txt');
    //console.log(await exportDNSRecordsToCloudFlare(filePath));
    await removeSubDomains();
    return;
  }catch(e){
    console.log(e);
  }
}

function cloudFlareInit(){
  const filePath = path.join(process.cwd(), 'Cloudflare-Backups', 'dnsrecords.txt');
  importDNSRecordsFromCloudflare(filePath);
}

module.exports = { importDNSRecordsFromCloudflare, exportDNSRecordsToCloudFlare, generateSubDomain, removeSubDomain, cleanUpCloudFlareAndExit, cloudFlareInit }