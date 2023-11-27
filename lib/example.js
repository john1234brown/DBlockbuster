const WebSocket = require('ws');
const fs = require('fs').promises;

const maxThreads = 4; // Set your maximum thread count here
const dataset = [];
let broadcasterIds = [];

class ChunkData {
  // ... (your existing ChunkData class)
}

async function readAndPopulateDataset(filePath, tmdbId) {
  const size = (10 ** 6) / 4 //500kb //1mb // 1024*32 32kb;
  const stream = await fs.createReadStream(filePath, { highWaterMark: size });
  for await (const chunk of stream) {
    dataset[tmdbId].push(chunk);
  }
}

async function startsocket(url, connectionDetails) {
  return new Promise((resolve, reject) => {
    const wsbroadcaster = new WebSocket(url);

    wsbroadcaster.on('open', () => {
      console.log(`Connected as a broadcaster for ${connectionDetails.providerId}`);
      wsbroadcaster.send(JSON.stringify(connectionDetails));
      resolve(wsbroadcaster);
    });

    wsbroadcaster.on('close', () => {
      console.log(`Disconnected as a broadcaster for ${connectionDetails.providerId}`);
      reject(new Error('WebSocket closed unexpectedly.'));
    });
  });
}

async function setupBroadcaster(providingType, providerId, fileType, tmdbId, typeTvShowOrMovie, season, episode, totalChunks, streamerId) {
  switch (providingType){

    case 0:
    //This will be for http serving method! relay to streamer the http url!

    break;

    case 1:
    //This will be for relay to all current streamers!

    break;

    case 2:
    //This will be for direct streamerId

    break;
  }
  const connectionDetailsArray = [
    { type: 'broadcaster', providerId: providerId, filetype: 'mp4', tmdbId: '456', typeTvShowOrMovie: 'tv', season: '1', episode: '1' },
    // Add more connection details as needed...
  ];

  try {
    await readAndPopulateDataset('./speech.mp4', '456');

    // Example: Establishing multiple WebSocket connections in parallel
    const connections = await Promise.all(
      connectionDetailsArray.map(async (connectionDetails) => {
        return startsocket('ws:localhost:3000', connectionDetails);
      })
    );

    // Continue with the rest of your logic...
  } catch (error) {
    console.error(error);
  }
}
await readAndPopulateDataset('./speech.mp4', '456');
await setupBroadcaster(providerId, fileType, tmdbId, typeTvShowOrMovie, season, episode, dataset['456'].length);

//how to setup multiple broadcaster Connections