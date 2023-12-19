```javascript
{
  NOTICE HOW WE DONT INCLUDE THE https:// or http:// url prefix we only need the subdomain its on aka the www. and also the domain it is on aka example.com!
  "domain": "www.example.com",
  This domain should be a domain you own if not just leave the port like it is and the useGeneratedSubDomain like it is! this will provide you with one!
  But if your using the generated sub domain please make sure you know portforwarding and how to only allow connections from cloudflare sources!
  The best for non advanced users is to utilize the cloudflare tunnels and put the tunnel location as your domain and port to 443 because its served over ssl
  also if your using cloudflare tunnels you will have to enable the usingCloudFlareTunnel so your video node will properly use the right ssl certs!
  "port": 8443,
  "useGeneratedSubDomain": true,
  Enable this v if your using cloudflare tunnels to enable set to true! Be sure to set the setting above ^ to disabled as well to disable the one above set to false!
  "usingCloudFlareTunnel": false
}
```
