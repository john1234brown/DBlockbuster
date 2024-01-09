
const { startStopP2P } = require('./index2.js');
const fs = require('node:fs');
const os = require('os');
const electron = require('electron');
const axios = require('axios');
const { app, BrowserView, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('node:path');
const Tray = electron.Tray;
const iconPath = path.join(path.dirname(process.execPath), 'gui/assets/logos/TabLogo.png');
const logoIconPath = path.join(path.dirname(process.execPath), 'gui/assets/logos/Logo.png');
const { DB, DBr, checkProvidable } = require(path.join(path.dirname(process.execPath), 'lib/db.js'));
const Menu = electron.Menu;
var tray = null;
var mainWindow;
var prefix = "/"
var configJSON;
const timer = ms => new Promise(res => setTimeout(res, ms));
if (process.platform === "win32") {
  prefix = "\\";
}
// Your bundled application directory
const appDirectory = path.join(path.dirname(process.execPath));

// Function to copy files to a destination directory
function copyFile(source, destination) {
    fs.copyFileSync(source, destination);
}

// Function to set up the required files
function setupFiles() {
  // Get the user's home directory
  const homeDirectory = os.homedir();

  // Define the destination directory for your files
  const destinationDirectory = path.join(homeDirectory, 'DBlockbuster');

  // Ensure the destination directory exists
  if (!fs.existsSync(destinationDirectory)) {
      fs.mkdirSync(destinationDirectory);
  }

  // Define paths for config.json and database.sqlite3 in the source and destination
  const sourceConfigPath = path.join(appDirectory, 'config.json');
  const destinationConfigPath = path.join(destinationDirectory, 'config.json');
  const sourceEulaPath = path.join(appDirectory, 'eula.json');
  const destinationEulaPath = path.join(destinationDirectory, 'eula.json');
  const sourceDBPath = path.join(appDirectory, 'database.sqlite3');
  const destinationDBPath = path.join(destinationDirectory, 'database.sqlite3');

  // Check if config.json already exists in the destination directory
  if (!fs.existsSync(destinationEulaPath)) {
    // Copy config.json to the destination directory
    copyFile(sourceEulaPath, destinationEulaPath);
    console.log('eula.json copied successfully!');
} else {
    console.log('eula.json already exists in the destination directory.');
}

  // Check if config.json already exists in the destination directory
  if (!fs.existsSync(destinationConfigPath)) {
      // Copy config.json to the destination directory
      copyFile(sourceConfigPath, destinationConfigPath);
      console.log('config.json copied successfully!');
  } else {
      console.log('config.json already exists in the destination directory.');
  }

  // Check if database.sqlite3 already exists in the destination directory
  if (!fs.existsSync(destinationDBPath)) {
      // Copy SQLite database files to the destination directory
      copyFile(sourceDBPath, destinationDBPath);
      console.log('database.sqlite3 copied successfully!');
  } else {
      console.log('database.sqlite3 already exists in the destination directory.');
  }

  // Read and parse the config.json file
  const configContent = fs.readFileSync(destinationConfigPath, 'utf-8');
  configJSON = JSON.parse(configContent);
  console.log('Files and globalVariable set up successfully!');
}
setupFiles();


// Helper function to copy a file
function copyFile(source, destination) {
  fs.copyFileSync(source, destination);
}


function openGUI() {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: iconPath,
      useContentSize: false,
      enableLargerThanScreen: false,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        preload: path.join(path.dirname(process.execPath), 'preload.js')
      }
    })

    //const view = new BrowserView()
    //win.setBrowserView(view)
    //view.setBounds({ x: 0, y: 0, width: 1200, height: 800 });
    //view.webContents.loadURL('http://localhost:3000');
    // Load the index.html of the app.
    win.loadFile(path.join(path.dirname(process.execPath), 'gui','index.html'));

    // Open the DevTools.
    //win.webContents.openDevTools()
  }
}

function addFile(obj){
  console.log(obj);
}

function increment(){
  mainWindow.webContents.send('update-counter', 1);
}

function decrement(){
  mainWindow.webContents.send('update-counter', -1);
}

function quitProcess(){
  process.exit(0);
}

function showErrorBox(title, content) {
  try {
  // Handle the error as needed (e.g., log it)
  console.error('Custom Error Handling:', title, content);

  // Show a custom notification box
  dialog.showErrorBox(title, content);
  }catch(e){
    console.log(e);
  }
}

function initializeMainGUI() {
  console.log('Initializing!');
  function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: iconPath,
      useContentSize: false,
      enableLargerThanScreen: false,
      sandbox: false,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        preload: path.join(path.dirname(process.execPath), 'preload.js')
      }
    });
    mainWindow = win;
    win.loadFile(path.join(path.dirname(process.execPath), 'gui','index.html'));
    win.show();

    // Open the DevTools.
    win.webContents.openDevTools()
    // Handle unhandled exceptions
    process.on('uncaughtException', (error) => {
    // Log the error type and message
    console.error(`Unhandled Exception [${error.name}]:`, error.message);

    // Show a custom notification box based on error message content
    if (error.message.includes('Unexpected server response: 521')) {
      showErrorBox('Connection Error', 'We are sorry. Please check your connection or the gateway server is currently down. We apologize for this inconvenience.');
    } else {
      showErrorBox('Custom Error', `An error occurred [${error.name}]:\n\n${error.message}`);
    }
    });
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // This method is equivalent to 'app.on('ready', function())'
  app.whenReady().then(() => {
    ipcMain.on('counter-value', (_event, value) => {
      console.log(value) // will print value to Node console
    })

    ipcMain.on('update:addFile', (_event, value) =>{
      console.log('Recievied:', value);
      let options;
      switch (value.fileType){
        case 'tv':
          console.log('Its a tv show');
          options = {
            method: 'GET',
            url: 'https://api.themoviedb.org/3/tv/'+value.id+'?language=en-US',
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA'
            }
          };
        break;
        case 'movie':
          console.log('Its a movie');
          options = {
            method: 'GET',
            url: 'https://api.themoviedb.org/3/movie/'+value.id+'?language=en-US',
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYTljY2JkNDViNmY1MTJjN2E0YWZmMzA5MjIxZDgyOCIsInN1YiI6IjYzZDBhM2M3NjZhZTRkMDA5ZTlkZjY4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.N5j1M7YnwmMTjIWMdYQbdh5suW2hCDucbqlDgMku_UA'
            }
          };
        break
        default:
        break;
      }
      axios.request(options).then(function (response) {
        //console.log(response.data);
        const json = response.data;
        //console.log('JSON:', json);
        var poster_path = "https://image.tmdb.org/t/p/original/";
        var description;
        var date;
        switch (value.fileType){
          case 'tv':
            poster_path = poster_path+json.poster_path;
            description = json.overview;
            date = json.first_air_date;
            //Prepare to add to db now with all the proper variables!
            try {
            if (checkProvidable(value.id, value.season, value.episode)){
              console.log('Is already Providable!');
              //We just need to add this to the tv table thats it!
              const a = DBr.prepare('SELECT * FROM "Providable" WHERE Id=? AND Season=? AND Episode=?').get(value.id, value.season, value.episode);
              const index = 1+a.AmountOfFiles;
              const presult = DB.prepare('UPDATE "Providable" SET "AmountOfFiles"=? WHERE Id=? AND Season=? AND Episode=?').run(index, value.id, value.season, value.episode);
              console.log(presult);
              const result = DB.prepare('INSERT INTO "TVShows"("Id","Season","Episode","FileType","FilePath","FileIndex") VALUES (?,?,?,?,?,?)').run(value.id, value.season, value.episode, value.fileType, value.path,index);
              console.log(result);
              _event.reply('response:addFile', {type: 'success'});
              const customAlert = new Notification();
              customAlert.title = 'Success';
              customAlert.body = 'Successfully added the file '+value.path+' to the db to TVShows Table for '+json.name;
              customAlert.show();
            }else{
              console.log('Its not in proviable lets add it to it!');
              //We need to initialize it to the providable table//Also need to add the initial file value
              const presult = DB.prepare('INSERT INTO "Providable"("Id","Type","Name","Info","Date","BackgroundImageUrl","Season","Episode","AmountOfFiles") VALUES (?,?,?,?,?,?,?,?,?)').run(value.id, value.fileType, json.name, description, date, poster_path,value.season,value.episode,1);
              console.log(presult);
              const result = DB.prepare('INSERT INTO "TVShows"("Id","Season","Episode","FileType","FilePath","FileIndex") VALUES (?,?,?,?,?,?)').run(value.id, value.season, value.episode, value.fileType, value.path,1);
              console.log(result);
              _event.reply('response:addFile', {type: 'success'});
              const customAlert = new Notification();
              customAlert.title = 'Success';
              customAlert.body = 'Successfully added the file '+value.path+' to the db to Providable Table for '+json.name;
              customAlert.show();
              const customAlert2 = new Notification();
              customAlert2.title = 'Success';
              customAlert2.body = 'Successfully added the file '+value.path+' to the db to TVShows Table for '+json.name;
              customAlert2.show();
            }

          }catch(e){
            console.log(e);
            _event.reply('response:addFile', {type: 'failed', reason: 'db'});
            const customAlert = new Notification();
            customAlert.title = 'Error SQLite Database';
            customAlert.body = 'Sorry the SQLite Database seems to have thrown a to busy error please try again in a little while!';
            customAlert.show();
            
          }
          break;
          case 'movie':
            poster_path = poster_path+json.poster_path;
            description = json.overview;
            date = json.release_date;
            //Prepare to add to db now with all the proper variables!
            try {
            if (checkProvidable(value.id)){
              //We just need to add this to the movie table thats it!//We Need to increment the amountofFiles! and set this fileindex to the new value!
              const a = DBr.prepare('SELECT * FROM "Providable" WHERE Id=?').get(value.id);
              const index = 1+a.AmountOfFiles;
              const presult = DB.prepare('UPDATE "Providable" SET "AmountOfFiles"=? WHERE Id=?').run(index, value.id);
              console.log(presult);
              const result = DB.prepare('INSERT INTO "Movies"("Id","FileType","FilePath","FileIndex") VALUES (?,?,?,?)').run(value.id, value.fileType, value.path, index);
              console.log(result);
              _event.reply('response:addFile', {type: 'success'});
              const customAlert = new Notification();
              customAlert.title = 'Success';
              customAlert.body = 'Successfully added the file '+value.path+' to the db to provide for '+json.title;
              customAlert.show();
            }else{
              //We need to initialize it to the providable table//Also need to add the initial file value
              const presult = DB.prepare('INSERT INTO "Providable"("Id","Type","Name","Info","Date","BackgroundImageUrl","Season","Episode","AmountOfFiles") VALUES (?,?,?,?,?,?,?,?,?)').run(value.id, value.fileType, json.title, description, date, poster_path,null,null,1);
              console.log(presult);
              const result = DB.prepare('INSERT INTO "Movies"("Id","FileType","FilePath","FileIndex") VALUES (?,?,?,?)').run(value.id, value.fileType, value.path,1);
              console.log(result);
              _event.reply('response:addFile', {type: 'success'});
              const customAlert = new Notification();
              customAlert.title = 'Success';
              customAlert.body = 'Successfully added the file '+value.path+' to the db to Provideable Table for '+json.title;
              customAlert.show();
              const customAlert2 = new Notification();
              customAlert2.title = 'Success';
              customAlert2.body = 'Successfully added the file '+value.path+' to the db to Movies Table for '+json.title;
              customAlert2.show();
            }
          }catch(e){
            console.log(e);
            _event.reply('response:addFile', {type: 'failed', reason: 'db'});
            const customAlert = new Notification();
            customAlert.title = 'Error SQLite Database';
            customAlert.body = 'Sorry the SQLite Database seems to have thrown a to busy error please try again in a little while!';
            customAlert.show();
          }
          break;
        }
        //console.log(response.data);
        //_event.reply('response:addFile', ['Args', 'Args2']);
      }).catch(function (error) {
        console.log(error);
        _event.reply('response:addFile', {type: 'failed', reason: 'axios'});
        const customAlert = new Notification();
        customAlert.title = 'Error TMDB API';
        customAlert.body = 'Sorry Fetch to TMDB API didnt return proper results please try again in a little while!';
        customAlert.show();
      });
    });

    ipcMain.on('asynchronous-message', (event, arg) => {
      if (arg.startsWith('error:')){
        const message = arg.split(':')[1];
        console.log('Recieived Error Message:', message);
        switch (message){
          case 'manageNoFilePathErrors':
            const customAlert = new Notification();
            customAlert.title = 'Error No File Paths Found In DB';
            customAlert.body = 'Sorry there werent any files paths found for this object so we have helped garbage collect it from the db for you! when you clicked it!';
            customAlert.show();
          break;

          default:
          break;
        }
      }
      console.log(arg) // prints "ping" in the Node console
      // works like `send`, but returning a message back
      // to the renderer that sent the original message
      event.reply('asynchronous-reply', 'pong')
    })

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      tray = new Tray(iconPath);
      let template = [
        {
          id: '4',
          label: 'Open GUI',
          toolTip: 'This will open the Browser GUI incase you closed it and dont want to restart the whole application you can just click this...',
          click: openGUI
        },
        { type: 'separator' },
        {
          id: '3',
          label: 'Start/Stop P2P',
          toolTip: 'Start or Stop the Peer 2 Peer protocol listener this will stop you forwarding your file locations to the peers via the event source server.',
          click: startStopP2P
        },
        { type: 'separator' },
        {
          id: '2',
          label: 'Quit',
          toolTip: 'Closes out the whole application this includes the Tray as well along with the GUI Window',
          click: quitProcess
        },
        { type: 'separator' },
        {
          id:'1',
          label: 'Increment',
          toolTip: 'Increment the counter in the website utilizng the backend nodejs Runetime!',
          click: increment
        },
        { type: 'separator' },
        {
          id:'0',
          label: 'Decrement',
          toolTip: 'Decrement the counter in the website utilizng the backend nodejs Runetime!',
          click: decrement
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
//initializeMainGUI();


function checkEula(){

  var eulaWindow;
  var eulaTray;
  // Get the user's home directory
  const homeDirectory = os.homedir();

  // Define the destination directory for your files
  const destinationDirectory = path.join(homeDirectory, 'DBlockbuster');
  const destinationEulaPath = path.join(destinationDirectory, 'eula.json');

  // Read and parse the eula.json file
  const eulaContent = fs.readFileSync(destinationEulaPath, 'utf-8');
  const eulaJSON = JSON.parse(eulaContent);
  console.log(eulaJSON);
  if (eulaJSON.IAgreeToTheEulaAgreementAndTermsOfServiceAndDisclaimers === false) {
  console.log('Eula is false');

  async function eulaAgree(){
    var json = eulaJSON;
    json.IAgreeToTheEulaAgreementAndTermsOfServiceAndDisclaimers = true;
    await fs.promises.writeFile(destinationEulaPath, JSON.stringify(json));
    console.log('Successfully updated Eula:');
    console.log('Closing eula window out!');
    eulaWindow.close();
    eulaTray.destroy();
    const test = new Notification();
    test.title = "Disclaimer, ToS & Eula Agreed";
    test.body = "Please wait 5 seconds for the regular application to display thank you for agreeing to the Terms of Service and Eula Agreements!";
    test.show();
    await timer(5000);
    initializeMainGUI();
  } 

  function eulaDisagree(){
    process.exit(0);
  }

  function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: logoIconPath,
      useContentSize: false,
      enableLargerThanScreen: false,
      sandbox: false,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        preload: path.join(path.dirname(process.execPath), 'eula_preload.js')
      }
    });
    win.loadFile(path.join(path.dirname(process.execPath), 'gui','eula.html'));
    eulaWindow = win;
    // Open the DevTools.
    //win.webContents.openDevTools()
    // Handle unhandled exceptions
    process.on('uncaughtException', (error) => {
    // Log the error type and message
    console.error(`Unhandled Exception [${error.name}]:`, error.message);

    // Show a custom notification box based on error message content
    if (error.message.includes('Unexpected server response: 521')) {
      showErrorBox('Connection Error', 'We are sorry. Please check your connection or the gateway server is currently down. We apologize for this inconvenience.');
    } else {
      showErrorBox('Custom Error', `An error occurred [${error.name}]:\n\n${error.message}`);
    }
    });
  }

  app.whenReady().then(() => {

    ipcMain.on('update:agreedToEula', (_event) =>{
      console.log('Recievied agree to eula!');
      eulaAgree();
      //_event.reply('response:addFile', ['Args', 'Args2']);
    });

    ipcMain.on('update:disagreedToEula', (_event) => {
      eulaDisagree();
      console.log('Recieved Disagree to Eula!');
    });

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      tray = new Tray(iconPath);
      let template = [
        {
          id: '2',
          label: 'Quit',
          toolTip: 'Closes out the whole application this includes the Tray as well along with the GUI Window',
          click: quitProcess
        },
        { type: 'separator' },
        {
          id:'1',
          label: 'Agree',
          toolTip: 'Agree to the Eula, and accept the ToS!',
          click: eulaAgree
        },
        { type: 'separator' },
        {
          id:'0',
          label: 'Disagree',
          toolTip: 'Disagree with the Eula, and disagree with the ToS!',
          click: eulaDisagree
        }
      ]
      const ctxMenu = Menu.buildFromTemplate(template);
      tray.setContextMenu(ctxMenu);
      eulaTray = tray;
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
  }else{
    console.log('Eula already Agreed!');
    initializeMainGUI();
  }

}
checkEula();