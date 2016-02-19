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
            callButton.disabled = true;
            hangupButton.disabled = true;
            startButton.onclick = start;
            callButton.onclick = call;
            hangupButton.onclick = hangup;

            var startTime;
            var localVideo = document.getElementById('local-video');
            var remoteVideo = document.getElementById('remote-video');

            var iceConfig = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}
                ]}
            var peerConnection = new RTCPeerConnection(iceConfig),
                    socket = io.connect(location.protocol + '//' + location.host),
                    roomId = 2,
                    clientConnected = false,
                    offered = false,
                    cameraEnabled = false,
                    localObjectUrl;

            localVideo.addEventListener('loadedmetadata', function () {
                trace('Local video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            remoteVideo.addEventListener('loadedmetadata', function () {
                trace('Remote video videoWidth: ' + this.videoWidth +
                        'px,  videoHeight: ' + this.videoHeight + 'px');
            });

            remoteVideo.onresize = function () {
                trace('Remote video size changed to ' +
                        remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight);
                // We'll use the first onsize callback as an indication that video has started
                // playing out.
                if (startTime) {
                    var elapsedTime = window.performance.now() - startTime;
                    trace('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
                    startTime = null;
                }
            };

            var localStream;
            var pc1;
            var offerOptions = {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            };

            peerConnection.onicecandidate = function (evnt) {
                console.log('on ise candidate');
                socket.emit('msg', {room: roomId, ice: evnt.candidate, type: 'ice'});
            };

            peerConnection.onaddstream = function (evnt) {
                localVideo.classList.remove('active');
                console.log("on add stream");
                console.log(evnt.stream);
                remoteVideo.src = window.URL.createObjectURL(evnt.stream);
            };
            console.log("controller loaded event handlers");
            socket.on('peer.connected', function (data) {

                console.log('peer connected' + data)
                clientConnected = true;
                console.log(clientConnected);
                /* if (!offered && cameraEnabled)
                 makeOffer(); */
            });



            peerConnection.oniceconnectionstatechange = function (e) {

                onIceStateChange(peerConnection, e);
            };

            socket.on('msg', function (data) {
                handleMessage(data);
            });
            socket.on('created', function (data)
            {
                console.log('room created' + data);

            });
            
            socket.on('joined', function(data)
            {
                console.log('room joined: ' + data)
            });

            socket.on('ready', function (data) {
                console.log('socket ready: ' + data);
            })
            
            socket.on('fill', function(data){
                console.log('socket fill: '+data);
            });
            function handleMessage(data) {
                console.log(data.type);
                switch (data.type) {
                    case 'sdp-offer':
                        console.log("SDP offer");
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        peerConnection.createAnswer(function (sdp) {
                            peerConnection.setLocalDescription(sdp);
                            socket.emit('msg', {room: roomId, sdp: sdp, type: 'sdp-answer'});
                        }, function (e) {
                            console.log(e);
                        });
                        break;
                    case 'sdp-answer':
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        break;
                    case 'ice':
                        if (data.ice)
                            peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
                        break;
                }
            }

            function gotStream(stream) {
                trace('Received local stream');
                console.log("get user media");
                console.log(stream);
                //localVideo.mozSrcObject = stream;

                // VideoTracks = stream.getVideoTracks();
                localVideo.src = window.URL.createObjectURL(stream);
                localStream = stream;
                callButton.disabled = false;
                peerConnection.addStream(stream);

                cameraEnabled = true;
            }
            function start() {

                console.log(roomId);
                console.log($scope.user.username);

                socket.emit('init', {room: roomId, username: $scope.user.username});
                trace('Requesting local stream');
                startButton.disabled = true;
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                })
                        .then(gotStream)
                        .catch(function (e) {
                            alert('getUserMedia() error: ' + e.name);
                        });
            }



            function call() {
                callButton.disabled = true;
                hangupButton.disabled = false;
                trace('Starting call');

                startTime = window.performance.now();
                var videoTracks = localStream.getVideoTracks();
                var audioTracks = localStream.getAudioTracks();
                if (videoTracks.length > 0) {
                    trace('Using video device: ' + videoTracks[0].label);
                }
                if (audioTracks.length > 0) {
                    trace('Using audio device: ' + audioTracks[0].label);
                }


                // may be wiil added for second time --- check this????

                trace('pc1 createOffer start');
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError,
                        offerOptions);
            }

            function onCreateSessionDescriptionError(error) {
                trace('Failed to create session description: ' + error.toString());
            }

            function onCreateOfferSuccess(desc) {
                trace('Offer from pc1\n' + desc.sdp);
                trace('pc1 setLocalDescription start');
                // var pc = getPeerConnection(id);



                peerConnection.setLocalDescription(desc, function () {
                    onSetLocalSuccess(peerConnection);
                    socket.emit('msg', {room: roomId, sdp: desc.sdp, type: 'sdp-offer', user: 'username'});
                }, onSetSessionDescriptionError);


                // accept the incoming offer of audio and video.

            }

            function Answer()
            {
                trace('pc2 createAnswer start');
                // Since the 'remote' side has no media stream we need
                // to pass in the right constraints in order for it to
                var offer = getOfferFromFriend();
                navigator.getUserMedia({video: true}, function (stream) {
                    peerConnection.onaddstream({stream: stream});
                    peerConnection.addStream(stream);

                    peerConnection.setRemoteDescription(new RTCSessionDescription(offer), function () {
                        peerConnection.createAnswer(function (answer) {
                            peerConnection.setLocalDescription(new RTCSessionDescription(answer), function () {
                                // send the answer to a server to be forwarded back to the caller (you)
                            }, error);
                        }, error);
                    }, error);
                });
            }

            function onSetLocalSuccess(pc) {
                trace(getName(pc) + ' setLocalDescription complete');

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

            function onIceCandidate(pc, event) {
                trace('On Ice Candidates' + event.candidate);
                if (event.candidate) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(event.candidate),
                            function () {
                                onAddIceCandidateSuccess(pc);
                            },
                            function (err) {
                                onAddIceCandidateError(pc, err);
                            }
                    );
                    $scope.users_connected = event.candidate.candidate;
                    console.log($scope.users_connected);
                    trace(getName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
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
                    console.log('ICE state change event: ', event);
                }
            }

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
