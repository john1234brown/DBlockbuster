#README for CONFIG.JSON THIS IS NOT THE CONFIG FILE THIS IS A REPLICA WITH COMMENTS IN IT! PLEASE OPEN UP config.json IF YOUR TRYING TO MODIFY CONFIG FILE

{
# peerId will be a later on function but for right now its a null variable.
 "peerId": null,
# This will be your provider public username that requesters will see when receiving file locations from you! 
 "providerUsername": "Theres-No-Way-Back-Now",
# This is to enable the smee provider p2p listener Deprecated we recommend keeping false for now!
 "smee": false,
# This is to enable the replit provider p2p listener. Current in use! we recommend keeping true for now!
 "replit": true,
# This is the file provider ipns location!
 "ipns": "k51qzi5uqu5djlqdcqfuxxi1bwu1zar0lpc8osjfzqzmji5q9o5rmp6hwqnck7",
# Set to true or false this will enable or disable the upload to ipfs or updating ipfs instead will just move files to local repo and prepare to be ready to upload to ipfs might have later on built in support for kubo cli binary library to init a ipfs daemon service if you dont want a gui to see the files on ipfs from ipfs desktop.
# But For now it is entirely just for disabling ipfs calls.
 "ipfsDesktopInstalled": false,
# This was to specify the original default root path of the Repository where the Repository folders exist!
 "repoDir": "/home/kali/external/StreampalRepo/",
# We will offer a selection box on the web ui for you to choose which RootPath you want to modify this will help specify what root path to upload files to and mkdirs to along with making it easier to swap which directory you want to use
 "listOfRootFolderNames": [
  "exampleRootFolder",
  "examplerootMini",
  "example2",
  "example3"
 ],
# Here you can specifiy the name of the folder to be created to the ipfs that will contain the repo in order from above! 
 "ipfsFolders": [
  "exampleRootFolder",
  "examplerootMini",
  "example2",
  "example3"
 ],
# This will be overwritten via each publish and update to the ipfs dont worry about this is for the application to respond ipns locations for repos and files!
 "listOfipns": [
  "k51qzi5uqu5dhiyehp8kev5bkdfjsaokah8kwbfhbx4gw4grh4b3s8soavkyj4",
  "k51qzi5uqu5djklhubfzv7zijh3rw6258f7xh0fssxzt5lgub2f3l7s1806u37",
  "k51qzi5uqu5dlc81bcuspyus9z0b1qk6k4q4nql5c5yhz06i37rzl9b4czn089",
  "k51qzi5uqu5dhnykt7xd2028gx15xummsuvy18azgytxapmliginldqgvzgsyj"
 ],
# This will be the names of the keys generated and used to publish the ipfs folders!
 "ipnsKeys": [
  "self",
  "key1",
  "key2",
  "key3"
 ],
# This will enable the status check of your files publicly from within the GUI browser
 "pingCheck": true,
# This Will determine how many simultaneous uploads to ipfs will happen at once on the current selected ipfs folder
 "maxUploadThreads": 4,
# This will cap the max searchable index for drag and drop of videos into the GUI Application!
 "maximumAmountOfFilesAndFoldersToSearchThroughOnDragAndDrops": 20,
# This enables the auto indexing of video files in the repos on startup!
 "repoAutoSearchIndexing": true
}







# this is outdated deprecated readme knowledge but still pertains to the same thing still!
{
# Leave null if you havent added your root folder structure to IPFS
    "ipns": null,
# Put your IPNS CID, aka the randomized letters after ipfs.io/ipns/(thisrandomizedcharacterstringisYourCID) in the url that was generated from publishing it in the IPFS Desktop Software from https://ipfs.tech
# This Is where you will define the ROOT folder of your Movies and TVSHOWS SubFolders if you dont have one just create a folder and make it that location
    "root": "C:/path/too/the/root/folder/for/providing/TheR00T"
}