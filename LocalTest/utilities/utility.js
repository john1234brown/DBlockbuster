const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');
const path = require('path');
const tmpFolderConfigPath = './tmp'; // Replace with the actual tmp folder path
const sizeLimitInBytes = 10 * 1024 * 1024 * 1024; // 10 GB in bytes


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
// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

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

function deepReplaceEscapeSequences(input) {
  if (Array.isArray(input)) {
    return input.map(deepReplaceEscapeSequences);
  } else if (typeof input === 'object') {
    return Object.keys(input).reduce((acc, key) => {
      acc[key] = deepReplaceEscapeSequences(input[key]);
      return acc;
    }, {});
  } else if (input !== undefined && input !== null) {
    return input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
  } else {
    return input; // Return input as-is if it's undefined or null
  }
}
/**
 * Takes an input and performs various transformations based on its type.
 * to ensure proper sanitization of the input by removing all potential escape characters!
 * @param {any} input - The input value to be transformed.
 * @return {any} - The transformed value.
 */
function s(input) {
  if (typeof input !== 'string' && typeof input === 'number') {
    // Handle numeric input
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
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
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
  }

  return input;
}

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

async function storeFullVideoData(broadcasterId, data, ws) {
  try{
    const TmpFoldersize = await checkTmpFolderSize();
    if (TmpFoldersize === false) {
      console.log('This is to big of tmp folder Directory Sorry!');
      console.log(broadcasterId);
      ws.send(JSON.stringify({ error: 'tmpFolderTooLarge', message: 'This is to big it will exceed the allowed limit of the servers tmp folder, please try again later!'}));
      return;
    }
    if (TmpFoldersize === true){
    const fileName = broadcasterId + ".mp4";
    const fileStream = fs.createWriteStream("./tmp/" + fileName);
    console.log("Writing to file: ./tmp/" + fileName);
    await new Promise((resolve, reject) => {
      fileStream.write(data);
      fileStream.on('finish', () =>{
        console.log("Finished writing to file: ./tmp/" + fileName);
        fileStream.end();
        // Notify broadcaster of complete video
        ws.send(JSON.stringify({ type: 'videoDataReady'}));
        resolve();
      });
      fileStream.on('error', () => {
        ws.send(JSON.stringify({ error: 'fileWrite', message: 'Error writing the file to the tmp folder, please try again later!'}));
        reject();
      });
    });

    console.log('No more issues!');
    return;
    }
  }catch(error){
  console.log(error);
  }
}

function sendEventsToAllProviders(json, ws){
  ws.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.connectionType === 'Provider') {
      client.send(JSON.stringify(json));
    }
  });
}

function fetchPublicIPv4() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.ipify.org',
      port: 80,
      path: '/',
    };

    const req = http.get(options, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

function fetchPublicIPv6() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api64.ipify.org',
      port: 80,
      path: '/',
    };

    const req = http.get(options, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}


return module.exports = { crypto, cleanupAndExit, sendEventsToAllProviders, generateId , tmpFolderConfigPath, s, deepReplaceEscapeSequences, deleteBroadcasterFile, storeFullVideoData, generateMD5Checksum, checkNewFileTmpFolderSize, fs, WebSocket, ChunkData, path, fetchPublicIPv4, fetchPublicIPv6};