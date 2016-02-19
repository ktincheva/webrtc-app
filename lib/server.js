var express = require('express'),
        expressApp = express(),
        socketio = require('socket.io'),
        http = require('http'),
        server = http.createServer(expressApp),
        uuid = require('node-uuid'),
        rooms = {},
        numClients = 0,
        currentRoom = 2;
userIds = [];

expressApp.use(express.static(__dirname + '/../public/app/'));

exports.run = function (config) {
    console.log("alabala");
    server.listen(config.PORT);
    console.log('Listening on', config.PORT);
    var io = socketio.listen(server, {log: true});
    io.sockets.on('connection', function (socket) {

        var currentRoom, id;
        // console.log('connection....' + socket);
        socket.on('init', function (data) {
            currentRoom = data.room;
            console.log("current Room" + currentRoom);
            console.log("username" + data.username);
            userIds.push(data.username);
            //console.log("Socket Init " + data);
            if (io.sockets.adapter.rooms[currentRoom])
                numClients = io.sockets.adapter.rooms[currentRoom].length;
            console.log(numClients);

            console.log('Room ' + currentRoom + ' has ' + numClients + ' client(s)');

            if (numClients === 0) {
                socket.join(currentRoom);
                socket.emit('created', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});

            } else if (numClients === 1) {
                socket.join(currentRoom);
                socket.emit('joined', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
                socket.in(currentRoom).emit('ready', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
                console.log(socket.adapter.rooms[currentRoom].length);
                socket.emit('peer.connected', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
            } else { // max two clients
                socket.emit('full', {room: currentRoom, socket: socket.id, user: data.username, users: userIds});
            }


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
           
            console.log("rooms");
            var room = data.room;

            console.log("in room"+room);
            var rooms = io.sockets.adapter.rooms[room];
            console.log(rooms);


            if (rooms && rooms.length >= 2)
            {
                console.log(Object.keys(rooms.sockets));
                target = (socket === Object.keys(rooms.sockets)[0]) ? Object.keys(rooms.sockets)[1] : Object.keys(rooms.sockets)[0];
                console.log(target);
                io.sockets.connected[target].emit('msg', data)
                io.sockets.in(socket.room).emit('peer.connected');
            }
        });

        socket.on('disconnect', function () {
            console.log('leave socket' + socket.id)
            socket.leave(socket.room);
            // userIds.splice(userIds.indexOf(data.username));
        });
    });
};