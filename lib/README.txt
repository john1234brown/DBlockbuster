# You may Delete any folder that isnt your OS
# I plan to include in the productions build to have a auto remove librarys that arent required to safe on memory space!

# For example if you are on mac you can delete all folders except darwin

# If you are on linux distros keep the linux folder

# If you dont have IPFS desktop installed but you have Go installed on the computer with your path variables already setup properly for Go
- # Then you can use the kubo go library just get the right distro if you dont know what distro you are on please look at line 12 aka three lines down in this file and list.
- # If you know what distro and arch you are running then you can install the ipfs kubo binary file into the proper distro folder and arch folder
- # for example a AMD 64 linux would put the IPFS Kubo cli binary under the linux folder and inside the Folder called 64 etc.. and so on
- # again if you dont know please open terminal or command prompt inside of the main folder of this NodeJS application and run this command in it!
- # node distro.js
- # this will console output your distro and what folder you should put the kubo cli binary file also it will save this to a txt file called distro.txt
- # in the same directory as the distro.js file incase you closed the console before reading its output!