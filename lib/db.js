const path = require('path');
const Database = require(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'node_modules','better-sqlite3'));
const os = require('os');
// Get the user's home directory
const homeDirectory = os.homedir();
// Define the destination directory for your files
const destinationDirectory = path.join(homeDirectory, 'DBlockbuster');
const destinationDBPath = path.join(destinationDirectory, 'database.sqlite3');
const DB = new Database(destinationDBPath);
const DBr = new Database(destinationDBPath, { readonly: true });

function getDB(){
  return new Database(destinationDBPath);
}

function getDBr(){
  return new Database(destinationDBPath, { readonly: true });
}

function checkProvidable(Id, season, episode){
  if (season && episode){//Add a check to ensure to check for tv types 
    return !!DBr.prepare('SELECT * FROM "Providable" WHERE Id=? AND Season=? AND Episode=?').get(Id, season, episode);// Returns true if result is truthy (row found), false otherwise
  }else{//If season and episode are undefined or null then its movie just go off id!
  return !!DBr.prepare('SELECT * FROM "Providable" WHERE Id=?').get(Id);// Returns true if result is truthy (row found), false otherwise
  }
}

function getProvidableFileAmounts(Id){
  return DBr.prepare('SELECT AmountOfFiles FROM "Providables" WHERE Id=?').get(Id);
}

async function updateMovieFileIndex(i, filePath, id) {
  const fresult = DB.prepare('UPDATE "Movies" SET "FileIndex"=? WHERE FilePath=? AND Id=?').run(i, filePath, id);
  console.log(fresult);
}

async function updateTVShowFileIndex(i, filePath, id) {
  const fresult = DB.prepare('UPDATE "TVShows" SET "FileIndex"=? WHERE FilePath=? AND Id=?').run(i, filePath, id);
  console.log(fresult);
}

module.exports = { DB, DBr, getDB, getDBr, checkProvidable, getProvidableFileAmounts, updateMovieFileIndex, updateTVShowFileIndex };