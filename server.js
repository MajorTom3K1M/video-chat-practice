
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

var fs = require('fs');

var useAuth = true;
var app = express();
var port = process.env.PORT || 3000;

var options = {
    key: fs.readFileSync('certs/server-key.pem'),
    cert: fs.readFileSync('certs/server-crt.pem'),
    ca: fs.readFileSync('certs/ca_client-crt.pem'),
    //crl: fs.readFileSync('certs/ca-crl.pem'),
};

var server = http.createServer(options, app);
var io = socketIO(server);

app.use(express.static(__dirname + '/public'));

const RoomService = require('./RoomService')(io);
io.sockets.on('connection', RoomService.listen);
io.sockets.on('error', e => console.log(e));
app.get('*', function(req, res) {
    res.sendFile(`${__dirname}/public/index.html`);
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
