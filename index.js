const express = require('express');
/*const bodyParser = require('body-parser');*/
const cors = require('cors');

const app = express();
app.use(cors('*'));
app.use(express.json());
/*app.use(bodyParser.urlencoded({ extended: false }));*/

app.get('/status', (request, response) => response.send(JSON.stringify({ nodes: nodesStatus, nodeslength: nodesStatus.length })));
app.get('/status-videos', (request, response) => response.send(JSON.stringify({ nodes: videonodesStatus, nodeslength: videonodesStatus.length })));

const PORT = 8080;

var nodes = [];
var nodesStatus = [];
var videonodes = [];
var videonodesStatus = [];
var factsOther = { msg: 'This is a gateway event stream provided by StreamPal! For the msgs to be relayed from nodes and other gateway points!' };

function rekt(text) {
  // Replace all escape sequences with their corresponding unescaped characters
  const escapeSequences = {
    '\\"': '"',
    '\\\'': '\'',
    '\\\\': '\\',
    '\\n': '\n',
    '\\r': '\r',
    '\\t': '\t',
    '\\b': '\b',
    '\\f': '\f',
    '\\v': '\v',
    '\\0': '\0',
  };

  const regex = new RegExp('(\\\\)[\\"|\'|\\]|\\n|\\r|\\t|\\b|\\f|\\v|\\0]', 'g');
  if (typeof text !== 'string' && typeof text === 'number') {
    //throw new Error('text must be a string');
    var test = text.toString().replace(regex, (match, escapedCharacter) => escapeSequences[escapedCharacter]);
    //Number(test);
    return Number(test);
  }
  return text.toString().replace(regex, (match, escapedCharacter) => escapeSequences[escapedCharacter]);
}

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})

function eventsNodeHandlerCatch(request, response, next) {
  try {
    //Here we dont do the full sanitization check just mostly can do intercept checkIP to add ip throttling along with ensuring or catching maximum amount of clients to be actively listening to the server at once!
    if (nodes.length <= 99999) {
      eventsNodeHandler(request, response, next);
    } else {
      response.status(429);
    }
  } catch (e) {
    console.log(e);
  }
}
//This is the channel provided by the gateway to link all the nodes together! which allows providers to listen to just one node and be able to cross communicate with other nodes etc... along with request and provide!
function eventsNodeHandler(request, response, next) {
  try {
    const url = request.query.url;
    const port = request.query.port;
    if (url && port) {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      response.writeHead(200, headers);

      const randId = Math.random().toString().slice(2, 11);
      const clientId = Date.now() + randId;
      var factNewOther = {
        type: 'authenticated',
        nodeId: clientId,
        domain: url,
        port: port,
        msg: factsOther.msg
      }
      var data2 = `data: ${JSON.stringify(factNewOther)}\n\n`;

      response.write(data2);
      //const newFact = JSON.parse(request.body);
      //console.log(newFact);
      //console.log(request.body);
      const newClient = {
        id: clientId,
        domain: url,
        port: port,
        response
      };

      nodes.push(newClient);
      nodesStatus.push({
        id: clientId,
        domain: url,
        port: port,
        status: 'connected'
      })

      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        nodes = nodes.filter(client => client.id !== clientId);
        nodesStatus = nodesStatus.filter(client => client.id !== clientId);
      });
    }
  } catch (e) {
    console.log(e);
  }
}
function eventsVideoNodeHandlerCatch(request, response, next) {
  try {
    //Here we dont do the full sanitization check just mostly can do intercept checkIP to add ip throttling along with ensuring or catching maximum amount of clients to be actively listening to the server at once!
    if (nodes.length <= 99999) {
      eventsVideoNodeHandler(request, response, next);
    } else {
      response.status(429);
    }
  } catch (e) {
    console.log(e);
  }
}
//This is the channel provided by the gateway to link all the nodes together! which allows providers to listen to just one node and be able to cross communicate with other nodes etc... along with request and provide!
function eventsVideoNodeHandler(request, response, next) {
  try {
    const url = s(request.query.url);
    const port = s(request.query.port);
    if (url && port) {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      response.writeHead(200, headers);

      const randId = Math.random().toString().slice(2, 11);
      const clientId = Date.now() + randId;
      var factNewOther = {
        type: 'authenticated',
        videonodeId: clientId,
        domain: url,
        port: port,
        msg: factsOther.msg
      }
      var data2 = `data: ${JSON.stringify(factNewOther)}\n\n`;

      response.write(data2);
      //const newFact = JSON.parse(request.body);
      //console.log(newFact);
      //console.log(request.body);
      const newClient = {
        id: clientId,
        domain: url,
        port: port,
        response
      };

      videonodes.push(newClient);
      videonodesStatus.push({
        id: clientId,
        domain: url,
        port: port,
        status: 'connected'
      })

      request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        videonodes = videonodes.filter(client => client.id !== clientId);
        videonodesStatus = videonodesStatus.filter(client => client.id !== clientId);
      });
    } else {
      response.status(404);
    }
  } catch (e) {
    console.log(e);
  }
}
//This is the node event client listener channel for the gateway!
app.get('/node', eventsNodeHandlerCatch);

app.get('/videonode', eventsVideoNodeHandlerCatch)


//This relay is for relaying a all msgs to all nodes!
function sendEventsToAllNodes(newFact) {
  var nodeId = newFact.nodeId;
  var Type = newFact.type;
  var Fact = newFact.fact;
  var relayedFact = {
    nodeId: nodeId,
    type: Type,
    fact: Fact
  }
  console.log(relayedFact);
  //console.log('Ids', objId, 'types', type, reqType);
  nodes.forEach(node => {
    if (node.id !== nodeId) {
      console.log('passing msg:', newFact, 'too node:', node.id);
      node.response.write('data: ' + JSON.stringify(relayedFact) + '\n\n');
    }
  });
}

function addNodeMsg(request, response, next) {

  const newFact = request.body;
  console.log('nodeMsg:', newFact);
  //facts.push(newFact);
  response.json(newFact);
  return sendEventsToAllNodes(newFact);
}
app.post('/nodemsg', addNodeMsg);


























//console.log("If you are reading this then SUCCESS and " + " Wazza ZAP ")