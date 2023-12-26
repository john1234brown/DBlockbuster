const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const http = require("https");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fastDeepEqual = require('fast-deep-equal');
const isEqual = require('lodash/isEqual');
const { es, ss, containsAnySubstring } = require('./utilities/sanitizers.js');
const { cleanUpCloudFlareAndExit, cloudFlareInit, generateSubDomain, removeSubDomain } = require("./utilities/cloudflare");
//cloudFlareInit();
const CloudFlareDB = require('./utilities/db.js');
const { Worker } = require("node:worker_threads");
const { CheckIP, CheckNodeIP } = require('./utilities/ratelimit.js');

// Assuming wss has a property named 'clients' which is a Map
function findWebSocketClientByClientId(clientId) {
  const client = nodes.find((node) => node.id === clientId);
  return client ? client : null;
}

function startCloudFlareWaitListWorker() {
  const worker = new Worker(path.join(process.cwd(), 'utilities', 'cloudflareWaitList.js'));
  worker.on('error', (err) => {
    console.log(err);
    worker.terminate();//Stop current worker!
  });
  worker.on('exit', () => {
    //Restart the worker on exit! most likely crashed on error!
    startCloudFlareWaitListWorker();
  });

  worker.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      switch (data.type){
        case 'success':
          //Here we process the returned message and process the queued ITEMS!
          const client = findWebSocketClientByClientId(data.id);
          if (client){
            console.log('Client is:', client);
            const newVideoStatus = {
              id: client.id,
              domain: client.domain,
              port: client.port,
              broadcasters: client.broadcasters,
              streamers: client.streamers,
            };
            videonodesStatus.push(newVideoStatus);
            const newStatus = {
              id: client.id,
              domain: client.domain,
              port: client.port,
              providers: client.providers,
              requesters: client.requesters,
            };
            nodesStatus.push(newStatus);
            const newProviderStatus = {
              id: client.id,
              domain: client.domain,
              port: client.port,
              providersStatus: client.providersStatus,
            };
            lazyProvidersStatus.push(newProviderStatus);
            var factNewOther = {
              type: "authenticated",
              nodeId: client.id,
              domain: client.domain,
              port: client.port,
              msg: FACTSOTHER.msg,
              msg2:'You have a generated subdomain located at relay-'+data.id+'.dblockbuster.com',
              connectionType: client.connectionType,
            };
            client.ws.send(JSON.stringify(factNewOther));
          }
          break;
        case 'failed':
          //Here we process the failed generate and close this node connection! let them know to retry!

          break;
      }

    }catch(e){
      console.log(e);
    }
  })
}
startCloudFlareWaitListWorker();
//require('dotenv').config();
// readFileSync function must use __dirname get current directory
// require use ./ refer to current directory.
const options = {
  key: fs.readFileSync('key.pem'),
  ca: fs.readFileSync('rsaroot.pem'),
 cert: fs.readFileSync('cert.pem')
};

// Gateway Key Pair
const gatewayKeyPair = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// Store Node Public Keys (for simplicity, use an object; in a real scenario, use a database)
var nodePublicKeys = [];
const app = express();
app.use(express.json());
app.use(cors('*'));


const server = http.createServer(options, app);
const wss = new WebSocket.Server({ server });

const PORT = 8443; //For cloudflare support!
//Nodes are the message servers
var nodes = [];
//This is responsible for generating our status response!
var nodesStatus = [];
var lazyProvidersStatus = []; //Here we utilize this to keep track of the lazy providers storage status and what node there attached to!
var videonodes = [];
var videonodesStatus = [];
var fileHashes = [];
var file2Hashes = [];
/*
 * This will be for the api requesters gateway point later on to be implemented
 * to make a true api access point for the whole system! We will be using this for our movie site!
 * Also Website Developers can choose to use there own message nodes as access points for their websites!
 * So they can easily integrate their websites with the DBlockbuster system!
 * They can still get the proper relayed data from the Gateway! from other nodes!
 * Without bogging down the whole system by going through their own message nodes instead of the gateway like we will be doing!
 */ var requesters = []; //We might implement this in the future! for now they can just use there own message node for there website!
var waitlist = [];
const FACTSOTHER = {
  msg: "This is a websocket gateway provided by DBlockbuster! For the msgs to be relayed from nodes to streamers and vice versa!",
};

function scrambleFiles(files, indices) {
  return new Promise((resolve, reject) => {
    try {
      indices.forEach((index, i) => {
        const otherIndex = indices[(i + 1) % indices.length];
        [files[index], files[otherIndex]] = [files[otherIndex], files[index]];
      });

      resolve(files);
    } catch (error) {
      reject(error);
    }
  });
}

function scrambleFilesSync(files, indices) {
  try {
    indices.forEach((index, i) => {
      const otherIndex = indices[(i + 1) % indices.length];
      [files[index], files[otherIndex]] = [files[otherIndex], files[index]];
    });

    return files;
  } catch (error) {
    console.log(error);
    //throw error;
  }
}
async function readFilesRecursively(folder, fileList = []) {
  try {
    //console.log('Reading File Path:', folder);
    const files = await fs.promises.readdir(folder);

    for (const file of files) {
      const filePath = path.join(folder, file);
      //console.log(filePath);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        // If the current item is a directory, recursively call the function
        await readFilesRecursively(filePath, fileList);
      } else if (stats.isFile()) {
        // If the current item is a file, add its path to the array
        fileList.push(filePath);
      }
    }
    fileList = fileList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return fileList;
  } catch (error) {
    console.error('Error reading files:', error);
    //throw error; // Rethrow the error to handle it elsewhere if needed
  }
}

async function calculateHash(filePath) {
  try {
    // Read file asynchronously
    const data = await fs.promises.readFile(filePath);

    // Calculate hash
    const hash = crypto.createHash('sha256');
    hash.update(data);

    // Return the hash value
    return hash.digest('hex');
  } catch (error) {
    // Handle errors, e.g., file not found, etc.
    console.log(error);
    //throw new Error(`Error calculating hash for file ${filePath}: ${error.message}`);
  }
}
//OutDated Version Deprecated and revoked!!! due to intensive cpu usage from concurent recursive fs usage!
async function deprecated_calculateCombinedHash() {
  try {
  const fileList = await readFilesRecursively(path.join(__dirname, 'LocalTest'));
  //console.log(execpath);
  // Read all files in the directory
  //const files = await readFilesRecursively(__dirname);
  const execFiles = await readFilesRecursively(path.join(__dirname, 'LocalTest', 'node_modules'));
  //console.log('Files amount!', fileList.length);
  //console.log('Sub Files amount!', execFiles.length);
  // Calculate hash for each file (excluding the specified folder)
  const calculateAndSortHashes = async (files) => {
    const hashes = [];
    for (const file of files) {
      const filePath = path.join(file);
      if (fs.statSync(filePath).isFile() && !filePath.includes("tmp") && !filePath.includes('certs') && !filePath.includes('configs')) {
        const fileHash = await calculateHash(filePath);
        hashes.push(fileHash);
      }
    }
    return hashes.sort();
  };

  const fileHashes = await calculateAndSortHashes(fileList);
  const file2Hashes = await calculateAndSortHashes(execFiles);

  // Combine hashes into a single string and calculate hash
  const combinedHash = crypto.createHash('sha256');
  combinedHash.update(fileHashes.join(''));
  //console.log('Amount of Hashes!',fileHashes.length);
  const execHash = crypto.createHash('sha256');
  execHash.update(file2Hashes.join(''));

  const answer = {
    firstHash: combinedHash.digest('hex'),
    secondHash: fileHashes,
    thirdHash: execHash.digest('hex'),
    fourthHash: file2Hashes,
  };

  console.log('Amount of Hashes!', fileHashes.length);
  console.log('Amount2 of Hashes!', file2Hashes.length);
  return answer;
  //return combinedHash.digest('hex');
  //return;
  }catch(e){
    console.log(e);
  }
}

async function saveCombinedHash(){
  try {
  console.log('Building Video Relay Node Merkle Verification File!');
  const fileList = await readFilesRecursively(path.join(__dirname, 'LocalTest'));
  const execFiles = await readFilesRecursively(path.join(__dirname, 'LocalTest', 'node_modules'));
  const calculateAndSortHashes = async (files) => {
    const hashes = [];
    for (const file of files) {
      const filePath = path.join(file);
      if (fs.statSync(filePath).isFile() && !filePath.includes("tmp") && !filePath.includes('certs') && !filePath.includes('configs')) {
        const fileHash = await calculateHash(filePath);
        hashes.push(fileHash);
      }
    }
    return hashes.sort();
  };

  const fileHashes = await calculateAndSortHashes(fileList);
  const file2Hashes = await calculateAndSortHashes(execFiles);

  // Combine hashes into a single string and calculate hash
  const combinedHash = crypto.createHash('sha256');
  combinedHash.update(fileHashes.join(''));
  //console.log('Amount of Hashes!',fileHashes.length);
  const execHash = crypto.createHash('sha256');
  execHash.update(file2Hashes.join(''));

  const answer = {
    firstHash: combinedHash.digest('hex'),
    secondHash: fileHashes,
    thirdHash: execHash.digest('hex'),
    fourthHash: file2Hashes,
  };

  console.log('Amount of Hashes!', fileHashes.length);
  console.log('Amount2 of Hashes!', file2Hashes.length);

  // Save the object to a file
  const filePath = path.join(process.cwd(), 'merkle.json');
  await fs.promises.writeFile(filePath, JSON.stringify(answer, null, 2));

  console.log('Object saved to file successfully.');

  // Load the object from the file without modifying it
  const jsonString = await fs.promises.readFile(filePath, 'utf-8');
  const loadedObject = JSON.parse(jsonString, (key, value) => value, 4);
  /*const loadedObject = JSON.parse(jsonString, (key, value) => {
    if (Array.isArray(value)) {
      return value.slice(); // Return a copy of the array to prevent modification
    }
    return value;
  });*/
  //console.log('Object loaded from file:', loadedObject);

  // Check if the loaded object is equal to the original one
  const isEqualToo = isEqual(answer, loadedObject);
  console.log('Objects are equal:', isEqualToo);
  return;
  //return combinedHash.digest('hex');
  //return;
  }catch(e){
    console.log(e);
  }
}
saveCombinedHash();

async function getCombinedHash() {
  try {
  const filePath = path.join(process.cwd(), 'merkle.json');
  // Load the object from the file without modifying it
  const jsonString = await fs.promises.readFile(filePath, 'utf-8');
  //const loadedObject = JSON.parse(jsonString, (key, value) => value, 4);
  const loadedObject = JSON.parse(jsonString, (key, value) => {
    if (Array.isArray(value)) {
      return value.slice(); // Return a copy of the array to prevent modification
    }
    return value;
  });
  //console.log('Object loaded from file:', loadedObject);
  return loadedObject;
  }catch (e){
    console.log(e);
  }
}

//To generate scramble! if we are doing scramble challenge!
function getRandomNumber() {
  return Math.floor(Math.random() * 1719); // 0 to 1719 (inclusive)
}
function getRandomNumber2() {
  return Math.floor(Math.random() * 1711); // 0 to 1711 (inclusive)
}
function getRandomChallenge(){
  return Math.floor(Math.random() * 4); // 0 to 3 (inclusive) 4 different types of challenges!
}
function getRandomCount(start, end){
  return Math.floor(Math.random() * (end-start+1))+start;
}
function generateRandomRange(start, end, count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * (end - start + 1)) + start);
}
// Function to generate a challenge
function generateChallenge() {
  const type = getRandomChallenge();
  var c1 = [];
  var c2 = [];
  switch (type){
    case 0:
      c1 = generateRandomRange(0, getRandomNumber(), getRandomCount(50, 100)); // { 1, 50, 30, 55, 556 }
      c2 = generateRandomRange(0, getRandomNumber2(), getRandomCount(50, 100));// { 5, 54, 43, 66, 345 }
    break;
    case 1:
      //We will generate a random number of times on how many times we want them to scramble it!
      c1 = generateRandomRange(0, getRandomNumber(), getRandomCount(400, 100));
      c2 = generateRandomRange(0, getRandomNumber2(), getRandomCount(400, 100));
    break;
    case 2:
      //We will generate a random number of times on how many times we want them to scramble it!
      c1 = generateRandomRange(0, getRandomNumber(), getRandomCount(800, 400));
      c2 = generateRandomRange(0, getRandomNumber2(), getRandomCount(800, 400));
    break;
    case 3:
      //We will generate a random number of times on how many times we want them to scramble it!
      c1 = generateRandomRange(0, getRandomNumber(), getRandomCount(1200, 800));
      c2 = generateRandomRange(0, getRandomNumber2(), getRandomCount(1200, 800));
    break;
    case 4:
      c1 = generateRandomRange(0, getRandomNumber(), getRandomCount(2400, 1200));
      c2 = generateRandomRange(0, getRandomNumber2(), getRandomCount(2400, 1200));
    break;
  }

  const end = {
    c: c1,
    c2: c2
  }
  
  return end;
}
//Incomplete verion of the challenge!
async function generateAnswer(challenge){
  const c1 = challenge.c;
  const c2 = challenge.c2;

  const Hashes = await getCombinedHash();

  const c1Hashes = Hashes.secondHash;
  const c2Hashes = Hashes.fourthHash;

  const a1Hashes = await scrambleFiles(c1Hashes, c1);
  const a2Hashes = await scrambleFiles(c2Hashes, c2);
  const combinedHash = crypto.createHash('sha256');
  combinedHash.update(a1Hashes.join(''));
  const firstHash = combinedHash.digest('hex');
  const combinedHash2 = crypto.createHash('sha256');
  combinedHash2.update(a2Hashes.join(''));
  const thirdHash = combinedHash2.digest('hex');
  const answer = {
    firstHash: firstHash,
    secondHash: a1Hashes,
    thirdHash: thirdHash,
    fourthHash: a2Hashes
  }
  return answer;
}

async function verifyNodeResponse(nodeId, signedResponse) {
  try {
    const nodePublicKey = nodePublicKeys[nodeId].publicKey;
    const decoded = jwt.verify(signedResponse, nodePublicKey, {
      algorithm: "RS256",
    });
/*    const ogchecksum = await getCombinedHash();
    console.log('Fast Deep Equal New Checksum:', fastDeepEqual(Object(decoded.challenge.checksum), Object(nodePublicKeys[nodeId].checksum)));
    console.log('Fast Deep Equal New Checksum Using same as scramble:', fastDeepEqual(decoded.challenge.checksum, nodePublicKeys[nodeId].checksum));
    console.log('Additional New Checksum:', isEqual(Object(decoded.challenge.checksum), Object(nodePublicKeys[nodeId].checksum)));
    console.log('Additional New Checksum Using same as scramble:', isEqual(decoded.challenge.checksum, nodePublicKeys[nodeId].checksum));
    console.log('OG check:', isEqual(decoded.challenge.checksum, ogchecksum));
    console.log('Decoded Checksum: is saving to file!:');*/
    //Uncomment below to enable debugging mode!
    /*fs.writeFileSync('./tmpchecksumAnswer.json', JSON.stringify(nodePublicKeys[nodeId].checksum, null, 2));
    fs.writeFileSync('./tmpchecksum.json', JSON.stringify(decoded.challenge.checksum, null, 2));
    console.log('Saving answer checksum:');
    fs.writeFileSync('./tmpscrambleans.json', JSON.stringify(nodePublicKeys[nodeId].answer, null, 2));
    fs.writeFileSync('./tmpcheckscrambleanswer.json', JSON.stringify(decoded.challenge.scrambled, null, 2));*/
    console.log('Original Checksum:', isEqual(decoded.challenge.checksum, nodePublicKeys[nodeId].checksum));
    console.log('Scramble: ', isEqual(decoded.challenge.scrambled, nodePublicKeys[nodeId].answer));
    if (isEqual(decoded.challenge.checksum, nodePublicKeys[nodeId].checksum)){
      console.log('Valid Client!');
      if (isEqual(decoded.challenge.scrambled, nodePublicKeys[nodeId].answer)){
        console.log('Valid Scramble! Valid Client!');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log(error);
    return false; // Failed JWT verification
  }
}

wss.on("connection", (ws, request) => {
  // Access the Headers from the Initial HTTP Request
  const headers = request.headers;
  ws.xForwardedForIP = headers['x-forwarded-for'];
  ws.cFConnectingIP = headers['cf-connecting-ip'];
  if (headers['cf-pseudo-ipv4']){
    ws.ipv4 = ss(es(headers['cf-pseudo-ipv4']));
  }else {
    ws.ipv4 = ss(es(headers['cf-connecting-ip']));
  }
  console.log(headers);
  
  ws.on("message", async (message) => {
    try {
      const newFact = JSON.parse(message);
      //console.log(newFact);
      switch (newFact.connectionType) {
        case "node":
          if (newFact.messageType === 'handshake' || newFact.messageType === 'response' || newFact.messageType === 'Initialize'){
            const safetyCheck = CheckNodeIP(ws.ipv4);
            if (safetyCheck === false){
              //Do Nothing allow them to continue!
            }
            if (safetyCheck === true){
              ws.close();
            }
          }
          switch (newFact.messageType) {
            case "handshake":
              console.log('Handshake started!');
              ws.verified = false;
              const randId = Math.random().toString().slice(2, 11);
              const clientId = Date.now() + randId;
              ws.clientId = clientId;
              ws.connectionType = 'node';
              const nodePublicKey = newFact.publicKey;
              //Generate Checksum For verification!
              const checksum = await getCombinedHash();
              console.log('Amount of hashes in checksum second:', checksum.secondHash.length);
              console.log('Amount of Hashes in checksum fourth:', checksum.fourthHash.length);
              //fs.writeFileSync('./checksum.json', JSON.stringify(checksum, null, 2));
              // Generate a challenge for the node!
              const challenge = generateChallenge();
              //console.log('The Challenge IS:',challenge);
              const answer = await generateAnswer(challenge);
              //console.log('The answer IS:', answer);
              // Save Node's Public Key and Challenge for future verification
              nodePublicKeys[clientId] = {
                publicKey: nodePublicKey,
                response: process.env.key,
                challenge: challenge,
                answer: answer,
                checksum: checksum
              };

              // Example: Send the challenge to the node
              ws.send(
                JSON.stringify({
                  connectionType: "gateway",
                  messageType: "challenge",
                  challenge: challenge
                })
              );
              break;
            case "response":
              // Verify the response from the node
              const nodeId = ws.clientId;
              const signedResponse = newFact.signedResponse;

              if (await verifyNodeResponse(nodeId, signedResponse)) {
                // Continue with the connection
                // ...
                ws.verified = true; // Set the connection to verified! this way we can allow them to move forward!
                console.log("Connection verified");
                // Example: Send an acknowledgment
                ws.send(
                  JSON.stringify({
                    connectionType: "gateway",
                    messageType: "handshake_ack",
                  })
                );
              } else {
                // Handle unauthorized node
                console.log("Unauthorized node");
                ws.close();
              }
              break;
            case "Initialize":
              //eventsNodeHandler(newFact);
              console.log('Client ID:', ws.clientId);
              console.log('Initialize Check:', fastDeepEqual(newFact.key, nodePublicKeys[ws.clientId].checksum));
              if (
                ws.verified === true && fastDeepEqual(nodePublicKeys[ws.clientId].checksum, newFact.key)
              ) {
                /*
                *    Valid Key Passed and they don't have a domain and port already so we need to add them to the waitlist...
                */
                if (newFact.domain === null && newFact.publicIpV4 !== (null && undefined)) {
                  console.log('Valid Key passed on Initialization! They are requesting for subdomain as they didnt provide one lets put them in the waitlist to be generated!');
                  const randId = Math.random().toString().slice(2, 11);
                  const clientId = Date.now() + randId;
                  ws.clientId = clientId;
                  console.log(newFact);
                  ws.publicIpV4 = ss(es(newFact.publicIpV4));
                  ws.generatedSubDomain = true;


                  const result = CloudFlareDB.prepare('INSERT INTO "waitList"("clientId","clientIp","providers","requesters","broadcasters","streamers") VALUES (?,?,?,?,?,?)').run(clientId, ws.publicIpV4, ss(es(newFact.providersAmount)), ss(es(newFact.requestersAmount)), ss(es(newFact.broadcastersAmount)), ss(es(newFact.streamersAmount)));
                  const lastInsertRowId = result.lastInsertRowid;
                  //^ added the client to the db! waitlist!
                  var factNewOther = {
                    type: "authenticated-waitlist",
                    queuePosition: lastInsertRowId,
                    nodeId: clientId,
                    domain: "relay-"+clientId+".dblockbuster.com",
                    port: es(newFact.port),
                    msg: FACTSOTHER.msg,
                    connectionType: es(newFact.connectionType),
                  };
                  console.log(factNewOther);
                  const newClient = {
                    id: clientId,
                    domain: 'relay-'+ws.clientId+'.dblockbuster.com',
                    port: es(newFact.port),
                    providers: es(newFact.providersAmount),
                    requesters: es(newFact.requestersAmount),
                    broadcasters: es(newFact.broadcastersAmount),
                    streamers: es(newFact.streamersAmount),
                    connectionType: es(newFact.connectionType),
                    providersStatus: es(newFact.providersStatus),
                    ws: ws,
                  };
                  nodes.push(newClient);
                  ws.send(JSON.stringify(factNewOther));
                /*
                *    Valid Key Passed and they have a domain and port already so we dont need to add them to the waitlist...
                */
                }else if(newFact.domain !== (null && undefined) && newFact.port !== (null && undefined)){
                  console.log('Valid Key passed on Initialization!');
                  const randId = Math.random().toString().slice(2, 11);
                  const clientId = Date.now() + randId;
                  ws.clientId = clientId;
                  var factNewOther = {
                    type: "authenticated",
                    nodeId: clientId,
                    domain: es(newFact.domain),
                    port: es(newFact.port),
                    msg: FACTSOTHER.msg,
                    connectionType: es(newFact.connectionType),
                  };
                  const newClient = {
                    id: clientId,
                    domain: es(newFact.domain),
                    port: es(newFact.port),
                    providers: es(newFact.providersAmount),
                    requesters: es(newFact.requestersAmount),
                    broadcasters: es(newFact.broadcastersAmount),
                    streamers: es(newFact.streamersAmount),
                    connectionType: es(newFact.connectionType),
                    providersStatus: es(newFact.providersStatus),
                    ws: ws,
                  };
                  nodes.push(newClient);
                  const newVideoStatus = {
                    id: clientId,
                    domain: es(newFact.domain),
                    port: es(newFact.port),
                    broadcasters: es(newFact.broadcastersAmount),
                    streamers: es(newFact.streamersAmount),
                  };
                  videonodesStatus.push(newVideoStatus);
                  const newStatus = {
                    id: clientId,
                    domain: es(newFact.domain),
                    port: es(newFact.port),
                    providers: es(newFact.providersAmount),
                    requesters: es(newFact.requestersAmount),
                  };
                  nodesStatus.push(newStatus);
                  const newProviderStatus = {
                    id: clientId,
                    domain: es(newFact.domain),
                    port: es(newFact.port),
                    providersStatus: es(newFact.providersStatus),
                  };
                  lazyProvidersStatus.push(newProviderStatus);
                  ws.send(JSON.stringify(factNewOther));
                }
              } else {
                ws.close();
              }
              break;

            case "messageRelay":
              if(ws.verified === true){
              processNodeFacts(newFact.fact);
              } else {
                ws.close();
              }
              break;

            case "providerStatus":
              if (ws.verified === true){
              var index = nodesStatus.findIndex((x) => x.id === ws.clientId);
              nodesStatus[index].providers = es(newFact.size);
              } else {
                ws.close();
              }
              break;

            case "requesterStatus":
              if (ws.verified === true){
              var index = nodesStatus.findIndex((x) => x.id === ws.clientId);
              nodesStatus[index].requesters = es(newFact.size);
              } else {
                ws.close();
              }
              break;

            case "broadcasterStatus":
              if (ws.verified === true){
              var index = videonodesStatus.findIndex(
                (x) => x.id === ws.clientId
              );
              videonodesStatus[index].broadcasters = es(newFact.size);
              } else {
                ws.close();
              }
              break;

            case "streamerStatus":
              if (ws.verified === true){
              var index = videonodesStatus.findIndex(
                (x) => x.id === ws.clientId
              );
              videonodesStatus[index].streamers = es(newFact.size);
              } else {
                ws.close();
              }
              break;

            case "lazyProviderStatus":
              if (ws.verified === true){
              var index = lazyProvidersStatus.findIndex(
                (x) => x.id === ws.clientId
              );
              lazyProvidersStatus[index].providersStatus = es(
                newFact.providersStatus
              );
              }
              break;

            case "ping":
              if (ws.verified === true){
              console.log(
                "Ping receieved:",
                newFact.connectionType,
                ws.clientId
              );
              ws.send(
                JSON.stringify({
                  connectionType: "gateway",
                  messageType: "pong",
                })
              );
              }
              break;
            }
          break;

        case "client":
          switch (newFact.messageType) {
            case "status":
              var factNewOther = {
                videoNodes: videonodesStatus,
                nodes: nodesStatus,
              };
              ws.send(JSON.stringify(factNewOther));
              break;
            case "availability":
              //This will return avaliable locations for users to use like which video nodes they can request broadcaster to etc..!
              console.log("VideoNodes:", videonodesStatus);
              console.log("Nodes:", nodesStatus);
              const videoNodes = videonodesStatus.filter(
                (x) => x.streamers < 5000 && x.broadcasters < 500
              );
              const Nodes = nodesStatus.filter(
                (x) => x.requesters < 50000 && x.providers < 50000
              );
              var factNewOther = {
                messageType: "availability",
                videoNodes: videoNodes,
                nodes: Nodes,
              };
              ws.send(JSON.stringify(factNewOther));
              break;
            case "lazyAvailability":
              const size = newFact.fileSize;
              //This will return avaliable locations for users to use like which video nodes they can request broadcaster to etc..!
              const lazyProviders = lazyProvidersStatus.filter((x) =>
                x.filter((y) => y.sizeAvailable)
              );
              var factNewOther = {
                messageType: "lazyAvailability",
                lazyProviders: lazyProviders,
              };
              ws.send(JSON.stringify(factNewOther));
              break;
          }
          break;
      }
    } catch (error) {
      console.log("Websocket On Message Error:", error);
    }
    //console.log('nodeMsg:', newFact);
    ///sendToAllNodes(newFact);
  });

  ws.on("close", () => {
    console.log("Connection closed");
    if (ws.connectionType === 'node' && ws.generatedSubDomain === true){
      removeSubDomain(ws.clientId);
      removeClient(ws);
    }else{
      removeClient(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`);
});

function removeClient(ws) {
  nodes = nodes.filter((client) => client.ws !== ws);
  nodesStatus = nodesStatus.filter((client) => client.id !== ws.clientId);
  videonodes = videonodes.filter((client) => client.ws !== ws);
  videonodesStatus = videonodesStatus.filter(
    (client) => client.id !== ws.clientId
  );
}

/**
 * Sends events to all message nodes.
 *
 * @param {Object} newFact - The new fact object.
 * @param {string} newFact.nodeId - The ID of the node.
 * @param {string} newFact.type - The type of the fact.
 * @param {string} newFact.fact - The fact itself.
 */
function sendToAllNodes(newFact) {
  var nodeId = newFact.nodeId;
  var Type = newFact.type;
  var Fact = newFact.fact;
  var relayedFact = {
    nodeId: nodeId,
    type: Type,
    fact: Fact,
  };
  console.log(relayedFact);

  nodes.forEach((node) => {
    if (node.nodeId !== nodeId) {
      console.log("passing msg:", newFact, "to node:", node.id);
      node.ws.send(JSON.stringify(relayedFact));
    }
  });
}
app.get('/', (req, res) => {
  // Set the content type to HTML
  res.setHeader('Content-Type', 'text/html');

  // Send a simple HTML response
  res.status(200).send('<html><head><title>Hello Browser!</title></head><body><h1>Hello Browser!</h1></body></html>');
});

//app.get('/node', eventsNodeHandler);
//app.get('/videonode', eventsVideoNodeHandler);
//app.get('/requester', eventsRequesterHandler);

/*function addNodeMsg(request, response, next) {
  const newFact = request.body;
  console.log('nodeMsg:', newFact);
  response.json(newFact);
  sendEventsToAllNodes(newFact);
}
*/
//app.post('/nodemsg', addNodeMsg);
//BELOW IS ERROR HANDLING CODE
////////////////////////////////////////////////////////////////////////////////
async function cleanupAndExit(){
  try {
    await cleanUpCloudFlareAndExit();
  } catch (error) {
    console.error('Error on cleanupAndExit in main index.js', error);
  }
  // Perform any other necessary cleanup tasks here...
  process.exit(0);
}

process.on('exit', async () => {
  console.log('Received exit signal, initiating cleanup...');
  await cleanupAndExit();
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal, initiating cleanup...');
  await cleanupAndExit();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal (Ctrl+C), initiating cleanup...');
  await cleanupAndExit();
});
