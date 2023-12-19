const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const CloudFlareDB = require('./db.js');

var ListOfRecordIds = [];
var requests = 0;//Need to keep track of our api request amounts to ensure we are within the limit!
const maxRequests = 1000 //Limit to allow atleast 200 requests to be performed from the dashboard incase we need to flush or restore etc..!
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
    const maxRetries = 23; // Adjust as needed //this will allow no more then 6 minutes of retrying which it really shouldnt go that far but just incase!
    let retryCount = 0;

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
              const RecordObj = {
                clientId: clientId,
                recordId: recordId
              }
              ListOfRecordIds.push(RecordObj);
              console.log('ListOfRecordIds:', ListOfRecordIds);
              console.log('Record Obj:', RecordObj);
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
        await generateSubDomain(clientId, ip).then(resolve).catch(reject);
        }
    }catch (error){
      console.log(error);
      // Retry if retry count is less than the maximum allowed retries
      if (retryCount < maxRetries) {
        retryCount++;
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
    await attemptRequest();
  });
}


function removeSubDomain(clientId){
  const generatedSubDomains = CloudFlareDB.prepare('SELECT * FROM "generatedSubDomains"  ORDER BY "clientId" ASC LIMIT 0, 49999').run();

  /*if (ListOfRecordIds.includes(clientId)){
    console.log('Found record Successfully able to remove!');
  }*/
  ///var recordObj = ListOfRecordIds.find((r)=> r.clientId === clientId);
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

  }catch(e){
    console.log(e);
  }
}

function cloudFlareInit(){
  const filePath = path.join(process.cwd(), 'Cloudflare-Backups', 'dnsrecords.txt');
  importDNSRecordsFromCloudflare(filePath);
}

module.exports = { importDNSRecordsFromCloudflare, exportDNSRecordsToCloudFlare, generateSubDomain, removeSubDomain, cleanUpCloudFlareAndExit, cloudFlareInit }