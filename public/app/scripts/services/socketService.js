'use strict';
chatApp.factory('socketService', function ($sce, $location, Io, config, $q) {
    var users = {};
    var status = '';
    
    var updateUsersConnected = function(users, status){
        users = users;
        status = status;
    }

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
                if (data.ice && peerConnection)
                {
                    var candidate = new RTCIceCandidate(data.ice);
                    peerConnection.addIceCandidate(candidate);
                }
                break;
        }
    }
    
    this.socket = io.connect(location.protocol + '//' + location.host);
    
    
    this.socket.on('msg', function (data) {
        handleMessage(data);
    });
    
    
    this.socket.on('created', function (data)
    {
        console.log('room created');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    });
    this.socket.on('joined', function (data)
    {
        console.log('room joined: ');
        console.log(data.socket);
        updateUsersConnected(data.users, 'conneted')
    });
    this.socket.on('ready', function (data) {
        console.log('socket ready: ');
        console.log(data);
        updateUsersConnected(data.users, 'conneted')
    })

    this.socket.on('fill', function (data) {
        console.log('socket fill: ');
        console.log(data.socket);
        updateUsersConnected(data.users, 'conneted')
    });
    this.socket.on('userleaved', function (data)
    {
        console.log('userleaved');
        console.log(data);
        var status;
        if (data.status)
            status = data.status
        updateUsersConnected(data.users, status)
    });


    this.socket.on('connect', function () {
        console.log("Connect to the chat")
        // call the server-side function 'adduser' and send one parameter (value of prompt)
    });

    // listener, whenever the server emits 'updatechat', this updates the chat body
 
   
    
return this;
});