'use strict';
/*  This is a worker broadcasting potentially if we take the worker threads route!
*   
*/
const { parentPort, workerData} = require('worker_threads');
const path = require('node:path');
const util = require('util');
const timer = ms => new Promise(res => setTimeout(res, ms));
const fs = require('fs');
const wsPath = path.join(workerData.appPath, 'node_modules', 'ws');
const WebSocket = require(wsPath);
const SOCKET_URL = workerData.socketUrl;
const THREADINDEX = workerData.threadIndex;
const FILEPATH = workerData.filePath;
const PROVIDERID = workerData.providerId;
const FILETYPE = workerData.fileType;
const TMDBID = workerData.tmdbId;
const TYPETVSHOWORMOVIE = workerData.typeTvShowOrMovie;
const SEASON = workerData.season;
const EPISODE = workerData.episode;
const QUALITY = workerData.quality;
const PROVIDERUSERNAME = workerData.providerName;
var dataset = [];
var broadcasterId;
// This will ensure our heartbeat doesnt get sent more then once and only allows one ping at a time!
//let heartbeatStarted = false;
let heartbeatIntervalId;
//This will help us only send a heartbeat when a pong is received!
let pongReceived = true;
//This will control our heartbeat interval!
const HEARTBEATINTERVAL = 30000;
const size = (10 ** 6) / 4 //500kb //1mb // 1024*32 32kb;

class ChunkData {
  constructor(providingType, metaData, totalIndex, index, timestamp, data) {
    this.providingType = providingType;
    this.metaData = metaData;
    this.totalIndex = totalIndex;
    this.index = index;
    this.timestamp = timestamp;
    this.data = new Uint8Array(data);
  }

  deconstruct(uint8Array) {
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


if (process.platform === "win32") {
    prefix = "\\";
}

async function check(){
  try {
    const stream = fs.createReadStream(FILEPATH, { highWaterMark: size });
    stream.on('data', (chunk) => {
      dataset.push(chunk);
    });
    stream.on('end', () => {
      console.log('Stream ended');
      parentPort.postMessage(JSON.stringify({ type: 'msg', threadIndex: THREADINDEX, msg: 'Finished Generating local Dataset object from fs.readFileStream()'}));
      startsocket();
    });
  } catch (err) {
    console.log(err);
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function startsocket() {
  // Create a WebSocket connection as a broadcaster
  const wsbroadcaster = new WebSocket(SOCKET_URL);
  startHeartbeat(wsbroadcaster);
  // Handle connection open
  wsbroadcaster.on('open', () => {
    console.log('Connected as a broadcaster');
    console.log('Sending broadcaster details...', PROVIDERID, FILETYPE, TMDBID, TYPETVSHOWORMOVIE, SEASON, EPISODE);
    wsbroadcaster.send(JSON.stringify({
      type: 'broadcaster',
      providerId: PROVIDERID,
      providerUsername: PROVIDERUSERNAME,
      domain: SOCKET_URL,
      filetype: FILETYPE,
      tmdbId: TMDBID,
      typeTvShowOrMovie: TYPETVSHOWORMOVIE,
      season: SEASON,
      episode: EPISODE
    }));
  });

  // Handle received messages
  wsbroadcaster.on('message', (message) => {
    console.log('Received message:', message);
    try {
      const data = JSON.parse(message);
      if (data.type === 'streamerDetails') {
        console.log(data);
        wspostDataSet(wsbroadcaster, 0, null);
      }
      //This is for demonstration purposes wont actually be in production build this will be handled by a sse connection! //or we might keep it and learn to implement more websocket messages to not need the extra process of the sse! but it is recommended to use the sse for messages!
      if (data.type === 'streamerRequest') {
        if (data.streamerId !== null || undefined){
          wspostDataSet(wsbroadcaster, 1, data.streamerId);
        }else if (data.streamerId === null || undefined){
          wspostDataSet(wsbroadcaster, 0, null);
          console.log(data);
        }
      }
      if (data.type === 'pong') {
        pongReceived = true;
      }
      if (data.type === 'broadcasterId') {
        broadcasterId = data.broadcasterId;
        workerData.broadcasterId = broadcasterId;
        workerData.clientId = Date.now() + generateId();
        parentPort.postMessage(JSON.stringify({ type: 'broadcasterId', broadcasterId: broadcasterId, workerData: workerData, threadIndex: THREADINDEX }));
        console.log(broadcasterId);
        var i = 1;
        console.log("datasets length", dataset.length);
        //httppostDataSet(wsbroadcaster);
      }
    } catch (err) {
      console.log(err);
    }
  });

  // Handle disconnection
  wsbroadcaster.on('close', () => {
    stopHeartbeat();
    console.log('Disconnected as a broadcaster');
  });

}

function startHeartbeat(wsbroadcaster) {
  const sendPing = () => {
    if (wsbroadcaster.readyState === wsbroadcaster.OPEN) {
      if (pongReceived) {
        console.log('Pong response received, Sending new ping!');
        wsbroadcaster.send(JSON.stringify({ type: 'ping' }));
        pongReceived = false; // Reset pongReceived flag
      } else {
        console.log('Previous ping response not received, skipping current ping');
        // Handle scenario where previous ping response was not received before the next ping
      }
    }
  };
  // Start the heartbeat
  heartbeatIntervalId = setInterval(sendPing, HEARTBEATINTERVAL);
}

function stopHeartbeat() {
  clearInterval(heartbeatIntervalId);
  heartbeatIntervalId = null;
}

async function main(){
  if (FILEPATH !== null || undefined){
    await check();
  }else{
    return;
  }
  return;
}
main();














///These down here our the additional functions!

async function wspostDataSet(wsbroadcaster, index, streamerId) {

  switch (index){
    case 0:
      console.log(broadcasterId);
      var i = 1;
      for (var chunk of dataset) {
        console.log("Sending Chunk:", i++);
        await wssendMessageAsync(wsbroadcaster, chunk);
        //wsbroadcaster.send(JSON.stringify({ type: 'forwardStream', broadcasterId: broadcasterId, providerId: '123', filetype: 'mp4', typeTvShowOrMovie: 'tv', tmdbId: '456', season: '1', episode: '1', data: chunk }));
      }//uncomment the for loop to post the dataset once done verifying other message process!
    //Then here we will respond to the streamers through the SSE to let them know the stream is avaliable via the server relay since the for loop has finished or we can let them know as we are adding but that can run into issues this method is the best way making sure the server has it and such!
    break;

    case 1:
      console.log(broadcasterId);
      //await sendRegularMessageAsync(wsbroadcaster, { 'type': 'prePostDataSet', 'broadcasterId': broadcasterId, 'providerId': '123', 'filetype': 'mp4', 'typeTvShowOrMovie': 'tv', 'tmdbId': '456', 'season': '1', 'episode': '1', 'totalChunks': dataset.length });
      var i = 1;
      for (var chunk of dataset) {
        console.log("Sending Chunk:", i++);
        await wssendMessageToStreamerAsync(wsbroadcaster, chunk, streamerId);
      }
    break;
  }

}
async function httppostDataSet(wsbroadcaster) {
  console.log(broadcasterId);
  //Deprecated as we have included totalchunks in the chunkData itself now for the server to interact with!
  //await sendRegularMessageAsync(wsbroadcaster, { 'type': 'prePostDataSet', 'broadcasterId': broadcasterId, 'providerId': '123', 'filetype': 'mp4', 'typeTvShowOrMovie': 'tv', 'tmdbId': '456', 'season': '1', 'episode': '1', 'totalChunks': dataset.length });
  var i = 1;
  for (var chunk of dataset) {
    console.log("Sending Chunk:", i++);
    await httpsendMessageAsync(wsbroadcaster, chunk);
  }
}

async function sendRegularMessageAsync(ws, message) {
  return new Promise((resolve, reject) => {
    try {
      ws.send(JSON.stringify(message));
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function wssendMessageToStreamerAsync(ws, message, streamerId) {
  // Add timestamp and chunk index to the data chunk
  var timestamp = Date.now();
  const chunkIndex = dataset.indexOf(message);
  const totalIndex = dataset.length;
  const metaData = {
    'providerId': PROVIDERID,
    'streamerId': streamerId,
    'filetype': FILETYPE,
    'typeTvShowOrMovie': TYPETVSHOWORMOVIE,
    'tmdbId': TMDBID,
    'season': SEASON,
    'episode': EPISODE
  }
  console.log(chunkIndex);
  const chunkData = new ChunkData(2, JSON.stringify(metaData), totalIndex, chunkIndex, BigInt(timestamp), message);
  console.log('Providing Type: ', chunkData.providingType);
  console.log('MetaData: ', chunkData.metaData);
  console.log('Chunk Index: ', chunkData.index);
  console.log('Total Chunks: ', chunkData.totalIndex);
  console.log('Timestamp: ', chunkData.timestamp);
  console.log('Data: ', chunkData.data);

  // Convert ChunkData object to Uint8Array
  const uint8Array = chunkData.toUint8Array();

  return new Promise((resolve, reject) => {
    try {
      // Send the Uint8Array to the server
      ws.send(uint8Array);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function wssendMessageAsync(ws, message) {
  // Add timestamp and chunk index to the data chunk
  var timestamp = Date.now();
  const chunkIndex = dataset.indexOf(message);
  const totalIndex = dataset.length;
  console.log(chunkIndex);
  const metaData = {
    'providerId': PROVIDERID,
    'filetype': FILETYPE,
    'typeTvShowOrMovie': TYPETVSHOWORMOVIE,
    'tmdbId': TMDBID,
    'season': SEASON,
    'episode': EPISODE
  };
  const chunkData = new ChunkData(1, JSON.stringify(metaData), totalIndex, chunkIndex, BigInt(timestamp), message);
  console.log('Providing Type: ', chunkData.providingType);
  console.log('MetaData: ', chunkData.metaData);
  console.log('Chunk Index: ', chunkData.index);
  console.log('Total Chunks: ', chunkData.totalIndex);
  console.log('Timestamp: ', chunkData.timestamp);
  console.log('Data: ', chunkData.data);

  // Convert ChunkData object to Uint8Array
  const uint8Array = chunkData.toUint8Array();

  return new Promise((resolve, reject) => {
    try {
      // Send the Uint8Array to the server
      ws.send(uint8Array);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function httpsendMessageAsync(ws, message) {
  // Add timestamp and chunk index to the data chunk
  var timestamp = Date.now();
  const chunkIndex = dataset.indexOf(message);
  const totalIndex = dataset.length;
  console.log(chunkIndex);
  const metaData = {
    'providerId': PROVIDERID,
    'filetype': FILETYPE,
    'typeTvShowOrMovie': TYPETVSHOWORMOVIE,
    'tmdbId': TMDBID,
    'season': SEASON,
    'episode': EPISODE
  };
  const chunkData = new ChunkData(0, JSON.stringify(metaData), totalIndex, chunkIndex, BigInt(timestamp), message);
  console.log('Providing Type: ', chunkData.providingType);
  console.log('MetaData: ', chunkData.metaData);
  console.log('Chunk Index: ', chunkData.index);
  console.log('Total Chunks: ', chunkData.totalIndex);
  console.log('Timestamp: ', chunkData.timestamp);
  console.log('Data: ', chunkData.data);
  const uint8Array = chunkData.toUint8Array();
  // Create a new ChunkData instance and deconstruct the uint8Array into it
  const newChunkDataInstance = new ChunkData();
  newChunkDataInstance.deconstruct(uint8Array);
  console.log('Deconstructed Providing Type: ', newChunkDataInstance.providingType);
  console.log('Deconstructed MetaData: ', newChunkDataInstance.metaData);
  console.log('Deconstructed Chunk Index: ', newChunkDataInstance.index);
  console.log('Deconstructed Total Chunks: ', newChunkDataInstance.totalIndex);
  console.log('Deconstructed Timestamp: ', newChunkDataInstance.timestamp);
  console.log('Deconstructed Data: ', newChunkDataInstance.data);
  return new Promise((resolve, reject) => {
    try {
      ws.send(uint8Array);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}