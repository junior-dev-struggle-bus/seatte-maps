'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const uriMap = new Map();
const mime = new Map();

mime.set('.html', 'text/html');
mime.set('.js', 'text/javascript');
mime.set('.mjs', 'text/javascript');
mime.set('.json', 'application/json');
mime.set('.wasm', 'application/wasm');

const root = '.\\';

async function recurseFileSystem(root, eventType, filename) {
  const uri = `/${filename.replace(/\\/g, '/')}`;
  console.log({eventType, uri});
  const fileObj = {
    path: `${root}\\${filename}`,
    headers: {},
  };

  if(mime.has(path.extname(filename))) {
    fileObj.headers['content-type'] = mime.get(path.extname(filename));
  }
  uriMap.set(uri, fileObj);
  console.log(uriMap);
}

fs.watch('./', {recursive: true}, recurseFileSystem.bind(null, root));

fs.readdirSync('./').forEach(recurseFileSystem.bind(null, root, 'change'));

const server = http.createServer((req, res) => {
  console.log(uriMap, req.url);
  if(uriMap.has(req.url)) {
    const fileObj = uriMap.get(req.url);
    [...Object.entries(fileObj.headers)].forEach(([k, v])=> res.setHeader(k, v));
    fs.createReadStream(uriMap.get(req.url).path).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8000);