'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */

chatApp.controller('ChatCtrl', function ($sce, $location, $routeParams, $scope, $filter, config, imagesUpload, Profile, socketService) {
    this.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
    ];
    console.log($routeParams);
    //var startButton = document.getElementById('startButton');
   
    $scope.user = {};
    $scope.user.username = $routeParams.userId;
    
    var hangupButton = document.getElementById('hangupButton');
    var disconnectButton = document.getElementById('disconnectButton');
    var userMediaButton = document.getElementById('getUserMedia');
    
    //  var usersList = document.getElementById('users_connected');

    
    // var remoteVideo = document.getElementById('remote-video');
    
    
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';

    
    
    var socket = socketService.socket;
    $scope.connection = socketService.connection;  
    console.log($scope.connection);
    $scope.users = socket.users;
    $scope.status = socket.status;
    
    
    if ($routeParams.roomId) roomId = $routeParams.roomId;
    
    $scope.connection.socket = socket;
    $scope.connection.user = {'username': $scope.user.username};
    $scope.connection.roomId = roomId;
// toId == received fromId
 
    
 
   
    $scope.sendOffer = function (toId) {
        console.log('Starting call to');
        console.log(toId);
        $scope.connection.formId = $scope.user.username;
        $scope.connection.toId = toId;
        $scope.connection.type = 'offer'
        
        if ($scope.user.username && $scope.connection.toId)
        {
            hangupButton.disabled = false;
            // may be wiil added for second time --- check this????
            console.log('pc1 createOffer start');
            // getPeerConnection(connection.toId);
            socketService.startUserMedia();
        } else {
            errors.push("Missing user name");
        }

    }
    var hangup = function () {
        console.log("User Hangup");
        console.log($scope.user.username);
        socket.emit('userleave', {room: roomId, username: $scope.user.username})
        hangupButton.disabled = true;
        socket.localStream = null;
        //socket.disconnect();
        socket.peer.connectionClose();
        stopVideo();
    }
    var disconnect = function ()
    {
        hangup();
        // socket.disconnect();
    }
    var stopVideo = function ()
    {
        socket.localStream.getVideoTracks()[0].stop();
        socket.localStream.getAudioTracks()[0].stop();
        socket.localStream = null;
        socket.localVideo.pause();
        //localVideo.remove();
    }

  $scope.sendAnswer = function ()
    {
            console.log("Send Answer to");
            console.log($scope.connection);
            $scope.remoteUser = $scope.connection.toId;
            socketService.startUserMedia();
            console.log("Receive offer: ");
            console.log($scope.connection.type);
    };

    
   

    
    var createVideoElement = function (stream)
    {
        console.log("Set stream to the videoe element per remote user id " + $scope.remoteUser);
        var remoteVideo = document.getElementById('remote-video-' + $scope.remoteUser);
        console.log(remoteVideo);
        /*var vid = document.createElement("video");
         ;*
         vid.src = windowv.URL.createObjectURL(event.stream);*/
        remoteVideo.src = window.URL.createObjectURL(stream)
        // remoteVideo.srcObject = stream;
    }
    
    var init = function (data) {
        $('#chat_rooms').show();
        socket.emit('init', {room: roomId, username: $scope.user.username, profile: data});
        console.log('document ready');
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
    };
    
    
    hangupButton.disabled = true;
    hangupButton.onclick = hangup;
    userMediaButton.onclick = socketService.startUserMedia;
    disconnectButton.onclick = disconnect;
    //sendOfferToAll.onclick = sendOfferToAll;
    
    $scope.rooms = rooms;
    $scope.config = config;
  
    $scope.login = function ()
    {
        
        console.log("login")
        if (!$scope.user.username)
        {
            console.log("Username is empty!!!");
            $scope.errors.push("Empty username");
            return false;
        }
        else {
            getProfileByUsername();
        }

        // socket.emit('adduser', $scope.user.username);
    }
    $scope.switchRoom = function (room) {
        console.log(socket);
        console.log('switch to room: ' + room)
        socket.emit('switchRoom', room);
    }
    $scope.senddata = function (data, room) {
        console.log("Send message data")
        console.log(data);
        $('#data-' + room).html('');
        data.room = room
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', data);
    }
    $scope.formdata = new FormData();
    $scope.sendImages = function ($files)
    {
        console.log($files);
        angular.forEach($files, function (value, key) {
            console.log('file: ' + value + ' key ' + key);
            $scope.formdata.append(key, value);
        });
    }
    $scope.uploadImages = function ()
    {

        imagesUpload.uploadImages($scope.formdata)
                .success(function (data) {
                    createImageUrl(data);

                })
                .error(function (data) {
                    //shpould log errors
                    console.log(data);
                })
    }

    var getProfileByUsername = function ()
    {
        console.log($scope.user.username);
        Profile.getProfileByUsername($scope.user.username)
                .success(function (data) {
                    console.log(data);
                    init(data);
                    
                    // should send data to the server
                })
                .error(function (data) {
                    //shpould log errors
                    console.log(data);
                })

    }


    var createImageUrl = function (data)
    {
        angular.forEach(data, function (value, key)
        {
            console.log(value);
            $scope.message.text += '<a href = "' + config.siteUrl + '/image_' + value.photo_sid + '_1.jpg"> click to see picture </a>';
        });

    }
    
       socket.on('updatechat', function (username, data) {
        console.log("Update chat message");
        console.log($filter('smilies')(data.text));
        $('#conversation-' + data.room).append('<b>' + username + ':</b>  <pre>' + $filter('smilies')(data.text) + '</pre>');
        $scope.$apply();
    });
     socket.on('updaterooms', function (rooms, current_room, users) {
        console.log("Update rooms ");
        $scope.users = users.users;
        $scope.$apply();
        console.log($scope.users);
        console.log(current_room);
        $('.current_room').html(current_room)
        $scope.current_room = current_room;
    });
    
    
   getProfileByUsername();
    //$scope.init();
});
