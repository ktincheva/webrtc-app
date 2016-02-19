'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
        .controller('ChatCtrl', function ($sce, $location, $routeParams, $scope) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];
            window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            window.URL = window.URL || window.mozURL || window.webkitURL;
            var startButton = document.getElementById('startButton');
            var callButton = document.getElementById('callButton');
            var hangupButton = document.getElementById('hangupButton');
            var answerButton = document.getElementById('incomingAccept');
            var usersList = document.getElementById('users_connected');


            var startTime;
            var localVideo = document.getElementById('local-video');
            var remoteVideo = document.getElementById('remote-video');
            var iceConfig = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
            var localStream;


            var peerConnection,
                    socket = io.connect(location.protocol + '//' + location.host),
                    roomId = 2,
                    clientConnected = false,
                    offered = false,
                    cameraEnabled = false,
                    localObjectUrl;


            var offerOptions = {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            };

            callButton.disabled = true;
            hangupButton.disabled = true;
            startButton.onclick = start;
            callButton.onclick = call;
            hangupButton.onclick = hangup;


            console.log("controller loaded event handlers");
            socket.on('peer.connected', function (data) {
                console.log('peer connected' + data)
                trace(data.socket);
                usersList.innerHTML += data.users;
                /*if (!offered && cameraEnabled)
                 makeOffer(); */
            });
            /* peerConnection.oniceconnectionstatechange = function (e) {
             onIceStateChange(peerConnection, e);
             };
             */
            socket.on('msg', function (data) {
                handleMessage(data);
            });
            socket.on('created', function (data)
            {
                trace('room created');
                trace(data.socket);
            });
            socket.on('joined', function (data)
            {
                trace('room joined: ');
                trace(data.socket);
            });
            socket.on('ready', function (data) {
                trace('socket ready: ');
                trace(data.socket)
            })

            socket.on('fill', function (data) {
                trace('socket fill: ');
                trace(data.socket);
            });

            function handleMessage(data) {

                switch (data.type) {
                    case 'sdp-offer':
                        trace("SDP offer");
                        $("#incomingCall").show();
                        answerButton.onclick = answer(data.sdp);
                        break;
                    case 'sdp-answer':
                        $("#incomingCall").hide();
                        trace(data.sdp);
                        // peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp), function ()
                        //{
                        //console.log("Call established");
                        //}, function (e) {
                        // console.log(e)
                        //});
                        break;
                    case 'ice':
                        if (data.ice)
                            peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
                        break;
                }
            }

            function gotStream(stream) {
                trace('Received local stream');
                trace("get user media")
                localStream = stream;
                trace(stream);
                var streamUrl = window.URL.createObjectURL(stream);
                localVideo.src = streamUrl;
                callButton.disabled = false;
                createPeerConnetion();
                socket.emit('init', {room: roomId, username: $scope.user.username});
            }


            function start() {
                trace(roomId);
                trace($scope.user.username);
                trace('Requesting local stream');
                startButton.disabled = true;
                getUserMedia({
                    audio: true,
                    video: true
                }, gotStream, function (e) {
                    alert('getUserMedia() error: ' + e.name);
                })
            }



            function call() {
                callButton.disabled = true;
                hangupButton.disabled = false;
                trace('Starting call');
                startTime = window.performance.now();

                // may be wiil added for second time --- check this????

                trace('pc1 createOffer start');
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
            }

            function createPeerConnetion()
            {
                peerConnection = new RTCPeerConnection(iceConfig)
                peerConnection.addStream(localStream);
                peerConnection.onicecandidate = onIceCandidate;
                peerConnection.onaddstream = function (event) {
                    localVideo.classList.remove('active');
                    trace("on add stream");
                    trace(event.stream);

                    remoteVideo.src = window.URL.createObjectURL(event.stream);
                    remoteVideo.onloadedmetadata = function (e) {
                         remoteVideo.play();
                    };
                };

            }

            function onCreateSessionDescriptionError(error) {
                trace('Failed to create session description: ' + error.toString());
            }

            function onCreateOfferSuccess(desc) {
                trace('pc1 setLocalDescription start');
                // var pc = getPeerConnection(id);

                peerConnection.setLocalDescription(desc);
                socket.emit('msg', {room: roomId, sdp: desc, type: 'sdp-offer', user: 'username'});
            }

            function answer(offer)
            {
                trace('pc2 createAnswer start');
                trace(offer);
                peerConnection.setRemoteDescription(new RTCSessionDescription(offer), function () {
                    console.log("setRemoteDescription, creating answer");
                    peerConnection.createAnswer(function (answer) {
                        console.log(answer);
                        peerConnection.setLocalDescription(answer, function () {
                            // Send answer to remote end.
                            console.log("created Answer and setLocalDescription " + JSON.stringify(answer));
                            socket.emit('msg', {room: roomId, sdp: answer, type: 'sdp-answer', user: 'username'});
                        }, function (e) {
                            console.log(e)
                        });
                    }, function (e) {
                        console.log(e)
                    });
                }, function (e) {
                    console.log(e)
                });
                /*
                 peerConnection.createAnswer(onCreateAnswerSuccess,function (e) {
                 console.log(e);
                 }); 
                 */
            }



            function onSetRemoteSuccess(pc) {
                trace(getName(pc) + ' setRemoteDescription complete');
            }

            function onSetSessionDescriptionError(error) {
                trace('Failed to set session description: ' + error.toString());
            }

            function gotRemoteStream(e) {
                console.log('test' + e);
            }

            function onCreateAnswerSuccess(desc) {
                trace('Answer from pc2:\n' + desc.sdp);
                trace('pc2 setLocalDescription start');
                peerConnection.setLocalDescription(desc, function () {
                    onSetLocalSuccess(peerConnection);
                }, onSetSessionDescriptionError);
                trace('pc1 setRemoteDescription start');
                peerConnection.setRemoteDescription(desc, function () {
                    onSetRemoteSuccess(peerConnection);
                }, onSetSessionDescriptionError);
            }

            function onIceCandidate(event) {
                trace('On Ice Candidates' + event.candidate);
                if (event.candidate) {
                    trace('Generated candidate!');
                    $scope.users_connected = event.candidate.candidate;
                    socket.emit('msg', {type: 'ice', ice: event.candidate});
                    trace($scope.users_connected);
                    trace(getName(peerConnection) + ' ICE candidate: \n' + event.candidate.candidate);
                }
            }

            function onAddIceCandidateSuccess(pc) {
                trace(getName(pc) + ' addIceCandidate success');
            }

            function onAddIceCandidateError(pc, error) {
                trace(getName(pc) + ' failed to add ICE Candidate: ' + error.toString());
            }

            function onIceStateChange(pc, event) {
                if (pc) {
                    trace(getName(pc) + ' ICE state: ' + pc.iceConnectionState);
                    trace('ICE state change event: ', event);
                }
            }
            
             localVideo.addEventListener('loadedmetadata', function () {
                trace('Local video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            remoteVideo.addEventListener('loadedmetadata', function () {
                trace('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            function hangup() {
                trace('Ending call');
                pc1.close();
                pc2.close();
                pc1 = null;
                pc2 = null;
                hangupButton.disabled = true;
                callButton.disabled = false;
            }
            function getName(pc) {
                return pc
            }

            function getOtherPc(pc) {
                //
            }


        });
