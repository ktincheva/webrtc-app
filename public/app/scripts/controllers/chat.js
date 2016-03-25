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

            //var startButton = document.getElementById('startButton');

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
            var rooms = ['room1', 'room2', 'room3'];

            var peerConnection;
            var peerConnections = {};
            var socket = io.connect(location.protocol + '//' + location.host);
            var roomId = 2;

            var connection = {};

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


            socket.on('connect', function () {
                console.log("Connect to the chat")
                // call the server-side function 'adduser' and send one parameter (value of prompt)
            });

            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('updatechat', function (username, data) {
                console.log(data);
                $scope.username = username;
                $('#conversation-' + data.room).append('<b>' + username + ':</b> ' + data.text + '<br>');
            });
            // listener, whenever the server emits 'updaterooms', this updates the room the client is in
            socket.on('updaterooms', function (rooms, current_room, users) {
                console.log("Update rooms ");
                $scope.users = users.users;
                $scope.$apply();
                console.log($scope.users);
                console.log(current_room);
                $('.current_room').html(current_room)
                $scope.current_room = current_room;
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
                console.log('Get pear connection');
                
                if (peerConnections[id])
                    peerConnection = peerConnections[id];
                else {
                    console.log("Create new PeerConnection")
                    peerConnection = new RTCPeerConnection(iceConfig)
                    peerConnection.onicecandidate = onIceCandidate;
                    peerConnection.onaddstream = onAddStream;
                    peerConnections[id] = peerConnection;
                    console.log(peerConnection);
                }
                console.log(peerConnections);
            }

            var onIceCandidate = function (event) {

                if (event.candidate) {
                    socket.emit('msg', {type: 'ice', ice: event.candidate});

                }
            }


            var onCreateSessionDescriptionError = function (error) {
                console.log('Failed to create session description: ' + error.toString());
            }

            var onCreateOfferSuccess = function (desc) {
                console.log('pc1 setLocalDescription start');
                console.log(connection.toId);

                peerConnection.setLocalDescription(desc);
                socket.emit('msg', {room: roomId, fromId: $scope.user.username, toId: connection.toId, sdp: desc, type: 'sdp-offer', user: $scope.user.username});
            }
            var startUserMedia = function () {
                console.log("Start user media");
                console.log(localStream)
                if (!localStream)
                {
                    var media = getUserMedia({
                        audio: true,
                        video: true
                    }, getStream, function (e) {
                        console.log(e.message);
                    });
                } else {
                    getPeerConnection(connection.toId);
                    peerConnection.addStream(localStream);
                }
            }

            var getStream = function (stream) {
                localStream = stream;
                console.log(localStream);
                var streamUrl = window.URL.createObjectURL(stream);
                localVideo.src = streamUrl;
                localVideo.srcObject = stream;
                console.log(connection);
                getPeerConnection(connection.toId);
                peerConnection.addStream(stream);
            }


            var handleMessage = function (data) {
                switch (data.type) {
                    case 'sdp-offer':
                        console.log("Received SDP offer");
                        if (data.toId == $scope.user.username)
                        {
                            //getPeerConnection(data.fromId)

                            $("#incomingCall").show();
                            connection.fromId = data.fromId;
                            connection.toId = data.toId;
                            console.log(data);
                            console.log(' createAnswer start' + data.toId);
                            console.log(connection);

                            $scope.remoteUser = data.user;
                            getPeerConnection(connection.toId);
                            answerButton.onclick = sendAnswer(data.sdp, data.fromId);
                            peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        }
                        break;
                    case 'sdp-answer':
                        console.log("Received SDP answer");
                        $scope.remoteUser = data.user;
                        console.log('form' + data.formId);
                        console.log('toid' + data.toId);
                        connection.formId = data.formId;
                        connection.toId = data.toId;

                        getPeerConnection(connection.toId);
                        //should set peer connection to the pearconnections array and take peer connections between each two users
                        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                        //{
                        //console.log("Call established");
                        //}, function (e) {
                        // console.log(e)
                        //});
                        break;
                    case 'ice':

                        console.log(data);
                        if (data.ice)
                        {
                            var candidate = new RTCIceCandidate(data.ice);
                            peerConnection.addIceCandidate(candidate);
                        }
                        break;
                }
            }



            var sendAnswer = function (offer, toId)
            {

                return function () {

                    startUserMedia();
                    console.log()
                    console.log("Receive offer: ");
                    console.log(offer.type);
                    var rtcOffer = new RTCSessionDescription(offer);
                    console.log(peerConnection);
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
            hangupButton.onclick = hangup;
            disconnectButton.onclick = disconnect;
            $scope.rooms = rooms;
            $('#chat_rooms').hide();
            $scope.login = function ()
            {
                console.log("login")
                if (!$scope.user.username)
                {
                    console.log("Username is empty!!!");
                    $scope.errors.push("Empty username");
                }
                else {
                    $('#chat_rooms').show();
                    socket.emit('init', {room: roomId, username: $scope.user.username});

                }

                // socket.emit('adduser', $scope.user.username);
            }
            $scope.sendOffer = function (toId) {

                console.log(toId);
                connection.formId = $scope.user.username;
                connection.toId = toId;
                if ($scope.user.username)
                {
                    getPeerConnection(connection.toId);

                    hangupButton.disabled = false;
                    console.log('Starting call');
                    // may be wiil added for second time --- check this????
                    console.log('pc1 createOffer start');
                } else {
                    errors.push("Missing user name");
                }
                startUserMedia()
                peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
            }


            $scope.switchRoom = function (room) {
                console.log('switch to room: ' + room)
                socket.emit('switchRoom', room);
            }
            $scope.senddata = function (data, room) {
                console.log(data);
                $('#data-' + room).val('');
                data.room = room;
                // tell server to execute 'sendchat' and send along one parameter
                socket.emit('sendchat', data);
            }

            $scope.init = function () {

                console.log('documet ready');
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

        });
