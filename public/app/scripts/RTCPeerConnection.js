var PeerConnection = function(localStream, connection)
{
   var peerConnection;   
   var iceConfig = {'iceServers': [{
                'url': 'stun:stun.l.google.com:19302'
            }, {
                'urls': 'stun:stun.l.google.com:19302'
            }]};
    
   var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

   var connection = connection;
   var socket = connection.socket;

    console.log("Create new RTCPeerConnection")
    peerConnection = new RTCPeerConnection(iceConfig)
    peerConnection.onicecandidate = onIceCandidate;
    peerConnection.onaddstream = onAddStream;
    peerConnection.addStream(localStream);
    console.log(peerConnection);
   
    
    
   var createOffer = function(connection)
   {
            console.log('Send offer to ' + connection.toId + ' on peer connection ' + peerConnection);
            peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);    
   }
   
   var createAnswer = function(connection)
   {
            console.log('Send answer to ' + connection.fromId + ' on peer connection ' + peerConnection);
            var rtcOffer = new RTCSessionDescription(connection.sdp);
            peerConnection.setRemoteDescription(rtcOffer, function () {
                peerConnection.createAnswer(onCreateAnswerSuccess, onCreateAnswerError);
            });
   }
   
   
   var connectionClose = function ()
    {
        peerConnection.close();
        peerConnection = null;
    }
    
    var onIceCandidate = function (event) {
        if (event.candidate) {
            socket.emit('msg', {type: 'ice', ice: event.candidate, 'connection': connection});
        }
    }
     var onAddStream = function (event) {
        // localVideo.classList.remove('active-video');
        console.log("on add remote stream of remote user " + connection.toId);
        console.log(event.stream);
        createVideoElement(event.stream);
        ;
    }
    
      var onCreateSessionDescriptionError = function (error) {
        console.log('Failed to create session description: ' + error.toString());
    }

    var onCreateOfferSuccess = function (offer) {
        console.log('pc1 setLocalDescription start');
        peerConnection.setLocalDescription(offer, function () {
            console.log(connection.toId);
            // peerConnections[connection.toId] = peerConnection;
            socket.emit('msg', {room: connection.roomId, fromId: connection.user.username, toId: connection.toId, sdp: offer, type: 'sdp-offer', user: connection.user.username});
        });
    };

    var onCreateAnswerSuccess = function (answer) {
        peerConnection.setLocalDescription(new RTCSessionDescription(answer), function () {
            console.log("send the answer to the remote connection");
            $("#incomingCall").hide();
            console.log(connection);
            // peerConnections[connection.toId] = peerConnection;
            socket.emit('msg', {room: connection.roomId, fromId: connection.user.username, toId: connection.toId, sdp: answer, type: 'sdp-answer', user: connection.user.username});
        });

    };
    var onCreateAnswerError = function ()
    {
        console.log("On create answer error");
    };  
    return {
        'createOffer': createOffer,
        'createAnswer': createAnswer,
    }
}

