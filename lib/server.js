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
                socket.emit('joined', {room: currentRoom, socket: socket.id,user: data.username, users: userIds});
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
           
            console.log("message type: "+data.type);
            var room = data.room;
            console.log(data);
            console.log("in room: "+room);
                socket.broadcast.emit('msg', data)
        });
        
        socket.on('userleave', function (data)
        {
            console.log('leave socket' + socket.id)
            console.log(data.username);
            console.log(userIds);
            console.log(userIds.indexOf(data.username));
           if(userIds.indexOf(data.username)>=0) userIds.splice(userIds.indexOf(data.username),1);
           console.log(userIds);
            socket.emit('userleaved', {'username':data.username, 'users':userIds, 'status':'leave'});
            socket.broadcast.emit('userleaved', {'username':data.username, 'users':userIds});
            socket.leave(socket.room);  
        });

        socket.on('disconnect', function () { 
            console.log('on disconnect');
            console.log(socket.username);
            console.log(userIds.indexOf(socket.username));
            if(userIds.indexOf(socket.username)>=0) userIds.splice(socket.username.toString());
            console.log(userIds);
            socket.emit('userleaved', {'username':socket.username, 'users':userIds, 'status':'leave'});
            socket.broadcast.emit('userleaved', {'username':socket.username, 'users':userIds});
            socket.leave(socket.room);  
        });
    });
};