const { contextBridge, ipcRenderer } = require('electron/renderer');
const { Notification } = require('electron');
const fs = require('node:fs');
const os = require('os');
const path = require('node:path');
const { DBr, DB, getDB, getDBr, updateMovieFileIndex, updateTVShowFileIndex } = require('./lib/db.js');
const { isElementEmpty, toggleVisibility, removePath, refreshManageList, guiDoubleCheck } = require('./lib/utils.js');
const { populateStatus } = require('./lib/status.js');
window.db = DB;
window.dbr = DBr;
window.getDbr = getDBr();
// Get the user's home directory
const homeDirectory = os.homedir();
// Define the destination directory for your files
const destinationDirectory = path.join(homeDirectory, 'DBlockbuster');
const destinationConfigPath = path.join(destinationDirectory, 'config.json');
// Read and parse the config.json file
const configContent = fs.readFileSync(destinationConfigPath, 'utf-8');
const configJSON = JSON.parse(configContent);
window.manageId;
window.manageType;
//console.log('Files and globalVariable set up successfully!');


//console.log('Testing our at db access!'); ///Success wahoo!
//Its a success

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value)),
  counterValue: (value) => ipcRenderer.send('counter-value', value),
  ipc: ipcRenderer,
  config: configJSON,
  onAddFile: (value) => ipcRenderer.send('update:addFile', value)
});

contextBridge.exposeInMainWorld('api', {
  cardClicked: (id, type, obj) => manageCardClicked(id, type, obj),
  removePath: (value, t, id, index) => removePath(value, t, id, index),
  refresh_manage: () => populateManage(),
  refresh_status: () => populateStatus(),
  refresh_episode: (season) => populateManageEpisode(season),
  refresh_season: () => populateManageSeason(),
});


//Listeners can only be put in here!
ipcRenderer.on('asynchronous-reply', (_event, arg) => {
  console.log(arg) // prints "pong" in the DevTools console
})
ipcRenderer.send('asynchronous-message', 'ping');

ipcRenderer.on('response:addFile', (_event, arg) =>{
  if (arg.type === 'success'){

  }else if (arg.type === 'failed'){
    switch (arg.reason){
      case 'axios':
      
      break;
      case 'db':

      break;
    }
  }
  //console.log(arg);
})

window.onload = function(){
  const seasonSelector =  document.getElementById('seasonSelector');
  console.log("Did our seasonSelector Object even load in the dom,",seasonSelector);
  seasonSelector.onchange = function () {
    console.log('proper way to create listener with electron context bridge enabled!');
    window.manageSeason = seasonSelector.value;
    console.log("window manage season value is now: ",window.manageSeason);
    populateManageEpisode(seasonSelector.value);
  };

  const episodeSelector =  document.getElementById('episodeSelector');
  console.log("Did our episodeSelector Object even load in the dom,", episodeSelector);
  episodeSelector.onchange = function () {
    console.log('proper way to create listener with electron context bridge enabled!');
    window.manageEpisode = episodeSelector.value;
    console.log("window manage season value is now: ",window.manageEpisode);
    refreshManageList();
  };
}

//This will be our javascript handling for the manage tab! and responsible for our interactive interface!
function manageCardClicked(id, type, obj){
  window.manageId = id;
  window.manageType = type;
  const listElement = document.getElementById('manageList');
  const tvselector = document.getElementById('administrationContainerTV');
  document.getElementById('administrationContainer2').style.display = '';
  listElement.innerHTML = '';
  switch (type){
    case "movie":
      tvselector.style.display = 'none';//This will ensure the tv container is not visible! just incase they are coming from a tv object to a movie object it will handle properly dynamically!
      const movieresults = getDBr().prepare('SELECT * FROM "Movies" WHERE Id=?').all(id);
      console.log(movieresults);
      listElement.innerHTML = '';
      for (const obj of movieresults){
        const element = document.createElement("li");
        element.innerHTML = `FilePath:${obj.FilePath.toString().replace(/^"(.*)"$/, '$1')} FileIndex:${obj.FileIndex}`
        const button = document.createElement('button');
        button.innerHTML="Remove"
        button.onclick=function(){
          removePath(obj.FilePath, this, obj.Id, obj.FileIndex);
        };
        element.appendChild(button);
        listElement.append(element);
        console.log(obj);
      }
    break;
    case "tv":
      const loadSE = getDBr().prepare('SELECT * FROM "Providable" WHERE Id=?').all(id);
      if (loadSE.length){
      window.manageSeason = loadSE[0].Season;//Go by the first object we find they are providing by that Id and use its season and episode values!
      window.manageEpisode = loadSE[0].Episode;
      populateManageSeason();//Make these functions update season and episode drop down also add event listener to call this populateManageSeason from when the event listener is triggered in the window.onload of the season or episode changing!
      tvselector.style.display = '';//This will ensure the tv container is visible!
      const tvresults = getDBr().prepare('SELECT * FROM "TVShows" WHERE Id=? AND Season=? AND Episode=?').all(id,window.manageSeason,window.manageEpisode);
      console.log(tvresults);
      listElement.innerHTML = '';
      for (const obj of tvresults){
        const element = document.createElement("li");
        element.innerHTML = `FilePath:${obj.FilePath.toString().replace(/^"(.*)"$/, '$1')} FileIndex:${obj.FileIndex}`
        const button = document.createElement('button');
        button.innerHTML="Remove"
        button.onclick=function(){
          removePath(obj.FilePath, this, obj.Id, obj.FileIndex);
        };
        element.appendChild(button);
        listElement.append(element);
        console.log(obj);
      }
    }
    break;
  }
  guiDoubleCheck(true, obj);
}

function populateManage(){
  console.log('Repopulating the manage tab');
  document.getElementById("administrationList").innerHTML = '';
  const mainElement = document.getElementById("administrationList");
  const populateResults = getDBr().prepare('SELECT Id,Type,Name,Info,Date,BackgroundImageUrl,MAX(Season) AS Season,MAX(Episode) AS Episode,MAX(AmountOfFiles) AS AmountOfFiles FROM Providable GROUP BY Id, Type, Name, Info, Date, BackgroundImageUrl').all();
  console.log(populateResults);
  for (const obj of populateResults){
    const newelement = document.createElement("li");
    newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
          <h3 class="card-title">${obj.Name}</h3> \
          <div class="card-content"> \
            <h3>Description</h3> \
            <p>${String(obj.Info).substring(0, 200)}</p> \
          </div> \
          <div class="card-link-wrapper"> \
            <p class="card-link">${obj.Date}</p> \
          </div>`
    newelement.setAttribute("style", `background:url('${obj.BackgroundImageUrl}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
    newelement.setAttribute("id", "manage-"+obj.Id);
    newelement.setAttribute("class", "card");
    newelement.onclick = function() {
      manageCardClicked(obj.Id, obj.Type, this);
    };
    mainElement.append(newelement);
    /*const element = document.createElement('div');
    element.className = "card";
    element.id = 'manage-'+obj.Id;
    const img = document.createElement('img');
    img.src = obj.BackgroundImageUrl;
    const footer = document.createElement('footer');
    footer.innerHTML = 'Click me to display File Paths for:'+obj.Name;
    element.innerHTML = `${obj.Type}`
    element.append(img);
    element.append(footer);
    element.onclick = function() {
      manageCardClicked(obj.Id, obj.Type, this);
    };
    //console.log('element onclick is:', element.onclick);
    mainElement.append(element);*/
  }
}

function populateManageSeason(){
  //This special sql command below thanks to chatgpt allows us to filter out duplicates and get only the needed seasons for this tv show!
  const result = getDBr().prepare('SELECT * FROM ( SELECT Id,Type,Name,Info,Date,BackgroundImageUrl,Season,Episode,AmountOfFiles,ROW_NUMBER() OVER (PARTITION BY Season ORDER BY Episode DESC) AS row_num FROM Providable WHERE Id=? ) AS ranked WHERE row_num=1').all(window.manageId);
  const seasonList = document.getElementById('seasonSelector');
  if (result.length){
    seasonList.innerHTML='';
    for (const obj of result){
      const element = document.createElement('option');
      element.value=obj.Season;
      element.innerText=obj.Season;
      seasonList.appendChild(element);
    }
    populateManageEpisodes(window.manageId,window.manageSeason);
  }
}

function populateManageEpisodes(id, season){  
  const result = getDBr().prepare('SELECT * FROM Providable WHERE Id=? AND Season=?').all(id, season);
  const episodeList = document.getElementById('episodeSelector');
  if (result.length){
    episodeList.innerHTML='';
    for (const obj of result){
      const element = document.createElement('option');
      element.value=obj.Episode;
      element.innerText=obj.Episode;
      episodeList.appendChild(element);
    }
  }
  refreshManageList();//Last but bot but or bot bot not least we will refresh the manageList() to ensure proper paths and such!
}

function populateManageEpisode(season){  
  const result = getDBr().prepare('SELECT * FROM Providable WHERE Id=? AND Season=?').all(window.manageId, season);
  window.manageEpisode = result[0].Episode;
  const episodeList = document.getElementById('episodeSelector');
  if (result.length){
    episodeList.innerHTML='';
    for (const obj of result){
      const element = document.createElement('option');
      element.value=obj.Episode;
      element.innerText=obj.Episode;
      episodeList.appendChild(element);
    }
  }
  refreshManageList();//Last but bot but or bot bot not least we will refresh the manageList() to ensure proper paths and such!
}