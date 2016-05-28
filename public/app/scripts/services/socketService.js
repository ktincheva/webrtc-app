'use strict';
chatApp.factory('socketService', function ($sce, $location, Io, config, $q) {
    
    
    var users = {};
    var status = '';
    
    var peer = null;
    var peers = [];
    
    var updateUsersConnected = function(users, status){
        users = users;
        status = status;
    }
    
    var videoConstraints = {
        video: {width: {exact: 320}, height: {exact: 240}},
    }
    var localVideo = document.getElementById('local-video');
    var connection = {};
    
    
   var localStream = null;
    
    
    var socket = io.connect(location.protocol + '//' + location.host);
    connection.socket = this.socket;
    
    console.log(this.connection);
    socket.on('msg', function (data) {
        handleMessage(data);
    });
    
    
    socket.on('created', function (data)
    {
        console.log('room created');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    });
    
    socket.on('joined', function (data)
    {
        console.log('room joined: ');
        console.log(data.socket);
        updateUsersConnected(data.users, 'conneted')
    });
    
    socket.on('ready', function (data) {
        console.log('socket ready: ');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    })

    socket.on('fill', function (data) {
        console.log('socket fill: ');
        console.log(data.socket);
        updateUsersConnected(data.users, 'conneted')
    });
    
    socket.on('userleaved', function (data)
    {
        console.log('userleaved');
        console.log(data);
      
        if (data.status)
            status = data.status
        updateUsersConnected(data.users, status)
    });


    socket.on('connect', function () {
        console.log("Connect to the chat")
        // call the server-side function 'adduser' and send one parameter (value of prompt)
    });

    var handleMessage = function (data) {
        console.log("Handle message function");
        switch (data.type) {
            case 'sdp-offer':
                receiveOffer(data);
                break;
            case 'sdp-answer':
                receiveAnswer(data);
                break;
            case 'ice':
                console.log(data);
                if (data.ice && peer)
                {
                    var candidate = new RTCIceCandidate(data.ice);
                    peer.addIceCandidate(candidate);
                }
                break;
        }
    }
    
 var receiveOffer = function (data) {
        console.log("Received SDP offer data: ");
        console.log(connection);
        if (data.toId === connection.formId)
        {
            $("#incomingCall").show();
            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.type = 'answer';
            connection.sdp = data.sdp;

            console.log(' createAnswer start to' + data.fromId);
            console.log(connection);
        }
    }
       
 var receiveAnswer = function (data)
    {
        if (data.toId === $scope.user.username)
        {
           
            console.log("Received SDP answer");
           
            connection.fromId = data.toId;
            connection.toId = data.fromId;
            connection.sdp = data.sdp;
            connection.type = 'answer-received';
            socket.peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
            appendRemoteVideoElement
        }
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

   var startUserMedia = function () {
        console.log("Start user media: ");
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
        console.log(peer);
        if (peers[id])
        {
            console.log("Get existing PeerConnection" + id);
            peer = peers[id];
        }
        else {
            console.log("Create new PeerConnection")
            peer = new PeerConnection(localStream, connection)
        }
        console.log(peer);
    }
    
    
      var onGetUserMediaError = function (e) {
        console.log(e);
    }
    
      localVideo.addEventListener('loadedmetadata', function () {
        console.log('Local video videoWidth: ' + this.videoWidth +
                'px,  videoHeight: ' + this.videoHeight + 'px');
    });
    return {
        'users':users,
        'socket': socket,
        'connection': connection,
        'localStream': localStream,
        'peer': peer,
        'peers': peers,
        'startUserMedia': startUserMedia,
    }
});