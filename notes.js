/*const sendForwardStreamMessage = (ws, messageData) => {
  console.log(messageData);

  // Extract the broadcaster ID from the WebSocket connection
  const broadcasterId = getBroadcasterIdFromWsConnection(ws);
  if (broadcasterId) {
    // Check if the broadcaster ID exists in dataObject
    if (!dataObject.hasOwnProperty(broadcasterId)) {
      // If it doesn't exist, create a new array for that broadcasterId
      dataObject[broadcasterId] = [];
    }

    // Convert the Uint8Array to a Buffer object
    const buffer = Buffer.from(messageData);

    // Check if the Buffer is a valid MP4 header
    const header = buffer.slice(0, 4).toString('ascii');
    if (header === 'ftyp') {
      // Add the valid MP4 header Buffer to the array
      dataObject[broadcasterId].push(buffer);
    } else {
      console.error('Invalid MP4 header:', header);
    }

    // Check if the full video data has been received
    if (dataObject[broadcasterId].length === totalChunks[broadcasterId]) {
      // Concatenate chunks to form the full video data
      const fullVideoBuffer = Buffer.concat(dataObject[broadcasterId]);

      // Store the full video data in the cache
      fullVideoData[broadcasterId] = fullVideoBuffer;

      // Notify broadcaster of complete video
      ws.send(JSON.stringify({ type: 'videoDataReady' }));

      // Clear the dataObject so we can start fresh again
      delete dataObject[broadcasterId];
    }
  }
};*/