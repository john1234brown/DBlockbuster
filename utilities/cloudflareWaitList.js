const path = require('path');
const { Worker, isMainThread, parentPort} = require('worker_threads');
const { generateSubDomain } = require('./cloudflare.js');
const CloudFlareDB = require('./db.js');
let isProcessingWaitlist = false;

async function processWaitlist() {
  // Check if the function is already processing the waitlist
  if (isProcessingWaitlist) {
    console.log('Already processing waitlist, skipping...');
    return;
  }
  // Set the flag to indicate that the function is now processing the waitlist
  isProcessingWaitlist = true;

  try {
    const waitlist = CloudFlareDB.prepare('SELECT * FROM "waitList"  ORDER BY "clientId" ASC LIMIT 0, 1200').all();
    if (waitlist){
      //console.log(waitlist);
      for (const obj of waitlist){ 
        console.log("Processing waitlist object:", obj);
        console.log("Processing waitlist object ClientId:", obj.clientId);
        console.log("Processing waitlist object ClientIP:", obj.clientIp);
        const success = await generateSubDomain(obj.clientId, obj.clientIp);
        console.log('Success equals:', success);
        if (success){
          //Use the obj.clientId
          //Parent port post message the client id!
          const message = {
            type: 'success',
            id: obj.clientId,
            ip: obj.clientIp
          }
          parentPort.postMessage(JSON.stringify(message));
          const result = CloudFlareDB.prepare('DELETE FROM "waitList" WHERE "clientId"=? AND "clientIp"=?').run(obj.clientId, obj.clientIp);
          console.log('Remove Results are:', result);

        }else if (success === false){
          console.log('Failed adding this client parentPort Post and remove this socket and have them retry!');
          //Use the obj.clientId
          //Parent port post message the client id!
          const message = {
            type: 'failed',
            id: obj.clientId,
            ip: obj.clientIp
          }
          parentPort.postMessage(JSON.stringify(message));
          const result = CloudFlareDB.prepare('DELETE FROM "waitList" WHERE "clientId"=? AND "clientIp"=?').run(obj.clientId, obj.clientIp);
          console.log('Remove Results are:', result);
        }
      }
      isProcessingWaitlist = false;
    }
  }catch(e){
    console.log(e);
    isProcessingWaitlist = false;
  }
}
setInterval(processWaitlist, 5*1000); // Check every 5 seconds! (adjust as needed)!