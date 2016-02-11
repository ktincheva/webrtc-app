var express = require('express'),
        expressApp = express(),
        socketio = require('socket.io'),
        http = require('http'),
        server = http.createServer(expressApp),
        uuid = require('node-uuid'),
        rooms = {},
        userIds = {};

expressApp.use(express.static(__dirname + '/../public/app/'));

exports.run = function (config) {
    console.log("alabala");
    server.listen(config.PORT);
    console.log('Listening on', config.PORT);
    socketio.listen(server, {log: true})
            .sockets.on('connection', function (socket) {

                var currentRoom, id;
                console.log('connection....' + socket);
                socket.on('init', function (data) {

                    currentRoom = data.room;
                    console.log("current Room" + currentRoom);
                    console.log("username" + data.username)
                    //console.log("Socket Init " + data);
                    var room = rooms[currentRoom];
                    console.log(room);
                    /*if (!data) {
                     rooms[currentRoom] = [socket];
                     id = userIds[currentRoom] = 0;
                     fn(currentRoom, id);
                     console.log('Room created, with #', currentRoom);
                     } else {
                     if (!room) {
                     return;
                     }
                     userIds[currentRoom] += 1;
                     id = userIds[currentRoom];
                     fn(currentRoom, id);
                     room.forEach(function (s) {
                     s.emit('peer.connected', { id: id, user: data.username });
                     });
                     room[id] = socket;
                     console.log('Peer connected to room', currentRoom, 'with #', id);
                     } */

                    if (!room)
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
                        room[0].emit('peer.connected', { id: id, user: data.username });
                    
                });

                socket.on('msg', function (data) {
                    var room = currentRoom,
                            target = (socket === rooms[room][0]) ? rooms[room][1] : rooms[room][0];
                    target.emit('msg', data)
                    rooms[room].forEach(function () {
                        socket.emit('peer.connected');
                    })
                });

                socket.on('disconnect', function () {
                    if (!currentRoom || !rooms[currentRoom]) {
                        return;
                    }
                    delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
                    rooms[currentRoom].forEach(function (socket) {
                        if (socket) {
                            socket.emit('peer.disconnected', {id: id});
                        }
                    });
                });
            });
};