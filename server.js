
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var port = process.env.PORT || 3000;

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
