//alert('Wazzzzz APPPP');//This will be used later on for our eula Agreement process!
if (window.electronAPI.config.debug === false){
  console.log = function (){
  };
}
let Autohide = false;
const timer = ms => new Promise(res => setTimeout(res, ms));
var imdbId;
window.namee;
window.Id;
window.cookieValue;
window.typeG;
window.qualityG;
window.episodeG;
window.seasonG;
var objlist = [];

async function getInit() {
}

function convertTitle2foldername(b) {
  //console.log('Before:', s);
  var a = b.toString().toLowerCase();
  a = a.replaceAll(' ', '');
  a = a.replace(/[\W_]+/g, "");
  return a;
}

async function updateLogs(log) {
  const newelement = document.createElement("li");
  newelement.innerHTML = log;
  newelement.setAttribute('class', 'consoleLog');
  document.getElementById("consoleList").appendChild(newelement);
}

async function updateQuality(e) {
  window.qualityG = e;
  var i = 0;
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

window.alert = function(text) { console.log('tried to alert: ' + text); return true; };

//Register events in the onload to ensure elements are loaded!
window.onload = function() {
  window.eApi = window.electronAPI;
  window.Api = window.api;
  window.api.refresh_status();

  const counter = document.getElementById('counter');
  console.log('counter is', counter);
  console.log(counter);

  window.electronAPI.onUpdateCounter((value) => {
  const oldValue = Number(counter.innerText)
  const newValue = oldValue + value
  counter.innerText = newValue.toString()
  window.electronAPI.counterValue(newValue)
  });

  window.electronAPI.ipc.send('asynchronous-message', 'test');
  //await timer(5000);
  window.electronAPI.ipc.send('asynchronous-message', 'SecondaryTest');

  window.document.body.addEventListener('drop', (event) => {
    console.log('Event Fired Off Drop event!');
      if (window.document.getElementById('tabwatch').checked){
        console.log('watch tab is checked successfully passed!', event);
              event.preventDefault();
              //event.stopPropagation();
              var idcookie = window.Id;
              if (idcookie){
                  var namecookie = window.namee;
                  var typecookie = window.typeG;
                  var qualitycookie = window.qualityG;
                  if (typecookie === "tv"){
                      var seasoncookie = window.seasonG;
                      var episodecookie = window.episodeG;
                      if (event.dataTransfer.files.length <= window.electronAPI.config.maximumAmountOfFilesAndFoldersToSearchThroughOnDragAndDrops){
                      for (const f of event.dataTransfer.files) {
                          console.log('file:', f.path);
                          console.log('File Type:', f.type);
                          if (f.type==="video/mp4"){//Then we upload!
                              console.log('Files path is ', f.path);
                              var obj = {
                                  type: "addFile",
                                  fileType: "tv",
                                  fileQuality: qualitycookie,
                                  name: namecookie,
                                  id: parseInt(idcookie),
                                  season: parseInt(seasoncookie),
                                  episode: parseInt(episodecookie),
                                  path: f.path
                              }
                              console.log(obj);
                              window.electronAPI.onAddFile(obj);
                          }
                      // Using the path attribute to get absolute file path
                      console.log('File Path of dragged files: ', f.path)
                      //console.log('File Type:', f.type.toString());
                      }
                      //Finished For Loop lets send the post obj!
                      console.log('Finished For Loop!');
                    }else{
                      //This exceeds the allowed amount of files to loop through on drag and drop! aka to many files!
                      return;
                    }
                  }else{//Type Movie Just upload check Post To Local express on 3030 with the id, type, name
                    if (event.dataTransfer.files.length <= window.electronAPI.config.maximumAmountOfFilesAndFoldersToSearchThroughOnDragAndDrops){
                      for (const f of event.dataTransfer.files) {
                          if (f.type==="video/mp4"){//Then we upload!
                              
                              var obj = {
                                  type: "addFile",
                                  fileType: "movie",
                                  fileQuality: qualitycookie,
                                  name: namecookie,
                                  id: parseInt(idcookie),
                                  path: f.path
                              }
                              console.log(obj);
                              window.electronAPI.onAddFile(obj);
                          }
                      console.log('File Path of dragged files: ', f.path)
                      }//Finished For Loop
                      console.log('Finished For Loop!');
                    }else{
                      //This exceeds the allowed amount of files to loop through on drag and drop! aka to many files!
                      return;
                    }
                  }
              }else{return;}
      }else{
          event.preventDefault();
          return;
      }
  });

  window.document.body.addEventListener('dragover', (e) => {
      if (document.getElementById('tabwatch').checked){
      e.preventDefault();
      //e.stopPropagation();
      }else{
      e.preventDefault;
      //e.stopPropagation();
      return;
      }
    });
   
  window.document.addEventListener('dragenter', (event) => {
      console.log('File is in the Drop Space');
  });
   
  window.document.addEventListener('dragleave', (event) => {
      console.log('File has left the Drop Space');
  });

  document.getElementById('logobutton').addEventListener('click', test);
  document.getElementById('searchbox').addEventListener('change', updateSearchContainerbySearch);
  window.qualityG = 2;
  if (window.Id !== undefined || null) {
    if (window.typeG !== undefined || null) {
      if (window.typeG === 'movie') {
        updateMovieContainer();
        updateRecommendedAndSimilar();
      }
      if (window.typeG === 'tv') {
        console.log("TV detected!");
        if ((window.episodeG && window.seasonG) !== (null || undefined)) {
          console.log('Loaded');
          updateTvContainer();
          updateRecommendedAndSimilar();
        }
      }
    }
  }

  movieinitexample();
  movieinitstonerexample();
  tvshowinitstonerexample();
  tvshowinitexample();
  getInit();///
}
//updateTvContainer();



//Deprecated!
async function getDir() {
  const dirHandle = await window.showDirectoryPicker();
  console.log(dirHandle);
  // run code for dirHandle
}

function updatewatchIdAndEtc(id, type, name) {
  window.Id = id;
  window.namee = name;
  window.typeG = type;
}

function updatewatchType(type) {
  window.typeG = type;
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
  const name = window.namee
  if (window.typeG === "movie") {
    if (window.Id) {
      try {
        document.getElementById("watchTvPlayer").removeAttribute('src');
        document.getElementById("watchMoviePlayer").removeAttribute('style');
        document.getElementById("seasoncontainer").setAttribute('style', 'display: none;');
        document.getElementById("episodecontainer").setAttribute('style', 'display: none;');
        document.getElementById("watchTvPlayer").setAttribute('style', 'display: none;');
      } catch (e) { }
      id = window.Id;
    }
    document.getElementById("detailType").innerHTML = "Movie";
    document.getElementById("detailName").innerHTML = "Title: " + window.namee;
  }
}

function updateTvContainer() {
  //bookmarkInit();
  var id; //Here we will load it from the document cookies
  if (window.typeG === 'tv' && window.Id !== null || undefined) {
    const cookieValue = window.Id;
    const name = window.namee;
    document.getElementById("detailType").innerHTML = "Tv Show";
    document.getElementById("detailName").innerHTML = "Title: " + name;
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
          console.log(seasonG);
          if (parseInt(seasonG) === parseInt(json.season_number)) {
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
      getepisodes(seasonG);
    }).catch(e => {
      console.log(e);
    });

  }
}


function getepisodes(n) {
  window.episodeG = 1;

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
  if (window.episodeG) {
    var episodecookie = window.episodeG;
    for (var i = 0; result.episode_count > i; i++) {
      const newelement = document.createElement("div");
      newelement.innerHTML = `Episode ${(i + 1)}`;
      newelement.setAttribute("class", "card2");
      newelement.setAttribute('name', 'episode');
      newelement.setAttribute("onclick", `updateTvPlayer(${n}, "${(i + 1)}");`);
      if (parseInt(episodecookie) === parseInt(i + 1)) { newelement.setAttribute('data-tag', 'checked'); }
      document.getElementById("listofepisodes").appendChild(newelement);
    }
    //updateTvPlayer(n, episodecookie); //**
    /**
     * 
     *we will use this later on for a drag and drop file moving system! 
     * 
     */
    //
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
  if (parseInt(season) !== parseInt(window.seasonG)){
  getepisodes(season);
  }
  window.seasonG = parseInt(season);
  window.episodeG = parseInt(episode);
  var i = 1
  for (var v of document.getElementsByName("episode")) {
    if (v.getAttribute('data-tag') === 'checked') {
      console.log('Found!');
      v.removeAttribute('data-tag');
    }
    if (i === parseInt(episode)) {
      console.log('YESS!')
      v.setAttribute('data-tag', 'checked');
     // console.log(i);
      //console.log(v);
    }
    //console.log(i);
    //console.log(v);
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
  console.log("Id:", id, "Name:", name, "Type:", type, "Was Clicked");
  const cookiequality = 2;
  updateQuality(cookiequality);
  if (parseInt(window.cookieValue) === id) {
    console.log('Matches!');
    document.getElementById("tababout").checked = false;
    document.getElementById("tabhome").checked = false;
    document.getElementById("tabchannels").checked = false;
    document.getElementById("tabmovies").checked = false;
    document.getElementById("tabtvshows").checked = false;
    document.getElementById("tabsearch").checked = false;
    document.getElementById("tabwatch").checked = true;
  } else {
    window.cookieValue = id;
    console.log('Else');
    updatewatchIdAndEtc(id, type, name);

    //Here Right above we will add in the updateRecommendedAndSimilar
    //updatewatchName(name);
    //updatewatchType(type);
    //bookmarkInit();
    if (type === "tv") {
      document.getElementById("seasoncontainer").removeAttribute('style');
      document.getElementById("episodecontainer").removeAttribute('style');
      window.episodeG = 1;
      window.seasonG = 1;
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
          updateTvContainer();
          updateRecommendedAndSimilar();
        }).catch(e => {
          console.log(e);
        });
    } else {
      console.log('The Card that was clicked is not a Tv Show so we will start movie container!');
      updateMovieContainer();
      updateRecommendedAndSimilar();
      document.getElementById("seasoncontainer").setAttribute('style', 'display: none;');
      document.getElementById("episodecontainer").setAttribute('style', 'display: none;');
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