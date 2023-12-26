const { calculateCombinedHash, calculateCombinedHashScrambled } = require('./utilities/tCheck.js');
const { crypto, WebSocket, sendEventsToAllProviders, generateId, tmpFolderConfigPath, s, fs, deleteBroadcasterFile, generateMD5Checksum, storeFullVideoData, checkNewFileTmpFolderSize, ChunkData, path, fetchPublicIPv4, fetchPublicIPv6} = require('./utilities/utility.js');
const express = require("express");
const app = express();
const https = require("https");
const http = require("http");
const isEqual = require('lodash/isEqual');
const options = {
  key: fs.readFileSync('./certs/private-key.pem', 'utf8'),
  ca: fs.readFileSync('./certs/rsaroot.pem'),
 cert: fs.readFileSync('./certs/origin-certificate.pem', 'utf8')
};
const jwt = require('jsonwebtoken');
const config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf-8'));
var server;
if (config.useGeneratedSubDomain === true && config.usingCloudFlareTunnel === false){
  //This will be required to serve over https as cloudflare wont handle upgrading properly!
  server = https.Server(options, app);
  server.listen(config.port, function() {
    console.log("listening on ", config.port, 'using ssl');
  });
}else if (config.useGeneratedSubDomain === false && config.usingCloudFlareTunnel === true){
  //This will server over http as cloudflare tunnels will handle the upgrading properly!
  server = http.Server(app);
  server.listen(config.port, function() {
    console.log("listening on ", config.port);
  });
}
const wss = new WebSocket.Server({ server });
const safeSize = (10 ** 6 / 4) + 1044//
const tmpFolderPath = tmpFolderConfigPath;
let gateway;//For our gateway websocket!

// arrays to store connected clients
let requesters = [];
let providers = [];
let providersStatus = []; //This will be the lazyProviderStatus as its referred to on the gateway server!
let lazyProviders = []; ///This will be the browser clients connected to the server trying to relay to our provider!
// Set up a dictionary to store the connected broadcasters
let broadcasters = [];
// Set up a dictionary to store the connected streamers
let streamers = [];

// This will be a broadcasters Stream data to ensure streamers get the full array of data!
var dataObject = {};
// This will be a broadcasters total chunk dataset to help know when broadcasters finished sending all the chunks!
var totalChunks = {};
// This will be our construction of the full video data!
var fullVideoData = {};

var heartbeatIntervalId;
//This will help us only send a heartbeat ping when a pong is received!
var pongReceived = true;
// Generate a key pair for the node
const nodeKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

//This will sanitize a full nested array with all of its objects so if someone sent a custom property to inject and bypass sanitization checks this will ensure we catch it!
wss.on('error', (err) => {
  console.error(err);
});

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    try {
      if (message.byteLength > safeSize) {
        console.log('Message too large to process message size in byteLength is:', message.byteLength);
        delete message; // Free up memory instantly!
        ws.close(); // Remove websocket connection instantly! to ensure this is not a memory leak or potential dos attack!
        return;
      }
      if (typeof message === 'object'){
        const data = JSON.parse(message);
        //console.log('Msg received', s(message), '\n', s(data));
        console.log('Msg received', s(data));
        console.log('ConnectionType:', s(data.connectionType));
        if (typeof data.connectionType !== 'undefined' && typeof(data.connectionType) === 'string' && typeof(data.messageType) !== 'undefined' && typeof(data.messageType) === 'string'){
          if (s(data.connectionType) === 'Requester') {
            handleRequester(ws, data);
          }
          if (s(data.connectionType) === 'Provider') {
            handleProvider(ws, data);
          }
          if (s(data.connectionType) === 'Broadcaster') {
            handleBroadcaster(ws, data);
          }
          if (s(data.connectionType) === 'Streamer') {
            handleStreamer(ws, data);
          }
        }
      }
      return;      
    } catch (error) {
      handleBroadcasterArrayBuffer(ws, message);
      //console.log('Error parsing message:', typeof(message));
      //console.log('Error parsing instanceof:', message instanceof Object ? message.constructor.name : message.constructor);
      //console.log(error);
    }
  });

  ws.on('close', () => {
    const connectionType = ws.connectionType;

    if (connectionType) {
      handleDisconnect(connectionType, ws);
    }
  });
});

function handleRequester(ws, data) {
  // Handle Requester logic
  // Add to clients.requesters, etc.
  try {
  console.log('Requester:', s(data));
  console.log('MessageType:', s(data.messageType));
  switch (s(data.messageType)){
    case 'Initialize':
      const clientId = Date.now().toString();
      ws.clientId = clientId;
      ws.connectionType = 'Requester';
      const requesterObject = {
        connectionType: 'Requester',
        clientId: clientId,
        id: parseInt(s(data.tmdbId)),
        reqType: s(data.type),
        reqFileType: s(data.filetype),
        reqQuality: s(data.quality) || 'auto',
        reqSeason: parseInt(s(data.season)) || 0,
        reqEpisode: parseInt(s(data.episode)) || 0,
        ws: ws
      };
      // Add requester to the array
      requesters.push(requesterObject);

      //Set the Response
      var json = {
        messageType: "Requesting",
        clientId: clientId,
        id: parseInt(s(data.tmdbId)),
        reqType: s(data.type),
        filetype: s(data.filetype),
        reqQuality: s(data.quality) || 'auto',
        reqSeason: parseInt(s(data.season)) || null,
        reqEpisode: parseInt(s(data.episode)) || null
      }
      ws.send(JSON.stringify({
        messageType: 'RequesterInitialized',
        clientId: clientId
      }))
      console.log('Requester Set for,', requesterObject);
      //postRequestersToGateway();
      //postToGateway(JSON.parse(JSON.stringify(json)));
      sendEventsToAllProviders(JSON.parse(JSON.stringify(json)), wss);
      break;
    case 'Request2Broadcast':
      console.log('Request2Broadcast: Checking Providers');
      const foundProvider = providers.find((provider) => provider.providerId === s(data.providerId) && provider.providerName === s(data.providerUsername));
      
      if (foundProvider) {
        console.log('Request2Broadcast: provider Found:', foundProvider);
        foundProvider.ws.send(JSON.stringify({
          messageType: 'Request2Broadcast',
          clientId: ws.clientId,
          id: parseInt(s(data.id)),
          reqType: s(data.type),
          filetype: s(data.filetype),
          reqSeason: parseInt(s(data.season)),
          reqEpisode: parseInt(s(data.episode)),
          reqQuality: s(data.quality),
          reqFileType: s(data.filetype)
        }));
      }
      break;
    default:
      break;
  }
  }catch(e){
    console.log(e);
  }
  return;
}

function handleProvider(ws, data) {
  // Handle Provider logic
  // Add to clients.providers, etc.
  // Add to providers array etc..
  try {
  switch (s(data.messageType)){
    case 'Initialize':
      const providerId = s(data.providerId);
      const isLazyProviding = s(data.isLazyProviding) || false;
      ws.providerId = providerId;
      ws.providerName = s(data.providerUsername);
      ws.connectionType = 'Provider';
      const providerObject = {
        connectionType: 'Provider',
        providerId: providerId,
        providerName: s(data.providerUsername),
        domain: s(data.domain),
        isLazyProviding: isLazyProviding,
        lazyProvidingSpaceLeft: s(data.lazyProvidingSpaceLeft) || 0,
        ws: ws
      };
      // Add provider to the array
      providers.push(providerObject);
      if (isLazyProviding === true) {
        console.log('Lazy Provider Set for', providerObject);
        const lazyProvider = {
          providerId: providerId,
          providerName: s(data.providerUsername),
          domain: s(data.domain),
          isLazyProviding: s(data.isLazyProviding) || false,
          lazyProvidingSpaceLeft: s(data.lazyProvidingSpaceLeft) || 0
        }
        providersStatus.push(lazyProvider);
      }
      console.log('Provider Set for', providerObject);
      break;
      case 'BroadcastReady':
        const requester = requesters.find(x => x.clientId === s(data.clientId));
        if (requester){
          requester.ws.send(JSON.stringify({
            messageType: 'BroadcastReady',
            providerId: s(data.providerId),
            providerName: s(data.providerUsername),
            broadcasterId: s(data.broadcasterId),
            domain: s(data.domain)
          }));
        }
        break;
      case 'BroadcasterReady':
        const requesterCheck = requesters.find(x => x.id === parseInt(s(data.tmdbId)) && x.reqType === s(data.reqType) && x.reqSeason === parseInt(s(data.reqSeason)) && x.reqEpisode === parseInt(s(data.reqEpisode)) && x.reqFileType === s(data.reqFileType));
        console.log('BroadcasterReady: Checking Requesters', requesterCheck);
        if (requesterCheck){
          requesters.forEach(requester => {
            if (parseInt(requester.id) === parseInt(s(data.tmdbId)) && requester.reqType === s(data.reqType) && requester.reqSeason === s(data.reqSeason) && requester.reqEpisode === s(data.reqEpisode) && requester.reqFileType === s(data.reqFileType)){
              requester.ws.send(JSON.stringify({
                messageType: 'BroadcasterReady',
                providerId: s(data.providerId),
                providerName: s(data.providerUsername),
                broadcasterId: s(data.broadcasterId),
                domain: s(data.domain)
              }));
            }
          });
        }
        break;
      case 'BroadcastEnded':
        // Find the requester with the given clientId
        const requester2 = requesters.find(requester => requester.clientId === s(data.clientId));
        if (requester2) {
          requester2.ws.send(JSON.stringify({
            messageType: 'BroadcastEnded',
            providerId: s(data.providerId),
            providerName: s(data.providerUsername),
            broadcasterId: s(data.broadcasterId),
            domain: s(data.domain)
          }));
        }
        break;
      case 'Providing':
        // Find the requester with the given clientId
        const requester3 = requesters.find(requester => requester.clientId === s(data.clientId));
        if (requester3) {
          console.log('Providing to ', requester3.clientId);
          switch(s(data.reqType)){
            case "movie":
              requester3.ws.send(JSON.stringify({
                messageType: 'Providing',
                providerId: s(data.providerId),
                providerName: s(data.providerUsername),
                id: parseInt(s(data.id)),
                listOfFiles: s(data.listoftypes),
                reqType: s(data.reqType),
                domain: s(data.domain),
              }));
            break;

            case "tv":
              requester3.ws.send(JSON.stringify({
                messageType: 'Providing',
                providerId: s(data.providerId),
                providerName: s(data.providerUsername),
                id: parseInt(s(data.id)),
                listOfFiles: JSON.parse(s(data.listoftypes)),
                reqType: s(data.reqType),
                reqSeason: parseInt(s(data.reqSeason)),
                reqEpisode: parseInt(s(data.reqEpisode)),
                domain: s(data.domain),
              }));
            break;
          }
        }
        break;
      default:
        break;
  }
  }catch(e){
    console.log(e);
  }
  return;
}

function handleBroadcaster(ws, data) {
  // Handle Broadcaster logic
  // Add to clients.broadcasters, etc.
  // Add the broadcaster to the connected broadcasters
  try {
    switch (s(data.messageType)){
      case 'Initialize':
        if (typeof data.providerId !== 'undefined' && typeof(data.tmdbId) !== 'undefined' && typeof(data.typeTvShowOrMovie) !== 'undefined' && typeof(data.filetype) !== 'undefined' && typeof(data.quality) !== 'undefined') {
        generateMD5Checksum(Date.now().toString() + generateId()).then(broadcasterId => {
          ws.broadcasterId = broadcasterId;
          ws.connectionType = 'Broadcaster';
          var broadcaster = {
            broadcasterId: broadcasterId,
            providerId: s(data.providerId),
            filetype: s(data.filetype) || 'mp4',
            typeTvShowOrMovie: s(data.typeTvShowOrMovie),
            quality: s(data.quality), //default to auto for streamers to allow any quality request!
            tmdbId: parseInt(s(data.tmdbId)),
            season: parseInt(s(data.season)) || 0,
            episode: parseInt(s(data.episode)) || 0,
            ws: ws
          }
          broadcasters.push(broadcaster);
          //broadcasters.set({ broadcasterId: broadcasterId, providerId: providerId, filetype: filetype, typeTvShowOrMovie: typeTvShowOrMovie, tmdbId: tmdbId, season: season, episode: episode }, ws);
          console.log(JSON.stringify(broadcasters));
          // Send the broadcaster ID back to the broadcaster
          ws.send(JSON.stringify({ type: 'broadcasterId', broadcasterId: broadcasterId }));
        }).catch(error => {
        console.error('Error occurred while sending broadcasters:', error);
        });
        }else{
          ws.close();
        }
        break;
      case 'ping':
        console.log('Ping Recieved! From Broadcaster:', ws.broadcasterId);
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        break;
      
    }
  }catch(e){
    console.log(e);
  }
  return;
}

function handleStreamer(ws, data) {
  // Handle Streamer logic
  // Add to clients.streamers, etc.
  try {
  switch (s(data.messageType)){
    case 'Initialize':
      const broadcasterCheck = broadcasters.find((x) => x.broadcasterId === s(data.broadcasterId))
      if (!broadcasterCheck){
        ws.send(JSON.stringify({ error: 'NullBroadcaster', message: 'Broadcaster not found' }));
        return;
      }
      if (broadcasterCheck){
        if (typeof(data.providerId) !== 'undefined' && typeof(data.filetype) !== 'undefined' && typeof(data.broadcasterId) !== 'undefined' && typeof(data.tmdbId) !== 'undefined' && typeof(data.typeTvShowOrMovie) !== 'undefined') {
          const streamerId = generateId();
          ws.streamerId = streamerId;
          ws.connectionType = 'Streamer';
          const streamer = {
            streamerId: streamerId,
            broadcasterId: s(data.broadcasterId),
            providerId: s(data.providerId),
            filetype: s(data.filetype) || 'mp4',
            typeTvShowOrMovie: s(data.typeTvShowOrMovie),
            quality: s(data.quality) || 'auto',
            tmdbId: s(data.tmdbId),
            season: s(data.season) || 0,
            episode: s(data.episode) || 0,
            ws: ws
          }
          streamers.push(streamer);
          console.log(JSON.stringify(streamers));
          // Send the broadcaster ID back to the broadcaster
          ws.send(JSON.stringify({ type: 'streamerId', streamerId: streamerId }));
          broadcasterCheck.ws.send(JSON.stringify({ type: 'streamerDetails', streamerId: streamerId, providerId: s(data.providerId), filetype: s(data.filetype), tmdbId: s(data.tmdbId), season: s(data.season), episode: s(data.episode) }));
        }else{
          // Inform the streamer that no matching broadcaster was found
          ws.send(JSON.stringify({ type: 'error', message: 'No matching broadcaster found' }));
          ws.close();
        }
      }
      break;
  }
  }catch(e){
    console.log(e);
  }
  return;
}

function handleBroadcasterArrayBuffer(ws, data){
  try {
  sendForwardStreamMessage(ws, data);
  }catch(e){
    console.log(e);
  }
}





//Finished!
function handleDisconnect(connectionType, ws) {
  // Handle disconnect logic based on connectionType
  // Remove from corresponding clients array
  switch (connectionType) {
    case 'Requester':
      requesters = requesters.filter(client => client.ws !== ws);
      break;
    case 'Provider':
      try {
      providers = providers.filter(client => client.ws !== ws);
      }catch(e){console.log(e);}
      break;
    case 'Broadcaster':
      //broadcasters = broadcasters.filter(client => client.ws !== ws);
      // Remove the broadcaster or streamer from the respective dictionary
      try{
        //Remove the broadcasters HTTP file from the tmp folder!
        deleteBroadcasterFile(ws.broadcasterId, broadcasters.find(client => client.ws === ws));

        // Remove the broadcaster from the dataObject
        delete dataObject[ws.broadcasterId];
        //Remove the broadcaster from the fullVideoData
        delete fullVideoData[ws.broadcasterId];
        //Remove the broadcaster from the totalChunks
        delete totalChunks[ws.broadcasterId];
        // Remove the broadcaster from the broadcasters array
        broadcasters = broadcasters.filter(client => client.ws !== ws);
      }catch(e){console.log(e);}
      break;
    case 'Streamer':
      try {
      streamers = streamers.filter(client => client.ws !== ws);
      console.log('Streamer disconnected:', ws.streamerId);
      /*streamers.forEach((streamer, streamerId) => {
        if (streamer === ws) {
          streamers.delete(streamerId);
        }
      });*/
      }catch(e){console.log(e);}
      break;
    case 'LazyProvider':
      break;
    default:
      break;
  }
  return;
}

//With the usage of chunkData and data validation we can now send the data to the streamer! but something went terribly wrong! but then we found a solution!
async function sendForwardStreamMessage(ws, messageData) {
  console.log(messageData);

  // Extract the broadcaster ID from the WebSocket connection
  if (ws.connectionType === 'Broadcaster'){
    const broadcasterId = ws.broadcasterId;
    if (broadcasterId) {
      // Create a ChunkData object from the received message data
      const chunkData = new ChunkData(new Uint8Array(messageData));
      ///chunkData.deconstruct(messageData);
      console.log('Providing Type: ', s(chunkData.providingType));
      switch (s(chunkData.providingType)) {
        case 0:
          // Broadcaster is sending us a ChunkData as regular http serving method!
          console.log('Index: ', s(chunkData.index), ' Total: ', s(chunkData.totalIndex));
          //console.log(chunkData.data);
          console.log('metaData: ', s(chunkData.metaData));
          console.log('Timestamp: ', s(chunkData.timestamp));
          const totalChunks = s(chunkData.totalIndex);
          // each chunk is average (10 ** 6) / 4 = 250,000 bytes so we will caclulate this here!
          const chunkSize = 10 ** 6 / 4;
          const totalSize = chunkSize * totalChunks;
          //console.log(totalChunks);


          // Check if the broadcaster ID exists in dataObject
          if (!dataObject.hasOwnProperty(broadcasterId)) {
            // If it doesn't exist, create a new array for that broadcasterId
            dataObject[broadcasterId] = [];
          }

          // Check if the chunk index already exists in the array
          const chunkIndexExists = dataObject[broadcasterId].some((c, i) => i === s(chunkData.index));
          //console.log(chunkIndexExists);
          if (!chunkIndexExists) {
            // If the index doesn't exist, add the ChunkData object to the array
            dataObject[broadcasterId][s(chunkData.index)] = chunkData;
            console.log('Added chunk index', s(chunkData.index));
          } else {
            console.error(`Duplicate chunk index received: ${s(chunkData.index)}`);
            return;
          }

          // Check if the full video data has been received
          console.log('TotalChunks', totalChunks[broadcasterId]);
          if (dataObject[broadcasterId].length === totalChunks[broadcasterId]) {
            console.log('Full video data received');

            // Concatenate chunks in order based on chunk indices to form the full video data
            let fullVideoBuffer = Buffer.allocUnsafe(0);
            for await (const chunkData of dataObject[broadcasterId]) {
              if (!chunkData) {
                console.error(`Missing chunk index: ${s(chunkData.chunkIndex)}`);
                continue;
              }
              fullVideoBuffer = Buffer.concat([fullVideoBuffer, chunkData.data]);
            }

            console.log('Im still executing!');

            // Wait for the full video data to be stored in the cache
            if (checkNewFileTmpFolderSize(fullVideoBuffer.byteLength) === true){
              storeFullVideoData(broadcasterId, fullVideoBuffer, ws).then(() => {
                  delete dataObject[broadcasterId];
                  delete fullVideoBuffer;
                }).catch((e) =>{
                  delete dataObject[broadcasterId];
                  delete fullVideoBuffer;
                  console.log(e);
                });
              }else{
                console.log('New File Size is too large.');
                console.log('Clearing from cache!');
                delete dataObject[broadcasterId];
                delete fullVideoBuffer;
                ws.send(JSON.stringify({ error: 'tmpFolderTooLarge', message: 'The servers tmp folder is to large, please try again later!'}));
                return;
            }

            console.log('Not anymore!');

            // Notify broadcaster of complete video
            ws.send(JSON.stringify({ type: 'videoDataReady' }));

            // Clear the dataObject so we can start fresh again
            //delete dataObject[broadcasterId];
          }
          break;
        case 1:
          const streamerCheck = streamers.find(x => x.broadcasterId === broadcasterId);
          if (streamerCheck){
            console.log('Found streamer');
            streamers.forEach(streamer => {
              if (streamer.broadcasterId === broadcasterId){
                streamer.ws.send(messageData);
              }
            });
          }
          break;
        case 2:
          try {
            console.log(s(chunkData.metaData));
            const json = JSON.parse(s(chunkData.metaData));
            console.log(json);
            console.log(json.streamerId);
            const streamerCheck = streamers.find(x => x.streamerId === json.streamerId);
            if (streamerCheck){
              console.log('Found streamer');
              streamerCheck.ws.send(messageData);
            }
          }catch(err){
            console.log('Problematic JSON substring:', chunkData.metaData.slice(128, 130));
            console.log(err);
          }
          break;
        // Broadcaster is sending us a ChunkData as websocket broadcasting method!
        // For each streamer of the broadcaster!
      }
    }
  }
}


async function sendLazyProviderStreamMessage(providerId, messageData){

}




//This is our streaming video api MWAHAHAHAHHAHAH! i hope its a success!
app.get("/video", function(req, res) {
  // Ensure there is a range given for the video
  const range = s(req.headers.range);
  const broadcasterId = s(req.query.broadcasterId);
  const filetype = s(req.query.filetype);
  console.log('broadcasterId', broadcasterId, ' filetype', filetype);
  const broadcasterCheck = broadcasters.includes((x) => x.broadcasterId === broadcasterId);
  console.log('does BroadcasterCheck contain Broadcaster ID?', broadcasterCheck);
  if (!broadcasterCheck) {
    console.error('Broadcaster ID not found');
    res.status(404).send('Broadcaster not found');
    return;
  }

  if (!range) {
    res.status(400).send("Requires Range header");
  }

  // get video stats (about 61MB)
  const videoPath = "./tmp/" + broadcasterId + "." + filetype;
  const videoSize = fs.statSync(videoPath).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

app.get('/', function(req, res) {
  res.sendStatus(200);
  return;
});
//BELOW IS ERROR HANDLING CODE
////////////////////////////////////////////////////////////////////////////////
async function cleanupAndExit(){
  try {
    //const tmpFolderPath = './tmp';
    // Delete all files in the tmp folder
    const files = await fs.promises.readdir(tmpFolderConfigPath);
    for (const file of files) {
      const filePath = path.join(tmpFolderPath, file);
      await fs.promises.unlink(filePath);
    }
    console.log('Successfully deleted all files in the tmp folder.');
  } catch (error) {
    console.error('Error deleting tmp files:', error);
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


console.log('WebSocket server has started');
// Handle server errors
server.on('error', (error) => {
  console.error('WebSocket server error:', error);
});



//BELOW IS GATEWAY HANDLING CODE
////////////////////////////////////////////////////////////////////////////////
function postProvidersStatusToGateway(){
  if (gateway instanceof WebSocket){
    gateway.send(JSON.stringify({
      connectionType: 'node',
      messageType: 'providerStatus',
      size: providers.length
    }))
    return true;
  }else{
    return false;
  }
}
/**
 * Sends the current status of the requesters to the gateway.
 * @return {undefined} No return value.
 */
function postRequestersToGateway(){
  if (gateway instanceof WebSocket) {
    var size = requesters.length;
    gateway.send(JSON.stringify({
      connectionType: 'node',
      messageType: 'requesterStatus',
      size: size
    }));
    return true;
  }else{
    return false;
  }
}
/**
 * Sends the provider status to the gateway.
 * @param {Array} providers - An array of providers.
 * @return {undefined} This function does not return a value.
 */
function postProvidersToGateway(){
  if (gateway instanceof WebSocket){
    var size = providers.length;
    gateway.send(JSON.stringify({
      connectionType: 'node',
      messageType: 'providerStatus',
      size: size
    }));
    return true;
  } else {
    return false;
  }
}
/**
 * Starts the heartbeat for the WebSocket connection.
 * specifically for the gateway to keep the connection alive and going as websockets dont tend to do this automatically!
 * but the server can still terminate connection at will at any moment as having a full keep alive setup wouldnt be a good idea!
 * @param {WebSocket} ws - The WebSocket connection.
 * @return {void} No return value.
 */
function startHeartbeat(ws) {
  const sendPing = () => {
    if (ws.readyState === ws.OPEN) {
      if (pongReceived) {
        console.log('Pong response received, Sending new ping!');
        ws.send(JSON.stringify({ connectionType: 'node', messageType: 'ping' }));
        pongReceived = false; // Reset pongReceived flag
      } else {
        console.log('Previous ping response not received, skipping current ping');
        // Handle scenario where previous ping response was not received before the next ping
      }
    }
  };
  // Start the heartbeat
  heartbeatIntervalId = setInterval(sendPing, 30000);
}

function stopHeartbeat() {
  clearInterval(heartbeatIntervalId);
  heartbeatIntervalId = null;
}

async function signChallengeResponse(challenge) {
  try {
    await calculateCombinedHash();
    const answer = await calculateCombinedHashScrambled(challenge.c, challenge.c2);
    const checksum = await calculateCombinedHash();
    const key2 = {
      scrambled: answer,
      checksum: checksum
    }
    const signedResponse = jwt.sign(
      {
        publicKey: nodeKeyPair.publicKey,
        challenge: key2
      },
      nodeKeyPair.privateKey,
      { algorithm: 'RS256' }
    );

    const decoded = jwt.verify(signedResponse, nodeKeyPair.publicKey, { algorithm: 'RS256' });
    if (isEqual(decoded.challenge.checksum, key2.checksum)) {
      if (isEqual(answer, decoded.challenge.scrambled)){
        console.log('Scramble is verified!!!!!!! Wahooo');
      }
      console.log('DECODED VERIFIED!');
    }

    return signedResponse;
  } catch (error) {
    console.error('Error during signing/verification:', error);
    throw error; // Rethrow the error to handle it at the higher level
  }
}
//Websocket for gateway
async function startGateway(){
try {
const wsGateway = new WebSocket('wss://gateway.dblockbuster.com:8443');
wsGateway.on('open', () => {
  startHeartbeat(wsGateway);
  // Perform Handshake
  const handshakeData = {
    connectionType: 'node',
    messageType: 'handshake',
    publicKey: nodeKeyPair.publicKey,
  };

  wsGateway.send(JSON.stringify(handshakeData));
});

wsGateway.on('message', async (event) => {
  try {
    
    const data = JSON.parse(event);
    if (data.connectionType === 'gateway')
    if (data.messageType === 'pong') {
      console.log('Pong received!');
      pongReceived = true;
    }

    if (data.messageType === 'challenge'){
        const response = await signChallengeResponse(data.challenge);
        // Send the signed response to the gateway
        wsGateway.send(JSON.stringify({connectionType: 'node', messageType: 'response', signedResponse: response }));
    }

    if (data.messageType === 'handshake_ack'){
      const key = await calculateCombinedHash();
      var message;
      if (config.useGeneratedSubDomain === true && config.usingCloudFlareTunnel === false){
        const ipv4 = await fetchPublicIPv4();
        const ipv6 = await fetchPublicIPv6();

        message = {
          connectionType: 'node',
          messageType: 'Initialize',
          publicIpV4: ipv4,
          publicIpV6: ipv6,
          domain: null,
          port: config.port,
          key: key,
          streamersAmount: streamers.length || 0,
          broadcastersAmount: broadcasters.length || 0,
          requestersAmount: requesters.length || 0,
          providersAmount: providers.length || 0,
          providersStatus: providersStatus
        }
      }

      if (config.useGeneratedSubDomain === false && config.usingCloudFlareTunnel === true){
        message = {
          connectionType: 'node',
          messageType: 'Initialize',
          domain: config.domain,
          port: config.port,
          key: key,
          streamersAmount: streamers.length || 0,
          broadcastersAmount: broadcasters.length || 0,
          requestersAmount: requesters.length || 0,
          providersAmount: providers.length || 0,
          providersStatus: providersStatus
        }
      }

      if (config.useGeneratedSubDomain === false && config.usingCloudFlareTunnel === false){
        message = {
          connectionType: 'node',
          messageType: 'Initialize',
          domain: config.domain,
          port: config.port,
          key: key,
          streamersAmount: streamers.length || 0,
          broadcastersAmount: broadcasters.length || 0,
          requestersAmount: requesters.length || 0,
          providersAmount: providers.length || 0,
          providersStatus: providersStatus
        }
      }
      wsGateway.send(JSON.stringify(message));
      console.log('WebSocket Gateway connection established');
      startHeartbeat(wsGateway);
      gateway = wsGateway;
    }

    /*if (data.messageType === 'authCheck'){
      // Calculate answer based on checksum and public key
      var answer = calculateCombinedHash(__dirname, process.dirname(__dirname));
      answer = {
        firstHash: answer.firstHash,
        secondHash: data.publicKey,
      }
      // Sign the answer with the node's private key
      const signedAnswer = jwt.sign({ answer }, privateKey, { algorithm: 'RS256' });

      // Send the signed answer back to the gateway
      wsGateway.send(JSON.stringify({ messageType: 'answer', signedAnswer, token }));
    }*/
    console.log(data);
    







  }catch(error){
    console.log(error);
  }
});

wsGateway.on('close', (event) =>{
  console.log('WebSocket Gateway connection closed');
  stopHeartbeat();
  //startGateway(); uncomment this line for production release! but include a retry counter to stop potential flood of retrys!
});
}catch(e){
  console.log(e);
}
}
startGateway();
