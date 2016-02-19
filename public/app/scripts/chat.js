(function ($scope) {
    console.log($scope);
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.URL = window.URL || window.mozURL || window.webkitURL;
    window.navigator.getUserMedia = window.navigator.getUserMedia || window.navigator.webkitGetUserMedia || window.navigator.mediaDevices.getUserMedia;

    var localVideo = document.getElementById('local-video'),
            remoteVideo = document.getElementById('remote-video'),
            iceConfig = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}
                ]},
     peerConnection = new RTCPeerConnection(iceConfig),
            socket = io.connect(location.protocol + '//' + location.host),
            roomId = 2,
            clientConnected = false,
            offered = false,
            cameraEnabled = false,
            localObjectUrl;

   
    console.log(peerConnection);
    document.getElementById('url-input').value = location.href;

    peerConnection.onicecandidate = function (evnt) {
        console.log('on ise candidate');
        socket.emit('msg', {room: roomId, ice: evnt.candidate, type: 'ice'});
    };

    peerConnection.onaddstream = function (evnt) {
        localVideo.classList.remove('active');

        console.log("on add stream");
       // console.log(evnt.stream);
        remoteVideo.src = URL.createObjectURL(evnt.stream);
    };

    socket.on('peer.connected', function () {

        console.log('peer connected')
        clientConnected = true;
        console.log(clientConnected);
        if (!offered && cameraEnabled)
            makeOffer();
    });

    socket.on('msg', function (data) {
        handleMessage(data);
    });

    function makeOffer() {
        offered = true;
        console.log(peerConnection)
        peerConnection.createOffer(function (sdp) {
            peerConnection.setLocalDescription(sdp);
            socket.emit('msg', {room: roomId, sdp: sdp, type: 'sdp-offer'});
        }, function (e) {
            console.log(e);
        },
                {'OfferToReceiveVideo': true, 'OfferToReceiveAudio': true});
    }

    function handleMessage(data) {
        console.log(data.type);
        switch (data.type) {
            case 'sdp-offer':
                data.sdp.type = 'offer';
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                peerConnection.createAnswer(function (sdp) {
                    
                    peerConnection.setLocalDescription(sdp);
                    socket.emit('msg', {room: roomId, sdp: sdp, type: 'sdp-answer'});
                }, function (e) {
                    console.log(e);
                });
                break;
            case 'sdp-answer':
                console.log("sdp-answer");
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                break;
            case 'ice':
                if (data.ice)
                    peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
                break;
        }
    }
    console.log("room id before init"+roomId);
    socket.emit('init', {room: roomId});

    navigator.getUserMedia({video: true, audio: true}, function (stream) {
        console.log("get user media");

        localObjectUrl = URL.createObjectURL(stream);
        console.log("get user media: "+clientConnected);
        localVideo.src = localObjectUrl;
        console.log('---- add strem -----')
        peerConnection.addStream(stream);
        cameraEnabled = true;
        if (clientConnected)
            makeOffer();
    }, function () {
        console.log('error');
    });

}());