var express = require('express'),
        expressApp = express(),
        socketio = require('socket.io'),
        https = require('https'),
        fs = require('fs'),
        uuid = require('node-uuid'),
        numClients = 0,
        currentRoom = 2;
var userIds = [];
var rooms = {};
var usernames = [];
var currentRoom, id;
console.log(__dirname);
var options = {
    key: fs.readFileSync(__dirname + '/../config/ssl/server.key'),
    cert: fs.readFileSync(__dirname + '/../config/ssl/server.crt')
};

var server = https.createServer(options, expressApp);
var serverPort = 443;
expressApp.use(express.static(__dirname + '/../public/app/'));

exports.run = function (config) {
    var userIds = [];
    var rooms = {};
    var usernames = {};
    var currentRoom, id;
    console.log("alabala");
    server.listen(config.PORT);
    console.log('Listening on', config.PORT);
    var io = socketio.listen(server, {log: true});
    io.sockets.on('connection', function (socket) {

        // console.log('connection....' + socket);
        socket.on('init', function (data) {
            currentRoom = data.room;
            console.log("current Room: " + currentRoom);
            console.log("username: " + data.username);
            userIds.push(data.username);
            //console.log("Socket Init " + data);
            socket.username = data.username;
            console.log(userIds);
            console.log("Current Room clients");
            console.log(io.sockets.adapter.rooms[currentRoom]);
            if (io.sockets.adapter.rooms[currentRoom])
                numClients = io.sockets.adapter.rooms[currentRoom].length;
            console.log(numClients);
            console.log(io.sockets.adapter.rooms[currentRoom]);
            console.log('Room ' + currentRoom + ' has ' + numClients + ' client(s)');
            if (numClients === 0) {
                socket.join(currentRoom);
                socket.emit('created', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});

            } else if (numClients === 1) {
                socket.join(currentRoom);
                socket.emit('joined', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
                socket.emit('ready', {room: currentRoom, user: data.username, users: userIds});
                console.log(socket.adapter.rooms[currentRoom].length);
                socket.broadcast.emit('ready', {room: currentRoom, user: data.username, users: userIds});
            } else { // max two clienzx\x\ts
                socket.emit('full', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
            }

            console.log(io.sockets.adapter.rooms[currentRoom]);
            console.log('Peer connected to room', currentRoom, 'with #', socket.id);


            /* if (!room)
             {
             rooms[currentRoom] = [socket];
             console.log(rooms);
             room = rooms[currentRoom];
             }
             else {
             room.push(socket);
             }
             console.log(room);
             if (room.length > 2)
             room.shift();
             console.log(room);
             room[0].emit('peer.connected', { id: id, user: data.username });*/
        });

        socket.on('msg', function (data) {

            console.log("message type: " + data.type);
            var room = data.room;
            console.log(data);
            console.log("in room: " + room);
            socket.broadcast.emit('msg', data)
        });

        socket.on('userleave', function (data)
        {
            console.log('leave socket' + socket.id)
            console.log(data.username);
            console.log(userIds);
            console.log(userIds.indexOf(data.username));
            if (userIds.indexOf(data.username) >= 0)
                userIds.splice(userIds.indexOf(data.username), 1);
            console.log(userIds);
            socket.emit('userleaved', {'username': data.username, 'users': userIds, 'status': 'leave'});
            socket.broadcast.emit('userleaved', {'username': data.username, 'users': userIds});
            socket.leave(socket.room);
        });

        socket.on('adduser', function (username) {
            console.log(rooms);
            // store the username in the socket session for this client
            socket.username = username;
            // store the room name in the socket session for this client
            socket.room = 'room1';
            // add the client's username to the global list
            usernames[username] = {'socket_id': socket.id, 'username': username};
            console.log(usernames);
            // send client to room 1
            socket.join('room1');
            // echo to client they've connected
            socket.emit('updatechat', 'SERVER', 'you have connected to room1');
            // echo to room 1 that a person has connected to their room
            socket.broadcast.to('room1').emit('updatechat', 'SERVER', {'text': username + ' has connected to this room', 'room': socket.room, 'users': usernames});
            socket.emit('updaterooms', {'rooms': rooms}, 'room1', {'users': usernames});
        });

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
            io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        });

        socket.on('switchRoom', function (newroom) {
            // leave the current room (stored in session)
            socket.leave(socket.room);
            // join new room, received as function parameter
            socket.join(newroom);
            socket.emit('updatechat', 'SERVER', {'text': 'you have connected to ' + newroom, 'room': socket.room});
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', {'text': socket.username + ' has left this room', 'room': socket.room});
            // update socket session room title
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'SERVER', {'text': socket.username + ' has joined this room', 'room': socket.room});
            socket.emit('updaterooms', rooms, newroom, {'users': usernames});
        });

        socket.on('disconnect', function () {
            console.log('on disconnect');
            console.log(socket.username);
            console.log(userIds.indexOf(socket.username));
            if (userIds.indexOf(socket.username) >= 0)
                userIds.splice(socket.username.toString());
            console.log(userIds);
            socket.emit('userleaved', {'username': socket.username, 'users': userIds, 'status': 'leave'});
            socket.broadcast.emit('userleaved', {'username': socket.username, 'users': userIds});
            socket.leave(socket.room);
        });
    });
};