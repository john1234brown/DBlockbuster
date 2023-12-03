const express = require("express");
const EventSource = require('eventsource');
const path = require('path');
const app = express();
const http = require("http");
const server = http.Server(app);
const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');


/*const evtSourceGateway = new EventSource('https://vervet-game-koi.ngrok-free.app/videonode?url=mature-thrush-manually.ngrok-free.app&port=443'); //example of using regular TMDB ID request!
evtSourceGateway.onmessage = (event) => {
  try {
    console.log('We have started Previous Ping log Check Listener!');
    console.log(event.data);
    var data = JSON.parse(event.data);
    if (data.type === 'authenticated') {
      nodeId = data.nodeId;
      console.log('Authenticated Response:', data.msg);
      console.log(data);
    }

  } catch (e) {
    console.log(e);
  }
};*/
class ChunkData {
  constructor(uint8Array) {
    const providingTypeBuffer = uint8Array.slice(0, 4);
    this.providingType = new DataView(providingTypeBuffer.buffer).getUint32(0, false);

    const stringBuffer = uint8Array.slice(4, 1028);
    this.metaData = new TextDecoder().decode(stringBuffer);

    const totalIndexBuffer = uint8Array.slice(1028, 1032);
    this.totalIndex = new DataView(totalIndexBuffer.buffer).getUint32(0, false);

    const chunkIndexBuffer = uint8Array.slice(1032, 1036);
    this.index = new DataView(chunkIndexBuffer.buffer).getUint32(0, false);

    const timestampBuffer = uint8Array.slice(1036, 1044);
    this.timestamp = new DataView(timestampBuffer.buffer).getBigUint64(0);

    this.data = uint8Array.slice(1044);
  }

  toUint8Array() {
    const bufferSize = 4 + 1024 + 4 + 4 + 8 + (this.data instanceof Uint8Array ? this.data.length : 0);
    const uint8Array = new Uint8Array(bufferSize); // Assuming the total size is 1044 bytes

    const providingTypeBuffer = Buffer.allocUnsafe(4); // Allocate 4 bytes for providingType
    providingTypeBuffer.writeUInt32BE(this.providingType, 0);
    uint8Array.set([...providingTypeBuffer], 0);

    const stringBuffer = Buffer.from(this.metaData); // Assuming 1024 is the maximum size
    uint8Array.set([...stringBuffer], 4);

    const totalIndexBuffer = Buffer.allocUnsafe(4); // Allocate 4 bytes for total index
    totalIndexBuffer.writeUInt32BE(this.totalIndex, 0); // Use BE (big endian) for byte order
    uint8Array.set([...totalIndexBuffer], 1028);
    

    const chunkIndexBuffer = Buffer.allocUnsafe(4); // Allocate 4 bytes for chunk index
    chunkIndexBuffer.writeUInt32BE(this.index, 0); // Use BE (big endian) for byte order
    uint8Array.set([...chunkIndexBuffer], 1032);

    const timestampBuffer = Buffer.allocUnsafe(8); // Allocate 8 bytes for timestamp
    timestampBuffer.writeBigUInt64BE(this.timestamp, 0); // Use BE (big endian) for byte order
    uint8Array.set([...timestampBuffer], 1036);
    
    // Convert data to Uint8Array if necessary
    const dataBuffer = new Uint8Array(this.data);
    uint8Array.set([...dataBuffer], 1044);

    // Combine all Uint8Arrays into a single Uint8Array
    //const uint8Array = new Uint8Array([...providingTypeBuffer, ...stringBuffer, ...totalIndexBuffer, ...chunkIndexBuffer, ...timestampBuffer, ...dataBuffer]);

    return uint8Array;
  }
}
// Create a WebSocket server
const wss = new WebSocket.Server({ server: server });
server.listen(3000, function() {
  console.log("listening on 3000");
});
// Set up a dictionary to store the connected broadcasters
var broadcasters = new Map();
// Set up a dictionary to store the connected streamers
var streamers = new Map();
// This will be a broadcasters Stream data to ensure streamers get the full array of data!
var dataObject = {};
// This will be a broadcasters total chunk dataset to help know when broadcasters finished sending all the chunks!
var totalChunks = {};
// This will be our construction of the full video data!
var fullVideoData = {};
let heartbeatIntervalId;
//This will help us only send a heartbeat when a pong is received!
let pongReceived = true;

function startHeartbeat(wsbroadcaster) {
  const sendPing = () => {
    if (wsbroadcaster.readyState === wsbroadcaster.OPEN) {
      if (pongReceived) {
        console.log('Pong response received, Sending new ping!');
        wsbroadcaster.send(JSON.stringify({ connectionType: 'videonode', messageType: 'ping' }));
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

//Websocket for gateway
const wsGateway = new WebSocket('wss://vervet-game-koi.ngrok-free.app');
wsGateway.on('open', () => {
  wsGateway.send(JSON.stringify({'connectionType': 'videonode', 'messageType': 'Initialize', 'domain': 'mature-thrush-manually.ngrok-free.app', 'port': '443', 'streamers': streamers.length || 0, 'broadcasters': broadcasters.length || 0}));
  console.log('WebSocket Gateway connection established');
  startHeartbeat(wsGateway);
});

wsGateway.on('message', (event) => {
  try {
    
    const data = JSON.parse(event);
    if (data.connectionType === 'gateway')
    if (data.messageType === 'pong') {
      console.log('Pong received!');
      pongReceived = true;
    }
    console.log(data);
    







  }catch(error){
    console.log(error);
  }
});

function generateMD5Checksum(data) {
  const utf8Encoder = new TextEncoder();
  const encodedData = utf8Encoder.encode(data);

  return new Promise((resolve, reject) => {
    crypto.subtle.digest('sha-256', encodedData).then(hashBuffer => {
      const hexHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      resolve(hexHash.slice(0, 16)); // Truncate to 16 characters
    }).catch(error => {
      reject(error);
    });
  });
}
//This will sanitize a full nested array with all of its objects so if someone sent a custom property to inject and bypass sanitization checks this will ensure we catch it!
function deepReplaceEscapeSequences(input) {
  if (Array.isArray(input)) {
    return input.map(deepReplaceEscapeSequences);
  } else if (typeof input === 'object') {
    return Object.keys(input).reduce((acc, key) => {
      acc[key] = deepReplaceEscapeSequences(input[key]);
      return acc;
    }, {});
  } else {
    return input.replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
  }
}

function rekt(input) {
  if (typeof input !== 'string' && typeof input === 'number') {
    // Handle numeric input
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
    return Number(input);
  }

  // Handle arrays
  if (Array.isArray(input)) {
    return deepReplaceEscapeSequences(input);
  }

  // Handle objects
  if (typeof input === 'object') {
    return deepReplaceEscapeSequences(input);
  }

  // Handle non-object input
  if (input !== undefined || null) {
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
  }

  return input;
}

function sanitizeJSON(jsonInput) {
  // Replace all potential escape sequences
  const sanitizedJSON = jsonInput.replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, function (match) {
    if (match === '\\') {
      return '\\\\'; // Escape the backslash itself
    } else {
      return '\\' + match; // Escape the character or sequence
    }
  });

  return sanitizedJSON;
}

const tmpFolderPath = './tmp'; // Replace with the actual tmp folder path
const sizeLimitInBytes = 10 * 1024 * 1024 * 1024; // 10 GB in bytes
function getFolderSize(folderPath) {
  let totalSize = 0;

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getFolderSize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

async function checkNewFileTmpFolderSize(newFileSize){
  try {
    const folderSize = getFolderSize(tmpFolderPath);
      console.log(folderSize, 'bytes');
      if ((folderSize+newFileSize) > sizeLimitInBytes) {
        console.log('Tmp folder size exceeds the limit of 10GB.');
        return false;
        //process.exit(1); // Exit with error code
      } else {
        console.log('Tmp folder size is within the limit.');
        return true;
        // Allow the build to proceed
      }
  } catch (error) {
    console.error('Error checking tmp folder size:', error);
    return undefined;
    //process.exit(1); // Exit with error code
  }
};
async function checkTmpFolderSize(){
  try {
    const folderSize = getFolderSize(tmpFolderPath);
      console.log(folderSize, 'bytes');
      if (folderSize > sizeLimitInBytes) {
        console.log('Tmp folder size exceeds the limit of 10GB.');
        return false;
        //process.exit(1); // Exit with error code
      } else {
        console.log('Tmp folder size is within the limit.');
        return true;
        // Allow the build to proceed
      }
  } catch (error) {
    console.error('Error checking tmp folder size:', error);
    return undefined;
    //process.exit(1); // Exit with error code
  }
};

function deleteBroadcasterFile(broadcasterId, broadcasterData) {
  try {
    const fileName = broadcasterId + "." + broadcasterData.filetype;
    const filePath = "./tmp/" + fileName;

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.log(`File '${filePath}' does not exist. Skipping deletion.`);
    }
  } catch (error) {
    console.log(error);
  }
}

async function storeFullVideoData(broadcasterId, data) {
  try{
  const TmpFoldersize = await checkTmpFolderSize();
  if (TmpFoldersize === false) {
    console.log('This is to big of tmp folder Directory Sorry!');
    const broadcaster = findBroadcasterById(broadcasterId);
    console.log(broadcaster);
    broadcaster.send('{"error": "tmp folder is full"}');
    return;
  }
  if (TmpFoldersize === true){
  //fullVideoData[broadcasterId] = data;

  const fileName = broadcasterId + ".mp4";
  const fileStream = fs.createWriteStream("./tmp/" + fileName);
  console.log("Writing to file: ./tmp/" + fileName);
  await new Promise((resolve, reject) => {
    fileStream.write(data);
    fileStream.on('finish', () =>{
      console.log("Finished writing to file: ./tmp/" + fileName);
      fileStream.end();
      resolve();
    });
    fileStream.on('error', reject);
  });
  delete dataObject[broadcasterId];
  delete data;
  return;
  }
}catch(error){
  console.log(error);
}
}
//With the usage of chunkData and data validation we can now send the data to the streamer! but something went terribly wrong!
async function sendForwardStreamMessage(ws, messageData) {
  console.log(messageData);

  // Extract the broadcaster ID from the WebSocket connection
  const broadcasterId = getBroadcasterIdFromWsConnection(ws);
  if (broadcasterId) {
    // Create a ChunkData object from the received message data
    const chunkData = new ChunkData(new Uint8Array(messageData));
    ///chunkData.deconstruct(messageData);
    console.log('Providing Type: ', rekt(chunkData.providingType));
    switch (rekt(chunkData.providingType)) {
      case 0:
        // Broadcaster is sending us a ChunkData as regular http serving method!
        console.log('Index: ', rekt(chunkData.index), ' Total: ', rekt(chunkData.totalIndex));
        //console.log(chunkData.data);
        console.log('metaData: ', rekt(chunkData.metaData));
        console.log('Timestamp: ', rekt(chunkData.timestamp));
        const totalChunks = rekt(chunkData.totalIndex);
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
        const chunkIndexExists = dataObject[broadcasterId].some((c, i) => i === rekt(chunkData.index));
        //console.log(chunkIndexExists);
        if (!chunkIndexExists) {
          // If the index doesn't exist, add the ChunkData object to the array
          dataObject[broadcasterId][rekt(chunkData.index)] = chunkData;
          console.log('Added chunk index', rekt(chunkData.index));
        } else {
          console.error(`Duplicate chunk index received: ${rekt(chunkData.index)}`);
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
              console.error(`Missing chunk index: ${rekt(chunkData.chunkIndex)}`);
              continue;
            }
            fullVideoBuffer = Buffer.concat([fullVideoBuffer, chunkData.data]);
          }

          console.log('Im still executing!');

          // Wait for the full video data to be stored in the cache
          if (checkNewFileTmpFolderSize(fullVideoBuffer.byteLength) === true){
            storeFullVideoData(broadcasterId, fullVideoBuffer);
            //console.log('New File Size is within the limit.');
            //Here we can start building the file for this broadcaster! by piece by piece instead of using up cache memory! and buffer memory!
            //What we will do is piece the file together utilizing filestreams!
            //storeFullVideoData(broadcasterId, chunkData.data);
          }else{
            console.log('New File Size is too large.');
            console.log('Clearing from cache!');
            delete dataObject[broadcasterId];
            delete fullVideoBuffer;
            ws.send(JSON.stringify({ type: 'FileTooLargeError'}));
          }

          console.log('Not anymore!');

          // Notify broadcaster of complete video
          ws.send(JSON.stringify({ type: 'videoDataReady' }));

          // Clear the dataObject so we can start fresh again
          //delete dataObject[broadcasterId];
        }
        break;
      case 1:
        const tmp = findStreamersByBroadcasterId(broadcasterId, 1);
        if (tmp !== null) {
          tmp.forEach((streamer) => {
            streamer.send(messageData);
          });
        }
        break;
      case 2:
        try {
          const json = JSON.parse(JSON.stringify(chunkData.metaData));
          console.log(json);
          for (const [id, streamer] of streamers.entries()){
            if (id.broadcasterId === broadcasterId){
              if (id.streamerId === json.streamerId){
                streamer.send(messageData);
              }
            }
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


// Handle incoming connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  // Handle incoming messages
  ws.on('message', (message) => {
    //console.log('Received message:', message);
    try {
      const data = JSON.parse(message);
      const { type, providerId, filetype, typeTvShowOrMovie, tmdbId, season, episode } = data;
      if (type === 'ping') {
        console.log('Ping recieved! From Provider!');
        ws.send(JSON.stringify({ type: 'pong' }));
      }

      if (type === 'streamerRequest') {
        console.log('Streamer request recieved!');
        const info = getStreamerInfoFromWsConnection(ws);
        const relayto = findBroadcasterById(info.broadcasterId);
        if (relayto !== null) {
          relayto.send(JSON.stringify({ type: 'streamerRequest', streamerId: info.streamerId }));
        }
      }

      if (type === 'prePostDataSet') {
        console.log('prePostDataSet recieved!', data);
        totalChunks[rekt(data.broadcasterId)] = rekt(data.totalChunks);
        console.log('totalChunks:', totalChunks, 'for broadcaster:', rekt(data.broadcasterId));
      }
      if (type === 'broadcaster') {
        // Add the broadcaster to the connected broadcasters
        generateMD5Checksum(Date.now().toString() + generateId()).then(broadcasterId => {
          broadcasters.set({ broadcasterId: broadcasterId, providerId: rekt(providerId), filetype: rekt(filetype), typeTvShowOrMovie: rekt(typeTvShowOrMovie), tmdbId: rekt(tmdbId), season: rekt(season), episode: rekt(episode) }, ws);
          console.log(JSON.stringify(broadcasters));
          // Send the broadcaster ID back to the broadcaster
          ws.send(JSON.stringify({ type: 'broadcasterId', broadcasterId: broadcasterId }));
        }).catch(error => {
          console.error('Error occurred while sending broadcasters:', error);
        });
        //const broadcasterId = calculateChecksum(timestamp.toString() + generateId());
      }
      if (type === 'streamer') {
        // Find the broadcaster based on the specified details
        const data3 = JSON.parse(message);
        //const {broadcasterId: data3.broadcasterId, providerId: data3.providerId, filetype: streamerFiletype, typeTvShowOrMovie: streamerTypeTvShowOrMovie, tmdbId: streamerTmdbId, season: streamerSeason, episode: streamerEpisode } = data3;
        const broadcaster = findBroadcaster(rekt(data3.broadcasterId), rekt(data3.providerId), rekt(data3.filetype), rekt(data3.tmdbId), rekt(data3.season), rekt(data3.episode));

        if (broadcaster) {
          // Add the streamer to the connected streamers
          const streamerId = generateId();
          streamers.set({ streamerId: streamerId, broadcasterId: rekt(data3.broadcasterId), providerId: rekt(data3.providerId), filetype: rekt(data3.filetype), typeTvShowOrMovie: rekt(data3.typeTvShowOrMovie), tmdbId: rekt(data3.tmdbId), season: rekt(data3.season), episode: rekt(data3.episode) }, ws);
          // Send the streamer ID back to the streamer
          ws.send(JSON.stringify({ type: 'streamerId', id: streamerId }));

          // Forward the streamer details to the broadcaster
          broadcaster.send(JSON.stringify({ type: 'streamerDetails', streamerId, providerId: rekt(data3.providerId), filetype: rekt(data3.filetype), tmdbId: rekt(data3.tmdbId), season: rekt(data3.season), episode: rekt(data3.episode) }));
          //Check the dataArray to ensure the broadcaster has already populated it
          const dataForStreamer = dataObject[rekt(data3.broadcasterId)] || []; // Get the array of data for the specific broadcasterId
          if (dataForStreamer.length > 0) {
            console.log('dataForStreamer length:', dataForStreamer.length);
            var i = 0;
            ws.send(JSON.stringify({ type: 'videoChunkPreDetails', total: dataForStreamer.length }));
            for (const data of dataForStreamer) {
              //console.log(data);
              console.log(i++);
              try {
                //const chunkData = new ChunkData(new Uint8Array(data));
                const uint8Array = data.toUint8Array();
                ws.send(uint8Array);
              } catch (errors) {
                console.log(errors);
              }
            }
          }
        } else {
          // Inform the streamer that no matching broadcaster was found
          ws.send(JSON.stringify({ type: 'error', message: 'No matching broadcaster found' }));
        }
      }
    } catch (err) {
      //The message is not proper JSON must be broadcaster relaying there raw uint8array so pass it to the sendForwardStreamMessage to see if its broadcaster and such!
      sendForwardStreamMessage(ws, message);
      //console.log(err);
    }
  });
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');

    // Remove the broadcaster or streamer from the respective dictionary
    broadcasters.forEach((broadcaster, broadcasterId) => {
      if (broadcaster === ws) {
        
        //Remove the broadcasters HTTP file from the tmp folder!
        deleteBroadcasterFile(broadcasterId.broadcasterId, broadcasterId);

        // Remove the broadcaster from the dataObject
        delete dataObject[broadcasterId.broadcasterId];
        //Remove the broadcaster from the fullVideoData
        delete fullVideoData[broadcasterId.broadcasterId];
        //Remove the broadcaster from the totalChunks
        delete totalChunks[broadcasterId.broadcasterId];
        // Remove the broadcaster from the broadcasters map
        broadcasters.delete(broadcasterId);
      }
    });

    streamers.forEach((streamer, streamerId) => {
      if (streamer === ws) {
        streamers.delete(streamerId);
      }
    });
  });
  //Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'An error occurred in the WebSocket connection' }));
  });
});
// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
// Helper function to find a matching broadcaster based on details
function findBroadcasterById(broadcasterId) {
  try {
    for (const [id, broadcaster] of broadcasters.entries()) {
      // Check if the broadcaster matches the specified details
      const { broadcasterId: bBroadcasterId } = id;
      if (bBroadcasterId === broadcasterId) {
        return broadcaster;
      }
    }
    return null;
  } catch (error) {
    console.error('Error occurred in findBroadcasterById:', error);
    return null;
  }
}
// Helper function to find a matching broadcaster based on details
function findBroadcaster(broadcasterId, providerId, filetype, tmdbId, season, episode) {
  try {
    for (const [id, broadcaster] of broadcasters.entries()) {
      // Check if the broadcaster matches the specified details
      const { broadcasterId: bBroadcasterId, providerId: bProviderId, filetype: bFiletype, tmdbId: bTmdbId, season: bSeason, episode: bEpisode } = id;
      if (bBroadcasterId === broadcasterId && bProviderId === providerId && bFiletype === filetype && bTmdbId === tmdbId && bSeason === season && bEpisode === episode) {
        return broadcaster;
      }
    }
    return null;
  } catch (error) {
    console.error('Error occurred in findBroadcaster:', error);
    return null;
  }
}
// Function to get broadcaster ID from WebSocket connection
function getBroadcasterIdFromWsConnection(ws) {
  // Check if the WebSocket connection exists in the broadcasters map
  for (const [broadcasterId, broadcasterData] of broadcasters.entries()) {
    if (broadcasterData === ws) {
      console.log('Broadcaster Found!, Broadcaster ID:', broadcasterId.broadcasterId);
      return broadcasterId.broadcasterId;
    }
  }

  // Return null if the WebSocket connection is not found
  return null;
}
// Function to retrieve broadcaster information from WebSocket connection
function getBroadcasterInfoFromWsConnection(ws) {
  // Check if the WebSocket connection exists in the broadcasters map
  for (const [broadcasterId, broadcasterData] of broadcasters.entries()) {
    if (broadcasterData === ws) {
      return broadcasterId;
    }
  }
  // Return null if the WebSocket connection is not found
  return null;
}
// Function to retrieve broadcaster information from WebSocket connection
function getStreamerInfoFromWsConnection(ws) {
  // Check if the WebSocket connection exists in the broadcasters map
  for (const [id, streamer] of streamers.entries()) {
    if (streamer === ws) {
      return id;
    }
  }
  // Return null if the WebSocket connection is not found
  return null;
}
//Helper function to help find matching streamers based on the details
function findStreamers(broadcasterId, providerId, filetype, typeTvShowOrMovie, tmdbId, season, episode) {
  try {
    if (streamers === undefined) {
      return null;
    }
    for (const [id, streamer] of streamers.entries()) {
      const { broadcasterId: sBroadcasterId, providerId: sProviderId, filetype: sFiletype, typeTvShowOrMovie: sTypeTvShowOrMovie, tmdbId: sTmdbId, season: sSeason, episode: sEpisode } = id;
      if (sBroadcasterId === broadcasterId && sProviderId === providerId && sFiletype === filetype && sTypeTvShowOrMovie === typeTvShowOrMovie && sTmdbId === tmdbId && sSeason === season && sEpisode === episode) {
        return streamer;
      }
    }
  } catch (error) {
    console.error('Error occurred in findStreamers:', error);
    return null;
  }
}
function findStreamersByBroadcasterId(broadcasterId, a) {
  try {
    switch (a){
      case 1:
        const temp2 = [];
        if (streamers === undefined) {
          return null;
        }
        for (const [id, streamer] of streamers.entries()) {
          const { broadcasterId: sBroadcasterId } = id;
          if (sBroadcasterId === broadcasterId) {
            temp2.push(streamer);
          }
        }
        if (temp2.length === 0) {
          return null;
        }
        if (temp2.length >= 1) {
          return temp2;
        }
      break;

      case 2:
        const temp = new Map();
        if (streamers === undefined) {
          return null;
        }
        for (const [id, streamer] of streamers.entries()) {
          if (id.broadcasterId === broadcasterId) {
            temp.set(id, streamer);
          }
        }
        if (temp.length === 0) {
          return null;
        }
        if (temp.length >= 1) {
          return temp;
        }
      break;
    }
  } catch (e) {
    console.error('Error occuring in findStreamersByBroadcasterId:', e);
  }
}
//This is our streaming video api MWAHAHAHAHHAHAH! i hope its a success!
app.get("/video", function(req, res) {
  // Ensure there is a range given for the video
  const range = rekt(req.headers.range);
  const broadcasterId = rekt(req.query.broadcasterId);
  const filetype = rekt(req.query.filetype);
  console.log('broadcasterId', broadcasterId, ' filetype', filetype);
  const broadcasterCheck = findBroadcasterById(broadcasterId);
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
});

const cleanupAndExit = async () => {
  try {
    // Delete all files in the tmp folder
    const files = await fs.promises.readdir(tmpFolderPath);
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