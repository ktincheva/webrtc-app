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

            var connection = {'fromid': '', 'toid': ''};

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




            var onAddStream = function (event) {
                // localVideo.classList.remove('active-video');
                console.log("on add stream");
                console.log(event.stream);
                //var videoIndex = remoteVideos.length();
                createVideoElement();
                remoteVideo = document.getElementById('remote-video-' + $scope.remoteUser);
                /*var vid = document.createElement("video");
                 remoteVideo.addEventListener('loadedmetadata', function () {
                 console.log('Remote video videoWidth: ' + this.videoWidth +
                 'px,  videoHeight: ' + this.videoHeight + 'px');
                 });*
                 vid.src = window.URL.createObjectURL(event.stream);*/
                remoteVideo.src = window.URL.createObjectURL(event.stream)
                remoteVideo.srcObject = event.stream;


                remoteVideo.onloadedmetadata = function (e) {
                    remoteVideo.play();
                };
            }
            var getPeerConnection = function (id)
            {
                console.log(peerConnections);
                if (peerConnections[id])
                    peerConnection = peerConnections[id];
                else {
                    peerConnection = new RTCPeerConnection(iceConfig)
                    peerConnection.onicecandidate = onIceCandidate;
                    peerConnection.addStream(localStream);
                    peerConnection.onaddstream = onAddStream;
                    peerConnections[id] = peerConnection;
                }
            }

            var onIceCandidate = function (event) {
                if (event.candidate) {
                    socket.emit('msg', {type: 'ice', ice: event.candidate});
                }
            }


            var onCreateSessionDescriptionError = function (error) {
                console.log('Failed to create session description: ' + error.toString());
            }

            var onCreateOfferSuccess = function (desc, toId) {
                console.log('pc1 setLocalDescription start');
                // var pc = getPeerConnection(id);
                console.log(desc);
                peerConnection.setLocalDescription(desc);
                socket.emit('msg', {room: roomId, fromId: $scope.user.username, toid: toId, sdp: desc, type: 'sdp-offer', user: $scope.user.username});
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
                if ($scope.user.username)
                {
                    socket.emit('init', {room: roomId, username: $scope.user.username});

                } else {
                    $scope.errors.push("Missing user name");
                }
            }


            var handleMessage = function (data) {
                console.log("Type of Message received " + data.type)
                console.log(data);
                switch (data.type) {
                    case 'sdp-offer':
                        console.log("Received SDP offer");
                        getPeerConnection(data.fromId)
                        $("#incomingCall").show();
                        $scope.remoteUser = data.user;
                        answerButton.onclick = sendAnswer(data.sdp, data.fromId);
                       
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        break;
                    case 'sdp-answer':
                        console.log("Received SDP answer");
                        console.log(data.sdp);
                        console.log(data.user);
                        $scope.remoteUser = data.user;
                        //should set peer connection to the pearconnections array and take peer connections between each two users
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
                            peerConnection.addIceCandidate(candidate);
                        }
                        break;
                }
            }
            $scope.sendOffer = function (toId) {
                getPeerConnection(toId);
                hangupButton.disabled = false;
                console.log('Starting call');
                // may be wiil added for second time --- check this????
                console.log('pc1 createOffer start');
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
            }

                

            var sendAnswer = function (offer, toId)
            {
                console.log('pc2 createAnswer start');
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
                                socket.emit('msg', {room: roomId, fromId: $scope.user.username, toId: toId, sdp: answer, type: 'sdp-answer', user: $scope.user.username});

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

            /*remoteVideo.addEventListener('loadedmetadata', function () {
             console.log('Remote video videoWidth: ' + this.videoWidth +
             'px,  videoHeight: ' + this.videoHeight + 'px');
             });*/
            var updateUsersConnected = function (data, status)
            {
                console.log(data);
                $scope.users = data;
                if (status)
                    $scope.status = status;
                $scope.$apply();
                console.log($scope.users);
            }
            var hangup = function () {
                console.log("User Hangup");
                console.log($scope.user.username);
                socket.emit('userleave', {room: roomId, username: $scope.user.username})
                hangupButton.disabled = true;
                startButton.disabled = false;
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

            var connectionClose = function ()
            {
                peerConnection.close();
                peerConnection = null;
            }

            var createVideoElement = function ()
            {
                var videoWrapper = $('#remote-videos-container');
                console.log(videoWrapper);
                console.log($scope.remoteUser);
                var remoteVideo = $('<video autoplay id="remote-video-' + $scope.remoteUser + '"></video>');
                remoteVideo.addClass("remote-video");
                remoteVideo.addClass("active-video");
                remoteVideo.addClass("free");
                videoWrapper.append(remoteVideo);
            }


            hangupButton.disabled = true;
            startButton.onclick = start;

            hangupButton.onclick = hangup;
            disconnectButton.onclick = disconnect;

        });
