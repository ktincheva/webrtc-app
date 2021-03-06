'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
        .controller('ChatCtrl', function ($sce, $location, $routeParams, $scope, config) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];

            var startButton = document.getElementById('startButton');
            var callButton = document.getElementById('callButton');
            var hangupButton = document.getElementById('hangupButton');
            var disconnectButton = document.getElementById('disconnectButton');
            var answerButton = document.getElementById('incomingAccept');
            //  var usersList = document.getElementById('users_connected');

            var localVideo = document.getElementById('local-video');
            var remoteVideo = document.getElementById('remote-video');
            var iceConfig = {'iceServers': [{
                        'url': 'stun:stun.l.google.com:19302'
                    }, {
                        'urls': 'stun:stun.l.google.com:19302'
                    }]};
            var localStream;
            var errors = {};

            var peerConnection;
            var peerConnections = {};
            var socket = io.connect(location.protocol + '//' + location.host);
            var roomId = 2;


            var offerOptions = {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            };
            console.log("controller loaded event handlers");
            /* peerConnection.oniceconnectionstatechange = function (e) {
             onIceStateChange(peerConnection, e);
             };
             */
            socket.on('msg', function (data) {
                handleMessage(data);
            });
            socket.on('created', function (data)
            {
                console.log('room created');
                console.log(data.socket);
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
                var status;
                if (data.status)
                    status = data.status
                updateUsersConnected(data.users, status)
            });

            var handleMessage = function(data) {
                console.log("Type of Message received " + data.type)
                switch (data.type) {
                    case 'sdp-offer':
                        console.log("Received SDP offer");
                        console.log(data.sdp);
                        $("#incomingCall").show();
                        answerButton.onclick = answer(data.sdp);
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        break;
                    case 'sdp-answer':
                        
                        console.log(data.sdp);
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp)); 
                        //{
                        //console.log("Call established");
                        //}, function (e) {
                        // console.log(e)
                        //});
                        break;
                    case 'ice':
                        if (data.ice)
                        { 
                            var candidate = new RTCIceCandidate(data.ice);
                            console.log(candidate);
                            console.log(peerConnection.RTCPeerConnectionState);
                            peerConnection.addIceCandidate(candidate);
                        }
                        break;
                }
            }



            var start = function () {
                startButton.disabled = true;
                
                getUserMedia({
                    audio: true,
                    video: true
                }, getStream, function (e) {
                    alert('getUserMedia() error: ' + e.name);
                })
            }

            var getStream = function (stream) {
                localStream = stream;
                console.log(stream);
                var streamUrl = window.URL.createObjectURL(stream);
                localVideo.src = streamUrl;
                localVideo.srcObject = stream;
                callButton.disabled = false;
                callButton.style.backgroundColor = 'green';
                getPeerConnetion(stream);
               
               // peerConnection.onaddstream = onAddStream;
                if ($scope.user.username)
                {
                    socket.emit('init', {room: roomId, username: $scope.user.username});
                   
                } else {
                    $scope.errors.push("Missing user name");
                }
            }

            var call = function() {
                callButton.disabled = true;
                hangupButton.disabled = false;
                console.log('Starting call');
               
                // may be wiil added for second time --- check this????
                console.log('pc1 createOffer start');
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
            }
            var onAddStream = function(event) {
               // localVideo.classList.remove('active-video');
                console.log("on add stream");
                console.log(event.stream);
                /*var vid = document.createElement("video");
                
                vid.src = window.URL.createObjectURL(event.stream);*/
                remoteVideo.src = window.URL.createObjectURL(event.stream)
                remoteVideo.srcObject = event.stream;
                remoteVideo.onloadedmetadata = function (e) {
                    remoteVideo.play();
                };
            }
            var getPeerConnetion = function(stream)
            {
                peerConnection = new RTCPeerConnection(iceConfig)
                peerConnection.onicecandidate = onIceCandidate;
                peerConnection.addStream(stream);
                peerConnection.onaddstream = onAddStream;
            }
            
            var onIceCandidate = function(event) {
                console.log('On Ice Candidates');
                console.log(event.candidate);
                if (event.candidate) {                  
                    socket.emit('msg', {type: 'ice', ice: event.candidate}); 
                }
            }

            
            var onCreateSessionDescriptionError = function(error) {
                console.log('Failed to create session description: ' + error.toString());
            }

            var onCreateOfferSuccess =function(desc) {
                console.log('pc1 setLocalDescription start');
                // var pc = getPeerConnection(id);
                console.log(desc);
                peerConnection.setLocalDescription(desc);
                socket.emit('msg', {room: roomId, sdp: desc, type: 'sdp-offer', user: $scope.user.username});
            }

            var answer = function(offer)
            {
                console.log('pc2 createAnswer start');
                console.log(peerConnection);
                return function () {
                    console.log("Receive offer: ");
                    console.log(offer.type);
                    var rtcOffer = new RTCSessionDescription(offer);
                    console.log(rtcOffer);
                    peerConnection.setRemoteDescription(rtcOffer, function () {
                        console.log(peerConnection);
                        console.log("setRemoteDescription, creating answer");
                        peerConnection.createAnswer(function (answer) {
                            console.log(answer);
                            peerConnection.setLocalDescription(new RTCSessionDescription(answer), function () {
                                // Send answer to remote end.
                                console.log("created Answer and setLocalDescription " + JSON.stringify(answer));
                                $("#incomingCall").hide();
                                socket.emit('msg', {room: roomId, sdp: answer, type: 'sdp-answer', user: $scope.user.username});
                                
                            }, function (e) {
                                console.log(e)
                            });
                        }, function (e) {
                            console.log(e)
                        });
                    }, function (e) {
                        console.log(e)
                    });
                };
            }

            localVideo.addEventListener('loadedmetadata', function () {
                console.log('Local video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            remoteVideo.addEventListener('loadedmetadata', function () {
                console.log('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });
            var updateUsersConnected = function(data, status)
            {
                console.log(data);
                $scope.users = data;
                if (status)
                    $scope.status = status;
                $scope.$apply();
                console.log($scope.users);
            }
            var hangup = function() {
                console.log("User Hangup");
                console.log($scope.user.username);

                socket.emit('userleave', {room: roomId, username: $scope.user.username})
                hangupButton.disabled = true;
                startButton.disabled = false;
                //socket.disconnect();
                connectionClose();
                stopVideo();
            }
            var disconnect = function()
            {
                hangup();
                // socket.disconnect();
            }
            var stopVideo = function()
            {
                localStream.getVideoTracks()[0].stop();
                localStream.getAudioTracks()[0].stop();
                localStream = null;
                localVideo.pause();
                //localVideo.remove();
            }

            var connectionClose = function()
            {
                peerConnection.close();
                peerConnection = null;
            }

            callButton.disabled = true;
            hangupButton.disabled = true;
            startButton.onclick = start;
            callButton.onclick = call;
            hangupButton.onclick = hangup;
            disconnectButton.onclick = disconnect;

        });
