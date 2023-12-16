# D-Blockbuster

![CM-Badge-2](https://github.com/john1234brown/DBlockbuster/assets/8825800/9629ebb4-bdca-4195-973b-1761cca970ad)


This is still a [WIP] Project I personally thank you for being patient.

A Decentralized Peer To Peer Movie and TV Show Streaming Relay Service that supports modern day browsers by passing uint8array of the video data in chunks with custom reconstructor to properly construct in proper ordering!

Programmed in NodeJS

Consisting of Three Branches for the 2 Servers the gateway is provided by DBlockbuster.

The Video Relay Server and Message Relay Server this is a single server node that can be, Peer Hosted with proper port forwarding, but we recommend hosting on a vps! 

If you don't have your own domain and ssl certs don't worry we generate a subdomain for your video relay server on authentication of server files also the video server is packaged with a ssl certificates for this subdomain!

Also you can utilize the bring your own domain where can configure the node server your domain and port and use a cloudflare tunnel which this port would be 443 we will include tutorials for these as for setting up cloudflare tunnel please refer to cloudflares documentations for setting up the tunnel please forward the cloudflare tunnel to localhost:8443 instead of localhost:5000!

This is the main branch just documenting What this service really is and what, its about the other 3 branches will go more in depth on each of the server and gateway systems along with the file provider electron application! And there own documentation can be found on there branch!

Will include Documentation for how A Browser Client Streamer would be attaching to this service and how to use it!

Will include Documentation for how a Broadcaster and Provider would be attaching to this service and how to use it!



We have our own file provider application for this service built in nodejs and electron 
- please reach out to us if you have your own application you plan on making for this service as we would have to collaborate to work on a secure authentication process!

- We have a community Discord feel free to join it at any time! https://discord.com/invite/3yay8rnyyD

- We have a movie and tv show provider application made in electron that allows anyone to provide there local video files to a peer in the browser through our the DBlockbuster Peer Hosted Relay Servers! https://github.com/john1234brown/DBlockbuster/tree/File-Provider-Electron-App
