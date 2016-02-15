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
                // console.log('connection....' + socket);
                socket.on('init', function (data) {
                    // console.log(socket)
                    currentRoom = data.room;
                    console.log("current Room" + currentRoom);
                    console.log("username" + data.username)
                    //console.log("Socket Init " + data);
                    var numClients = 0;
                    if (socket.rooms[currentRoom])
                        numClients = socketio.sockets.clients();
                   
                    console.log('Room ' + currentRoom + ' has ' + numClients + ' client(s)');

                    if (numClients === 0) {
                        socket.join(currentRoom);
                        socket.emit('created', currentRoom, socket.id);

                    } else if (numClients === 1) {
                        socket.join(currentRoom);
                        socket.emit('joined', currentRoom, socket.id);
                        socket.in(currentRoom).emit('ready');

                    } else { // max two clients
                        socket.emit('full', currentRoom);
                    }
                     console.log(socket.adapter.rooms[currentRoom]);
                    socket.emit('peer.connected', {id: socket.id, user: data.username});



                    console.log('Peer connected to room', currentRoom, 'with #',socket.id);


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
                    console.log(socket.rooms);
                    var room = data.room;
                    console.log(socket.rooms[room]);
                    socket.in(room).emit('peer.connected');
                    socket.emit('msg', data);
                   /*         target = (socket === rooms[room][0]) ? rooms[room][1] : rooms[room][0];
                    target.emit('msg', data)
                    rooms[room].forEach(function () {
                        socket.emit('peer.connected');
                    }) */
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