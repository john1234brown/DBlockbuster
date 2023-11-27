const http = require('node:http');
const fs = require('node:fs');
const { promises: Fs } = require('node:fs');
const path = require('node:path');
const SmeeClient = require('smee-client');
const crypto = require('crypto');
const WebSocket = require('ws');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
var configjson;
var __newDirName;
var p2pRunning = false;
var pingEventReady = false;
var providerId = generateMD5Checksum(Date.now()+ '-'+generateId());
class NewWorkerData {
  constructor(workerData) {
    workerData = JSON.parse(workerData),
    this.socketUrl = workerData.socketUrl,
    this.threadIndex = workerData.threadIndex,
    this.filePath = workerData.filePath,
    this.providerId = workerData.providerId,
    this.filetype = workerData.filetype,
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
      filetype: this.filetype,
      tmdbId: this.tmdbId,
      typeTvShowOrMovie: this.typeTvShowOrMovie,
      season: this.season,
      episode: this.episode,
      quality: this.quality,
      broadcasterId: this.broadcasterId
    };
  }
}
var broadcastWorkers = new Map();
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

function startBroadcastWorker(workerData) {
  if (broadcastWorkers.size < 5) {
    var worker = new Worker(path.join(path.dirname(process.execPath), '/lib/broadcaster.js'), { workerData: workerData });

    worker.on('error', (err) => { throw err; });

    worker.on('exit', () => {
      broadcastWorkers.delete(worker);
      console.log("Worker has exited.");
    });

    worker.on('msg', (msg) => {
      if (msg.type === 'broadcasterId') {
        broadcastWorkers.set(worker, new NewWorkerData(msg.workerData));
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
//This will be the easy to read and check incase our broadcastWorkers map set is to hard to forEach through and find out information etc..!
var broadcasters = [];
var eventsWebsocket;
var messageDomainIndex = 0;
var videoDomainIndex = 0;
var messageDomains;
var videoDomains;
//HERE WE INITIALIZE ALL OF OUR VARIABLES TO THE EXECUTION FOLDER USING THE ./ directory path!
//AND taking a file from the path.join(app.getAppPath(), 'filepath') and writing it to the ./ Directory if it doesn't exist!
//This is basically responsible for handling multiple Operating systems!
async function initializeObjectsInExecutionPath() {
  //Here
  switch (process.platform) {
    case "win32":
      //Do Nothing config file is saved and used from the appData Program location folder on windows!
      //The installer for windows auto handles and bundles all of that!
      //The only thing this os needs is the quit option to close this process from the tray icon
      var configJSON = await fs.promises.readFile('./config.json');
      configjson = JSON.parse(configJSON);
      __newDirName = configjson.repoDir.replaceAll('//', '\\');
      console.log(__newDirName);
      console.log(configjson);
      rootFolderName = configjson.listOfRootFolderNames[rootFolderIndex];
      break;
    case "linux":
      //fs.readFileSync()
      try {
        const stat = fs.existsSync('./config.json');
        if (stat) {
          console.log('It exists the user config!');
          var configJSON = await fs.promises.readFile('./config.json');
          configjson = JSON.parse(configJSON);
          rootFolderName = configjson.listOfRootFolderNames[rootFolderIndex];
          __newDirName = configjson.repoDir;
          console.log(configjson);
          return;// new Promise(resolve=>resolve('done'));
          /*Do nothing continue already exists everything is all good!*/
        } else {
          try {
            const stat2 = fs.existsSync(path.join(path.dirname(process.execPath), '/config.json'));
            console.log('Default config was found:', stat2);
            if (stat2) {
              try {
                const defaultconfig = await fs.promises.readFile(path.join(path.dirname(process.execPath), '/config.json'));
                var json = JSON.parse(defaultconfig);
                await fs.promises.writeFile('./config.json', JSON.stringify(json, null, " "), { flag: 'wx' });
                configjson = json;
                rootFolderName = configjson.listOfRootFolderNames[rootFolderIndex];
                __newDirName = configjson.repoDir;
                console.log(configjson);
                return;// new Promise(resolve=>resolve('done'));
              } catch (e) {
                console.log(e);
                configJSON = await fs.promises.readFile('./config.json');
                configjson = JSON.parse(configJSON);
                rootFolderName = configjson.listOfRootFolderNames[rootFolderIndex];
                __newDirName = configjson.repoDir;
                console.log(configjson);
                return; //new Promise(resolve=>resolve('done'));
              }
            }
          } catch (error) {
            console.log(error);
            var errmsg = {
              err: "Couldn't write the default config, because the program couldn't find it!"
            };
            await fs.promises.writeFile('./error.log', JSON.stringify(errmsg, null, " "));
            process.exit();
          }
          console.log('HEY THIS FILE DOESNT EXIST OHHHHH NOOOO!!!!!!!!!!!');
        }
      } catch (e1) {
        console.log(e1);
      }
      break;
    case "darwin":
      //This one might react the same as linux so might have to write the config file if not existing

      break;
    case "freebsd":
      //I will have to find a os to test on to find out how it works
      break;
    case "openbsd":
      //I will have to find a os to test on to find out how it works
      break;
  }
}
/*function startInitializeConfig(){

}
startInitializeConfig();*/
//initializeObjectsInExecutionPath();
const timer = ms => new Promise(res => setTimeout(res, ms));
const util = require('node:util');
const realLog = console.log;
var clients = [];
//process.env.IPFS_PATH=__newDirName+"/ipfs"
var prefix = "/"
if (process.platform === "win32") {
  prefix = "\\";
}
//const [url] = "http://localhost:3000";
const url = 'https://localhost:5000/'
//console.log(electron);
const electron = require('electron');
const { app, BrowserView, BrowserWindow } = require('electron');
const Tray = electron.Tray;
const iconPath = path.join(path.dirname(process.execPath), '/gui/assets/logos/TabLogo.png');
const Menu = electron.Menu;
var tray = null;

//This Is a test Function used to log things to the console for testing purposes
async function handleClick(menuItem, browserWindow, event) {
  realLog(menuItem);
  realLog(browserWindow);
  realLog(event);
}
//This to potentially be used in the future but honestly we will keep the layout we have!
//__newDirName = path.join(path.join(path.dirname(app.getPath ('home')), require("os").userInfo().username), 'streampal');

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
    }
    p2pRunning = false;
  } else {
    initializeP2P();
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
                        domain: videoDomains.nodes[videoDomainIndex].domain
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
                  domain: videoDomains.nodes[videoDomainIndex].domain
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


//Still updating this Code!!!
async function initializeP2P() {
  if (!p2pRunning) {
    if (configjson.websocket) {
      console.log('WEbsocket set to true! p2p not running fetching status!')
      await fetch('https://vervet-game-koi.ngrok-free.app/status-videos').then(response => response.json()).then((data) => {
        console.log(data);
        videoDomains = data;
        console.log('Video Domains:', videoDomains);
      }).catch(error =>{
        console.log('Error fetching message status endpoints:', error);
      });
      fetch('https://vervet-game-koi.ngrok-free.app/status').then(response => response.json()).then( async (data) =>{
      messageDomains = data;
      //console.log('got data,',data);
      //console.log(data.nodes[0].domain);
      if (data.nodelength < 1) {
        //console.log('No nodes found!');
        return;
      }else{
        if (data.nodes.length >= 1){
          /*
          Here We will eventually implement a forEach Loop through all the data.nodes and find the one with the lowest provider connections!
          But we need to update our Message Server and Video Servers to post to the gateway client counts to help make this a easier process via browser clients and provider here in this application manner!
          */
          //console.log('Nodes found:', data.nodes.length);
          const providerid = await generateMD5Checksum(Date.now() + generateId());
          providerId = providerid;
          console.log(providerId);
          console.log(data.nodes[0].domain);//For now this is basic example on how we can do this in the future we replace messageDomainIndex with the value of the foundIndex of the lowest value on again connected providers!
          eventsWebsocket = new WebSocket('wss://'+messageDomains.nodes[messageDomainIndex].domain.replace('http://','').replace('https://','')+":"+messageDomains.nodes[messageDomainIndex].port);
          eventsWebsocket.onopen = () => {
          console.log('Connected as a Broadcaster');
  
          eventsWebsocket.send(JSON.stringify({
            connectionType: 'Provider',
            messageType: 'Initialize',
            providerId: providerId,
            providerUsername: configjson.providerUsername,
            domain: configjson.domain
          }));
          eventsWebsocket.on('message', async (msg) => {
            try {
              console.log('Got a message:', msg);
              var json = JSON.parse(msg);
              console.log(json);
              if (json.messageType === 'Requesting') {
               console.log('This is a request:', msg);
               processMsg(msg);
              }
              
              if (json.messageType === 'Request2Broadcast'){
                if (broadcastWorkers.length === undefined || broadcastWorkers.length === 0){
                  //We need to setup workerData
                  console.log('We need to setup workerData');
                  //processMsgBroadcast(msg);
                  const processedResponse = await processMsgBroadcast(msg);
                  console.log('We have processedResponse:', processedResponse);
                  console.log('We SEEEM TO BE STALLING HERE OH NO THIS IS NOT GOOD!');
                  if (processedResponse){
                    console.log('We have a response!:', JSON.stringify(processedResponse));
                    console.log(videoDomains.nodes[videoDomainIndex].domain.replace('http://','').replace('https://',''));
                    var workerData = {
                      socketUrl: "wss://"+videoDomains.nodes[videoDomainIndex].domain.replace('http://','').replace('https://',''),
                      threadIndex: 0,
                      filePath: processedResponse.filePath,
                      providerId: providerId,
                      fileType: json.reqFileType,
                      tmdbId: json.id,
                      typeTvShowOrMovie: json.reqType,
                      season: json.reqSeason,
                      episode: json.reqEpisode,
                      quality: json.reqQuality,
                      appPath: app.getAppPath()
                      };
                      console.log('WorkerData:', workerData);
                      startBroadcastWorker(workerData);
                  }

                }


                if (broadcastWorkers.length >= 1){
                  //Then we check to ensure not to duplicate a broadcast!
                }
                //realLog(json);
                //realLog(broadcastWorkers.length);
              }
  
            } catch (e) {
              console.error(e);
            }
          });
          p2pRunning = true;
          };
        }
      }
      }).catch(error =>{
        console.log('Error fetching message status endpoints:', error);
      });
    }
    //p2pRunning = true;
  }
}

function quitProcess() {
  process.exit();
}

function openGUI() {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      useContentSize: false,
      enableLargerThanScreen: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    //const view = new BrowserView()
    //win.setBrowserView(view)
    //view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });
    //view.webContents.loadURL('http://localhost:3000');
    // Load the index.html of the app.
    win.loadURL('http://localhost:5000/');
    //win.loadFile('./index.html')

    // Open the DevTools.
    //win.webContents.openDevTools()
  }
}

function initializeMainGUI() {

  function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      useContentSize: false,
      enableLargerThanScreen: false,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
    })

    //const view = new BrowserView()
    //win.setBrowserView(view)
    //view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });
    //view.webContents.loadURL('http://localhost:3000');
    // Load the index.html of the app.
    win.loadURL('http://localhost:5000/');
    //win.loadFile('./index.html')

    // Open the DevTools.
    //win.webContents.openDevTools()
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // This method is equivalent to 'app.on('ready', function())'
  app.whenReady().then(() => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      tray = new Tray(iconPath);
      let template = [
        /* {
           label: 'audio',
           submenu: [
             {
               label: 'low',
               type: 'radio',
               checked: true,
               click: handleClick
             },
             {
               label: 'High',
               type: 'radio',
               click: handleClick
             }
           ]
         },*/
        {
          id: '2',
          label: 'Open GUI',
          toolTip: 'This will open the Browser GUI incase you closed it and dont want to restart the whole application you can just click this...',
          click: openGUI
        },
        { type: 'separator' },
        {
          id: '1',
          label: 'Start/Stop P2P',
          toolTip: 'Start or Stop the Peer 2 Peer protocol listener this will stop you forwarding your file locations to the peers via the event source server.',
          click: startStopP2P
        },
        { type: 'separator' },
        {
          id: '0',
          label: 'Quit',
          toolTip: 'Closes out the whole application this includes the Tray as well along with the GUI Window',
          click: quitProcess
        }
      ]
      const ctxMenu = Menu.buildFromTemplate(template);
      tray.setContextMenu(ctxMenu);
    }

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the
      // app when the dock icon is clicked and there are no
      // other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      //app.quit()
    }
  });

  // In this file, you can include the rest of your
  // app's specific main process code. You can also
  // put them in separate files and require them here.
}

function is64Bit() {
  return ['arm64', 'ppc64', 'x64', 's390x', 'mipsel'].includes(process.arch);
}

var rootFolderIndex = 0;
var browserFolderIndex = 0; ///This variable will be used to know which index the browser is adding files or mkdir too! so that way the refresh has its own internal index system for its loop through!
var rootFolderName; /////refresh is aka calling the function temp();
var refreshing = false;
var threadcountAlt = new Array();
var browserThreads = new Array();
var broadcastWorkers = new Map();
const hostname = 'localhost';
const port = 5000;
var TmpLogs = [];
var logs = [];
var pings = [];
var pingIndex = 0;
var Pings2Check = new Array();
var Pings = [];
var arrayOfFiles = new Array();
var arrayOfFilesFromBrowser = [];
const reg = new RegExp('^[0-9]+$');
const express = require('express');
var cors = require('cors');
const app3 = express();
const app2 = express();
var router = express.Router();
//__ogdirname = __dirname;

//app.use(rawBody);
/*var corsOptions = {
  origin: 'http://localhost:3000/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}*/
//app.use(cors());
app2.use(cors());
app2.options('localhost 127.0.0.1', cors());
app2.use(express.json());
app3.use(router);
app2.use(router);

var arrayOfPingJsonTemp = new Array();
var pingJSONTemp = {
  "ping": "pong",
  'info': {
    'movies': [],
    'tvshows': []
  }
}

function isString(str) {
  try {
    if (typeof str === 'string' || str instanceof String) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

//The Rename Function!
// This is the Rename and File Move Function for the browser drag and drop process!
async function checkDirForVideos(dataJson, dir, threadIndex) {//NOTES RENAME BROWSERFOLDERINDEX to dataJson.browserIndex and all the browserFolderindexs on the Array List to threadIndex
  try {
    //const configJSON = await fs.promises.readFile('./config.json');
    //var json = JSON.parse(configJSON);
    //var uploadType = dataJson.fileType;
    //var rootFolderName = json.rootFolderName;
    // Get the files as an array
    const files = await fs.promises.readdir(dir);
    if (files.length > parseInt(configjson.maximumAmountOfFilesAndFoldersToSearchThroughOnDragAndDrops)) {//Hopefully we stop alot of potential bugs such as someone accidently dragging there C: drive root folder onto the application
      //Along with protecting from allowing to many files to be searched through at once!
      //Might make this configurable with config.json using maximumAmountOfFilesAndFoldersToSearchThroughOnDragAndDrops: 20 by default
      return;
    }//this is to hopefully stop to potential memory leaks
    console.log('Checking Dir:', dir);
    files.sort(function(a, b) {
      return a.split(".")[0] - b.split(".")[0];
    });

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(dir, file);
      //const toPath = path.join( moveTo, file );

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fromPath);
      console.log(path.basename(fromPath));

      if (stat.isFile()) {
        var filePath = path.dirname(fromPath);
        var fileType = path.extname(fromPath);
        var fileName = path.basename(fromPath);
        //console.log(path.extname(fromPath));
        //console.log(dataJson.fileType);
        if (dataJson.fileType === "tv") {
          //console.log('Its TV SHOW!');
          /*if (containsOnlyNumbers(fileName)){
            if (fileType.toLowerCase() === "mkv" || fileType.toLowerCase() === "mp4"){
              var dis=string;
              if(process.platform === 'win32') {dis=string.replaceAll('\\', '/');}
            }
          }else{*///FileName Isnt a Number only then we will check first to ensure there arent already a list of files there for this type and id and name!
          //We will just use the rename function to make the process a whole lot simpler!
          if (fileType.toLowerCase() === ".mkv" || fileType.toLowerCase() === ".mp4") {
            console.log('Found video File!');
            var newFilePath = __newDirName + prefix + configjson.listOfRootFolderNames[dataJson.browserIndex] + prefix + "tvshows" + prefix + dataJson.name + "-" + dataJson.id + prefix + dataJson.season + prefix + dataJson.episode + prefix + dataJson.fileQuality + prefix;
            var newfilename = "1" + fileType;
            var i = 1;
            var test = true;
            while (test) {
              if (fs.existsSync(path.join(newFilePath, newfilename))) {
                i = i + 1;
                newfilename = i + fileType;
              }
              if (!(fs.existsSync(path.join(newFilePath, newfilename)))) {
                test = false;
                realLog(newfilename, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
              }
            }//End of our while loop check!
            //We will have to encapusalte this in a directory ^ check to ensure files don't exist before trying to rename!
            try {
              await Fs.renameSync(fromPath, path.join(newFilePath, newfilename));   ///UNCOMMMENT THISSSS LINE=========================<<<<<<<<<<<<<< ///UNCOMMMENT THISSSS LINE=========================<<<<<<<<<<<<<<
              console.log('Renamed and Moved file', fromPath, 'too', path.join(newFilePath, newfilename));
            } catch (e) {
              realLog(e);
            }
          }
          //}
        }
        if (dataJson.fileType === "movie") {
          if (fileType.toLowerCase() === ".mkv" || fileType.toLowerCase() === ".mp4") {
            var newFilePath = __newDirName + prefix + configjson.listOfRootFolderNames[dataJson.browserIndex] + prefix + "tvshows" + prefix + dataJson.name + "-" + dataJson.id + prefix + dataJson.fileQuality + prefix;
            var newfilename = "1" + fileType;
            var i = 1;
            var test = true;
            while (test) {
              if (fs.existsSync(path.join(newFilePath, newfilename))) {
                i = i + 1;
                newfilename = i + fileType;
              }
              if (!(fs.existsSync(path.join(newFilePath, newfilename)))) {
                test = false;
                realLog(newfilename, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
              }
            }//End of our while loop check!
            //We will have to encapusalte this in a directory ^ check to ensure files don't exist before trying to rename!
            try {
              await Fs.renameSync(fromPath, path.join(newFilePath, newfilename)); ///UNCOMMMENT THISSSS LINE=========================<<<<<<<<<<<<<< ///UNCOMMMENT THISSSS LINE=========================<<<<<<<<<<<<<<
              console.log('Renamed and Moved file', fromPath, 'too', path.join(newFilePath, newfilename));
            } catch (e) {
              realLog(e);
            }
          }
        }
        //console.log(fromPath, "is a file.");
        //console.log(fromPath.split(rootFolderName).length);
        //var length = fromPath.split(rootFolderName).length;
        //console.log(string);
        //var length2 = string.split(prefix).length


        //var directory = string.split(prefix)[0];
        //console.log(directory);

      }


      //if (fromPath.split("/" + rootFolderName + "/"))
      else if (stat.isDirectory()) {
        //console.log("'%s' is a directory.", fromPath);
        await checkDirForVideos(dataJson, fromPath, threadIndex);//testAdditionalDirectoriesAndFiles(fromPath);
        //console.log(fromPath.split(rootFolderName).length);

      }
    } // End for...of
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }
  //realLog(JSON.stringify(pingJSONTemp.info.movies));
}
//This is the Main function of the Browser File upload process!
//We willl name this UpdateFilesFromBrowser Later on 
async function updateFilesFromBrowser(json) {
  var dir = json.path;
  var threadIndex = threadcountAlt.length;
  browserThreads[threadIndex] = new Set();
  //Check if dir is a file if not then loop through its subdirectorys and check to find any video files that match our required format either mp4 or mkv. and queue for upload!
  const stat = await fs.promises.stat(dir);
  if (stat.isDirectory) {
    arrayOfFilesFromBrowser[threadIndex] = new Array();
    await checkDirForVideos(json, dir, threadIndex);
    console.log('Finished CheckDir:', arrayOfFilesFromBrowser[threadIndex]);
    if (arrayOfFilesFromBrowser[threadIndex].length > 0) {
      //Here is where we 
      //This will make sure our ping.json is updated properly so we can respond with all our movies and tvshows properly after the update is done!
      await testMainDirectoryForBrowser(path.join(__newDirName, configjson.listOfRootFolderNames[jsonbrowserIndex]), json.browserIndex); //UNCOMMENT THISSS LINE<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<=========//It will be responsible for updating the ping.json properly.
      //await updateIPFSFilesFromBrowser(json, threadIndex); ///UNCOMMMENT THISSSS LINE=========================<<<<<<<<<<<<<<
      //console.log('Files:', arrayOfFilesFromBrowser.length);
    }
  } else {
    //If Its just a file then we will do our checking and just add it all right inside this function if its not and is a directory then we do the loop and then execute the update to start the working threaded process!
    if (stat.isFile()) {

      console.log(dir);
    } else {
      // If it's a directory, do the loop and execute the update
      // ...
      // Start the working threaded process
      // ...
    }
    console.log(dir);
    return;
  }



}

//Complete No Bugs
async function respondPing(req, res) {
  console.log('responding to ping list request!');
  //console.log(Pings);
  if (Pings.length > 0) {
    //console.log(Pings);
    console.log('Supplying Ping List to listener!', Pings);
    res.status(200).end(JSON.stringify({ 'logs': Pings }));
    //array=[];
  }
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


//console.log('converting harry potters philospher stone title: ,', convertTitle2foldername("Harry Potter and the Philosopher's Stone"));
//Complete No Bugs
function addToTmpLogs(log) {
  try {
    if (isString(log)) {
      //TmpLogs.push(log);
      sendEventsToAll(log);
      logs.push(log);
    } else {
      sendEventsToAll(log);
    }
  } catch (e) {
    realLog(e);
  }
}
//Complete No Bugs
function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}

function objToString(obj) {
  var str = '';
  for (var p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      str += p + '::' + obj[p] + '\n';
    }
  }
  return str;
}

////Log Override!
console.log = function() {
  try {
    // ...your code...
    //if (Array.isArray(arguments)){
    //    if (arguments.length > 1){
    /*if (!isString(objToString(arguments))){
      var string = objToString(arguments);
      addToTmpLogs(string);
    }else{
      var string = arguments.toString();
      addToTmpLogs(string);*/
    //var string = objToString(arguments);
    var string = "";
    for (var i = 0; arguments.length > i; i++) {
      string = string + " " + arguments[i];
    }
    addToTmpLogs(string);
    //}else {
    //addToTmpLogs(msg);
    //}
    // Pass off to the real one
    return realLog.apply(console, arguments);
    //}
  } catch (e) {
    realLog(e);
  }
};
realLog(configjson);


//Complete No Bugs
async function respondInit(req, res) {
  console.log('Initializer recieved from browser:', configjson);
  var obj = {
    browserIndex: browserFolderIndex,
    pingIndex: pingIndex,
    config: configjson,
    pingReady: pingEventReady
  }
  res.status(200).end(JSON.stringify(obj));
}
//Complete No Bugs
async function respondLogs(req, res) {
  if (TmpLogs.length > 0) {
    var logs = {
      "logs": TmpLogs
    };
    res.end(JSON.stringify(logs));
    TmpLogs = [];
  } else {
    res.status(404).end();
  }
}
//Complete No Bugs
async function makeDirs(id, name, type, seasons) {
  var safename = convertTitle2foldername(name);
  switch (type) {
    case "movie":
      var moveFrom = configjson.repoDir +prefix+ configjson.listOfRootFolderNames[browserFolderIndex] + "/movies/" + safename + "-" + id;
      if (!(fs.existsSync(path.join(moveFrom, "hd")))) {
        fs.mkdir(path.join(moveFrom, "hd"), { recursive: true }, (err) => {
          if (err) {
            return false;
          }
          console.log('HD Directory created successfully for ' + moveFrom + "/hd");
        });
      } else {
        console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "/hd");
      }
      if (!(fs.existsSync(path.join(moveFrom, "sd")))) {
        fs.mkdir(path.join(moveFrom, "sd"), { recursive: true }, (err) => {
          if (err) {
            return false;
          }
          console.log('SD Directory created successfully for ' + moveFrom + "/sd");
        });
      } else {
        console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "/sd");
      }
      if (!(fs.existsSync(path.join(moveFrom, "cam")))) {
        fs.mkdir(path.join(moveFrom, "cam"), { recursive: true }, (err) => {
          if (err) {
            return false;
          }
          console.log('CAM Directory created successfully for ' + moveFrom + "/cam");
        });
      } else {
        console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "/cam");
      }
      break;

    case "tvshow":
      if (seasons) {
        for (var row of seasons) {
          var season = row.season;
          var episodes = row.episode_count;
          for (var i = 0; i < episodes; i++) {
            var moveFrom = configjson.repoDir +prefix+ configjson.listOfRootFolderNames[browserFolderIndex] + "/tvshows/" + safename + "-" + id + "/" + parseInt(season) + "/" + parseInt(i + 1) + "/";
            try {
              if (!(fs.existsSync(path.join(moveFrom, "hd")))) {
                await fs.promises.mkdir(path.join(moveFrom, "hd"), { recursive: true });
                console.log('HD Directory created successfully for ' + moveFrom + "hd");
              } else {
                console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "hd");
              }
              if (!(fs.existsSync(path.join(moveFrom, "sd")))) {
                await fs.promises.mkdir(path.join(moveFrom, "sd"), { recursive: true });
                console.log('SD Directory created successfully for ' + moveFrom + "sd");
              } else {
                console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "sd");
              }
              if (!(fs.existsSync(path.join(moveFrom, "cam")))) {
                await fs.promises.mkdir(path.join(moveFrom, "cam"), { recursive: true });
                console.log('CAM Directory created successfully for ' + moveFrom + "cam");
              } else {
                console.log('Error: Already Exists! Occurred while creating the directory for ', moveFrom + "cam");
              }
            } catch (err) {
              console.error('Error occurred while creating the directory for ', moveFrom + "cam", err);
            }
            //End of Second For Loop Down Below V
          }//End of the second loop right here
          //End of First For Loop Down Below V
        }//End of the first loop right here
      } else {//seasons object is blank so return false
        return;
      }
      break;
  }//end of switch statement
}
//end of makedir function

/*async function respond(url) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: 'providing', id: '0', url: url })
  };
  const response = await fetch('http://localhost:3050', requestOptions);
  //console.log(response);
};*/
//This creates the local website 
const server = http.createServer((req, res) => {
  //console.log('Request for ' + req.url + ' by method ' + req.method);
  const fourpath = path.join(path.dirname(process.execPath), '/gui/404.html');

  if (req.method == 'GET') {
    var fileUrl;
    if (req.url == '/') fileUrl = '/index.html';
    else fileUrl = req.url;
    //console.log(req.url);
    //console.log(fileUrl);
    //console.log(path.join(app.getAppPath(), '/worker.js'));
    //console.log(path.join(path.dirname(process.execPath),fileUrl));
    //console.log(path.join(process.execPath, '/gui/index.html'));

    var filePath = path.join(path.dirname(process.execPath), prefix + "gui" + fileUrl);
    console.log('the requested file path:', filePath);
    const fileExt = path.extname(filePath);
    switch (fileExt) {
      case '.html':
        if (fs.existsSync(filePath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
        } else {
          filePath = fourpath
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        break;
      case '.css':
        if (fs.existsSync(filePath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/css');
          fs.createReadStream(filePath).pipe(res);
        } else {
          filePath = fourpath
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        break;
      case '.js':
        if (fs.existsSync(filePath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript');
          fs.createReadStream(filePath).pipe(res);
        } else {
          filePath = fourpath
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        break;
      case '.png':
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'image/png');
          res.statusCode = 200;
          fs.createReadStream(filePath).pipe(res);
        } else {
          filePath = fourpath
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        break;
      case '.ttf':
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 200;
          fs.createReadStream(filePath).pipe(res);
        } else {
          filePath = fourpath
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        break;
      default:
        filePath = fourpath
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        fs.createReadStream(filePath).pipe(res);
        break;
    }
  }
});

//This allows the listening of the local website on localhost at port 3000 for the gui display!
server.listen(port, hostname, () => {
  console.log(`Web UI is running at http://${hostname}:${port}/`);
});

//This will be for the browser
app2.get('/', function(req, res) {
  //var json = JSON.parse(req.headers);
  var type = req.get("request-type");
  //console.log(JSON.stringify(json));
  if (type !== undefined && type !== null) {
    /*if (type === "logs") {
      //respondLogs(req, res);
    }*/
    if (type === "init") {
      respondInit(req, res);
    }
    if (type === 'ping') {
      realLog('Sending them to Ping!');
      console.log('sending them to ping!');
      respondPing(req, res);
    }
  }
});

//This is the event sender!
function sendEventsToAll(newFact) {
  if (!isString(newFact)) {
    try {
      newFact = objToString(newFact);
    } catch (e) {
      realLog(e);
    }
  }

  const dataobj = {
    type: 'single',
    obj: newFact
  }
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(dataobj)}\n\n`))
}

function sendFinishedEventToAll() {
  const dataobj = {
    type: 'task',
    status: 'finished',
    msg: 'for ping list event clients'
  }
  clients.forEach(client => client.response.write('data: ' + JSON.stringify(dataobj) + "\n\n"));
}

//This the event handler! the actual p2p communication handler!
function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const dataobj = {
    type: 'array',
    obj: logs
  }

  const data = `data: ${JSON.stringify(dataobj)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}
//This is responsible for the console log for the browser of the electron app!
function eventsHandlerPing(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const dataobj = {
    type: 'array',
    pingIndex: pingIndex,
    obj: pings
  }

  const data = `data: ${JSON.stringify(dataobj)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

//This is for event source server for the browser for the logs and such!
app2.get('/consolelog', eventsHandler);
//This is the ping console handler to help keep log persistent during application close and open etc..
app2.get('/ping', eventsHandlerPing);

app2.post('/', (req, res) => {
  try {
    var json = req.body;
    console.log(JSON.stringify(req.body));
    if (req.body === undefined) {
      res.status(404).end('{"error": 404}');
    }
    if (json !== undefined) {
      if (json.type) {
        if (json.type === "mkdir") {
          var type = json.maketype;
          var id = json.id;
          var name = json.name;
          var seasons;
          if (json.seasons) seasons = json.seasons; else seasons = null;
          if (makeDirs(id, name, type, seasons)) {
            console.log('mkdir success');
            res.status(200).end('{"info": "mk dir success"}');
          } else {
            console.log('mkdir failure');
            res.status(200).end(`{"error": "mkdir failure ${configjson.rootPath + `/${type}s/` + name + "-" + id}"}`);
          }
          //we execute mkdir
          //console.log('mkdir success');
          //res.status(200).end('{"info": "mk dir success"}');
        }
        if (json.type === "refresh") {
          temp();
          res.status(200).end();
        }
        if (json.type === "addFile") {
          updateFilesFromBrowser(json);
          res.status(200).end(JSON.stringify({ status: 'done' }));
        }
        if (json.type === "updateBrowserIndex") {
          console.log('Updated Browser Selected Repo Index:', json.index);
          browserFolderIndex = parseInt(json.index);
        }
        if (json.type === "addBrowserIndex") {
          var t = new Array();
          t = configjson.listOfRootFolderNames;
          //var folderindex = t.length;
          var foldername = json.name;
          fs.mkdir(path.join(__newDirName, foldername), { recursive: true }, (err) => {
            if (err) {
              console.log('Repo:', foldername, ' must already be created!');
              return false;
            }
            console.log('Repo:', foldername, 'created successfully!');
          });
          configjson.listOfRootFolderNames.push(foldername);
          configjson.listOfRootPaths.push("./" + foldername);
          fs.writeFileSync('./config.json', JSON.stringify(configjson, null, " "));
        }
        if (json.type === "removeBrowserIndex") {
          var foldername = json.name;
          //var folderindex = json.index;
          configjson.listOfRootFolderNames = configjson.listOfRootFolderNames.filter((row) => row === foldername);
          configjson.listOfRootPaths = configjson.listOfRootPaths.filter((row) => row.replace("./", "") === foldername);
          fs.writeFileSync('./config.json', JSON.stringify(configjson, null, " "));
          configJSON = fs.readFileSync('./config.json');
          configjson = JSON.parse(configjson);
        }
      }
    }
  } catch (e) {
    realLog(e);
  }
});

app2.post('/ping', (req, res) => {
  try {
    var json = req.body;
    realLog(json);
    pingIndex = json.pingIndex;
    pings.push(json);
    res.status(200).end();
  } catch (e) {
    realLog(e);
  }
})

app2.listen(3030, function() {
  console.log('Listening for Web UI on port 3030 locally')
});

async function testMainDirectoryForBrowser(browserIndex) {
  // Our starting point
  try {
    //const configJSON = await fs.promises.readFile('./config.json');
    //var json = JSON.parse(configJSON);
    //console.log(json.rootpath);
    var moveFrom = configjson.repoDir + prefix + configjson.listOfRootFolderNames[browserIndex];
    //console.log(moveFrom);

    // Get the files as an array
    const files = await fs.promises.readdir(moveFrom);
    files.sort(function(a, b) {
      return a.split(".")[0] - b.split(".")[0];
    });

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(moveFrom, file);
      //const toPath = path.join( moveTo, file );

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fromPath);

      if (stat.isFile()) {
        //console.log(fromPath, "is a file.");
        //console.log(fromPath.split(rootFolderName).length);

        //console.log(fromPath.split("/" + rootFolderName + "/").length);


        //if (fromPath.split("/" + rootFolderName + "/"))

      }
      else if (stat.isDirectory()) {
        //console.log(fromPath, "is a directory.");
        const files2 = await fs.promises.readdir(fromPath);

        await testAdditionalDirectoriesAndFilesForBrowser(fromPath, fromPath.split(configjson.listOfRootFolderNames[browserIndex])[0], browserIndex);
        //console.log('Split Length ', fromPath.split(rootFolderName).length);
        //console.log(fromPath.split(rootFolderName)[0])

      }
    } // End for...of
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }

}

//Complete No Bugs im assuming we will see! lol 3/24/23
async function testAdditionalDirectoriesAndFilesForBrowser(dir, browserIndex) {
  //realLog(arrayOfPingJsonTemp[browserIndex]);
  //console.log(dir);
  try {
    //const configJSON = await fs.promises.readFile('./config.json');
    //configjson = configJSON;
    //var json = JSON.parse(configJSON);
    //var configjson.listOfRootFolderNames[browserIndex] = json.configjson.listOfRootFolderNames[browserIndex];
    // Get the files as an array
    const files = await fs.promises.readdir(dir);
    files.sort(function(a, b) {
      return a.split(".")[0] - b.split(".")[0];
    });

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(dir, file);
      //console.log (fromPath);
      //const toPath = path.join( moveTo, file );

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fromPath);

      if (stat.isFile()) {
        //console.log(fromPath, "is a file.");
        //console.log(fromPath.split(configjson.listOfRootFolderNames[browserIndex]).length);
        //var length = fromPath.split(configjson.listOfRootFolderNames[browserIndex]).length;
        var string = fromPath.replace(__newDirName, "").replace(prefix + configjson.listOfRootFolderNames[browserIndex] + prefix, "");

        //console.log(string);
        var length2 = string.split(prefix).length

        var directory = string.split(prefix)[0];
        //console.log(directory);
        if (directory === "movies") {
          if (length2 === 4) {
            var foldername = string.split(prefix)[1].split('-')[0];////
            var filename = string.split(prefix)[3];////
            var filequality = string.split(prefix)[2];////
            //console.log(filename);
            //            console.log('File type is ', filename.split(".")[1]);
            //            console.log('filename is ', filename.split('.')[0]);
            //console.log(containsOnlyNumbers(filename.split('.')[0]));
            if (containsOnlyNumbers(filename.split('.')[0])) {

              if ((filename.split(".")[1].includes("mkv")) || (filename.split(".")[1].includes("mp4"))) {
                var id = string.split(prefix)[1].split('-')[1];
                //                console.log('Id is ', id);
                //                console.log('Is valid video type and name is valid!');
                //realLog(arrayOfPingJsonTemp[browserIndex].info.movies);
                //var result = arrayOfPingJsonTemp[browserIndex].info.movies.find(row => parseInt(row.id) === parseInt(id));
                //realLog(result);
                if (arrayOfPingJsonTemp[browserIndex].info.movies.find(row => parseInt(row.id) === parseInt(id))) {
                  //console.log('Its in it! might so load its value and modify it then filter it out and re push it in the array!');
                  //realLog("ITS IN IT OMG!");
                  var index = arrayOfPingJsonTemp[browserIndex].info.movies.findIndex(row => parseInt(row.id) === parseInt(id));
                  var array = [];
                  arrayOfPingJsonTemp[browserIndex].info.movies[index].listoftypes.forEach(row => {
                    array.push(row);
                  });
                  /*for(var row of arrayOfPingJsonTemp[browserIndex].info.movies[index].listoftypes){
                    array.push(row);
                  }*/
                  array.push({
                    'type': filequality,
                    'filetype': filename.split('.')[1],
                    'id': filename.split('.')[0]
                  });
                  var obj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'videocount': (1 + arrayOfPingJsonTemp[browserIndex].info.movies[index].videocount),
                    'listoftypes': array
                  }
                  arrayOfPingJsonTemp[browserIndex].info.movies[index] = obj;
                } else {
                  var obj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'videocount': 1,
                    'listoftypes': [{
                      'type': filequality,
                      'filetype': filename.split('.')[1],
                      'id': filename.split('.')[0]
                    }]
                  }
                  arrayOfPingJsonTemp[browserIndex].info.movies.push(obj);
                }
              }
            } else {//This else is continue what happens if the video file is not in proper regexpression check aka we need to rename the video file to do proper ordering check if there is already video count stored for this id if so increment rename up one if not return
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              //console.log('ERRROR ERRROR File is not Number!');
              var id = string.split(prefix)[1].split('-')[1];
              if (arrayOfPingJsonTemp[browserIndex].info.movies.find(row => parseInt(row.id) === parseInt(id))) {
                //console.log("its got data Lets do something about it!");
                var index = arrayOfPingJsonTemp[browserIndex].info.movies.findIndex(row => parseInt(row.id) === parseInt(id));
                var currentAmount = parseInt(arrayOfPingJsonTemp[browserIndex].info.movies[index].videocount + 1);
                var newname = currentAmount + "." + filename.split('.')[1];
                fs.rename(fromPath, path.join(dir, newname), (err) => {
                  console.log(err);
                });
                var array = [];
                arrayOfPingJsonTemp[browserIndex].info.movies[index].listoftypes.forEach(row => {
                  array.push(row);
                });
                /*for(var row of arrayOfPingJsonTemp[browserIndex].info.movies[index].listoftypes){
                  array.push(row);
                }*/
                array.push({
                  'type': filequality,
                  'filetype': filename.split('.')[1],
                  'id': filename.split('.')[0]
                });
                var obj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'videocount': (1 + arrayOfPingJsonTemp[browserIndex].info.movies[index].videocount),
                  'listoftypes': array
                }
                arrayOfPingJsonTemp[browserIndex].info.movies[index] = obj;
                //So here since it was found we will just increment this one to the next number up!
                //console.log('Its in it! might so load its value and modify it then filter it out and re push it in the array!');
              } else {
                // Nope nothing contained so we will just start the counter!
                console.log('File name is not a number renaming it please double check it was success sometimes due to ordering of files it will mess up the numerical ordering all though i have implemented a new failsafe check for that i hope it works well for everyone!');
                //Rename the video file to #1
                var newname = "1." + filename.split(".")[1];
                fs.rename(fromPath, path.join(dir, newname), (err) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log('Renammed file', fromPath, 'too', path.join(dir, newname));
                  }
                });

                //Push the obj into the array!
                var obj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'videocount': 1,
                  'listoftypes': [{
                    'type': filequality,
                    'filetype': newname.split('.')[1],
                    'id': newname.split('.')[0]
                  }]
                }
                arrayOfPingJsonTemp[browserIndex].info.movies.push(obj);
              }
            }
          }
        }
        if (directory === "tvshows") {
          if (length2 === 6) {
            var foldername = string.split(prefix)[1].split('-')[0];
            var filename = string.split(prefix)[5];
            var filequality = string.split(prefix)[4];
            var seasonnum = string.split(prefix)[2];
            var episodenum = string.split(prefix)[3];
            var id = string.split(prefix)[1].split('-')[1];
            //            console.log('File type is ', filename.split(".")[1]);
            if (containsOnlyNumbers(filename.split('.')[0])) {
              if (filename.split(".")[1].includes("mkv") || filename.split(".")[1].includes("mp4")) {
                var dis = string
                if (process.platform === 'win32') { dis = string.replaceAll('\\', '/'); }
                //var id = string.split(prefix)[1].split('-')[1];
                //                console.log('Id is ', id);
                //Filename is a number just make sure to properly add to the arrayOfPingJsonTemp[browserIndex]
                if (arrayOfPingJsonTemp[browserIndex].info.tvshows.find(row => parseInt(row.id) === parseInt(id))) {
                  //console.log('Its in it! might so load its value and modify it and update in array!');
                  //realLog("ITS IN IT OMG!");
                  var idindex = arrayOfPingJsonTemp[browserIndex].info.tvshows.findIndex(row => parseInt(row.id) === parseInt(id));
                  if (arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.find(row => parseInt(row.season) === parseInt(seasonnum))) {
                    var seasonindex = arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.findIndex(row => parseInt(row.season) === parseInt(seasonnum));

                    if (arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.find(row => parseInt(row.episode) === parseInt(episodenum))) {
                      var episodeindex = arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.findIndex(row => parseInt(row.episode) === parseInt(episodenum));
                      ///For loop through listoftypes to increment properly!
                      var array = [];
                      arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].listoftypes.forEach(row => {
                        array.push(row);
                      });
                      var counter = arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].videocount + 1;
                      var listoftypeobj = {
                        'type': filequality,
                        'filetype': filename.split('.')[1],
                        'id': filename.split('.')[0]
                      }
                      array.push(listoftypeobj);
                      arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex] = {
                        'episode': arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].episode,
                        'videocount': counter,
                        'listoftypes': array

                      }//This will probably update everything correctly now!

                    } else { //Season index was found but not the episode index!
                      //We just need to add in the episode object into the season index!
                      var episodeobj = {
                        'episode': episodenum,
                        'videocount': 1,
                        'listoftypes': [{ 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }]
                      }
                      arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.push(episodeobj);
                    }

                  } else {
                    // We have to add in the season object, episodes object, and episode object to this pingJSON and insert it into it UUUUUUUUGGGGGGGGG!
                    var episodeob = {
                      'episode': episodenum,
                      'videocount': 1,
                      'listoftypes': [
                        { 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }
                      ]
                    }
                    var seasonob = {
                      'season': seasonnum,
                      'episodes': [episodeob]
                    }
                    arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.push(seasonob);
                  }

                } else {//ID not found so manually add ALLL things!
                  //realLog('putting it into The Array of tvshows since its id was not found!');
                  var episodeob = {
                    'episode': episodenum,
                    'videocount': 1,
                    'listoftypes': [
                      { 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }
                    ]
                  }
                  var seasonob = {
                    'season': seasonnum,
                    'episodes': [episodeob]
                  }
                  var tvobj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'seasons': [seasonob]
                  }
                  arrayOfPingJsonTemp[browserIndex].info.tvshows.push(tvobj);
                  //realLog(arrayOfPingJsonTemp[browserIndex].info.tvshows[0].seasons[0]);
                }
              } else { return; }
            } else {//Error this filename is not a number need to fix it! We have to replicate all of this above to ensure proper numbering!
              //We redoo the same as before but modify the filenames before adding the object to the list!
              ///ERRRRRRRRRRRRRRRRROOOOOOOOOOORRRRRRRRRRRRRRRRR
              /////NOT A NUMBER ! MUST RENAME!!!!! BUT HAVE TO CHECK FOR COUNTS ALREADY TO ENSURE WE GET IT RIGHT!
              ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              var newfilename = "1." + filename.split('.')[1];
              var i = 1;
              var test = true;
              while (test) {
                if (fs.existsSync(path.join(dir, newfilename))) {
                  i = i + 1;
                  newfilename = i + "." + filename.split('.')[1];
                }
                if (!(fs.existsSync(path.join(dir, newfilename)))) {
                  test = false;
                  realLog(newfilename, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                }
              }//End of our while loop check!
              //We will have to encapusalte this in a directory ^ check to ensure files don't exist before trying to rename!
              try {
                fs.renameSync(fromPath, path.join(dir, newfilename));
                console.log('Renammed file', fromPath, 'too', path.join(dir, newfilename));
              } catch (e) {
                console.error(e);
              }
              //Bullseye deprecated way that caused the error V
              /*fs.rename(fromPath, path.join(dir, newfilename), (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Renammed file', fromPath, 'too', path.join(dir, newfilename));
                }
              });*/

              console.log('File name is not a number renaming it please double check it was success sometimes due to ordering of files it will mess up the numerical ordering all though i have implemented a new failsafe check for that i hope it works well for everyone!');
              //realLog('ERRRORRERER!');
              if (arrayOfPingJsonTemp[browserIndex].info.tvshows.find(row => parseInt(row.id) === parseInt(id))) {
                //console.log('Its in it! might so load its value and modify it and update in array!');
                //realLog("ITS IN IT OMG!");
                var idindex = arrayOfPingJsonTemp[browserIndex].info.tvshows.findIndex(row => parseInt(row.id) === parseInt(id));
                if (arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.find(row => parseInt(row.season) === parseInt(seasonnum))) {
                  var seasonindex = arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.findIndex(row => parseInt(row.season) === parseInt(seasonnum));
                  //realLog(arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex]);
                  if (arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.find(row => parseInt(row.episode) === parseInt(episodenum))) {
                    var episodeindex = arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.findIndex(row => parseInt(row.episode) === parseInt(episodenum));
                    ///For loop through listoftypes to increment properly!
                    var array = [];
                    arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].listoftypes.forEach(row => {
                      array.push(row);
                    });
                    var counter = parseInt(arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].videocount + 1);
                    newfilename = counter + "." + filename.split('.')[1];
                    var listoftypeobj = {
                      'type': filequality,
                      'filetype': newfilename.split('.')[1],
                      'id': newfilename.split('.')[0]
                    }
                    array.push(listoftypeobj);
                    arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex] = {
                      'episode': arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].episode,
                      'videocount': counter,
                      'listoftypes': array
                    }//This will probably update everything correctly now!
                    //This was sudo code that all in all ran really well out the box just had the typo issue other then that pretty good! but i can optimize this truly
                    // ^ the above lines of code are redundant since i already have the episode index i could just push to the listoftypes directly to the arrayOfPingJsonTemp[browserIndex] object but as you seen
                    // i went the dumb and long route with a for loop reduplicate and redundant way to do it! i must say im appalled looking at this hope you enjoy these comments!

                  } else { //Season index was found but not the episode index!
                    //We just need to add in the episode object into the season index!
                    var episodeobj = {
                      'episode': episodenum,
                      'videocount': 1,
                      'listoftypes': [{ 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }]
                    }
                    arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons[seasonindex].episodes.push(episodeobj);
                  }

                } else {
                  // We have to add in the season object, episodes object, and episode object to this pingJSON and insert it into it UUUUUUUUGGGGGGGGG!
                  var episodeob = {
                    'episode': episodenum,
                    'videocount': 1,
                    'listoftypes': [
                      { 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }
                    ]
                  }
                  var seasonob = {
                    'season': seasonnum,
                    'episodes': [episodeob]
                  }
                  arrayOfPingJsonTemp[browserIndex].info.tvshows[idindex].seasons.push(seasonob);
                }

              } else {//ID not found so manually add ALLL things!
                var episodeob = {
                  'episode': episodenum,
                  'videocount': 1,
                  'listoftypes': [
                    { 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }
                  ]
                }
                var seasonob = {
                  'season': seasonnum,
                  'episodes': [episodeob]
                }
                var tvobj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'seasons': [seasonob]
                }
                arrayOfPingJsonTemp[browserIndex].info.tvshows.push(tvobj);
              }

            }
          }
        }
      }


      //if (fromPath.split("/" + configjson.listOfRootFolderNames[browserIndex] + "/"))
      else if (stat.isDirectory()) {
        //console.log("'%s' is a directory.", fromPath);
        await testAdditionalDirectoriesAndFiles(fromPath);
        //console.log(fromPath.split(configjson.listOfRootFolderNames[browserIndex]).length);

      }
    } // End for...of
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }
  //realLog(JSON.stringify(arrayOfPingJsonTemp[browserIndex].info.movies));
}


async function testAdditionalDirectoriesAndFiles(dir) {
  //realLog(pingJSONTemp);
  //console.log(dir);
  try {
    //const configJSON = await fs.promises.readFile('./config.json');
    //configjson = configJSON;
    //var json = JSON.parse(configJSON);
    //var rootFolderName = json.rootFolderName;
    // Get the files as an array
    const files = await fs.promises.readdir(dir);
    files.sort(function(a, b) {
      return a.split(".")[0] - b.split(".")[0];
    });

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(dir, file);
      //console.log (fromPath);
      //const toPath = path.join( moveTo, file );

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fromPath);

      if (stat.isFile()) {
        //console.log(fromPath, "is a file.");
        //console.log(fromPath.split(rootFolderName).length);
        //var length = fromPath.split(rootFolderName).length;
        //console.log('from path:',fromPath);
        var string = fromPath.replace(__newDirName, "").replace(prefix + rootFolderName + prefix, "");
        /*if (process.platform === 'win32'){
          string = fromPath.replace(__newDirName, "").replace('\\' + rootFolderName + '\\', "");
        }*/

        // console.log(string);
        var length2 = string.split(prefix).length

        var directory = string.split(prefix)[0];
        //console.log(directory);
        if (directory === "movies") {
          if (length2 === 4) {
            var foldername = string.split(prefix)[1].split('-')[0];////
            var filename = string.split(prefix)[3];////
            var filequality = string.split(prefix)[2];////
            //console.log(filename);
            //            console.log('File type is ', filename.split(".")[1]);
            //            console.log('filename is ', filename.split('.')[0]);
            //console.log(containsOnlyNumbers(filename.split('.')[0]));
            if (containsOnlyNumbers(filename.split('.')[0])) {

              if ((filename.split(".")[1].includes("mkv")) || (filename.split(".")[1].includes("mp4"))) {
                var dis = string
                if (process.platform === 'win32') { dis = string.replaceAll('\\', '/'); }
                var id = string.split(prefix)[1].split('-')[1];
                //                console.log('Id is ', id);
                //                console.log('Is valid video type and name is valid!');
                //realLog(pingJSONTemp.info.movies);
                //var result = pingJSONTemp.info.movies.find(row => parseInt(row.id) === parseInt(id));
                //realLog(result);
                if (pingJSONTemp.info.movies.find(row => parseInt(row.id) === parseInt(id))) {
                  //console.log('Its in it! might so load its value and modify it then filter it out and re push it in the array!');
                  //realLog("ITS IN IT OMG!");
                  var index = pingJSONTemp.info.movies.findIndex(row => parseInt(row.id) === parseInt(id));
                  var array = [];
                  pingJSONTemp.info.movies[index].listoftypes.forEach(row => {
                    array.push(row);
                  });
                  /*for(var row of pingJSONTemp.info.movies[index].listoftypes){
                    array.push(row);
                  }*/
                  array.push({
                    'type': filequality,
                    'filetype': filename.split('.')[1],
                    'id': filename.split('.')[0]
                  });
                  var obj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'videocount': (1 + pingJSONTemp.info.movies[index].videocount),
                    'listoftypes': array
                  }
                  pingJSONTemp.info.movies[index] = obj;
                } else {
                  var obj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'videocount': 1,
                    'listoftypes': [{
                      'type': filequality,
                      'filetype': filename.split('.')[1],
                      'id': filename.split('.')[0]
                    }]
                  }
                  pingJSONTemp.info.movies.push(obj);
                }
              }
            } else {//This else is continue what happens if the video file is not in proper regexpression check aka we need to rename the video file to do proper ordering check if there is already video count stored for this id if so increment rename up one if not return
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              //console.log('ERRROR ERRROR File is not Number!');
              var id = string.split(prefix)[1].split('-')[1];
              if (pingJSONTemp.info.movies.find(row => parseInt(row.id) === parseInt(id))) {
                //console.log("its got data Lets do something about it!");
                var index = pingJSONTemp.info.movies.findIndex(row => parseInt(row.id) === parseInt(id));
                var currentAmount = parseInt(pingJSONTemp.info.movies[index].videocount + 1);
                var newname = currentAmount + "." + filename.split('.')[1];
                fs.rename(fromPath, path.join(dir, newname), (err) => {
                  console.log(err);
                });
                var array = [];
                pingJSONTemp.info.movies[index].listoftypes.forEach(row => {
                  array.push(row);
                });
                /*for(var row of pingJSONTemp.info.movies[index].listoftypes){
                  array.push(row);
                }*/
                array.push({
                  'type': filequality,
                  'filetype': filename.split('.')[1],
                  'id': filename.split('.')[0]
                });
                var obj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'videocount': (1 + pingJSONTemp.info.movies[index].videocount),
                  'listoftypes': array
                }
                pingJSONTemp.info.movies[index] = obj;
                //So here since it was found we will just increment this one to the next number up!
                //console.log('Its in it! might so load its value and modify it then filter it out and re push it in the array!');
              } else {
                // Nope nothing contained so we will just start the counter!
                console.log('File name is not a number renaming it please double check it was success sometimes due to ordering of files it will mess up the numerical ordering all though i have implemented a new failsafe check for that i hope it works well for everyone!');
                //Rename the video file to #1
                var newname = "1." + filename.split(".")[1];
                fs.rename(fromPath, path.join(dir, newname), (err) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log('Renammed file', fromPath, 'too', path.join(dir, newname));
                  }
                });

                //Push the obj into the array!
                var obj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'videocount': 1,
                  'listoftypes': [{
                    'type': filequality,
                    'filetype': newname.split('.')[1],
                    'id': newname.split('.')[0]
                  }]
                }
                pingJSONTemp.info.movies.push(obj);
              }
            }
          }
        }
        if (directory === "tvshows") {
          if (length2 === 6) {
            var foldername = string.split(prefix)[1].split('-')[0];
            var filename = string.split(prefix)[5];
            var filequality = string.split(prefix)[4];
            var seasonnum = string.split(prefix)[2];
            var episodenum = string.split(prefix)[3];
            var id = string.split(prefix)[1].split('-')[1];
            //            console.log('File type is ', filename.split(".")[1]);
            if (containsOnlyNumbers(filename.split('.')[0])) {
              if (filename.split(".")[1].includes("mkv") || filename.split(".")[1].includes("mp4")) {
                var dis = string
                if (process.platform === 'win32') { dis = string.replaceAll('\\', '/'); }
                //var id = string.split(prefix)[1].split('-')[1];
                //                console.log('Id is ', id);
                //Filename is a number just make sure to properly add to the pingJSONTemp
                if (pingJSONTemp.info.tvshows.find(row => parseInt(row.id) === parseInt(id))) {
                  //console.log('Its in it! might so load its value and modify it and update in array!');
                  var idindex = pingJSONTemp.info.tvshows.findIndex(row => parseInt(row.id) === parseInt(id));
                  if (pingJSONTemp.info.tvshows[idindex].seasons.find(row => parseInt(row.season) === parseInt(seasonnum))) {
                    var seasonindex = pingJSONTemp.info.tvshows[idindex].seasons.findIndex(row => parseInt(row.season) === parseInt(seasonnum));

                    if (pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.find(row => parseInt(row.episode) === parseInt(episodenum))) {
                      var episodeindex = pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.findIndex(row => parseInt(row.episode) === parseInt(episodenum));
                      ///For loop through listoftypes to increment properly!
                      var array = [];
                      pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].listoftypes.forEach(row => {
                        array.push(row);
                      });
                      var counter = pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].videocount + 1;
                      var listoftypeobj = {
                        'type': filequality,
                        'filetype': filename.split('.')[1],
                        'id': filename.split('.')[0]
                      }
                      array.push(listoftypeobj);
                      pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex] = {
                        'episode': pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].episode,
                        'videocount': counter,
                        'listoftypes': array

                      }//This will probably update everything correctly now!

                    } else { //Season index was found but not the episode index!
                      //We just need to add in the episode object into the season index!
                      var episodeobj = {
                        'episode': episodenum,
                        'videocount': 1,
                        'listoftypes': [{ 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }]
                      }
                      pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.push(episodeobj);
                    }

                  } else {
                    // We have to add in the season object, episodes object, and episode object to this pingJSON and insert it into it UUUUUUUUGGGGGGGGG!
                    var episodeob = {
                      'episode': episodenum,
                      'videocount': 1,
                      'listoftypes': [
                        { 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }
                      ]
                    }
                    var seasonob = {
                      'season': seasonnum,
                      'episodes': [episodeob]
                    }
                    pingJSONTemp.info.tvshows[idindex].seasons.push(seasonob);
                  }

                } else {//ID not found so manually add ALLL things!
                  //realLog('putting it into The Array of tvshows since its id was not found!');
                  var episodeob = {
                    'episode': episodenum,
                    'videocount': 1,
                    'listoftypes': [
                      { 'type': filequality, 'filetype': filename.split('.')[1], 'id': filename.split('.')[0] }
                    ]
                  }
                  var seasonob = {
                    'season': seasonnum,
                    'episodes': [episodeob]
                  }
                  var tvobj = {
                    'id': parseInt(id),
                    'name': foldername,
                    'seasons': [seasonob]
                  }
                  pingJSONTemp.info.tvshows.push(tvobj);
                  //realLog(pingJSONTemp.info.tvshows[0].seasons[0]);
                }
              } else { return; }
            } else {//Error this filename is not a number need to fix it! We have to replicate all of this above to ensure proper numbering!
              //We redoo the same as before but modify the filenames before adding the object to the list!
              ///ERRRRRRRRRRRRRRRRROOOOOOOOOOORRRRRRRRRRRRRRRRR
              /////NOT A NUMBER ! MUST RENAME!!!!! BUT HAVE TO CHECK FOR COUNTS ALREADY TO ENSURE WE GET IT RIGHT!
              ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              var newfilename = "1." + filename.split('.')[1];
              var i = 1;
              var test = true;
              while (test) {
                if (fs.existsSync(path.join(dir, newfilename))) {
                  i = i + 1;
                  newfilename = i + "." + filename.split('.')[1];
                }
                if (!(fs.existsSync(path.join(dir, newfilename)))) {
                  test = false;
                  realLog(newfilename, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                }
              }//End of our while loop check!
              //We will have to encapusalte this in a directory ^ check to ensure files don't exist before trying to rename!
              try {
                fs.renameSync(fromPath, path.join(dir, newfilename));
                console.log('Renammed file', fromPath, 'too', path.join(dir, newfilename));
              } catch (e) {
                console.error(e);
              }
              //Bullseye deprecated way that caused the error V
              /*fs.rename(fromPath, path.join(dir, newfilename), (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Renammed file', fromPath, 'too', path.join(dir, newfilename));
                }
              });*/

              console.log('File name is not a number renaming it please double check it was success sometimes due to ordering of files it will mess up the numerical ordering all though i have implemented a new failsafe check for that i hope it works well for everyone!');
              //realLog('ERRRORRERER!');
              if (pingJSONTemp.info.tvshows.find(row => parseInt(row.id) === parseInt(id))) {
                //console.log('Its in it! might so load its value and modify it and update in array!');
                //realLog("ITS IN IT OMG!");
                var idindex = pingJSONTemp.info.tvshows.findIndex(row => parseInt(row.id) === parseInt(id));
                if (pingJSONTemp.info.tvshows[idindex].seasons.find(row => parseInt(row.season) === parseInt(seasonnum))) {
                  var seasonindex = pingJSONTemp.info.tvshows[idindex].seasons.findIndex(row => parseInt(row.season) === parseInt(seasonnum));
                  //realLog(pingJSONTemp.info.tvshows[idindex].seasons[seasonindex]);
                  if (pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.find(row => parseInt(row.episode) === parseInt(episodenum))) {
                    var episodeindex = pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.findIndex(row => parseInt(row.episode) === parseInt(episodenum));
                    ///For loop through listoftypes to increment properly!
                    var array = [];
                    pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].listoftypes.forEach(row => {
                      array.push(row);
                    });
                    var counter = parseInt(pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].videocount + 1);
                    newfilename = counter + "." + filename.split('.')[1];
                    var listoftypeobj = {
                      'type': filequality,
                      'filetype': newfilename.split('.')[1],
                      'id': newfilename.split('.')[0]
                    }
                    array.push(listoftypeobj);
                    pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex] = {
                      'episode': pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes[episodeindex].episode,
                      'videocount': counter,
                      'listoftypes': array
                    }//This will probably update everything correctly now!
                    //This was sudo code that all in all ran really well out the box just had the typo issue other then that pretty good! but i can optimize this truly
                    // ^ the above lines of code are redundant since i already have the episode index i could just push to the listoftypes directly to the pingJSONTemp object but as you seen
                    // i went the dumb and long route with a for loop reduplicate and redundant way to do it! i must say im appalled looking at this hope you enjoy these comments!

                  } else { //Season index was found but not the episode index!
                    //We just need to add in the episode object into the season index!
                    var episodeobj = {
                      'episode': episodenum,
                      'videocount': 1,
                      'listoftypes': [{ 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }]
                    }
                    pingJSONTemp.info.tvshows[idindex].seasons[seasonindex].episodes.push(episodeobj);
                  }

                } else {
                  // We have to add in the season object, episodes object, and episode object to this pingJSON and insert it into it UUUUUUUUGGGGGGGGG!
                  var episodeob = {
                    'episode': episodenum,
                    'videocount': 1,
                    'listoftypes': [
                      { 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }
                    ]
                  }
                  var seasonob = {
                    'season': seasonnum,
                    'episodes': [episodeob]
                  }
                  pingJSONTemp.info.tvshows[idindex].seasons.push(seasonob);
                }

              } else {//ID not found so manually add ALLL things!
                var episodeob = {
                  'episode': episodenum,
                  'videocount': 1,
                  'listoftypes': [
                    { 'type': filequality, 'filetype': newfilename.split('.')[1], 'id': newfilename.split('.')[0] }
                  ]
                }
                var seasonob = {
                  'season': seasonnum,
                  'episodes': [episodeob]
                }
                var tvobj = {
                  'id': parseInt(id),
                  'name': foldername,
                  'seasons': [seasonob]
                }
                pingJSONTemp.info.tvshows.push(tvobj);
              }

              //EVEN MORE BULLSEYE THAT IS DEPRECATED AND CAUSED MY ERROR VVVVVV
              //We will have to encapusalte this in a directory check to ensure files dont exist before trying to rename!
              //
              /*fs.rename(fromPath, path.join(dir, newfilename), (err) => {
                if (err){
                console.log(err);
                }else{
                  console.log('Renammed file',fromPath, 'too', path.join(dir, newfilename));
                }
              });*/

            }
          }
        }
      }


      //if (fromPath.split("/" + rootFolderName + "/"))
      else if (stat.isDirectory()) {
        //console.log("'%s' is a directory.", fromPath);
        console.log("Scanning directory: " + fromPath);
        await testAdditionalDirectoriesAndFiles(fromPath);
        //console.log(fromPath.split(rootFolderName).length);

      }
    } // End for...of
  }
  catch (e) {
    // Catch anything bad that happens
    console.error("We've thrown! Whoops!", e);
  }
  //realLog(JSON.stringify(pingJSONTemp.info.movies));
}

//Complete No Bugs
// Make an async function that gets executed immediately
async function testMainDirectory() {
  var moveFrom = __newDirName + prefix + configjson.listOfRootFolderNames[rootFolderIndex];
  console.log('Moving From', moveFrom);
  //realLog(moveFrom);
  pingJSONTemp = {
    "ping": "pong",
    'info': {
      'movies': [],
      'tvshows': []
    }
  }
  // Our starting point
  //realLog(moveFrom);
  try {
    //const configJSON = await fs.promises.readFile('./config.json');
    //var json = JSON.parse(configJSON);
    //console.log(json.rootpath);
    //console.log(moveFrom);
    //var moveFrom = configjson.repoDir+prefix+configjson.rootFolderName[rootFolderIndex];
    //console.log(moveFrom);
    //console.log(moveFrom);

    // Get the files as an array
    const files = await fs.promises.readdir(moveFrom);
    files.sort(function(a, b) {
      return a.split(".")[0] - b.split(".")[0];
    });

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fromPath = path.join(moveFrom, file);
      //const toPath = path.join( moveTo, file );

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fromPath);

      if (stat.isFile()) {
        //console.log(fromPath, "is a file.");
        //console.log(fromPath.split(rootFolderName).length);

        //console.log(fromPath.split("/" + rootFolderName + "/").length);


        //if (fromPath.split("/" + rootFolderName + "/"))

      }
      else if (stat.isDirectory()) {
        //console.log(fromPath, "is a directory.");
        const files2 = await fs.promises.readdir(fromPath);
        /*for (const file2 of files2) {
          //Additional File
          console.log('BEFORE', file2);
          const fromPath2 = path.join(fromPath, file2);
          //const toPath = path.join( moveTo, file );

          // Stat the file to see if we have a file or dir
          const stat2 = await fs.promises.stat(fromPath2);
          if (stat2.isFile()) {
            console.log("'%s' is a file.", fromPath2);
            console.log(fromPath2.split(rootFolderName).length);

            //console.log(fromPath.split("/" + rootFolderName + "/").length);


            //if (fromPath.split("/" + rootFolderName + "/"))

          }
          else if (stat2.isDirectory()) {
            console.log("'%s' is a directory.", fromPath2);
          }
        }*/
        await testAdditionalDirectoriesAndFiles(fromPath, fromPath.split(rootFolderName)[0]);
        //console.log('Split Length ', fromPath.split(rootFolderName).length);
        //console.log(fromPath.split(rootFolderName)[0])

      }
      // Now move async
      //await fs.promises.rename( fromPath, toRenamed); How we will rename video files in proper order this will be used later on Very cool functin here

      // Log because we're crazy
      //console.log("Moved '%s'->'%s'", fromPath, toPath);
    } // End for...of
  }
  catch (e) {
    // Catch anything bad that happens
    //var moveFrom = __newDirName+prefix+configjson.listOfRootFolderNames[rootFolderIndex];
    //realLog(moveFrom, '\n\n\n');
    console.error("We've thrown! Whoops!", e);
  }

}
//Complete No Bugs
async function temp() {
  initializeObjectsInExecutionPath();
  await timer(5000);
  const configJSON = await fs.promises.readFile('./config.json');
  if (configjson.openGUIOnStart) {
    initializeMainGUI();
  }
  initializeP2P();
  if (isJsonString(configJSON)) {
    configjson = JSON.parse(configJSON);
    providerId = generateMD5Checksum(configjson.providerUsername + Date.now().toString() + generateId());
    console.log(configjson);
    var t = new Array();
    t = configjson.listOfRootFolderNames;
    var i = t.length;
    if (configjson.repoAutoSearchIndexing) {
      for (i; i > 0; i--) {
        rootFolderIndex = (i - 1);
        arrayOfFiles[rootFolderIndex] = new Array();
        rootFolderName = configjson.listOfRootFolderNames[rootFolderIndex];
        //await timer(1000);
        await testMainDirectory();
        //console.log(pingJSONTemp);
        arrayOfPingJsonTemp[rootFolderIndex] = pingJSONTemp;
        var pingpath = __newDirName + prefix + configjson.listOfRootFolderNames[rootFolderIndex] + prefix + "ping.json";
        //console.log(pingpath);
        //await timer(1000);
        if (arrayOfPingJsonTemp[rootFolderIndex]) {
          await fs.promises.writeFile(pingpath, JSON.stringify(arrayOfPingJsonTemp[rootFolderIndex], null, " "), { flag: 'w' });
          Pings2Check[rootFolderIndex] = new Array();
          Pings2Check[rootFolderIndex] = arrayOfPingJsonTemp[rootFolderIndex];
          await timer(1000);
          // realLog(arrayOfPingJsonTemp[rootFolderIndex]);}
          //await timer(1000);
        }
      }
    }
    await timer(2500);
    var allpingpath = __newDirName + prefix + 'allpings.json'
    console.log('Writing all pings file...', allpingpath);
    console.log('Pings to write:', Pings2Check);
    //await fs.promises.writeFile(allpingpath, JSON.stringify(arrayOfPingJsonTemp[rootFolderIndex], null, " "), { flag: 'w'});
    await Fs.writeFile(allpingpath, JSON.stringify(Pings2Check, null, " "), { flag: 'w' });
    //await timer(2500);
    console.log('Bout to run the system send event to all!');
    await timer(1000);
    pingEventReady = true;
    sendFinishedEventToAll();
  }
}
temp();