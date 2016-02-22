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


            var peerConnection;
            var socket = io.connect(location.protocol + '//' + location.host);
            var roomId = 2;


            var offerOptions = {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            };

            callButton.disabled = true;
            hangupButton.disabled = true;
            startButton.onclick = start;
            callButton.onclick = call;
            hangupButton.onclick = hangup;
            disconnectButton.onclick = disconnect;


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

            function handleMessage(data) {
                console.log("Type of Message received " + data.type)
                switch (data.type) {
                    case 'sdp-offer':
                        console.log("Received SDP offer");
                        console.log(data.sdp);
                        $("#incomingCall").show();
                        answerButton.onclick = answer(data.sdp);
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
                        console.log("On ice message received");
                        console.log(data.ice.candidate);
                        if (data.ice)
                            peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
                        break;
                }
            }



            function start() {
                console.log(roomId);
                console.log($scope.user.username);
                console.log('Requesting local stream');
                startButton.disabled = true;
                getUserMedia({
                    audio: true,
                    video: true
                }, gotStream, function (e) {
                    alert('getUserMedia() error: ' + e.name);
                })
            }

            function gotStream(stream) {
                console.log('Received local stream');
                console.log("get user media")
                localStream = stream;
                console.log(stream);
                var streamUrl = window.URL.createObjectURL(stream);
                localVideo.src = streamUrl;
                callButton.disabled = false;
                callButton.style.backgroundColor = 'green';
                socket.emit('init', {room: roomId, username: $scope.user.username});
                createPeerConnetion(stream);
            }

            function call() {

                callButton.disabled = true;
                hangupButton.disabled = false;
                console.log('Starting call');
                // may be wiil added for second time --- check this????

                console.log('pc1 createOffer start');
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
            }

            function createPeerConnetion(stream)
            {
                peerConnection = new RTCPeerConnection(iceConfig)
                peerConnection.onicecandidate = onIceCandidate;
                peerConnection.addStream(stream);
                peerConnection.onaddstream = onAddStream;
            }
            function onIceCandidate(event) {
                console.log(event.candidate);
                if (event.candidate) {
                    console.log('On Ice Candidates' + event.candidate);
                    console.log('Generated candidate!');
                    socket.emit('msg', {type: 'ice', ice: event.candidate});
                    console.log('ICE candidate: \n' + event.candidate.candidate);
                }
            }

            function onAddStream(event) {
                localVideo.classList.remove('active');
                console.log("on add stream");
                console.log(event.stream);
                remoteVideo.src = window.URL.createObjectURL(event.stream);
                remoteVideo.onloadedmetadata = function (e) {
                    remoteVideo.play();
                };
            }
            function onCreateSessionDescriptionError(error) {
                console.log('Failed to create session description: ' + error.toString());
            }

            function onCreateOfferSuccess(desc) {
                console.log('pc1 setLocalDescription start');
                // var pc = getPeerConnection(id);
                console.log(desc);
                peerConnection.setLocalDescription(desc);
                socket.emit('msg', {room: roomId, sdp: desc, type: 'sdp-offer', user: $scope.user.username});
            }

            function answer(offer)
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
            function updateUsersConnected(data, status)
            {
                console.log(data);

                $scope.users = data;
                if (status)
                    $scope.status = status;
                $scope.$apply();
                console.log($scope.users);
            }
            function hangup() {
                console.log("User Hangup");
                console.log($scope.user.username);

                socket.emit('userleave', {room: roomId, username: $scope.user.username})
                hangupButton.disabled = true;
                startButton.disabled = false;
                //socket.disconnect();
                connectionClose();
                stopVideo();
            }
            function disconnect()
            {
                hangup();
                // socket.disconnect();
            }
            function stopVideo()
            {
                localStream.getVideoTracks()[0].stop();
                localStream.getAudioTracks()[0].stop();
                localStream = null;
                localVideo.pause();
                //localVideo.remove();

            }

            function connectionClose()
            {
                peerConnection.close();
                peerConnection = null;
            }



        });
