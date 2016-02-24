'use strict';
angular.module('publicApp')
        .controller('ChatappCtrl', function ($location, $routeParams, $scope) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];
            var rooms = ['room1', 'room2', 'room3'];
   
            
            //var rooms = io.sockets.adapter.rooms;
           var socket = io.connect(location.protocol + '//' + location.host);
           
            console.log(socket.rooms);
            $scope.rooms = rooms;
            console.log($scope.rooms);
            // $scope.rooms = ['room1', 'room2', 'room3'];
            // on connection to server, ask for user's name with an anonymous callback
            socket.on('connect', function () {
                console.log("Connect to the chat")
                // call the server-side function 'adduser' and send one parameter (value of prompt)
                socket.emit('setup', rooms);
                socket.emit('adduser', prompt("What's your name?"));
               
            });
            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('updatechat', function (username, data) {
                console.log(data);
             
                $('#conversation-'+data.room).append('<b>' + username + ':</b> ' + data.text + '<br>');
            });
            // listener, whenever the server emits 'updaterooms', this updates the room the client is in
            socket.on('updaterooms', function (rooms, current_room, users) {
                console.log("Update rooms ");
               
               
                $scope.users = users.users;
                $scope.$apply();
                console.log($scope.users);
                console.log(current_room);
                $('.current_room').html(current_room)
                $scope.current_room = current_room;
            });
            console.log($scope.rooms)
            $scope.switchRoom = function (room) {
                console.log('switch to room: ' + room)
                socket.emit('switchRoom', room);
            }
            $scope.senddata = function(data, room){
                    console.log(data);
                    $('#data-'+room).val('');
                    data.room = room;
                    // tell server to execute 'sendchat' and send along one parameter
                    socket.emit('sendchat', data);
            }
            function init() {
                console.log('documet ready');
                // when the client clicks SEND
                console.log($scope.rooms);
                // when the client hits ENTER on their keyboard
                $('.message').keypress(function (e) {
                    if (e.which == 13) {
                        $(this).blur();
                        $('#datasend').focus().click();
                    }
                });
                // initRooms();
            }
            ;
            init();
        });
