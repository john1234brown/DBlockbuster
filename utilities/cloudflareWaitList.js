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
        console.log(obj);
        console.log(obj.clientId);
        console.log(obj.clientIp);
        //const success = await generateSubDomain(obj.clientId, obj.clientIp);
        /*if (success){
          console.log('Successfully added this client parent post port Message get this socket by clientId, and send them the response of completion!');

        }else if (success === false){
          console.log('Failed adding this client parentPort Post and remove this socket and have them retry!');

        }*/
      }

      isProcessingWaitlist = false;
    }
  }catch(e){
    console.log(e);
    isProcessingWaitlist = false;
  }
}
setInterval(processWaitlist, 5*1000); // Check every 5 seconds! (adjust as needed)!