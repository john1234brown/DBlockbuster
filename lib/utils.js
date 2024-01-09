const { ipcRenderer } = require('electron/renderer');
const { DBr, DB, getDBr, checkProvidable } = require('./db.js');

function isElementEmpty(element) {
  return element.innerHTML.trim() === '';
}

function toggleVisibility() {
  const administrationContainer = document.getElementById('administrationContainer2');
  if (administrationContainer.style.display === 'none') {
    administrationContainer.style.display = '';
    if(window.manageType === 'tv'){
    const tvselector = document.getElementById('administrationContainerTV');
    tvselector.style.display = '';//This will ensure the tv container is visible!
    }
  } else {
    administrationContainer.style.display = 'none';
    if (window.manageType === 'tv'){
      const tvselector = document.getElementById('administrationContainerTV');
      tvselector.style.display = 'none';//This will ensure the tv container is not visible!
    }
  }
}


function removePath(path, t, id, index){
  console.log(t);
  const promises = [];
  switch(window.manageType){
    case "movie":
      const a = DBr.prepare('SELECT * FROM "Providable" WHERE Id=?').get(id);
      const index1 = a.AmountOfFiles-1;
      const presult = DB.prepare('UPDATE "Providable" SET "AmountOfFiles"=? WHERE Id=?').run(index1, id);
      console.log(presult);
      const movieresults = DB.prepare('DELETE FROM "Movies" WHERE FilePath=? AND Id=? AND FileIndex=?').run(path,id,index);
      console.log(movieresults);
      const mresult = DB.prepare('SELECT _rowid_,* FROM "main"."Movies" WHERE Id=?').all(id);
      console.log(mresult);
      try{
      mresult.forEach((obj, i) => {
        console.log("The Value of it is:",i);
        console.log("The Obj is:", obj);
        console.log("The _rowid_ is:", obj.rowid);
        const fresult = DB.prepare('UPDATE "Movies" SET "FileIndex"=? WHERE _rowid_=?').run(i+1, obj.rowid);
        promises.push(fresult);
        console.log(fresult);
      });
      Promise.all(promises).then(() => {
        console.log('All async operations completed.');
        refreshManageList();
      }).catch((error) => {
        console.error('Error:', error);
      });
    }catch(e){console.log(e);}
    break;
    case "tv":
      const atv = DBr.prepare('SELECT * FROM "Providable" WHERE Id=?').get(id);
      const index1tv = atv.AmountOfFiles-1;
      const ptvresult = DB.prepare('UPDATE "Providable" SET "AmountOfFiles"=? WHERE Id=?').run(index1tv, id);
      console.log(ptvresult);
      const tvresults = DB.prepare('DELETE FROM "TVShows" WHERE FilePath=? AND Id=? AND FileIndex=? AND Season=? AND Episode=?').run(path, id, index, window.manageSeason,window.manageEpisode);
      console.log(tvresults);
      const tvresult = DB.prepare('SELECT _rowid_,* FROM "main"."TVShows" WHERE Id=? AND Season=? And Episode=?').all(id,window.manageSeason,window.manageEpisode);
      console.log(tvresult);
      tvresult.forEach((obj, i) => {
        console.log("The Value of it is:",i);
        console.log("The Obj is:", obj);
        console.log("The _rowid_ is:", obj.rowid);
        const fresult = DB.prepare('UPDATE "TVShows" SET "FileIndex"=? WHERE _rowid_=?').run(i+1, obj.rowid);
        console.log(fresult);
        promises.push(fresult);
      });
      Promise.all(promises).then(() => {
        console.log('All async operations completed.');
        refreshManageList();
      }).catch((error) => {
        console.error('Error:', error);
      });
    break;
  }
  const l = t.parentElement;
  l.parentElement.removeChild(l);
  guiDoubleCheck(false);
}

function refreshManageList(){
  const id = window.manageId;
  const type = window.manageType;
  if (id !== (null||undefined)&&type !== (null||undefined)){
  const listElement = document.getElementById('manageList');
  document.getElementById('administrationContainer2').style.display = '';
  listElement.innerHTML = '';
  switch (type){
    case "movie":
      const movieresults = getDBr().prepare('SELECT * FROM "Movies" WHERE Id=?').all(id);
      if (movieresults.length){
        console.log(movieresults);
        document.getElementById('administrationContainer2').style.display = '';
        listElement.innerHTML = '';
        for (const obj of movieresults){
          const element = document.createElement("li");
          element.innerText = `FilePath:${obj.FilePath.toString().replace(/^"(.*)"$/, '$1')} FileIndex:${obj.FileIndex}`
          const button = document.createElement('button');
          button.innerText="Remove"
          button.onclick=function(){
            removePath(obj.FilePath, this, obj.Id, obj.FileIndex);
          };
          element.appendChild(button);
          listElement.append(element);
          console.log(obj);
        }
      }else{
        document.getElementById('administrationContainer2').style.display = 'none';
      }
    break;
    case "tv":
      const tvresults = getDBr().prepare('SELECT * FROM "TVShows" WHERE Id=? AND Season=? AND Episode=?').all(id,window.manageSeason,window.manageEpisode);
      if (tvresults.length){
        console.log(tvresults);
        document.getElementById('administrationContainer2').style.display = '';
        listElement.innerHTML = '';
        for (const obj of tvresults){
          const element = document.createElement("li");
          element.innerText = `FilePath:${obj.FilePath.toString().replace(/^"(.*)"$/, '$1')} FileIndex:${obj.FileIndex}`
          const button = document.createElement('button');
          button.innerText="Remove"
          button.onclick=function(){
            removePath(obj.FilePath, this, obj.Id, obj.FileIndex);
          };
          element.appendChild(button);
          listElement.append(element);
          console.log(obj);
        }
      }else{
        document.getElementById('administrationContainer2').style.display = 'none';
      }
    break;
  }
  }
}

function guiDoubleCheck(b, obj){
  const listElement = document.getElementById('manageList');
  switch (b) {
    case true:
      if (isElementEmpty(listElement)){
        if (window.manageType === 'movie'){
        console.log('Is empty!');
        toggleVisibility();
        try{
        const p = obj.parentElement;
        p.removeChild(obj);
        const p2 = document.getElementById('status-broadcast-'+window.manageId).parentElement;
        p2.removeChild(document.getElementById('status-broadcast-'+window.manageId));
        const p3 = document.getElementById('status-providable-'+window.manageId).parentElement;
        p3.removeChild(document.getElementById('status-providable-'+window.manageId));
        }catch(e){console.log(e);}
        ipcRenderer.send('asynchronous-message', 'error:manageNoFilePathErrors');
        //Now we should remove it completely from the providing table DB as well using the id
        const result = DB.prepare('DELETE FROM "Providable" WHERE Id=?').run(window.manageId);
        console.log('Removed From DB,', result);
        }else{
          //We need to remove that specific season and episode from the providable db!!!
          const result = DB.prepare('DELETE FROM "Providable" WHERE Id=? AND Season=? AND Episode=?').run(window.manageId, window.manageSeason, window.manageEpisode);
          console.log('Removed From DB,', result);
          const presult = getDBr().prepare('SELECT * FROM Providable WHERE Id=?').get(window.manageId);
          if (presult){
            //do nothing
          }else{
            try{
              const p = document.getElementById('manage-'+window.manageId).parentElement;
              p.removeChild(document.getElementById('manage-'+window.manageId));
              const p2 = document.getElementById('status-broadcast-'+window.manageId).parentElement;
              p2.removeChild(document.getElementById('status-broadcast-'+window.manageId));
              const p3 = document.getElementById('status-providable-'+window.manageId).parentElement;
              p3.removeChild(document.getElementById('status-providable-'+window.manageId));
              }catch(e){console.log(e);}
              ipcRenderer.send('asynchronous-message', 'error:manageNoFilePathErrors');
          }
        }
      }else{
        console.log('Its not empty!')
      }
    break;
    case false:
      if (isElementEmpty(listElement)){
        if (window.manageType === 'movie'){
        console.log('Is empty!');
        toggleVisibility();
        try{
        const p = document.getElementById('manage-'+window.manageId).parentElement;
        p.removeChild(document.getElementById('manage-'+window.manageId));
        const p2 = document.getElementById('status-broadcast-'+window.manageId).parentElement;
        p2.removeChild(document.getElementById('status-broadcast-'+window.manageId));
        const p3 = document.getElementById('status-providable-'+window.manageId).parentElement;
        p3.removeChild(document.getElementById('status-providable-'+window.manageId));
        }catch(e){console.log(e);}
        ipcRenderer.send('asynchronous-message', 'error:manageNoFilePathErrors');
          //Now we should remove it completely from the providing table DB as well using the id
          const result = DB.prepare('DELETE FROM "Providable" WHERE Id=?').run(window.manageId);
          console.log('Removed From DB,', result);
      }else{
        //We need to remove that specific season and episode from the providable db!!!
        const result = DB.prepare('DELETE FROM "Providable" WHERE Id=? AND Season=? AND Episode=?').run(window.manageId, window.manageSeason, window.manageEpisode);
        console.log('Removed From DB,', result);
        const presult = getDBr().prepare('SELECT * FROM Providable WHERE Id=?').get(window.manageId);
        if (presult){
          //do nothing
        }else{
          try{
            const p = document.getElementById('manage-'+window.manageId).parentElement;
            p.removeChild(document.getElementById('manage-'+window.manageId));
            const p2 = document.getElementById('status-broadcast-'+window.manageId).parentElement;
            p2.removeChild(document.getElementById('status-broadcast-'+window.manageId));
            const p3 = document.getElementById('status-providable-'+window.manageId).parentElement;
            p3.removeChild(document.getElementById('status-providable-'+window.manageId));
            }catch(e){console.log(e);}
            ipcRenderer.send('asynchronous-message', 'error:manageNoFilePathErrors');
        }
      }
      }else{
        console.log('Its not empty!')
      }
    break;
  }
}

module.exports = { isElementEmpty, toggleVisibility, removePath, guiDoubleCheck, refreshManageList }