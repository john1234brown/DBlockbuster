const { ipcRenderer } = require('electron/renderer');
const { DBr, DB, getDBr } = require('./db.js');

function populateStatus(){
  function populateBroadcasts(){
    try {
    const tvResults = getDBr().prepare('SELECT * FROM "Broadcasters" WHERE Type=?').all("tv");
    document.getElementById("bookmarklist").innerHTML = '';
    if (tvResults.length > 0){
      console.log(tvResults);
      for (const obj of tvResults){
        const tvObjResult = getDBr().prepare('SELECT * FROM "Providable" WHERE Id=?').get(obj.FileId);
        const newelement = document.createElement("li");
        newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
              <h3 class="card-title">${tvObjResult.Name}</h3> \
              <div class="card-content"> \
                <h3>Description</h3> \
                <p>${String(tvObjResult.Info).substring(0, 200)}</p> \
              </div> \
              <div class="card-link-wrapper"> \
                <p class="card-link">${tvObjResult.Date}</p> \
              </div>`
        newelement.setAttribute("style", `background:url('${tvObjResult.BackgroundImageUrl}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
        newelement.setAttribute("id", "status-broadcast-"+tvObjResult.Id);
        newelement.setAttribute("class", "card");
        //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
        document.getElementById("bookmarklist").appendChild(newelement);
      }
    }
    const movieResults = getDBr().prepare('SELECT * FROM "Broadcasters" WHERE Type=?').all("movie");
    document.getElementById("moviebookmarklist").innerHTML = '';
    if (movieResults.length > 0){
      //console.log(movieResults);
      for (const obj of movieResults){
      const ObjResult = getDBr().prepare('SELECT * FROM "Providable" WHERE Id=?').get(obj.FileId);
      console.log(ObjResult);
      console.log('BackgroundImageUrl:', ObjResult.BackgroundImageUrl);
      const newelement = document.createElement("li");
        newelement.innerHTML = `<figure class="card__thumbnail"></figure> \
              <h3 class="card-title">${ObjResult.Name}</h3> \
              <div class="card-content"> \
                <h3>Description</h3> \
                <p>${String(ObjResult.Info).substring(0, 200)}</p> \
              </div> \
              <div class="card-link-wrapper"> \
                <p class="card-link">${ObjResult.Date}</p> \
              </div>`
        newelement.setAttribute("style", `background:url('${ObjResult.BackgroundImageUrl}'); background-repeat: no-repeat; background-size: cover; background-position: center;`);
        newelement.setAttribute("id", "status-broadcast-"+ObjResult.Id);
        newelement.setAttribute("class", "card");
        //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
        document.getElementById("moviebookmarklist").appendChild(newelement);
      }
    }
  }catch(e){
    console.log(e);
  }
  }

  function populateProvidable(){
    try {
      const tvResults = getDBr().prepare('SELECT MAX(Id) AS Id,Type,MAX(Name) AS Name,MAX(Info) AS Info,MAX(Date) AS Date,MAX(BackgroundImageUrl) AS BackgroundImageUrl,MAX(Season) AS Season,MAX(Episode) AS Episode,MAX(AmountOfFiles) AS AmountOfFiles FROM Providable WHERE Type = ? GROUP BY Type;').all("tv");
      document.getElementById("bookmarklist2").innerHTML = '';
      if (tvResults.length > 0){
        console.log(tvResults);
        for (const obj of tvResults){
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
          newelement.setAttribute("id", "status-providable-"+obj.Id);
          newelement.setAttribute("class", "card");
          //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
          document.getElementById("bookmarklist2").appendChild(newelement);
        }
      }
      const movieResults = getDBr().prepare('SELECT * FROM "Providable" WHERE Type=?').all("movie");
      document.getElementById("moviebookmarklist2").innerHTML = '';
      if (movieResults.length > 0){
        console.log(movieResults);
        for (const obj of movieResults){
        console.log('BackgroundImageUrl:', obj.BackgroundImageUrl);
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
          newelement.setAttribute("id", "status-providable-"+obj.Id);
          newelement.setAttribute("class", "card");
          //newelement.setAttribute("onclick", `cardclicked(${json.id}, "${json.title}", "movie");`);
          document.getElementById("moviebookmarklist2").appendChild(newelement);
        }
      }
    }catch(e){
      console.log(e);
    }
  }

  populateBroadcasts();
  populateProvidable();
}

module.exports = { populateStatus }