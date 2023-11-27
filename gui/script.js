let Autohide = false;
var server = 1;
const TodaysDate = new Date();
const timer = ms => new Promise(res => setTimeout(res, ms));
var imdbId;
var namee;
var Id;
var configjson;
var data123;
var ipns = null;
var rootFolderName = null;
var rootPath = null
var pingIndex = 0;
var objlist = [];
var adServersList = [];
var AdServersInfo = {
  'id': null,
  'ep': null,
  'season': null
}
var Bookmarks = [];
var BookmarksJson;
//const evtSource = new EventSource("http://localhost:3000");
async function post() {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'refresh' })
  };
  const response = await fetch('http://localhost:3030', requestOptions);
  console.log(response);
};

async function postPing(url, status, index){
  console.log('posting Ping')
  var obj = {
    type: status,
    url: url,
    pingIndex: index
  }
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(obj)
  };
  const response = await fetch('http://localhost:3030/ping', requestOptions);
  console.log('Post of ping result status code:',response.status);
}
//post();

async function updateLogs(log){
  const newelement = document.createElement("li");
  newelement.innerHTML = log;
  newelement.setAttribute('class', 'consoleLog');
  document.getElementById("consoleList").appendChild(newelement);
}

async function updateQuality(e){
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  //const server = document.cookie.split('; ').find((row) => row.startsWith('server='))?.split('=')[1];
  document.cookie = "quality=" + e + "; SameSite=strict; Secure; " + kia;
  var i = 1
  for (var v of document.getElementsByName("quality")) {
    if (v.getAttribute('data-tag') === 'checked') {
      console.log('Found!');
      v.removeAttribute('data-tag');
    }
    if (i === parseInt(e)) {
      console.log('YESS!')
      v.setAttribute('data-tag', 'checked');
      console.log(i);
      console.log(v);
    }
    console.log(i);
    console.log(v);
    i = i + 1;
  }
}


/*async function getLogs() {
  var event = new EventSource
  /*const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Request-Type': 'logs'
    }
  };
  fetch('http://localhost:3030', requestOptions)
    .then(function(response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      //console.log(response.status);
      if (response.status === 200) {
        return response.json();
      }
    }).then(function(data) {
      if (data) {
        for (obj of data.logs) {
          if (obj.length > 1) {
            console.log(obj);
            const newelement = document.createElement("li");
            newelement.innerHTML = obj;
            newelement.setAttribute('class', 'consoleLog');
            document.getElementById("consoleList").appendChild(newelement);
          }
        }
      }
      // `data` is the parsed version of the JSON returned from the above endpoint.
      //console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
    }).catch(function(e) {
      ///console.log(e);
      return;
    });
  //const response = await fetch('http://localhost:3030', requestOptions);
  //console.log(response.body);
}*/

async function getInit() {
  const cookiequality = document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1];
  if (cookiequality !== null && cookiequality !== undefined){
  updateQuality(cookiequality);
  }
  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Request-Type': 'init'
    }
  };
  fetch('http://localhost:3030', requestOptions)
    .then(function(response) {
      console.log(response.status);
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      if (response.status === 200) {
        return response.json();
      }
    }).then(function(data) {
      console.log(data);
      if (data) {
        ipns = data.config.ipns;
        rootPath = data.config.rootPath;
        rootFolderName = data.config.rootFolderName;
        configjson = data.config;
        if (configjson.pingCheck === true){
          if (data.pingReady === true){
            const evtSource2 = new EventSource('http://localhost:3030/ping');
            evtSource2.onmessage = (event) => {
            try {
              console.log('We have started Previous Ping log Check Listener!');
              console.log(event.data);
              var data = JSON.parse(event.data);
              if (data.type === "array"){
                pingIndex = parseInt(data.pingIndex);
                console.log('pingIndex is ', data.pingIndex, 'set tooo', pingIndex);
                console.log('objs are', data.obj);
                getPingFiles();
                for (var obj of data.obj){
                  console.log('testing object', obj);
                  if (obj.type === 'success') {
                    var newelement = document.createElement("li");
                    newelement.setAttribute('onclick', `window.open('${obj.url}', '_blank')`);
                    newelement.setAttribute('class', 'pingLog');
                    newelement.innerHTML = obj.url + " Was a success!";
                    document.getElementById("activeFilesList").appendChild(newelement);
                  }
                  if (obj.type === 'failed') {
                    var newelement = document.createElement("li");
                    //newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
                    newelement.setAttribute('class', 'pingLog');
                    //newelement.setAttribute('href', obj);
                    newelement.innerHTML = obj.url + " Failed Please wait...!";
                    document.getElementById("pendingFilesList").appendChild(newelement);
                  }
                //updateLogs(obj);
                }
              }
            }catch (e){
              console.log(e);
            }
            };
          }
        }
        /*if (data.pingCheck === true){
          const evtSource2 = new EventSource('http://localhost:3030/ping');
          evtSource2.onmessage = (event) => {
          try {
            console.log('We have started Previous Ping log Check Listener!');
            console.log(event.data);
            var data = JSON.parse(event.data);
            if (data.type === "array"){
              pingIndex = parseInt(data.pingIndex);
              console.log('pingIndex is ', data.pingIndex, 'set tooo', pingIndex);
              console.log('objs are', data.obj);
              getPingFiles();
              for (var obj of data.obj){
                console.log('testing object', obj);
                if (obj.type === 'success') {
                  var newelement = document.createElement("li");
                  newelement.setAttribute('onclick', `window.open('${obj.url}', '_blank')`);
                  newelement.setAttribute('class', 'pingLog');
                  newelement.innerHTML = obj.url + " Was a success!";
                  document.getElementById("activeFilesList").appendChild(newelement);
                }
                if (obj.type === 'failed') {
                  var newelement = document.createElement("li");
                  //newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
                  newelement.setAttribute('class', 'pingLog');
                  //newelement.setAttribute('href', obj);
                  newelement.innerHTML = obj.url + " Failed Please wait...!";
                  document.getElementById("pendingFilesList").appendChild(newelement);
                }
              //updateLogs(obj);
              }
            }
          }catch (e){
            console.log(e);
          }
        };


        }*/
        //if (data.ipfsDesktopInstalled === true ) {
          //setInterval(getPingFiles, 240000);
          var counter = 0;
          if (configjson.listOfRootFolderNames.length>0){
            document.getElementById('settingRepoSelection').innerHTML = "";
          }
          for (var obj of configjson.listOfRootFolderNames) {
            var newelement = document.createElement("option");
            newelement.setAttribute('value', counter);
            newelement.innerHTML = obj;
            document.getElementById('settingRepoSelection').appendChild(newelement);
            counter = counter + 1;
          }
        //}
      }
      // `data` is the parsed version of the JSON returned from the above endpoint.
      //console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
    }).catch(function(e) {
      //console.log(e);
      return;
    });
  //const response = await fetch('http://localhost:3030', requestOptions);
  //console.log(response.body);
}

async function pingCheck(data) {
  console.log('starting Ping check!');
  var index = pingIndex;
  if (pingIndex>0 && (pingIndex <= (data.logs.length-2))){
    console.log('Ping index is greater then initial going to push it up!');
    index = pingIndex+1;
  }
  console.log('Ping check index:', index);
  for (index; index<=(data.logs.length-1);index++){
    var obj = data.logs[index];
    fetch(obj).then(function(response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      if (response.status === 200) {
        var newelement = document.createElement("li");
        newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
        newelement.setAttribute('class', 'pingLog');
        newelement.innerHTML = obj + " Was a success!";
        document.getElementById("activeFilesList").appendChild(newelement);
        postPing(obj, 'success', index);
        //index = index + 1;
        return;// response.text();
      } else {
        var newelement = document.createElement("li");
        newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
        newelement.setAttribute('class', 'pingLog');
        //newelement.setAttribute('href', obj);
        newelement.innerHTML = obj + " Failed Please wait...!";
        document.getElementById("pendingFilesList").appendChild(newelement);
        postPing(obj, 'failed', index);
        return;
        //index = index + 1;
      }
    }).catch(function(e) {
      /*console.log(e);
      var newelement = document.createElement("li");
      newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
      newelement.setAttribute('class', 'pingLog');
      //newelement.setAttribute('href', obj);
      newelement.innerHTML = obj + " Failed Please wait...!";
      document.getElementById("pendingFilesList").appendChild(newelement);
      postPing(obj, 'failed', index);
      index = index + 1;*/
    });
    await timer(15000);
  }
  /*for (var obj of data.logs) {
    if (index <= pingIndex){
      index = index+1;
      continue;
    }else{
    console.log('Ping index:', index);
    console.log('Ping checking:', obj);
    //const response = await fetch(obj);
    fetch(obj).then(function(response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      if (response.status === 200) {
        var newelement = document.createElement("li");
        newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
        newelement.setAttribute('class', 'pingLog');
        newelement.innerHTML = obj + " Was a success!";
        document.getElementById("activeFilesList").appendChild(newelement);
        postPing(obj, 'success', index);
        index = index + 1;
        return response.text();
      } else {
        var newelement = document.createElement("li");
        newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
        newelement.setAttribute('class', 'pingLog');
        //newelement.setAttribute('href', obj);
        newelement.innerHTML = obj + " Failed Please wait...!";
        document.getElementById("pendingFilesList").appendChild(newelement);
        postPing(obj, 'failed', index);
        index = index + 1;
      }
    }).catch(function(e) {
      console.log(e);
      var newelement = document.createElement("li");
      newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
      newelement.setAttribute('class', 'pingLog');
      //newelement.setAttribute('href', obj);
      newelement.innerHTML = obj + " Failed Please wait...!";
      document.getElementById("pendingFilesList").appendChild(newelement);
      postPing(obj, 'failed', index);
      index = index + 1;
    });
    await timer(45000);
    //console.log('Ping Result', response.status);
    /*if (response.status === 200){
      var newelement = document.createElement("li");
      newelement.innerHTML = obj + " Was a success!";
      document.getElementById("activeFilesList").appendChild(newelement);
    }else{
      var newelement = document.createElement("li");
      newelement.innerHTML = obj.log;
      document.getElementById("pendingFilesList").appendChild(newelement);
    }
    }
  }*/
  pingIndex=0;
  getPingFiles();
}

async function getPingFiles() {
  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Request-Type': 'ping'
    }
  };
  /*const response = await fetch('http://localhost:3030', requestOptions);
  console.log(response);
  const jsonresponse = */
  console.log('Starting get ping files');
  fetch('http://localhost:3030/', requestOptions)
    .then(function(response) {
      console.log(response.status);
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      if (response.status === 200) {
        return response.json();
      }
    }).then(function(data) {
      console.log('Returned response!');
      if (data) {
        data123 = data;
        console.log(data);
        pingCheck(data);
        /*for (obj of data.logs) {
          //if (obj.length > 1) {
            //if (obj.type === "success") {
              //console.log(obj);
              //const newelement = document.createElement("li");
              //newelement.innerHTML = obj.log;
              //document.getElementById("activeFilesList").appendChild(newelement);
            //}
            //if (obj.type === "failed") {
              //console.log(obj);
              //const newelement = document.createElement("li");
              //newelement.innerHTML = obj.log;
              //document.getElementById("pendingFilesList").appendChild(newelement);
            //}
          //}
      }*/
      }
      // `data` is the parsed version of the JSON returned from the above endpoint.
      //console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
    }).catch(function(e) {
      //console.log(e);
      return;
    });
  //const response = await fetch('http://localhost:3030', requestOptions);
  //console.log(response.body);
}

function convertTitle2foldername(b) {
  //console.log('Before:', s);
  var a = b.toString().toLowerCase();
  a = a.replaceAll(' ', '');
  a = a.replace(/[\W_]+/g, "");
  //d = encodeURIComponent(d);
  //d = d.replaceAll('^\\+', '').replaceAll('[\\\\/:*?\'<>|]', '');
  //console.log('After:', d);
  return a;
}

async function mkDir(id, name, type, seasons) {
  var safename = convertTitle2foldername(name);

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "type": "mkdir", "id": id, "name": safename, "maketype": type, "seasons": seasons })
  };
  //const response = await fetch('http://localhost:3030', requestOptions);
  //console.log(response);
  fetch('http://localhost:3030', requestOptions)
    .then(function(response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      return response.json();
    }).then(function(data) {
      // `data` is the parsed version of the JSON returned from the above endpoint.
      //console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
    });
    //makeDirs(id, safename, type, seasons);
}
//mkDir(0, "blah", "movie");

async function startPingListener(){
  const evtSource2 = new EventSource('http://localhost:3030/ping');
  evtSource2.onmessage = (event) => {
    try {
      console.log('We have started Previous Ping log Check Listener!');
      console.log(event.data);
      var data = JSON.parse(event.data);
      if (data.type === "array"){
        pingIndex = parseInt(data.pingIndex);
        console.log('pingIndex is ', data.pingIndex, 'set tooo', pingIndex);
        console.log('objs are', data.obj);
        getPingFiles();
        for (var obj of data.obj){
          console.log('testing object', obj);
          if (obj.type === 'success') {
            var newelement = document.createElement("li");
            newelement.setAttribute('onclick', `window.open('${obj.url}', '_blank')`);
            newelement.setAttribute('class', 'pingLog');
            newelement.innerHTML = obj.url + " Was a success!";
            document.getElementById("activeFilesList").appendChild(newelement);
          }
          if (obj.type === 'failed') {
            var newelement = document.createElement("li");
            //newelement.setAttribute('onclick', `window.open('${obj}', '_blank')`);
            newelement.setAttribute('class', 'pingLog');
            //newelement.setAttribute('href', obj);
            newelement.innerHTML = obj.url + " Failed Please wait...!";
            document.getElementById("pendingFilesList").appendChild(newelement);
          }
        //updateLogs(obj);
        }
      }
    }catch (e){
      console.log(e);
    }
  };
}
//console.log('converting puss in boots title ',convertTitle2foldername('Puss in Boots: The Last Wish'));
//console.log('converting harry potters philospher stone title: ,', convertTitle2foldername("Harry Potter and the Philosopher's Stone"));

//window.open = function(text) { console.log('tried to Open: ' + text); return true; };

//Override Existing Window.alert function to combat popups and alerts!
window.alert = function(text) { console.log('tried to alert: ' + text); return true; };

//Window built in ads blocked!!
/*onbeforeunload = (event) => { event.preventDefault; console.log("prevented redirect!") };
window.onbeforeunload = function(event) {
  console.log("prevented Redirect!");
  event.preventDefault;
}*/

//Register events in the onload to ensure elements are loaded!
window.onload = function() {
  document.getElementById('logobutton').addEventListener('click', test);
  document.getElementById('searchbox').addEventListener('change', updateSearchContainerbySearch);
  document.getElementById('settingRepoSelection').addEventListener('change', updateRepoDir);
  document.getElementById('settingsCreateRepoSubmit').addEventListener('click', addRepoDir);
  if (!document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1]) {
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    var kia = "expires=" + d.toUTCString();
    document.cookie = "quality="+"hd"+"; SameSite=strict; Secure; " + kia;
    //namee = document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1];
  }
  if (!document.cookie.split('; ').find((row) => row.startsWith('browserIndex='))?.split('=')[1]) {
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    var kia = "expires=" + d.toUTCString();
    document.cookie = "browserIndex="+0+"; SameSite=strict; Secure; " + kia;
    //namee = document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1];
  }
  //document.getElementById('settingRepoSelection').addEventListener('change', updateRepoDir);
  //document.getElementById('settingsCreateRepoSubmit').addEventListener('click', addRepoDir);
  if (document.cookie.split('; ').find((row) => row.startsWith('name='))?.split('=')[1]) {
    namee = document.cookie.split('; ').find((row) => row.startsWith('name='))?.split('=')[1];
  }
    if (document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1]) {
      if (document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1]) {
        if (document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1] === "movie") {
          updateMovieContainer();
          //updateRecommendedAndSimilar();
        }
        if (document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1] === "tv") {
          console.log("TV detected!");
          if (document.cookie.split('; ').find((row) => row.startsWith('season='))?.split('=')[1] && document.cookie.split('; ').find((row) => row.startsWith('episode='))?.split('=')[1]) {
            console.log('Loaded');
            updateTvContainer();
            //updateRecommendedAndSimilar();
          }
        }
      }
    }
  
  movieinitexample();
  movieinitstonerexample();
  tvshowinitstonerexample();
  tvshowinitexample();
  //mkDir(0, "blah", "movie");
  //var obj = [{"season":1,"episode_count":8},{"season":2,"episode_count":0}];
  //mkDir(0, "blah", "tvshow", obj);
  getInit();///
  //getPingFiles();
  const evtSource = new EventSource('http://localhost:3030/consolelog');
  evtSource.onmessage = (event) => {
    try {
      console.log(event.data);
      var data1 = JSON.parse(event.data);
      console.log(data1);
      if (data1.type === "single"){
        updateLogs(data1.obj);
      }
      if (data1.type === "array"){
        for (var obj of data1.obj){
          updateLogs(obj);
        }
      }
      if (data1.type === 'task'){
        if (data1.status === 'finished'){
          if (configjson.pingCheck === true){
            startPingListener();
            return;
          }
          //pingIndex=0;
          //getPingFiles();
        }
      }
    }catch (e){
      console.log(e);
    }
  };
  //getLogs();///
  //setInterval(getLogs, 30000);///
  //bookmarkInit();
  //bookmarkUpdate();
  //getDir();
}
//updateTvContainer();


async function addRepoDir(){
  console.log('Changed');
  if (document.getElementById('settingsCreateRepoName').value){
    var name = document.getElementById('settingsCreateRepoName').value;
    if (name.length>0){
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({type: 'addBrowserIndex', name: name})
      };
      fetch("http://localhost:3030", requestOptions).then(data =>{
        console.log(data);
      }).catch(e =>{
        console.log(e);
      });
      var newelement = document.createElement('option');
      newelement.setAttribute('value', configjson.listOfRootFolderNames.length);
      newelement.innerHTML = name;
      document.getElementById('settingRepoSelection').appendChild(newelement);
    }
  }
}

async function updateRepoDir(){
  console.log('Changed');
  var selected = document.getElementById('settingRepoSelection').value;
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  document.cookie = "browserIndex=" + selected + "; SameSite=strict; Secure; " + kia;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({type: 'updateBrowserIndex', index: selected})
  };
  fetch("http://localhost:3030", requestOptions).then(data =>{
    console.log(data);
  }).catch(e =>{
    console.log(e);
  });
  console.log(selected);
}

//NEED TODO THIS////////////////////////////////////////////
async function deleteRpoDirFromConfig(){///For the browser gui easy working with repo wont actually delete the whole folder just its entry in the config.json which makes the application ignore it!

}
//////////////////////////////////////////////////////////

//Deprecated!
async function getDir() {
  const dirHandle = await window.showDirectoryPicker();
  console.log(dirHandle);
  // run code for dirHandle
}

function updatewatchIdAndEtc(id, type, name) {
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  document.cookie = "watchId=" + id + "; SameSite=strict; Secure; " + kia;
  Id = id;
  document.cookie = "watchType=" + type + "; SameSite=strict; Secure; " + kia;
  document.cookie = "name=" + name + "; SameSite=strict; Secure; " + kia;
  namee = name;
  /*
  * Memory Note Please don't forget to add a updateExternalId
  */

}

function updatewatchType(type) {
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  document.cookie = "watchType=" + type + "; SameSite=strict; Secure; " + kia;
}

function updateSearchContainerbyPage(n) {
  var result = document.getElementById('searchbox').value;
  //console.log(result2);
  //console.log(result);
  if (result) {
    var query = encodeURIComponent(encodeURI(result.replaceAll(' ', '-')).toString()).toString();
    //console.log(query);
    fetch(`https://api.themoviedb.org/3/search/multi?query=${query}&language=en-US&page=${parseInt(n)}&append_to_response=external_ids`, {
      method: 'GET',
      headers: {
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
        'content-type': 'application/json;charset=utf-8'
      }
    }).then((response) => response.json())
      .then((data) => {
        //console.log(data);
        document.getElementById("searchlist").innerHTML = "";
        for (var json of data.results) {
          if (json.media_type !== "person") {
            //console.log(json.media_type);
            var overview;
            if (json.overview) {
              overview = json.overview.substring(0, 200);
            } else {
              overview = "";
            }

            if (json.media_type === "movie") {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.title}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${overview}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.release_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "${json.media_type}");`);
              document.getElementById("searchlist").appendChild(newelement);
            }

            if (json.media_type === "tv") {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.name}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${overview}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "${json.media_type}");`);
              document.getElementById("searchlist").appendChild(newelement);
            }
          }
        }
      }).catch(e => {
        console.log(e);
      });
  }
}

function updateSearchContainerbySearch() {
  //console.log('search bar was updated! event fired Successfully');
  //var result = document.getElementById("searchbox").getAttribute('value');
  var result = document.getElementById('searchbox').value;
  //console.log(result2);
  //console.log(result);
  if (result) {
    var query = encodeURIComponent(encodeURI(result.replaceAll(' ', '-')).toString()).toString();
    //console.log(query);
    fetch(`https://api.themoviedb.org/3/search/multi?query=${query}&language=en-US&append_to_response=external_ids`, {
      method: 'GET',
      headers: {
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
        'content-type': 'application/json;charset=utf-8'
      }
    }).then((response) => response.json())
      .then((data) => {
        //console.log(data);
        document.getElementById("pagelist").innerHTML = "";
        document.getElementById("searchlist").innerHTML = "";
        for (var json of data.results) {
          if (json.media_type !== "person") {
            //console.log(json.media_type);
            var overview;
            if (json.overview) {
              overview = json.overview.substring(0, 200);
            } else {
              overview = "";
            }

            if (json.media_type === "movie") {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.title}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${overview}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.release_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "${json.media_type}");`);
              document.getElementById("searchlist").appendChild(newelement);
            }

            if (json.media_type === "tv") {
              const newelement = document.createElement("li");
              var bookmarksrc = "assets/bookmark.png";
              if (localStorage.getItem('bookmarks')) {
                if (JSON.parse(localStorage.getItem('bookmarks')).tv.find(tree => parseInt(tree) === parseInt(json.id))) {
                  bookmarksrc = "assets/bookmarkfilled.png";
                  //console.log('FOUND BOOOKMARK');
                }
              }
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.name}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${overview}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "${json.media_type}");`);
              document.getElementById("searchlist").appendChild(newelement);
            }
          }
        }
        if (data.total_pages >= 2) {
          for (var i = 0; data.total_pages > i; i++) {
            const pageelement = document.createElement("div");
            pageelement.innerHTML = `${(i + 1)}`;
            pageelement.setAttribute("class", "card6");
            pageelement.setAttribute("onclick", `updateSearchContainerbyPage(${(i + 1)})`);
            //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
            document.getElementById("pagelist").appendChild(pageelement);
          }
        } else {
          const pageelement = document.createElement("div");
          pageelement.innerHTML = `${(1)}`;
          pageelement.setAttribute("class", "card6");
          pageelement.setAttribute("onclick", `updateSearchContainerbyPage(${(1)})`);
          //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          document.getElementById("pagelist").appendChild(pageelement);
        }
      }).catch(e => {
        console.log(e);
      });
  }
}

function updateMovieContainer() {
  //bookmarkInit();
  var id; //Here we will load it from the document cookies
  //var season = document.cookie.split('; ').find((row) => row.startsWith('season='))?.split('=')[1];
  const name = document.cookie.split('; ').find((row) => row.startsWith('name='))?.split('=')[1];
  if (document.cookie.split('; ').find((rowc) => rowc.startsWith('watchType=movie'))) {
    const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
    
    id = cookieValue;
    if (id) {

    try {
      document.getElementById("watchTvPlayer").removeAttribute('src');
      document.getElementById("watchMoviePlayer").removeAttribute('style');
      document.getElementById("seasoncontainer").setAttribute('style', 'display: none;');
      document.getElementById("episodecontainer").setAttribute('style', 'display: none;');
      document.getElementById("watchTvPlayer").setAttribute('style', 'display: none;');
    } catch (e) { }
    const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
    id = cookieValue;


    }

    document.getElementById("detailType").innerHTML="Movie";
    document.getElementById("detailName").innerHTML="Title: "+name;
  }
}

function updateTvContainer() {
  //bookmarkInit();
  var id; //Here we will load it from the document cookies
  var season = document.cookie.split('; ').find((row) => row.startsWith('season='))?.split('=')[1];
  if (document.cookie.split('; ').find((rowc) => rowc.startsWith('watchType=tv'))) {
    const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
    const name = document.cookie.split('; ').find((row) => row.startsWith('name='))?.split('=')[1];
    document.getElementById("detailType").innerHTML="Tv Show";
    document.getElementById("detailName").innerHTML="Title: "+name;
    id = cookieValue;
    try {
      document.getElementById("watchTvPlayer").removeAttribute('style');
      document.getElementById("seasoncontainer").removeAttribute('style');
      //document.getElementById("watchMoviePlayer").removeAttribute('src');
      document.getElementById("watchMoviePlayer").setAttribute('style', 'display: none;');
      document.getElementById("episodecontainer").removeAttribute('style');
    } catch (e) { }
    fetch(`https://api.themoviedb.org/3/tv/${id}?language=en-US&append_to_response=external_ids`, {
      method: 'GET',
      headers: {
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
        'content-type': 'application/json;charset=utf-8'
      }
    }).then((response) => response.json())
      .then((data) => {
        objlist = [];
        for (var json of data.seasons) {
          if (json.name !== null && !json.name.startsWith("Special")) {
            var obj = {
              "season": json.season_number,
              "episode_count": json.episode_count
            };
            obj.season = json.season_number;
            obj.episode_count = json.episode_count;
            objlist.push(obj);
          }
        }
      });
    //document.getElementById("watchMoviePlayer").setAttribute('style', 'display: none;');
    //Put inside if statement to make sure its watching a tv show! check the cookies!
    fetch(`https://api.themoviedb.org/3/tv/${id}?language=en-US&append_to_response=external_ids`, {
      method: 'GET',
      headers: {
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
        'content-type': 'application/json;charset=utf-8'
      }
    }).then((response) => response.json()).then((data) => {
      //console.log(data);
      document.getElementById("listofseasons").innerHTML = "";
      objlist = [];
      for (var json of data.seasons) {
        if (json.name !== null && !json.name.startsWith("Special")) {
          var obj = {
            "season": json.season_number,
            "episode_count": json.episode_count
          };
          obj.season = json.season_number;
          obj.episode_count = json.episode_count;
          objlist.push(obj);
          const seasonelement = document.createElement("li");
          seasonelement.innerHTML = `Season ${json.season_number}`;
          seasonelement.setAttribute("class", "card2");
          seasonelement.setAttribute('name', 'season');
          seasonelement.setAttribute("onclick", `getepisodes(${json.season_number})`);
          console.log(season);
          if (parseInt(season) === parseInt(json.season_number)) {
            console.log('season is the same making it checked!');
            seasonelement.setAttribute('data-tag', 'checked');
          }
          document.getElementById('listofseasons').appendChild(seasonelement);
          //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          //document.getElementById("listofseasons").appendChild(seasonelement);
          //Then we for loop for each episode count and append the episode amount to the object!
          /*for(var i=0; json.episode_count> i; i++){
          const newelement =  document.createElement("div");
          newelement.innerHTML=`Episode ${json.episode_number}`;
          newelement.setAttribute("class", "seasonobj");
          //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          document.getElementById("stonertvlist").appendChild(newelement);
          }*/
        }
      }

      //mkDir("")
      console.log(objlist);
      getepisodes(season);
    }).catch(e => {
      console.log(e);
    });

  }
}

function updateServer(n) {
  const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('server='))?.split('=')[1];
  const cookieValue2 = document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1];
  if (cookieValue === n) {
    return;
  } else {
    server = n;
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    var kia = "expires=" + d.toUTCString();
    document.cookie = "server=" + n + "; SameSite=strict; Secure; " + kia;
    if (cookieValue2 === "movie") {
      //updateMovieContainer();
    } else {
      var season = document.cookie.split('; ').find((row) => row.startsWith('season='))?.split('=')[1];
      var episode = document.cookie.split('; ').find((row) => row.startsWith('episode='))?.split('=')[1];
      //updateTvPlayer(season, episode);
    }
  }
}

function getepisodes(n) {
  var result = objlist.find(tree => (tree.season === parseInt(n)));
  //console.log(n);
  //console.log(result);
  var i = 1;
  for (var v of document.getElementsByName("season")) {
    if (v.getAttribute('data-tag') === 'checked') {
      //console.log('Found!');
      v.removeAttribute('data-tag');
    }
    if (parseInt(i) === parseInt(n)) {
      //console.log('YESS!')
      v.setAttribute('data-tag', 'checked');
    }
    //console.log(season);
    //console.log(i);
    //console.log(v);
    i = i + 1;
  }
  document.getElementById("listofepisodes").innerHTML = "";
  if (document.cookie.split('; ').find((row) => row.startsWith('episode'))) {
    var episodecookie = document.cookie.split('; ').find((row) => row.startsWith('episode='))?.split('=')[1];
    for (var i = 0; result.episode_count > i; i++) {
    const newelement = document.createElement("div");
    newelement.innerHTML = `Episode ${(i + 1)}`;
    newelement.setAttribute("class", "card2");
    newelement.setAttribute('name', 'episode');
    newelement.setAttribute("onclick", `updateTvPlayer(${n}, "${(i + 1)}");`);
    if (parseInt(episodecookie)===parseInt(i+1)){newelement.setAttribute('data-tag', 'checked');}
    document.getElementById("listofepisodes").appendChild(newelement);
  }
    //updateTvPlayer(n, episodecookie); //**
    /**
     * 
     *we will use this later on for a drag and drop file moving system! 
     * 
     */
    //
    //updateTvAdServers(document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1], n, episodecookie);
    //console.log('Howdy dudoidoo');
  } else {
    for (var i = 0; result.episode_count > i; i++) {
    const newelement = document.createElement("div");
    newelement.innerHTML = `Episode ${(i + 1)}`;
    newelement.setAttribute("class", "card2");
    newelement.setAttribute('name', 'episode');
    newelement.setAttribute("onclick", `updateTvPlayer(${n}, "${(i + 1)}");`);
    document.getElementById("listofepisodes").appendChild(newelement);
  }
    //updateTvPlayer(n, 1);
  }
}

function getTvExternalIds(id) {

  fetch(`https://api.themoviedb.org/3/tv/${id}/external_ids`, {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      return data.imdb_id;
      //console.log(data);
    }).catch(e => {
      console.log(e);
    });
}

function updateTvPlayer(season, episode) {
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  document.cookie = "season=" + season + "; SameSite=strict; Secure; " + kia;
  document.cookie = "episode=" + episode + "; SameSite=strict; Secure; " + kia;
  getepisodes(season);
  var i = 1
  for (var v of document.getElementsByName("episode")) {
    if (v.getAttribute('data-tag') === 'checked') {
      console.log('Found!');
      v.removeAttribute('data-tag');
    }
    if (i === parseInt(episode)) {
      console.log('YESS!')
      v.setAttribute('data-tag', 'checked');
      console.log(i);
      console.log(v);
    }
    console.log(i);
    console.log(v);
    i = i + 1;
  }
  i = 1;
  for (var v of document.getElementsByName("season")) {
    if (v.getAttribute('data-tag') === 'checked') {
      //console.log('Found!');
      v.removeAttribute('data-tag');
    }
    if (parseInt(i) === parseInt(season)) {
      //console.log('YESS!')
      v.setAttribute('data-tag', 'checked');
    }
    //console.log(season);
    //console.log(i);
    //console.log(v);
    i = i + 1;
  }
  //const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
  //var id = cookieValue;
  //bookmarkInit();
  //updateHistory(id, "tv", season, episode);
  //updateTvAdServers(id, season, episode);
  //updateHistory(id, season, episode);
}


function test() {
  //getDir();
  Autohide = !Autohide;
  //console.log("Logo Clicked!");
  //console.log("Autohide Value: ", Autohide);
  if (Autohide == true) {
    //console.log("Hiding Tab Labels!");
    document.getElementById("tababoutlabel")
    document.getElementById("tababoutlabel").setAttribute("style", "display: none");
    document.getElementById("tabhomelabel").setAttribute("style", "display: none");
    document.getElementById("tabchannelslabel").setAttribute("style", "display: none");
    //document.getElementById("tabcountrylabel").setAttribute("style", "display: none");
    document.getElementById("tabmovieslabel").setAttribute("style", "display: none");
    document.getElementById("tabtvlabel").setAttribute("style", "display: none");
    document.getElementById("tabsearchlabel").setAttribute("style", "display: none");
    document.getElementById("tabwatchlabel").setAttribute("style", "display: none");
    //console.log(document.getElementById("tababoutlabel").getAttribute("display"));
  } else {
    document.getElementById("tababoutlabel").removeAttribute("style");
    document.getElementById("tabhomelabel").removeAttribute("style");
    document.getElementById("tabchannelslabel").removeAttribute("style");
    //document.getElementById("tabcountrylabel").removeAttribute("style");
    document.getElementById("tabmovieslabel").removeAttribute("style");
    document.getElementById("tabtvlabel").removeAttribute("style");
    document.getElementById("tabsearchlabel").removeAttribute("style");
    document.getElementById("tabwatchlabel").removeAttribute("style");
  }
}

function cardclicked(id, name, type) {
  //console.log('cardClicked');
  const d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  var kia = "expires=" + d.toUTCString();
  //console.log("Id:", id, "Name:", name, "Type:", type, "Was Clicked");
  const cookieValue = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
  const cookiequality = document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1];
  updateQuality(cookiequality);
  if (parseInt(cookieValue) === id) {
    document.getElementById("tababout").checked = false;
    document.getElementById("tabhome").checked = false;
    document.getElementById("tabchannels").checked = false;
    document.getElementById("tabmovies").checked = false;
    document.getElementById("tabtvshows").checked = false;
    document.getElementById("tabsearch").checked = false;
    document.getElementById("tabwatch").checked = true;
  } else {
    //console.log('Else');
    updatewatchIdAndEtc(id, type, name);

    //Here Right above we will add in the updateRecommendedAndSimilar
    //updatewatchName(name);
    //updatewatchType(type);
    //bookmarkInit();
    if (type === "tv") {
      document.getElementById("seasoncontainer").removeAttribute('style');
      document.getElementById("episodecontainer").removeAttribute('style');
      //console.log('Is a TV SHOW!');
      //Package the History Check right Here be the optimal spot!
      document.cookie = "season=" + 1 + "; SameSite=strict; Secure; " + kia;
      document.cookie = "episode=" + 1 + "; SameSite=strict; Secure; " + kia;
      fetch(`https://api.themoviedb.org/3/tv/${id}?language=en-US&append_to_response=external_ids`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          objlist = [];
          for (var json of data.seasons) {
            if (json.name !== null && !json.name.startsWith("Special")) {
              var obj = {
                "season": json.season_number,
                "episode_count": json.episode_count
              };
              obj.season = json.season_number;
              obj.episode_count = json.episode_count;
              objlist.push(obj);
            }
          }
          mkDir(id, name, "tvshow", objlist);
          //makeDirs(id, convertTitle2foldername(name), "tvshow", objlist);
          updateTvContainer();
        }).catch(e => {
          console.log(e);
        });
      //updateTvContainer();
      //updateRecommendedAndSimilar();
      //}
    } else {
      mkDir(id, name, "movie");
      //makeDirs(id, convertTitle2foldername(name), "movie");
      updateMovieContainer();
      document.getElementById("seasoncontainer").setAttribute('style', 'display: none;');
      document.getElementById("episodecontainer").setAttribute('style', 'display: none;');
      //updateRecommendedAndSimilar();
    }
    document.getElementById("tababout").checked = false;
    document.getElementById("tabhome").checked = false;
    document.getElementById("tabchannels").checked = false;
    document.getElementById("tabmovies").checked = false;
    document.getElementById("tabtvshows").checked = false;
    document.getElementById("tabsearch").checked = false;
    document.getElementById("tabwatch").checked = true;
    //getLogs();
  }
}

async function updateRecommendedAndSimilar() {
  var Id = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
  var type = document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1];
  if (Id && type) {
    switch (type) {
      case "tv":
        fetch(`https://api.themoviedb.org/3/tv/${Id}/recommendations?language=en-US&page=1`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            total_pages = parseInt(data.total_pages);
            document.getElementById("listofrecommended").innerHTML = "";
            initializeaddbypage("recommended", total_pages);
          }).catch(e => {
            console.log(e);
          });

        fetch(`https://api.themoviedb.org/3/tv/${Id}/similar?language=en-US&page=1`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            total_pages = parseInt(data.total_pages);
            document.getElementById("listofsuggested").innerHTML = "";
            initializeaddbypage("suggested", total_pages);
          }).catch(e => {
            console.log(e);
          });
        break;

      case "movie":
        fetch(`https://api.themoviedb.org/3/movie/${Id}/recommendations?language=en-US&page=1`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            total_pages = parseInt(data.total_pages);
            document.getElementById("listofrecommended").innerHTML = "";
            initializeaddbypage("recommended", total_pages);
          }).catch(e => {
            console.log(e);
          });
        fetch(`https://api.themoviedb.org/3/movie/${Id}/similar?language=en-US&page=1`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            total_pages = parseInt(data.total_pages);
            document.getElementById("listofsuggested").innerHTML = "";
            initializeaddbypage("suggested", total_pages);
          }).catch(e => {
            console.log(e);
          });
        break;
    }

  }
}

async function tvaddbyPage(n, p) {
  switch (n) {
    case 1:
      fetch(`https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.asc&page=${(p + 1)}&with_original_language=en&vote_count.gte=1000&vote_average.gte=8&watch_region=US&region=US`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            if (json.poster_path === null && json.backdrop_path === null) {
            }
            if (json.poster_path !== null) {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.name}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${json.overview.substring(0, 200)}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
              document.getElementById("IMDBToptvlist").appendChild(newelement);
            }
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case 2:
      fetch(`https://api.themoviedb.org/3/trending/tv/week?page=${(p + 1)}`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            if (json.poster_path === null && json.backdrop_path === null) {
            }
            if (json.poster_path !== null) {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.name}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${json.overview.substring(0, 200)}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                    </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
              document.getElementById("newesttvlist").appendChild(newelement);
            }
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case 3:
      fetch(`https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=${(p + 1)}&with_original_language=en`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            const newelement = document.createElement("li");
            newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                    <h3 class="card-title">${json.name}</h3> \
                    <div class="card-content"> \
                      <h3>Description</h3> \
                      <p>${json.overview.substring(0, 200)}</p> \
                    </div> \
                    <div class="card-link-wrapper"> \
                      <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                    </div>`
            newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
            newelement.setAttribute("id", json.id);
            newelement.setAttribute("class", "card");
            newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
            document.getElementById("populartvlist").appendChild(newelement);
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case 20:
      fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=${(p + 1)}&with_original_language=en&vote_count.gte=10000&vote_average.gte=7&watch_region=US&region=US`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {

            if (json.poster_path === null && json.backdrop_path === null) {

            }
            if (json.poster_path !== null) {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
              document.getElementById("IMDBTopmovielist").appendChild(newelement);
            }
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case 21:
      fetch(`https://api.themoviedb.org/3/movie/popular?language=en-US&sort_by=popularity.asc&page=${(p + 1)}&with_original_language=en`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            //console.log(json.id);
            //console.log(json.poster_path);
            const newelement = document.createElement("li");
            newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
            newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
            newelement.setAttribute("id", json.id);
            newelement.setAttribute("class", "card");
            newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
            document.getElementById("popularmovielist").appendChild(newelement);
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case 22:
      fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&region=US%7CUK&sort_by=release_date.desc&page=${(p + 1)}&primary_release_year=2023%7C2022&watch_region=US%7CUK&with_original_language=en&with_release_type=3&primary_release_date.lte=${TodaysDate.toISOString().split("T")[0]}`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            //console.log(json.id);
            //console.log(json.poster_path);
            //console.log(json.backdrop_path);
            if (json.poster_path === null && json.backdrop_path === null) {

            }
            if (json.poster_path !== null) {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              //newelement.setAttribute("data-type", "movie");
              //newelement.setAttribute("data-name", json.title);
              //newelement.setAttribute("data-id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
              document.getElementById("newestmovielist").appendChild(newelement);

              //document.getElementById(`${json.id}`).addEventListener("click", cardclicked(`${json.id}`));
              //console.log(JSON.stringify(json));
            }
          }
        }).catch(e => {
          console.log(e);
        });
      break;

    case "recommended":
      var Id = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
      var type = document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1];
      if (Id && type) {
        switch (type) {
          case "tv":
            fetch(`https://api.themoviedb.org/3/tv/${Id}/recommendations?language=en-US&page=${(p + 1)}`, {
              method: 'GET',
              headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
                'content-type': 'application/json;charset=utf-8'
              }
            }).then((response) => response.json())
              .then((data) => {
                //console.log(data);
                for (var json of data.results) {
                  if (json.poster_path === null && json.backdrop_path === null) {
                  }
                  if (json.poster_path !== null) {
                    const newelement = document.createElement("li");
                    if (json.original_language === "en" && json.origin_country.includes("US" || "UK")) {
                      newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
                      newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                      newelement.setAttribute("id", json.id);
                      newelement.setAttribute("class", "card");
                      newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
                      document.getElementById("listofrecommended").appendChild(newelement);
                    }
                  }
                }
              }).catch(e => {
                console.log(e);
              });
            break;

          case "movie":
            fetch(`https://api.themoviedb.org/3/movie/${Id}/recommendations?language=en-US&page=${(p + 1)}`, {
              method: 'GET',
              headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
                'content-type': 'application/json;charset=utf-8'
              }
            }).then((response) => response.json())
              .then((data) => {
                //console.log(data);
                for (var json of data.results) {
                  if (json.poster_path === null && json.backdrop_path === null) {
                  }
                  if (json.poster_path !== null) {
                    const newelement = document.createElement("li");
                    if (json.original_language === "en") {
                      newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
                      newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                      newelement.setAttribute("id", json.id);
                      newelement.setAttribute("class", "card");
                      newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
                      document.getElementById("listofrecommended").appendChild(newelement);
                    }
                  }
                }
              }).catch(e => {
                console.log(e);
              });
            break;
        }
      }
      break;

    case "suggested":
      var Id = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
      var type = document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1];
      if (Id && type) {
        switch (type) {
          case "tv":
            fetch(`https://api.themoviedb.org/3/tv/${Id}/similar?language=en-US&page=${(p + 1)}`, {
              method: 'GET',
              headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
                'content-type': 'application/json;charset=utf-8'
              }
            }).then((response) => response.json())
              .then((data) => {
                //console.log(data);
                for (var json of data.results) {
                  if (json.poster_path === null && json.backdrop_path === null) {
                  }
                  if (json.poster_path !== null) {
                    const newelement = document.createElement("li");
                    if (json.original_language === "en" && json.origin_country.includes("US" || "UK")) {
                      newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
                      newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                      newelement.setAttribute("id", json.id);
                      newelement.setAttribute("class", "card");
                      newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
                      document.getElementById("listofsuggested").appendChild(newelement);
                    }
                  }
                }
              }).catch(e => {
                console.log(e);
              });
            break;

          case "movie":
            fetch(`https://api.themoviedb.org/3/movie/${Id}/similar?language=en-US&page=${(p + 1)}`, {
              method: 'GET',
              headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
                'content-type': 'application/json;charset=utf-8'
              }
            }).then((response) => response.json())
              .then((data) => {
                //console.log(data);
                for (var json of data.results) {
                  if (json.poster_path === null && json.backdrop_path === null) {
                  }
                  if (json.poster_path !== null) {
                    const newelement = document.createElement("li");
                    if (json.original_language === "en") {
                      newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
                      newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                      newelement.setAttribute("id", json.id);
                      newelement.setAttribute("class", "card");
                      newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
                      document.getElementById("listofsuggested").appendChild(newelement);
                    }
                  }
                }
              }).catch(e => {
                console.log(e);
              });
            break;
        }
      }
      break;

    case 420:
      fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=${(p + 1)}&include_null_first_air_dates=false&with_keywords=302399%7C54169%7C10776%7C171235%7C241040%7C8224%7C258212%7C195631%7C243617%7C171401%7C195632%7C245911`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //console.log(data);
          for (var json of data.results) {
            if (json.poster_path === null && json.backdrop_path === null) {
            }
            if (json.poster_path !== null) {
              const newelement = document.createElement("li");
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
              document.getElementById("stonermovielist").appendChild(newelement);
            }
          }
        }).catch(e => {
          console.log(e);
        });
      break;
  }
}

async function initializeaddbypage(n, t_p) {
  for (var p = 0; t_p > p; p++) {
    if (p < 50) {
      //console.log(p);
      tvaddbyPage(n, p);
      await timer(100);
    }
    if (p >= 51) {
      break;
    }
    //console.log(p);
  }
  return;
}

async function initializeaddbypagestoner(n, t_p) {
  for (var p = 0; t_p > p; p++) {
    if (p < 100) {
      //console.log(p);
      tvaddbyPage(n, p);
      await timer(100);
    }
    if (p >= 101) {
      break;
    }
    //console.log(p);
  }
  return;
}

//Show all Button Handler!
async function tvshowAll(n, cb) {
  var total_pages = 1;
  //First we clear the already existing list! then we add to it!
  switch (n) {
    case 1:
      document.getElementById("IMDBToptvlist").innerHTML = "";
      fetch(`https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en&vote_count.gte=1000&vote_average.gte=8&watch_region=US&region=US`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          //const timer = ms => new Promise(res => setTimeout(res, ms));
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(1, total_pages);
          }
          //console.log(data);

        }).catch(e => {
          console.log(e);
        });
      break;
    case 2:
      document.getElementById("newesttvlist").innerHTML = "";
      fetch(`https://api.themoviedb.org/3/trending/tv/week?page=1`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(2, total_pages);
          }
          //console.log(data);
        }).catch(e => {
          console.log(e);
        });
      break;
    case 3:
      document.getElementById("populartvlist").innerHTML = "";
      fetch(`https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(3, total_pages);
          }
          //console.log(total_pages);
          //console.log(data);
        }).catch(e => {
          console.log(e);
        });
      break;
    case 20:
      document.getElementById("IMDBTopmovielist").innerHTML = "";
      fetch('https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en&vote_count.gte=10000&vote_average.gte=7&watch_region=US&region=US', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(20, total_pages);
          }
          //console.log(data);
        }).catch(e => {
          console.log(e);
        });
      break;
    case 21:
      fetch('https://api.themoviedb.org/3/movie/popular?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(21, total_pages);
          }
          //console.log(data);

        }).catch(e => {
          console.log(e);
        });
      break;
    case 22:
      document.getElementById("newestmovielist").innerHTML = "";
      fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&region=US%7CUK&sort_by=release_date.desc&page=1&primary_release_year=2023%7C2022&watch_region=US%7CUK&with_original_language=en&with_release_type=3&primary_release_date.lte=${TodaysDate.toISOString().split("T")[0]}`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
          'content-type': 'application/json;charset=utf-8'
        }
      }).then((response) => response.json())
        .then((data) => {
          total_pages = parseInt(data.total_pages);
          if (cb.checked) {
            initializeaddbypage(22, total_pages);
          }
          //console.log(data);
        }).catch(e => {
          console.log(e);
        });
      break;
  }
  //Here we clear a list if its not checked!
  //  console.log(cb.checked);
  if (!cb.checked) {
    switch (n) {
      case 1:
        fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en&vote_count.gte=1000&vote_average.gte=8&watch_region=US&region=US', {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {
              if (json.poster_path === null && json.backdrop_path === null) {
              }
              if (json.poster_path !== null) {
                const newelement = document.createElement("li");
                var bookmarksrc = "assets/bookmark.png";
                if (localStorage.getItem('bookmarks')) {
                  if (JSON.parse(localStorage.getItem('bookmarks')).tv.find(tree => parseInt(tree) === parseInt(json.id))) {
                    bookmarksrc = "assets/bookmarkfilled.png";
                    console.log('FOUND BOOOKMARK');
                  }
                }
                newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                            <h3 class="card-title">${json.name}</h3> \
                            <div class="card-content"> \
                              <h3>Description</h3> \
                              <p>${json.overview.substring(0, 200)}</p> \
                            </div> \
                            <div class="card-link-wrapper"> \
                              <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                            </div>`
                newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                newelement.setAttribute("id", json.id);
                newelement.setAttribute("class", "card");
                newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
                document.getElementById("IMDBToptvlist").appendChild(newelement);
              }
            }
          }).catch(e => {
            console.log(e);
          });
        break;
      case 2:
        fetch('https://api.themoviedb.org/3/trending/tv/week', {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {
              if (json.poster_path === null && json.backdrop_path === null) {
              }
              if (json.poster_path !== null) {
                const newelement = document.createElement("li");
                var bookmarksrc = "assets/bookmark.png";
                if (localStorage.getItem('bookmarks')) {
                  if (JSON.parse(localStorage.getItem('bookmarks')).tv.find(tree => parseInt(tree) === parseInt(json.id))) {
                    bookmarksrc = "assets/bookmarkfilled.png";
                    console.log('FOUND BOOOKMARK');
                  }
                }
                newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                            <h3 class="card-title">${json.name}</h3> \
                            <div class="card-content"> \
                              <h3>Description</h3> \
                              <p>${json.overview.substring(0, 200)}</p> \
                            </div> \
                            <div class="card-link-wrapper"> \
                              <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                            </div>`
                newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                newelement.setAttribute("id", json.id);
                newelement.setAttribute("class", "card");
                newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
                document.getElementById("newesttvlist").appendChild(newelement);
              }
            }
          }).catch(e => {
            console.log(e);
          });
        break;
      case 3:
        fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en', {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {
              const newelement = document.createElement("li");
              var bookmarksrc = "assets/bookmark.png";
              if (localStorage.getItem('bookmarks')) {
                if (JSON.parse(localStorage.getItem('bookmarks')).tv.find(tree => parseInt(tree) === parseInt(json.id))) {
                  bookmarksrc = "assets/bookmarkfilled.png";
                  console.log('FOUND BOOOKMARK');
                }
              }
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                            <h3 class="card-title">${json.name}</h3> \
                            <div class="card-content"> \
                              <h3>Description</h3> \
                              <p>${json.overview.substring(0, 200)}</p> \
                            </div> \
                            <div class="card-link-wrapper"> \
                              <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                            </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
              document.getElementById("populartvlist").appendChild(newelement);
            }
          }).catch(e => {
            console.log(e);
          });
        break;

      case 20:
        document.getElementById("IMDBTopmovielist").innerHTML = "";
        fetch('https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en&vote_count.gte=10000&vote_average.gte=7&watch_region=US&region=US', {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {

              if (json.poster_path === null && json.backdrop_path === null) {

              }
              if (json.poster_path !== null) {
                const newelement = document.createElement("li");
                var bookmarksrc = "assets/bookmark.png";
                if (localStorage.getItem('bookmarks')) {
                  if (JSON.parse(localStorage.getItem('bookmarks')).movies.find(tree => parseInt(tree) === parseInt(json.id))) {
                    bookmarksrc = "assets/bookmarkfilled.png";
                    console.log('FOUND BOOOKMARK');
                  }
                }
                newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
                newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                newelement.setAttribute("id", json.id);
                newelement.setAttribute("class", "card");
                newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
                document.getElementById("IMDBTopmovielist").appendChild(newelement);
              }
            }
          }).catch(e => {
            console.log(e);
          });
        break;
      case 21:
        document.getElementById("popularmovielist").innerHTML = "";
        fetch('https://api.themoviedb.org/3/movie/popular?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en', {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {
              //console.log(json.id);
              //console.log(json.poster_path);
              const newelement = document.createElement("li");
              var bookmarksrc = "assets/bookmark.png";
              if (localStorage.getItem('bookmarks')) {
                if (JSON.parse(localStorage.getItem('bookmarks')).movies.find(tree => parseInt(tree) === parseInt(json.id))) {
                  bookmarksrc = "assets/bookmarkfilled.png";
                  console.log('FOUND BOOOKMARK');
                }
              }
              newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
              newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
              newelement.setAttribute("id", json.id);
              newelement.setAttribute("class", "card");
              newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
              document.getElementById("popularmovielist").appendChild(newelement);
            }
          }).catch(e => {
            console.log(e);
          });
        break;
      case 22:
        document.getElementById("newestmovielist").innerHTML = "";
        fetch(`https://api.themoviedb.org/3/discover/movie?language=en-US&region=US%7CUK&sort_by=release_date.desc&page=1&primary_release_year=2023%7C2022&watch_region=US%7CUK&with_original_language=en&with_release_type=3&primary_release_date.lte=${TodaysDate.toISOString().split("T")[0]}`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
            'content-type': 'application/json;charset=utf-8'
          }
        }).then((response) => response.json())
          .then((data) => {
            //console.log(data);
            for (var json of data.results) {
              //console.log(json.id);
              //console.log(json.poster_path);
              //console.log(json.backdrop_path);
              if (json.poster_path === null && json.backdrop_path === null) { }
              if (json.poster_path !== null) {
                const newelement = document.createElement("li");
                var bookmarksrc = "assets/bookmark.png";
                if (localStorage.getItem('bookmarks')) {
                  if (JSON.parse(localStorage.getItem('bookmarks')).movies.find(tree => parseInt(tree) === parseInt(json.id))) {
                    bookmarksrc = "assets/bookmarkfilled.png";
                    console.log('FOUND BOOOKMARK');
                  }
                }
                newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
                newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
                newelement.setAttribute("id", json.id);
                //newelement.setAttribute("data-type", "movie");
                //newelement.setAttribute("data-name", json.title);
                //newelement.setAttribute("data-id", json.id);
                newelement.setAttribute("class", "card");
                newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
                document.getElementById("newestmovielist").appendChild(newelement);

                //document.getElementById(`${json.id}`).addEventListener("click", cardclicked(`${json.id}`));
                //console.log(JSON.stringify(json));
              }
            }
          }).catch(e => {
            console.log(e);
          });
        break;
    }
  }
}

async function minimize(n, cb) {
  if (cb.checked) {
    switch (n) {
      case 1:
        document.getElementById("MostPopularTV").setAttribute('style', 'display: none');
        break;
      case 2:
        document.getElementById("IMDBTopTV").setAttribute('style', 'display: none');
        break;
      case 3:
        document.getElementById("NewestTV").setAttribute('style', 'display: none');
        break;

      case 20:
        document.getElementById("MostPopularMovie").setAttribute('style', 'display: none');
        break;
      case 21:
        document.getElementById("IMDBTopMovie").setAttribute('style', 'display: none');
        break;
      case 22:
        document.getElementById("NewestMovie").setAttribute('style', 'display: none');
        break;
      case 23:
        document.getElementById("StonerMovie").setAttribute('style', 'display: none');
        break

      case 420:
        document.getElementById("StonerTV").setAttribute('style', 'display: none');
        break;
      case "bookmark":
        document.getElementById("bookmarkContainerAll").setAttribute('style', 'display: none; padding-bottom: 0rem;');
        document.getElementById("homeBookmarksDiv").setAttribute('style', 'padding-bottom: 0rem');
        break;
      case "watchHistory":
        document.getElementById("watchHistory").setAttribute('style', 'display: none; padding-bottom: 0rem;');
        document.getElementById("homeWatchDiv").setAttribute('style', 'padding-bottom: 0rem');
        break;
    }
  } else {
    switch (n) {
      case 1:
        document.getElementById("MostPopularTV").removeAttribute('style');
        break;
      case 2:
        document.getElementById("IMDBTopTV").removeAttribute('style');
        break;
      case 3:
        document.getElementById("NewestTV").removeAttribute('style');
        break;

      case 20:
        document.getElementById("MostPopularMovie").removeAttribute('style');
        break;
      case 21:
        document.getElementById("IMDBTopMovie").removeAttribute('style');
        break;
      case 22:
        document.getElementById("NewestMovie").removeAttribute('style');
        break;
      case 23:
        document.getElementById("StonerMovie").removeAttribute('style');
        break

      case 420:
        document.getElementById("StonerTV").removeAttribute('style');
        break;
      case "bookmark":
        document.getElementById("bookmarkContainerAll").removeAttribute('style');
        document.getElementById("homeBookmarksDiv").removeAttribute('style');
        document.getElementById("bookmarkMinimize").removeAttribute('checked');
        break;
      case "watchHistory":
        document.getElementById("watchHistory").removeAttribute('style');
        document.getElementById("homeWatchDiv").removeAttribute('style');
        document.getElementById("watchHistoryMinimize").removeAttribute('checked');
        break;
    }
  }
}

//Fetch the Highest Rated TV Shows & Movies! first 20!
async function movieinitexample() {
  fetch('https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en&vote_count.gte=10000&vote_average.gte=7&watch_region=US&region=US', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {

        if (json.poster_path === null && json.backdrop_path === null) {

        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
          document.getElementById("IMDBTopmovielist").appendChild(newelement);
        }
      }
    }).catch(e => {
      console.log(e);
    });

  fetch('https://api.themoviedb.org/3/discover/movie?language=en-US&region=US%7CUK&sort_by=release_date.desc&page=1&primary_release_year=2023%7C2022&watch_region=US%7CUK&with_original_language=en&with_release_type=3&primary_release_date.lte=2023-02-14', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      console.log(data);
      for (var json of data.results) {
        //console.log(json.id);
        //console.log(json.poster_path);
        //console.log(json.backdrop_path);
        if (json.poster_path === null && json.backdrop_path === null) {

        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          //newelement.setAttribute("data-type", "movie");
          //newelement.setAttribute("data-name", json.title);
          //newelement.setAttribute("data-id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
          document.getElementById("newestmovielist").appendChild(newelement);

          //document.getElementById(`${json.id}`).addEventListener("click", cardclicked(`${json.id}`));
          //console.log(JSON.stringify(json));
        }
      }
    }).catch(e => {
      console.log(e);
    });

  fetch('https://api.themoviedb.org/3/movie/popular?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {
        //console.log(json.id);
        //console.log(json.poster_path);
        const newelement = document.createElement("li");
        newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.title}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.release_date.split("-")[0]}</p> \
                </div>`
        newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
        newelement.setAttribute("id", json.id);
        newelement.setAttribute("class", "card");
        newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
        document.getElementById("popularmovielist").appendChild(newelement);
      }
    }).catch(e => {
      console.log(e);
    });

}

async function tvshowinitexample() {

  fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.asc&page=1&with_original_language=en&vote_count.gte=1000&vote_average.gte=8&watch_region=US&region=US', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {

        if (json.poster_path === null && json.backdrop_path === null) {

        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          document.getElementById("IMDBToptvlist").appendChild(newelement);
        }
      }
    }).catch(e => {
      console.log(e);
    });

  fetch('https://api.themoviedb.org/3/trending/tv/week', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {
        //console.log(json.id);
        //console.log(json.poster_path);
        //console.log(json.backdrop_path);
        if (json.poster_path === null && json.backdrop_path === null) {

        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          /*if (BookmarksJson){
          for (var js of BookmarksJson){
           // console.log(js.id);
           // console.log(json.id);
           if (parseInt(js.id) === parseInt(json.id)){
             console.log("Bookmark found!");
             bookmarksrc = "assets/bookmarkfilled.png";
           } 
          }
          }*/
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          newelement.setAttribute("data-type", "tv");
          newelement.setAttribute("data-name", json.name);
          newelement.setAttribute("data-id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          document.getElementById("newesttvlist").appendChild(newelement);

          //document.getElementById(`${json.id}`).addEventListener("click", cardclicked(`${json.id}`));
          //console.log(JSON.stringify(json));
        }
      }
    }).catch(e => {
      console.log(e);
    });
  fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=1&with_original_language=en', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {
        //console.log(json.id);
        //console.log(json.poster_path);
        const newelement = document.createElement("li");
        newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
        newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
        newelement.setAttribute("id", json.id);
        newelement.setAttribute("class", "card");
        newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
        document.getElementById("populartvlist").appendChild(newelement);
      }
    }).catch(e => {
      console.log(e);
    });
}
//Fetch The Stoner Movies and Tv Shows! all of them!
async function movieinitstonerexample() {

  fetch('https://api.themoviedb.org/3/discover/movie?language=en-US&sort_by=popularity.desc&page=1&include_null_first_air_dates=false&with_keywords=302399%7C54169%7C10776%7C171235%7C241040%7C8224%7C258212%7C195631%7C243617%7C171401%7C195632%7C245911', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      total_pages = parseInt(data.total_pages);
      initializeaddbypagestoner(420, total_pages);
    }).catch(e => {
      console.log(e);
    });
  //console.log(jsons);
  fetch('https://api.themoviedb.org/3/genre/movie/list', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      console.log('Movie Genres:', data);
    }).catch(e => {
      console.log(e);
    });
}

async function tvshowinitstonerexample() {
  fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=1&include_null_first_air_dates=false&with_keywords=302399%7C54169%7C10776%7C171235%7C241040%7C8224%7C258212%7C195631%7C243617%7C171401%7C195632%7C245911', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {
        if (json.poster_path === null && json.backdrop_path === null) {
        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv");`);
          document.getElementById("stonertvlist").appendChild(newelement);
        }
      }
    }).catch(e => {
      console.log(e);
    });


  fetch('https://api.themoviedb.org/3/discover/tv?language=en-US&sort_by=popularity.desc&page=2&include_null_first_air_dates=false&with_keywords=302399%7C54169%7C10776%7C171235%7C241040%7C8224%7C258212%7C195631%7C243617%7C171401%7C195632%7C245911', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
      for (var json of data.results) {
        //console.log(json.id);
        //console.log(json.poster_path);
        //console.log(json.backdrop_path);
        if (json.poster_path === null && json.backdrop_path === null) {

        }
        if (json.poster_path !== null) {
          const newelement = document.createElement("li");
          newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
                <h3 class="card-title">${json.name}</h3> \
                <div class="card-content"> \
                  <h3>Description</h3> \
                  <p>${json.overview.substring(0, 200)}</p> \
                </div> \
                <div class="card-link-wrapper"> \
                  <p class="card-link">${json.first_air_date.split("-")[0]}</p> \
                </div>`
          newelement.setAttribute("style", `background:url('https://image.tmdb.org/t/p/original${json.poster_path}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
          newelement.setAttribute("id", json.id);
          newelement.setAttribute("class", "card");
          newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.name}", "tv")`);
          document.getElementById("stonertvlist").appendChild(newelement);
        }
      }
    }).catch(e => {
      console.log(e);
    });
  fetch('https://api.themoviedb.org/3/genre/tv/list', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      //console.log(data);
    }).catch(e => {
      console.log(e);
    });

  /*  fetch('https://private-anon-a708459cf9-superembed.apiary-proxy.com/?type=tmdb&id=85723&season=1&episode=1&max_results=5').then((response) => response.json())
      .then((data) => {
        console.log(data);
      }).catch(e => {
        console.log(e);
      });*/
  /*fetch('https://api.themoviedb.org/3/tv/37854', {
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA',
      'content-type': 'application/json;charset=utf-8'
    }
  }).then((response) => response.json())
    .then((data) => {
      console.log(data);
    }).catch(e => {
      console.log(e);
    });*/
}