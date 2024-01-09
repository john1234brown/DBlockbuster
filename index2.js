const path = require('node:path');
const crypto = require('crypto');
const WebSocket = require('ws');
const os = require('os');
const fs = require('node:fs');
const { Notification } = require('electron');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { DB, DBr } = require(path.join(path.dirname(process.execPath), 'lib/db.js'));
//const { configJSON } = require('./index.js');
var configjson = setup();
var __newDirName;
var p2pRunning = false;
var pingEventReady = false;
var providerId = generateMD5Checksum(Date.now()+ '-'+generateId());
console.log('Hello World Welcome to the optimized version of File Sharing!');
//This will be the easy to read and check incase our broadcastWorkers map set is to hard to forEach through and find out information etc..!
var broadcasters = [];
var eventsWebsocket;
var messageDomainIndex = 0;
var videoDomainIndex = 0;
var messageDomains;
var videoDomains;
var messageSocket;
var broadcastWorkers = new Map();

class NewWorkerData {
  constructor(workerData) {
    this.socketUrl = workerData.socketUrl,
    this.threadIndex = workerData.threadIndex,
    this.filePath = workerData.filePath,
    this.providerId = workerData.providerId,
    this.providerName = configjson.providerUsername,
    this.fileType = workerData.fileType,
    this.tmdbId = workerData.tmdbId,
    this.typeTvShowOrMovie = workerData.typeTvShowOrMovie,
    this.season = workerData.season,
    this.episode = workerData.episode,
    this.quality = workerData.quality,
    this.broadcasterId = workerData.broadcasterId
  }
  toJSON() {
    return {
      socketUrl: this.socketUrl,
      threadIndex: this.threadIndex,
      filePath: this.filePath,
      providerId: this.providerId,
      providerName: configjson.providerUsername,
      fileType: this.fileType,
      tmdbId: this.tmdbId,
      typeTvShowOrMovie: this.typeTvShowOrMovie,
      season: this.season,
      episode: this.episode,
      quality: this.quality,
      broadcasterId: this.broadcasterId
    };
  }
}

function setup(){
  const homeDirectory = os.homedir();
  // Define the destination directory for your files
  const destinationDirectory = path.join(homeDirectory, 'DBlockbuster');
  const destinationPath = path.join(destinationDirectory, 'config.json');
  // Read and parse the config.json file
  const configContent = fs.readFileSync(destinationPath, 'utf-8');
  const configJSON = JSON.parse(configContent);
  console.log('Config file is:', configJSON);
  return configJSON;
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
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

//Complete No Bugs
function convertTitle2foldername(b) {
  var a = b.toString().toLowerCase();
  a = a.replaceAll(' ', '');
  a = a.replaceAll(/[\W_]+/g, "");
  //d = encodeURIComponent(d);
  //d = d.replaceAll('^\\+', '').replaceAll('[\\\\/:*?\'<>|]', '');
  return a;
}


function s(input) {
  if (typeof input !== 'string' && typeof input === 'number') {
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
    return Number(input);
  }

  if (typeof input !== 'string' && typeof input === 'object') {
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
    return Object(input);
  }
  if (input !== undefined || null){
  input = input.replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|['"|`]|\\/g, '');
  }
  return input;
}

function startBroadcastWorker(workerData) {
  if (broadcastWorkers.size < 5) {
    var worker = new Worker(path.join(path.dirname(process.execPath), '/lib/broadcaster.js'), { workerData: workerData });

    worker.on('error', (err) => { throw err; });

    worker.on('exit', () => {
      //findBroadcaster()
      broadcastWorkers.delete(worker);
      console.log("Worker has exited.");
    });

    worker.on('message', (msg) => {
      try {
        const jsonmsg = JSON.parse(msg);
        console.log('GOT A MESSAGE FROM A WORKER THREADDDDDDDDDD!!!!!!!!!!!!!!@#@#@#@#@#,', jsonmsg);
        if (jsonmsg.type === 'broadcasterId') {
          console.log('BROADCASTER WORKER HAS SENT THERE BROADCASTER ID');
          broadcastWorkers.set(worker, jsonmsg.workerData);
        
          const matchingBroadcaster = findBroadcasterByWorker(worker);

          if (messageSocket.readyState === 1 && matchingBroadcaster) {
            console.log('Message Socket Is is open sending BroadcasterReady message');
            console.log('Matching Broadcaster:', matchingBroadcaster);
          
            const providerId = matchingBroadcaster.providerId;
            const providerName = matchingBroadcaster.providerName;
            const broadcasterId = matchingBroadcaster.broadcasterId;
            const domain = matchingBroadcaster.socketUrl;
            const tmdbId = matchingBroadcaster.tmdbId;
            const reqSeason = matchingBroadcaster.season;
            const reqType = matchingBroadcaster.typeTvShowOrMovie;
            const reqEpisode = matchingBroadcaster.episode;
            const reqQuality = matchingBroadcaster.quality;
            const reqFileType = matchingBroadcaster.fileType;
            const json  = {
              connectionType: 'Provider',
              messageType: 'BroadcasterReady',
              providerId: providerId,
              providerName: providerName,
              broadcasterId: broadcasterId,
              domain: domain,
              tmdbId: tmdbId,
              reqType: reqType,
              reqSeason: reqSeason,
              reqEpisode: reqEpisode,
              reqQuality: reqQuality,
              reqFileType: reqFileType
            }
            console.log(json);
            messageSocket.send(JSON.stringify(json));
          }
        }else{
          console.log(msg);
        }
      }catch(e){
      console.log(e);
      }
    });

    //broadcastWorkers.set(worker, workerData);

    const maxRuntime = 4 * 60 * 60 * 1000; // 4 hours
    setTimeout(() => {
      worker.terminate();
      console.log("Worker terminated after 4 hours.");
    }, maxRuntime);
  } else {
    console.log("Maximum number of workers reached. Cannot start a new worker.");
  }
}



async function respond(Obj) {
  try {
    eventsWebsocket.send(JSON.stringify(Obj));
  } catch (e) {
    console.log(e);
  }
}

/*This still needs to be worked on i feel like hasn't been fully complete for future setups need
to include a connected client amount in the nodes status data via post updates 
to the gateway to keep track of total connected clients on each node to properly load balance

*/
function startStopP2P() {
  if (p2pRunning) {
    if (configjson.websocket) {
      eventsWebsocket.close();
    }else{
      const test = new Notification();
      test.title = "Configuration Error";
      test.body = "You need to update your config.json file located at your Home Folder inside the DBlockbuster Folder and make sure the option websocket is set to true!";
      test.show();
    }
    p2pRunning = false;
  } else {
    if (configjson.websocket){
      initializeP2P();
    }else{
      const test = new Notification();
      test.title = "Configuration Error";
      test.body = "You need to update your config.json file located at your Home Folder inside the DBlockbuster Folder and make sure the option websocket is set to true!";
      test.show();
    }
    //initializeP2P();
  }
}

//This has been tested and works as expected!
//Complete no Bugs!!
function processMsg(msg) {
  try {
    var data = JSON.parse(msg);
    realLog('PRocessing This message!',data);
    if (data.messageType === 'Requesting') {
      console.log('This is not a message it is a request! checking if we have it! if so will respond!:', JSON.stringify(data));
      if (data.reqType) {
        /*if (data.reqType === 'tv'){
          console.log('its a tv request');
        }
        if (data.reqType === 'movie'){
          console.log('its a movie request');
        }*/
        switch (data.reqType) {
          case "tv":
            //console.log('Its a tv show');
            //Event better and shorter version to cut down on for looping unnecessarily!
            //console.log(data.id);
            if (Pings2Check.find((value, rootIndex) => {
              //console.log(rootIndex);
              if (value.info.tvshows.find(row => parseInt(row.id) === parseInt(data.id))){
              //if (value.find(row => parseInt(row.id) === parseInt(data.id))) {
                //console.log('WE found it we have it!\n with rootIndex of:', rootIndex);
                if (arrayOfPingJsonTemp[rootIndex].info.tvshows.find(row => parseInt(row.id) === parseInt(data.id))) {
                  var tvIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows.findIndex(row => parseInt(row.id) === parseInt(data.id));
                  if (arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons?.find(r => parseInt(r.season) === parseInt(data.reqSeason))) {
                    var seasonIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons.findIndex(r => parseInt(r.season) === parseInt(data.reqSeason));
                    if (arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes?.find(ep => parseInt(ep.episode) === parseInt(data.reqEpisode))) {
                      var episodeIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes.findIndex(ep => parseInt(ep.episode) === parseInt(data.reqEpisode));
                      console.log('Requested Resource Found Root index:', rootIndex, 'tvshowindex', tvIndex, 'seasonindex', seasonIndex, 'episodeindex', episodeIndex);
                      var listOfTypes = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes[episodeIndex].listoftypes;
                      var objToSend = {
                        connectionType: 'Provider',
                        messageType: 'Providing',
                        clientId: data.clientId,
                        providerUsername: configjson.providerUsername,
                        providerId: providerId,
                        id: data.id,
                        reqType: data.reqType,
                        reqSeason: data.reqSeason,
                        reqEpisode: data.reqEpisode,
                        listoftypes: listOfTypes,
                        domain: videoDomains[videoDomainIndex].domain
                      }
                      //console.log('WE HAVE IT FOuND IT WE SHOULD SUPPLY IT!');
                      respond(objToSend);
                      return 1;
                    }
                  }
                }
              }
            })) {
              //console.log('We have it!');
            }

            break;
          case "movie":
            console.log('Its a movie');
            //Event better and shorter version to cut down on for looping unnecessarily!
            if (Pings2Check.find((value, rootindex) => {
              //console.log('pings2check',Pings2Check);
              //console.log('value:', value)
              //console.log('Checking Value Index', value.info.movies);
              if (value.info.movies.find(row => parseInt(row.id) === parseInt(data.id))) {
                console.log('WE found it we have it!\n with rootIndex of:', rootindex);
                var index = value.info.movies.findIndex(row => parseInt(row.id) === parseInt(data.id));
                var listOfTypes = arrayOfPingJsonTemp[rootindex].info.movies[index].listoftypes;
                //console.log(videoDomains);
                var objToSend = {
                  connectionType: 'Provider',
                  messageType: 'Providing',
                  clientId: data.clientId,
                  providerUsername: configjson.providerUsername,
                  providerId: providerId,
                  id: data.id,
                  reqType: data.reqType,
                  listoftypes: listOfTypes,
                  domain: videoDomains[videoDomainIndex].domain
                }
                console.log('WE HAVE IT FOuND IT WE SHOULD SUPPLY IT!');
                //console.log('found', data.id);
                //console.log(arrayOfPingJsonTemp[rootindex].info.movies[index].listoftypes);
                //console.log(rootindex);
                console.log(objToSend);
                respond(objToSend);
                return 1;
              }
            })) {
              //console.log('We have it!');
            }
            break;
        }
      }
    } else {
      if (data.messageType === 'providing') {
        return;
      }
      //console.log(msg.data)
      console.log('This is a msg! no need to check!', JSON.stringify(data));
    }
  } catch (e) {
    realLog(e);
  }
}
//Still testing this code!!!
async function processMsgBroadcast(msg) {
  try {
    var data = JSON.parse(msg);
    console.log('REQUEST2BROADCAST Processing This message!', data);

    if (data.messageType === 'Request2Broadcast') {
      console.log('REQUEST2BROADCAST PROCESS This is not a message it is a request! Checking if we have it! If so, will respond:', JSON.stringify(data));

      if (data.reqType) {
        switch (data.reqType) {
          case "tv":
            console.log('It\'s a tv show');
            var tvShowResult = await new Promise ((resolve, reject) => {
              if (Pings2Check.find((value, rootIndex) => {
              console.log(rootIndex);
              if (value.info.tvshows.find(row => parseInt(row.id) === parseInt(data.id))){
              //if (value.find(row => parseInt(row.id) === parseInt(data.id))) {
                console.log('WE found it we have it!\n with rootIndex of:', rootIndex);
                var repoName = configjson.listOfRootFolderNames[rootIndex];
                if (arrayOfPingJsonTemp[rootIndex].info.tvshows.find(row => parseInt(row.id) === parseInt(data.id))) {
                  var tvIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows.findIndex(row => parseInt(row.id) === parseInt(data.id));
                  var tvName = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].name;
                  if (arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons?.find(r => parseInt(r.season) === parseInt(data.reqSeason))) {
                    var seasonIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons.findIndex(r => parseInt(r.season) === parseInt(data.reqSeason));
                    if (arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes?.find(ep => parseInt(ep.episode) === parseInt(data.reqEpisode))) {
                      var episodeIndex = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes.findIndex(ep => parseInt(ep.episode) === parseInt(data.reqEpisode));
                      console.log('Requested Resource Found Root index:', rootIndex, 'tvshowindex', tvIndex, 'seasonindex', seasonIndex, 'episodeindex', episodeIndex);
                      var listOfTypes = arrayOfPingJsonTemp[rootIndex].info.tvshows[tvIndex].seasons[seasonIndex].episodes[episodeIndex].listoftypes;
                      if (listOfTypes.find(row => row.type === data.reqQuality && row.filetype === data.reqFileType)) {
                        var listOfTypesIndex = listOfTypes.findIndex(row => row.type === data.reqQuality && row.filetype === data.reqFileType);
                        console.log('WE HAVE IT FOuND IT WE SHOULD SUPPLY IT!');
                        //Here is where we need to implement our Websocket system to broadcast if we are not already broadcasting this file etc.. if we are already broadcasting then just providing the id etc..
                        //Potentially we might keep this for just displaying us on the website then after they click we will have a message that might fire off the psudeo code we are talking about above comment ^
                        filePath = path.join(configjson.repoDir, repoName, "tvshows", tvName+"-"+data.id, data.reqSeason, data.reqEpisode, data.reqQuality, listOfTypes[listOfTypesIndex].id+"."+data.reqFileType);
                        let tvShowResultTmp =  {
                          repoDir: configjson.repoDir,
                          repoName: repoName,
                          rIndex: rootIndex,
                          Name: tvName,
                          index: tvIndex,
                          season: seasonIndex,
                          episode: episodeIndex,
                          listOfTypes: listOfTypesIndex,
                          fileName: listOfTypes[listOfTypesIndex].id,
                          requestedQuality: data.reqQuality,
                          requestedFileType: data.reqFileType,
                          filePath: filePath
                        };
                        resolve(tvShowResultTmp);
                      }
                    }
                  }
                }
              }
            })){
              console.log('We Have it continue on with the search!');
            }else{
              console.log('We dont have it reject false');
              reject(false);
            }
          });
          
          if (tvShowResult) {
          //respond(tvShowResult);
          return tvShowResult;
          };
          //return { repoDir: configjson.repoDir, rIndex: rootIndex.toString(), season: requestedSeason, episode: requestedEpisode };
          break;

          case "movie":
            console.log('It\'s a movie');
            var movieResult = await new Promise ((resolve, reject) => { 
              if (Pings2Check.find((value, rootIndex) => {
                //console.log(rootindex);
                //console.log(value);
                var repoName = configjson.listOfRootFolderNames[rootIndex];
                if (value.info.movies.find(row => parseInt(row.id) === parseInt(data.id))) {
                  console.log('We found it, we have it!\n with rootIndex of:', rootIndex);
                  var index = value.info.movies.findIndex(row => parseInt(row.id) === parseInt(data.id));
                  var listOfTypes = arrayOfPingJsonTemp[rootIndex].info.movies[index].listoftypes;
                  var movieName = arrayOfPingJsonTemp[rootIndex].info.movies[index].name;
                  if (listOfTypes.find(row => row.type === data.reqQuality && row.filetype === data.reqFileType)) {
                    var listOfTypesIndex = listOfTypes.findIndex(row => row.type === data.reqQuality && row.filetype === data.reqFileType);
                    console.log('WE HAVE IT FOuND IT WE SHOULD SUPPLY IT!');
                    //Here is where we need to implement our Websocket system to broadcast if we are not already broadcasting this file etc.. if we are already broadcasting then just providing the id etc..
                    //Potentially we might keep this for just displaying us on the website then after they click we will have a message that might fire off the psudeo code we are talking about above comment ^
                    var filePath = path.join(configjson.repoDir, repoName, "movies", movieName+"-"+data.id.toString(), data.reqQuality, listOfTypes[listOfTypesIndex].id+"."+data.reqFileType);
                    let movieResultTmp = {
                      repoDir: configjson.repoDir,
                      repoName: repoName,
                      rIndex: rootIndex,
                      Name: movieName,
                      index: index,
                      listOfTypes: listOfTypesIndex,
                      fileName: listOfTypes[listOfTypesIndex].id,
                      requestedQuality: data.reqQuality,
                      requestedFileType: data.reqFileType,
                      filePath: filePath,
                    };
                    resolve(movieResultTmp);
                    //return movieResult;
                  }
                }
              })){
                console.log('We Have it continue on with the search!');
              }else{
                console.log('We dont have it reject false');
                reject(false);
              }
            });
            if (movieResult){
              return movieResult;
            };
            break;
        }
      }
    } else {
      if (data.messageType === 'providing') {
        return false;
      }
      console.log('This is a msg! No need to check!', JSON.stringify(data));
    }
  } catch (e) {
    console.log(e);
  }
}
/**
 * Finds the broadcaster by the given worker.
 * 
 * @param {type} worker - The worker to search for in the broadcaster data.
 * @return {type} The broadcaster data if a matching worker is found, otherwise null.
 */
function findBroadcasterByWorker(worker) {
  const workerDataArray = Array.from(broadcastWorkers.entries());

  const matchingWorkerData = workerDataArray.find(([currentWorker, workerData]) => {
    return currentWorker === worker;
  });

  if (matchingWorkerData) {
    return matchingWorkerData[1]; // Return the workerData object
  } else {
    return null; // Return null if no matching worker data found
  }
}
/**
 * Finds the broadcaster that matches the given criteria.
 *
 * @param {number} tmdbId - The TMDB ID of the TV show or movie.
 * @param {number} season - The season number.
 * @param {number} episode - The episode number.
 * @param {string} typeTvShowOrMovie - The type of the TV show or movie.
 * @param {string} quality - The desired quality of the broadcast.
 * @param {string} filetype - The desired filetype of the broadcast.
 * @return {object|null} The workerData object of the matching broadcaster, or null if no matching broadcaster found.
 */
function findBroadcaster(tmdbId, season, episode, typeTvShowOrMovie, quality, filetype) {
  try {
    // Convert map entries to array
    const workerDataEntries = Array.from(broadcastWorkers.entries());

    // Filter array based on criteria
    const matchingBroadcasters = workerDataEntries.filter(([worker, workerData]) => {
      return (
        workerData.tmdbId === tmdbId &&
        workerData.typeTvShowOrMovie === typeTvShowOrMovie &&
        workerData.season === season &&
        workerData.episode === episode &&
        workerData.quality === quality &&
        workerData.fileType === filetype
      );
    });

    // Extract the first matching broadcaster (if any)
    const matchingBroadcaster = matchingBroadcasters[0];
    if (matchingBroadcaster) {
      return matchingBroadcaster[1]; // Return the workerData object
    } else {
      return null; // Return null if no matching broadcaster found
    }
  } catch (error) {
    console.log('Error in findBroadcaster:', error);
    return null; // Return null in case of an error
  }
}

async function startMessage(domain, port){
  try {
  console.log('Starting Message Server Provider Client!');
  const providerid = await generateMD5Checksum(Date.now() + generateId());
  providerId = providerid;
  console.log(providerId);
  eventsWebsocket = new WebSocket('wss://'+domain+':'+port);
  messageSocket = eventsWebsocket;
  eventsWebsocket.on('open', () => {
    console.log('Connected as a Provider');
    p2pRunning = true;
    eventsWebsocket.send(JSON.stringify({
      connectionType: 'Provider',
      messageType: 'Initialize',
      providerId: providerId,
      providerUsername: configjson.providerUsername,
      domain: videoDomains[videoDomainIndex].domain
    }));
  });
  eventsWebsocket.on('message', async (msg) => {
    try {
      console.log('Got a message:', msg);
      var json = JSON.parse(msg);
      console.log(json);
      if (json.messageType === 'Requesting') {
       console.log('This is a request:', msg);
       processMsg(msg);
      }
      
      if (json.messageType === 'Request2Broadcast') {
        console.log('We need to setup workerData');
      
        const processedResponse = await processMsgBroadcast(msg);
      
        if (processedResponse) {
          if (broadcastWorkers.length >= 1) {
            const matchingBroadcaster = findBroadcaster(
              s(json.id),
              s(json.reqSeason),
              s(json.reqEpisode),
              s(json.reqType),
              s(json.reqQuality),
              s(json.reqFileType)
            );
            if (matchingBroadcaster) {
              console.log('We have a matching broadcaster:', matchingBroadcaster);
              // Use the existing matchingBroadcaster object
              const workerData = matchingBroadcaster;


            } else {
              // Start a new broadcast worker if no matching broadcaster exists
              const workerData = {
                socketUrl: `wss://${videoDomains[videoDomainIndex].domain.replace('http://', '').replace('https://', '')}`,
                threadIndex: broadcastWorkers.length, // Increment thread index for new worker
                filePath: processedResponse.filePath,
                providerId: providerId,
                providerName: configjson.providerUsername,
                fileType: s(json.reqFileType),
                tmdbId: s(json.id),
                typeTvShowOrMovie: s(json.reqType),
                season: s(json.reqSeason),
                episode: s(json.reqEpisode),
                quality: s(json.reqQuality),
                appPath: app.getAppPath()
              };
          
              console.log('WorkerData:', workerData);
              startBroadcastWorker(workerData);
            }
          } else {//There are no workers so we must start one and start the thread index!
            // Start a new broadcast worker since there are no existing workers
            const workerData = {
              socketUrl: `wss://${videoDomains[videoDomainIndex].domain.replace('http://', '').replace('https://', '')}`,
              threadIndex: 0, // Initialize thread index for the first worker
              filePath: processedResponse.filePath,
              providerId: providerId,
              providerName: configjson.providerUsername,
              fileType: s(json.reqFileType),
              tmdbId: s(json.id),
              typeTvShowOrMovie: s(json.reqType),
              season: s(json.reqSeason),
              episode: s(json.reqEpisode),
              quality: s(json.reqQuality),
              appPath: app.getAppPath()
            };
          
            console.log('WorkerData:', workerData);
            startBroadcastWorker(workerData);
          }
        }//This is the end of our processed Response Undefined Check Here!
      }//This is the end of our Request2Broadcast Check Here!
    } catch (e) {
      const test = new Notification();
      test.title = "Message Error";
      test.body = "This message couldnt be processed by the gateway!!";
      test.show();
      console.error(e);
    }
  });
  console.log('Finished Executing StartMessage()');
}catch(e){
  console.log(e);
}
}

//Still updating this Code!!!
async function initializeP2P() {
  if (!p2pRunning) {
    if (configjson.websocket) {
      if (configjson.websocket_localVideoRelay === true){
        await startMessage('ws://localhost', configjson.websocket.localVideoPort);
      }else{
        let gatewayws = new WebSocket(configjson.websocket_gateway);
        gatewayws.on('open', () => {
          console.log('Websocket Connected!');
          var json = {
            connectionType: 'client',
            messageType: 'availability'
          }
          gatewayws.send(JSON.stringify(json));
        });
        gatewayws.on('message', async (event) => {
          try{
            var json = JSON.parse(event);
            console.log(json);
              if(json.messageType === 'availability'){
                console.log('Gateway Availability:', json);
                videoDomains = json.videoNodes;
                messageDomains = json.nodes;
                await startMessage(messageDomains[0].domain, messageDomains[0].port);
                gatewayws.close();
              }
          }catch(e){
            console.log(e);
          }
        });
      }
    }
  }
}

function quitProcess() {
  process.exit();
}


if (configjson.websocket === true){
  try {
  startStopP2P();
  }catch(e){
    console.log(e);
  }
}
//startStopP2P();
module.exports = { startStopP2P }