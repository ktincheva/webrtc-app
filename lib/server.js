var express = require('express');
var expressApp = express();
var socketio = require('socket.io');
var https = require('https');
var fs = require('fs');
var uuid = require('node-uuid');


var options = {
    key: fs.readFileSync(__dirname + '/../config/ssl/server.key'),
    cert: fs.readFileSync(__dirname + '/../config/ssl/server.crt')
};



expressApp.use(express.static(__dirname + '/../public/app/'));

exports.run = function (config) {
    var server = https.createServer(options, expressApp);
    server.listen(config.PORT);

    console.log("Server started!");
    console.log('Listening on', config.PORT);
    
    var io = socketio.listen(server, {log: true});
    var numClients = 0;
    var userIds = {};
    var rooms = {};
    var usernames = {};
  
    
    io.on('connection', function (socket) {
        console.log("--------on connection socket room is----------");
        console.log(socket.room);
        // console.log('connection....' + socket);
        socket.on('init', function (data) {
            console.log(data);
            socket.room = data.room;
            console.log("current Room: " + socket.room);
            console.log("username: " + data.username);
            //userIds.push(data.username);
            userIds[data.username] = data;
            //console.log("Socket Init " + data);
            socket.username = data.username;
            console.log("------------------------Users Ids json object---------------------");
            console.log(userIds);
            
            console.log("Current Room clients");
            console.log(io.sockets.adapter.rooms[socket.room]);
            
            if (io.sockets.adapter.rooms[socket.room])
                numClients = io.sockets.adapter.rooms[socket.room].length;
            
            console.log(io.sockets.adapter.rooms[socket.room]);
            console.log('Room ' + socket.room + ' has ' + numClients + ' client(s)');
            var result = {room: socket.room, socket: socket.id, user: data.username, users: userIds};
            if (numClients === 0) {
                socket.join(socket.room);
                socket.emit('created', result);

            } else if (numClients <= config.max_connections) {
                socket.join(data.room);
                socket.emit('joined', result);
                socket.emit('ready', result);
                console.log(socket.adapter.rooms[data.room].length);
                socket.broadcast.emit('ready', result);
            } else { // max two cliens
                socket.emit('full', result);
            }

            console.log(io.sockets.adapter.rooms[data.room]);
            console.log('Peer connected to room', data.room, 'with #', socket.id);
        });

        socket.on('msg', function (data) {
            console.log("Message received: " + data.type);
            console.log(data);
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
        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {
            console.log("Server: on send chat event starts");
            // we tell the client to execute 'updatechat' with 2 parameters
            io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        });

        socket.on('switchRoom', function (newroom) {
            // leave the current room (stored in session)
            console.log("---------------------leave curent room -----------------");
            console.log(socket.room)
            console.log("---------------------user leaved curent room is -----------------");
            console.log(socket.username);
            socket.leave(socket.room);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', {'text': socket.username + ' has left this room', 'room': socket.room, 'users': userIds});
            // join new room, received as function parameter
            console.log("----------- join to new room------------------");
            
            socket.join(newroom);
            socket.room = newroom;
            console.log("--------------- socket room is --------------------");
            console.log(socket.room);
            socket.emit('updatechat', 'SERVER', {'text': 'You have connected to ' + newroom, 'room': socket.room, 'users': userIds});

            // update socket session room title
            socket.broadcast.to(newroom).emit('updatechat', 'SERVER', {'text': socket.username + ' has joined this room', 'room': socket.room, 'users': userIds});
            socket.emit('updaterooms', rooms, newroom, {'users': userIds});
        });

        socket.on('disconnect', function () {
            console.log('on disconnect');
            console.log(socket.username);
            if (socket.username)
            {
                console.log(userIds[socket.username].length);
                if (Object.keys(userIds[socket.username]).length>0)
                    delete userIds[socket.username];
                    
                console.log(userIds);
                socket.emit('userleaved', {'username': socket.username, 'users': userIds, 'status': 'leave'});
                socket.broadcast.emit('userleaved', {'username': socket.username, 'users': userIds});
                socket.leave(socket.room);
            }
        });
    });
};