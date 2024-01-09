function convertTitle2foldername(b) {
  //console.log('Before:', s);
  var a = b.toString().toLowerCase();
  a = a.replaceAll(' ', '');
  a = a.replace(/[\W_]+/g, "");
  return a;
}

async function post(obj) {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    };
    const response = await fetch('http://localhost:3030', requestOptions);
    console.log(await response.text());
}


//NEED TODO LIST
//CREATE ARRAY OF OBJS FROM THE FOR LOOP OF FILES AND SEND THIS TO THE LOCALHOST AND HAVE THE NODE APPLICATION LOOP THROUGH THEM
//AND EXECUTE THE WORKERS FROM THE LIST OF ARRAY OF ITEMS DONT FORGET TO UPDATE THE WORKERS TO USE THE browserIndex Object located in the main OBJECT being posted!

window.onload = function () {
document.body.addEventListener('drop', (event) => {
  console.log('Event Fired Off Drop event!');
    if (document.getElementById('tabwatch').checked){
      console.log('watch tab is checked successfully passed!', event);
        if (document.cookie.split('; ').find((row) => row.startsWith('browserIndex='))?.split('=')[1]){
            var browserRepoIndex = parseInt(document.cookie.split('; ').find((row) => row.startsWith('browserIndex='))?.split('=')[1]);
            //console.log('From Electrons Script Testing!', configjson);
            event.preventDefault();
            event.stopPropagation();
            var idcookie = document.cookie.split('; ').find((row) => row.startsWith('watchId='))?.split('=')[1];
            if (idcookie){
                var namecookie = document.cookie.split('; ').find((row) => row.startsWith('name='))?.split('=')[1];
                var typecookie = document.cookie.split('; ').find((row) => row.startsWith('watchType='))?.split('=')[1];
                var qualitycookie = document.cookie.split('; ').find((row) => row.startsWith('quality='))?.split('=')[1];
                if (typecookie === "tv"){
                    //var arrayOfObjs = new Array();
                    var seasoncookie = document.cookie.split('; ').find((row) => row.startsWith('season='))?.split('=')[1];
                    var episodecookie = document.cookie.split('; ').find((row) => row.startsWith('episode='))?.split('=')[1];
                    /*var obj = {
                        type: "addFile",
                        fileType: "tv",
                        fileQuality: qualitycookie,
                        name: convertTitle2foldername(namecookie),
                        id: parseInt(idcookie),
                        season: parseInt(seasoncookie),
                        episode: parseInt(episodecookie),
                        path: f.path,
                        browserIndex: browserRepoIndex
                    }
                    post(obj);*/
                    for (const f of event.dataTransfer.files) {
                        console.log('file:', f.path);
                        //if (f.type==="mkv"||f.type==="mp4"){//Then we upload!
                            //console.log("Found Available Video Files ready to move, rename, upload to ipfs, and publish to ipns");
                            console.log('Files path is ', f.path);
                            var obj = {
                                type: "addFile",
                                fileType: "tv",
                                fileQuality: qualitycookie,
                                name: convertTitle2foldername(namecookie),
                                id: parseInt(idcookie),
                                season: parseInt(seasoncookie),
                                episode: parseInt(episodecookie),
                                path: f.path,
                                browserIndex: browserRepoIndex
                            }
                            console.log(obj);
                            post(obj);
                            //arrayOfObjs.push(obj);
                       // }
                    // Using the path attribute to get absolute file path
                    console.log('File Path of dragged files: ', f.path)
                    //console.log('File Type:', f.type.toString());
                    }
                    //Finished For Loop lets send the post obj!
                    console.log('Finished For Loop!');
                    
                }else{//Type Movie Just upload check Post To Local express on 3030 with the id, type, name
                    //var arrayOfObjs = new Array();
                    for (const f of event.dataTransfer.files) {
                        //if (f.type==="mkv"||f.type==="mp4"){//Then we upload!
                            //console.log("Found Available Video Files ready to move, rename, upload to ipfs, and publish to ipns");
                            
                            var obj = {
                                type: "addFile",
                                fileType: "movie",
                                fileQuality: qualitycookie,
                                name: convertTitle2foldername(namecookie),
                                id: parseInt(idcookie),
                                path: f.path,
                                browserIndex: browserRepoIndex
                            }
                            console.log(obj);
                            post(obj);
                            //arrayOfObjs.push(obj);
                        //}
                    // Using the path attribute to get absolute file path
                    console.log('File Path of dragged files: ', f.path)
                    }//Finished For Loop
                    console.log('Finished For Loop!');   
                }
            }else{return;}
        }
    }else{
        event.preventDefault();
        event.stopPropagation();
        return;
    }
});














 
document.body.addEventListener('dragover', (e) => {
    if (document.body.getElementById('tabwatch').checked){
    //e.preventDefault();
    //e.stopPropagation();
    }else{
    //e.preventDefault;
    //e.stopPropagation();
    //return;
    }
  });
 
document.body.addEventListener('dragenter', (event) => {
    console.log('File is in the Drop Space');
});
 
document.body.addEventListener('dragleave', (event) => {
    console.log('File has left the Drop Space');
});

}