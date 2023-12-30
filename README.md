# Project Documentation

## Overview

This project implements a WebSocket server with Express and Node.js, facilitating communication between various client types such as Requesters, Providers, Broadcasters, and Streamers.

## Dependencies

- **Express**: Web application framework for Node.js
- **WebSocket**: Library for WebSocket server implementation
- **lodash**: Utility library for common JavaScript tasks
- **jsonwebtoken**: Library for JSON Web Token (JWT) creation and verification
- **cloudflared**: Library for running Cloudflare Tunnels from within NodeJS without an account by using try.cloudflare.com free randomly generated domains.

## Configuration

### SSL Certificates

Ensure the following SSL certificates are available in the specified paths:

- Private Key: `./certs/private-key.pem`
- Root CA: `./certs/rsaroot.pem`
- Origin Certificate: `./certs/origin-certificate.pem`

### Project Configuration

Update the `./configs/config.json` file with the desired configuration parameters.

## Main Execution

The `main` function is responsible for initializing the WebSocket server based on the project configuration. It dynamically handles HTTPS and HTTP servers depending on the setup.

### WebSocket Communication with Gateway
- There's a WebSocket connection to a gateway (`wss://gateway.dblockbuster.com:8443`).
- Handshake, heartbeats, and response signing with challenges are handled.
- The code sends information about the server's status, such as the number of streamers, broadcasters, requesters, and providers, to the gateway.

### WebSocket Server Communication

### Requester

- **Initialize**: Initializes a requester with the provided parameters.
  - Parameters:
    - `tmdbId`: ID of the requested media on TMDb.
    - `type`: Type of media, either "tv" or "movie".
    - `filetype`: Filetype of the requested media.
    - `quality`: Quality of the requested media, default is "auto".
    - `season`: Season number (for TV shows), default is 0.
    - `episode`: Episode number (for TV shows), default is 0.
  - Sends back a unique `clientId` to the requester.
  - Notifies all providers about the new requester.

- **Request2Broadcast**: Notifies providers about the request to broadcast a specific media.
  - Parameters:
    - `providerId`: ID of the selected provider.
    - `providerUsername`: Username of the selected provider.
    - `id`: ID of the requested media on TMDb.
    - `type`: Type of media, either "tv" or "movie".
    - `filetype`: Filetype of the requested media.
    - `quality`: Quality of the requested media.
    - `season`: Season number (for TV shows).
    - `episode`: Episode number (for TV shows).

### Provider

- **Initialize**: Initializes a provider with the provided parameters.
  - Parameters:
    - `providerId`: ID of the provider.
    - `providerUsername`: Username of the provider.
    - `domain`: Domain of the provider.
    - `isLazyProviding`: Indicates if the provider supports lazy providing.
    - `lazyProvidingSpaceLeft`: Available space for lazy providing (if applicable).
  - Notifies all providers about the new provider.

- **BroadcastReady**: Notifies the requester when a broadcaster is ready to broadcast.
  - Parameters:
    - `clientId`: ID of the requester.
    - `providerId`: ID of the provider.
    - `providerUsername`: Username of the provider.
    - `broadcasterId`: ID of the broadcaster.
    - `domain`: Domain of the provider.

- **BroadcasterReady**: Notifies the requester when a broadcaster is ready to fulfill the request.
  - Parameters (similar to BroadcastReady).

- **BroadcastEnded**: Notifies the requester when a broadcast ends.
  - Parameters (similar to BroadcastReady).

- **Providing**: Notifies the requester about the media being provided.
  - Parameters:
    - `clientId`: ID of the requester.
    - `providerId`: ID of the provider.
    - `providerUsername`: Username of the provider.
    - `id`: ID of the provided media on TMDb.
    - `listoftypes`: List of file types available for the media.
    - `reqType`: Type of media, either "tv" or "movie".
    - `reqSeason`: Season number (for TV shows).
    - `reqEpisode`: Episode number (for TV shows).
    - `domain`: Domain of the provider.

### Broadcaster

- **Initialize**: Initializes a broadcaster with the provided parameters.
  - Parameters:
    - `providerId`: ID of the associated provider.
    - `tmdbId`: ID of the associated media on TMDb.
    - `typeTvShowOrMovie`: Type of media, either "tv" or "movie".
    - `filetype`: Filetype of the media, default is "mp4".
    - `quality`: Quality of the media, default is "auto".
    - `season`: Season number (for TV shows), default is 0.
    - `episode`: Episode number (for TV shows), default is 0.
  - Sends back a unique `broadcasterId` to the broadcaster.

### Streamer

- **Initialize**: Initializes a streamer with the provided parameters.
  - Parameters:
    - `providerId`: ID of the associated provider.
    - `filetype`: Filetype of the media, default is "mp4".
    - `broadcasterId`: ID of the associated broadcaster.
    - `tmdbId`: ID of the associated media on TMDb.
    - `typeTvShowOrMovie`: Type of media, either "tv" or "movie".
    - `quality`: Quality of the media, default is "auto".
    - `season`: Season number (for TV shows), default is 0.
    - `episode`: Episode number (for TV shows), default is 0.
  - Sends back a unique `streamerId` to the streamer.
  - Notifies the associated broadcaster about the streamer's details.

### Broadcasting Methods

- **ping**: Receives a ping message from the broadcaster and replies with a pong.

### Error Handling

- If invalid or incomplete data is received during initialization, the WebSocket connection is closed.

### Disconnection Handling

- Handles disconnection based on the connection type, removing the client from the respective array.

### Broadcasting Data

- Handles the reception of broadcasting data in chunks.
- Checks for duplicate chunk indices and constructs the full video data when all chunks are received.
- Notifies the broadcaster when the video data is ready.

### Streamer Communication

- Forwards streaming data to the respective streamers based on the broadcasting method.

### Video Streaming
- The `/video` route handles video streaming, supporting partial content requests using the `Range` header.
- The code efficiently manages video chunks and sends them to the client based on the requested range.

### Error Handling
- You have implemented error handling for various scenarios, such as missing range headers or broadcaster not found.

### Cleanup and Exit
- You have a cleanup function that executes when the process exits (either naturally or due to a signal like SIGTERM or SIGINT). It deletes files in the tmp folder.

## Conclusion

Ensure proper initialization and communication between broadcasters and streamers for successful media streaming.

# utility.js Documentation

## Dependencies
- [fs](https://nodejs.org/api/fs.html): File system module for handling file operations.
- [http](https://nodejs.org/api/http.html): HTTP module for making HTTP requests.
- [crypto](https://nodejs.org/api/crypto.html): Crypto module for cryptographic functionalities.
- [WebSocket](https://www.npmjs.com/package/ws): WebSocket implementation for Node.js.
- [path](https://nodejs.org/api/path.html): Path module for working with file and directory paths.

## Constants

### tmpFolderConfigPath
- Description: Path to the temporary folder (replace with the actual tmp folder path).
- Type: String
- Example: `./tmp`

### sizeLimitInBytes
- Description: Size limit for the temporary folder in bytes.
- Type: Number
- Example: `10 * 1024 * 1024 * 1024` (10 GB)

## Class

### ChunkData
- Description: Represents chunk data for streaming.
- Properties:
  - `providingType`: Type of providing.
  - `metaData`: Metadata.
  - `totalIndex`: Total index.
  - `index`: Chunk index.
  - `timestamp`: Timestamp.
  - `data`: Data.

  #### Methods

  ##### `toUint8Array()`
  - Description: Converts ChunkData to Uint8Array.

## Functions

### generateId()
- Description: Generates a random ID.
- Returns: String

### cleanupAndExit()
- Description: Deletes all files in the temporary folder and performs cleanup tasks before exiting.

### generateMD5Checksum(data)
- Description: Generates an MD5 checksum for the provided data.
- Parameters:
  - `data`: Data to generate the checksum for.
- Returns: Promise\<String>

### getFolderSize(folderPath)
- Description: Retrieves the size of a folder recursively.
- Parameters:
  - `folderPath`: Path to the folder.
- Returns: Number

### checkNewFileTmpFolderSize(newFileSize)
- Description: Checks if adding a new file will exceed the temporary folder size limit.
- Parameters:
  - `newFileSize`: Size of the new file.
- Returns: Promise\<Boolean>

### checkTmpFolderSize()
- Description: Checks if the temporary folder size exceeds the limit.
- Returns: Promise\<Boolean>

### deepReplaceEscapeSequences(input)
- Description: Recursively replaces escape sequences in an object or array.
- Parameters:
  - `input`: Input object or array.
- Returns: Transformed object or array.

### s(input)
- Description: Sanitizes input by removing escape characters.
- Parameters:
  - `input`: Input value to be transformed.
- Returns: Transformed value.

### deleteBroadcasterFile(broadcasterId, broadcasterData)
- Description: Deletes a file associated with a broadcaster.
- Parameters:
  - `broadcasterId`: Broadcaster ID.
  - `broadcasterData`: Data associated with the broadcaster.

### storeFullVideoData(broadcasterId, data, ws)
- Description: Stores full video data in the temporary folder.
- Parameters:
  - `broadcasterId`: Broadcaster ID.
  - `data`: Video data.
  - `ws`: WebSocket connection.

### sendEventsToAllProviders(json, ws)
- Description: Sends events to all WebSocket providers.
- Parameters:
  - `json`: JSON data to be sent.
  - `ws`: WebSocket connection.

### fetchPublicIPv4()
- Description: Fetches the public IPv4 address.
- Returns: Promise\<String>

### fetchPublicIPv6()
- Description: Fetches the public IPv6 address.
- Returns: Promise\<String>

Feel free to customize and expand this documentation according to your project's specific requirements.

