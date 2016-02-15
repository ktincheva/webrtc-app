var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    rooms = {},
    port = 5555,
    roomId = 0;

expressApp.use(express.static(__dirname + '/public/app'));

expressApp.get('/', function (req, res) {
  return res.redirect(302, '/chat/' + roomId++);
});

server.listen(port);
console.log('Listening on', port);
socketio.listen(server, { log: true })
.sockets.on('connection', function (socket) {
  console.log('connection....'+socket);   
  var socketRoom;

  socket.emit('app-url', getAppUrl());

  socket.on('init', function (data) {
    console.log('socket on init');
   
    socketRoom = data.room;
   
    var room = rooms[socketRoom];
    console.log(socketRoom);
    if (!room) rooms[socketRoom] = [socket];
    else {
      room.push(socket);
      console.log(room);
      if (room.length > 2) room.shift();
      room[0].emit('peer.connected');
    }
  });

  socket.on('msg', function (data) {
    var room = socketRoom,
        target = (socket === rooms[room][0]) ? rooms[room][1] : rooms[room][0];
    target.emit('msg', data)
    rooms[room].forEach(function () {
      socket.emit('peer.connected');
    })
  });

});

function getAppUrl() {
  return 'http://' + getIpAddress() + ':' + port + '/chat/' + roomId++;
}

function getIpAddress() {
  var os = require('os'),
      ifaces = os.networkInterfaces(),
      ip;
      console.log(ifaces);
  ifaces['eth0'].forEach(function (details) {
    if (details.family=='IPv4') {
      ip = details.address;
      return;
    }
  });
  return ip;
}