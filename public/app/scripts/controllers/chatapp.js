'use strict';
angular.module('publicApp')
        .controller('ChatappCtrl', function ($location, $routeParams, $scope) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];
            var rooms = ['room1', 'room2', 'room3'];
            $scope.rooms = rooms;
            console.log($scope.rooms);
            
            //var rooms = io.sockets.adapter.rooms;
            var socket = io.connect('http://localhost:5555');
           
            // $scope.rooms = ['room1', 'room2', 'room3'];
            // on connection to server, ask for user's name with an anonymous callback
            socket.on('connect', function () {
                console.log("Connect to the chat")
              
                // call the server-side function 'adduser' and send one parameter (value of prompt)
                socket.emit('setup', rooms);
                socket.emit('adduser', prompt("What's your name?"));
               
            });
            
            console.log($scope.rooms)
            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('updatechat', function (username, data) {
                $('#conversation').append('<b>' + username + ':</b> ' + data + '<br>');
            });
            // listener, whenever the server emits 'updaterooms', this updates the room the client is in
            socket.on('updaterooms', function (rooms, current_room) {
                console.log("Update rooms "+rooms)
                console.log(current_room);
                $('.current_room').html(current_room)
                
                console.log($scope.current_room);
            });
            console.log(rooms);
            console.log($scope.rooms)
            $scope.switchRoom = function (room) {
                console.log('switch to room: ' + room)
                socket.emit('switchRoom', room);
            }
      
            function init() {
                console.log('documet ready');
                // when the client clicks SEND
                console.log($scope.rooms);
                $('#datasend').click(function () {
                    var message = $('#data').val();
                    $('#data').val('');
                    // tell server to execute 'sendchat' and send along one parameter
                    socket.emit('sendchat', message);
                });
                // when the client hits ENTER on their keyboard
                $('#data').keypress(function (e) {
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
