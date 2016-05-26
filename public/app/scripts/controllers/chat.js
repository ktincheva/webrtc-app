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
    var answerButton = document.getElementById('incomingAccept');
    var userMediaButton = document.getElementById('getUserMedia');
    var sendOfferToAll = document.getElementById('sendOfferToAll');
    //  var usersList = document.getElementById('users_connected');

    var localVideo = document.getElementById('local-video');
    // var remoteVideo = document.getElementById('remote-video');
    
    
    var rooms = ['room1', 'room2', 'room3'];
    var roomId = 'room1';

    var connection = {};
    var localStream;
    
    var socket = socketService.socket;
    var peer = null;
    var peers = [];
    
    
    var videoConstraints = {
        video: {width: {exact: 320}, height: {exact: 240}},
    }
    
    
    console.log(socket);
    $scope.users = socket.users;
    $scope.status = socket.status;

// toId == received fromId
    var startUserMedia = function () {
        console.log("Start user media: ");
        console.log(connection);

        ///////////////
        if (localStream) {
            localStream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        setTimeout(function () {
            navigator.mediaDevices.getUserMedia(
                    videoConstraints
                    ).then(
                    getStream,
                    onGetUserMediaError
                    );
        }, (localStream ? 200 : 0));
    }
        var getStream = function (stream) {
        localStream = stream;
        var streamUrl = window.URL.createObjectURL(stream);
        localVideo.src = streamUrl;
        localVideo.srcObject = stream;
        console.log('Add local stream to the peer connection');
        console.log(localStream);
        addStreamAndSetDescriptions(stream);
    }
    var addStreamAndSetDescriptions = function (stream)
    {

        console.log("Add Stream and set local decription");
        console.log(connection);
        getPeerConnection(connection.toId);
        // create video element
        appendRemoteVideoElement(connection.toId)

        if (connection.type === 'offer')
        {
            peer.createOffer(connection)
        }
        else if (connection.type === 'answer')
        {
            peer.createAnswer(connection);
        }
        // peerConnections[connection.toId] = peerConnection;
    }
    
    var getPeerConnection = function (id)
    {
        console.log('Get peer connection');
        console.log('with id ' + id);
        console.log(peerConnections);
        if (peera[id])
        {
            console.log("Get existing PeerConnection" + id);
            peer = peers[id];
        }
        else {
            console.log("Create new PeerConnection")
            peer = new RTCPeerConnection(iceConfig)
        }
        console.log(peer);
    }
    
    
      var onGetUserMediaError = function (e) {
        console.log(e);
    }
    
    var sendAnswer = function (connection)
    {
        return function ()
        {
            console.log("Send Answer to");
            console.log(connection);
            $scope.remoteUser = connection.toId;
            startUserMedia();
            console.log("Receive offer: ");
            console.log(connection.type);
        };
    };

    var receiveAnswer = function (data)
    {
        if (data.toId === $scope.user.username)
        {
            console.log("Received SDP answer");
            $scope.remoteUser = data.user;
            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.sdp = data.sdp;
            connection.type = 'answer-received';
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
    }
    
    $scope.sendOffer = function (toId) {
        console.log('Starting call to');
        console.log(toId);
        connection.formId = $scope.user.username;
        connection.toId = toId;
        connection.type = 'offer'
        $scope.remoteUser = toId;
        if ($scope.user.username && connection.toId)
        {
            hangupButton.disabled = false;
            // may be wiil added for second time --- check this????
            console.log('pc1 createOffer start');
            // getPeerConnection(connection.toId);
            startUserMedia();
        } else {
            errors.push("Missing user name");
        }

    }
    $scope.sendOfferToAll = function () {
        console.log('Starting call to all in roorm');
        console.log(toId);
        connection.formId = $scope.user.username;
        connection.toId = toId;
        connection.type = 'offer'
        $scope.remoteUser = toId;
        
        if ($scope.user.username && connection.toId)
        {
            hangupButton.disabled = false;
            // may be wiil added for second time --- check this????
            console.log('pc1 createOffer start');
            // getPeerConnection(connection.toId);
            startUserMedia();
        } else {
            errors.push("Missing user name");
        }

    }
    var receiveOffer = function (data) {
        console.log("Received SDP offer data: ");
        console.log($scope);
        if (data.toId === $scope.user.username)
        {
            $("#incomingCall").show();
            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.type = 'answer';
            connection.sdp = data.sdp;

            console.log(' createAnswer start to' + data.fromId);
            console.log(connection);
            $scope.remoteUser = data.user;
            //getPeerConnection(connection.fromId);
            //should set peer connection to the pearconnections array and take peer connections between each two users
            //peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            //peerConnection[connection.toId] = peerConnection;
            answerButton.onclick = sendAnswer(connection);

        }
    }

    localVideo.addEventListener('loadedmetadata', function () {
        console.log('Local video videoWidth: ' + this.videoWidth +
                'px,  videoHeight: ' + this.videoHeight + 'px');
    });

    /*remoteVideo.addEventListener('loadedmetadata', function () {
     console.log('Remote video videoWidth: ' + this.videoWidth +
     'px,  videoHeight: ' + this.videoHeight + 'px');
     });*/
    /*updateUsersConnected = function (data, status)
    {
        concole.log("----------------- Update connected users ---------------------");
        console.log(data);
        $scope.users = data;
        if (status)
            $scope.status = status;
        setTimeout(function(){
        $scope.$apply();
    })
        
        console.log($scope.users);
    }*/
    var hangup = function () {
        console.log("User Hangup");
        console.log($scope.user.username);
        socket.emit('userleave', {room: roomId, username: $scope.user.username})
        hangupButton.disabled = true;
        localStream = null;
        //socket.disconnect();
        connectionClose();
        stopVideo();
    }
    var disconnect = function ()
    {
        hangup();
        // socket.disconnect();
    }
    var stopVideo = function ()
    {
        localStream.getVideoTracks()[0].stop();
        localStream.getAudioTracks()[0].stop();
        localStream = null;
        localVideo.pause();
        //localVideo.remove();
    }

  

    var appendRemoteVideoElement = function (id)
    {
        var remoteVideo = document.getElementById('remote-video-' + id);
        if (!remoteVideo)
        {
            var videoWrapper = document.getElementById("remote-videos-container");
            var video = document.createElement("video");
            video.setAttribute("id", "remote-video-" + id);
            video.setAttribute("class", "remote-video active-video");
            video.style.verticalAlign = "middle";
            videoWrapper.appendChild(video)
            video.autoplay = true;
            $scope.$apply();
            remoteVideo = document.getElementById("remote-video-" + id)
            remoteVideo.addEventListener('loadedmetadata', function () {
                remoteVideo.play();
                console.log('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });
        }
    }

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
    userMediaButton.onclick = startUserMedia;
    disconnectButton.onclick = disconnect;
    sendOfferToAll.onclick = sendOfferToAll;
    
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
