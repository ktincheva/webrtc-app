'use strict';
/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
        .controller('ChatCtrl', function ($sce, $location, $routeParams, $scope, $filter, config) {
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
            // var remoteVideo = document.getElementById('remote-video');

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
            
            var videoConstraints = {
                audio: true,
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720},
                    facingMode:  "environment", 
                }

            }
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
                console.log("Update chat message");
                console.log($filter('smilies')(data.text));
                 
                $scope.username = username;
                $('#conversation-' + data.room).append('<b>' + username + ':</b>  <pre>'+$filter('smilies')(data.text)+'</pre>');
                $scope.$apply();
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
                console.log("on add remote stream of remote user " + $scope.remoteUser);
                console.log(event.stream);
                createVideoElement(event.stream);
                ;
            }
            var getPeerConnection = function (id)
            {
                console.log('Get peer connection');
                console.log('with id ' + id);
                console.log(peerConnections);
                if (peerConnections[id])
                {
                    console.log("Get existing PeerConnection" + id);
                    peerConnection = peerConnections[id];
                }
                else {
                    console.log("Create new PeerConnection")
                    peerConnection = new RTCPeerConnection(iceConfig)
                    peerConnection.onicecandidate = onIceCandidate;
                    peerConnection.onaddstream = onAddStream;
                    peerConnection.addStream(localStream);
                    peerConnections[id] = peerConnection;
                }

                console.log(peerConnection);
            }

            var onIceCandidate = function (event) {

                if (event.candidate) {
                    socket.emit('msg', {type: 'ice', ice: event.candidate, 'connection': connection});
                }
            }


            var onCreateSessionDescriptionError = function (error) {
                console.log('Failed to create session description: ' + error.toString());
            }

            var onCreateOfferSuccess = function (offer) {
                console.log('pc1 setLocalDescription start');
                peerConnection.setLocalDescription(offer, function () {
                    console.log(connection.toId);
                    // peerConnections[connection.toId] = peerConnection;
                    socket.emit('msg', {room: roomId, fromId: $scope.user.username, toId: connection.toId, sdp: offer, type: 'sdp-offer', user: $scope.user.username});
                });
            };

            var onCreateAnswerSuccess = function (answer) {
                peerConnection.setLocalDescription(new RTCSessionDescription(answer), function () {
                    console.log("send the answer to the remote connection");
                    $("#incomingCall").hide();
                    console.log(connection);
                    // peerConnections[connection.toId] = peerConnection;
                    socket.emit('msg', {room: roomId, fromId: $scope.user.username, toId: connection.toId, sdp: answer, type: 'sdp-answer', user: $scope.user.username});
                });

            };
            var onCreateAnswerError = function ()
            {
                console.log("On create answer error");
            };

            var startUserMedia = function () {
                console.log("Start user media: ");
                console.log(connection);

                if (!localStream)
                {
                    getUserMedia(videoConstraints, getStream, onGetUserMediaError);
                } else {
                    addStreamAndSetDescriptions(localStream);
                }
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
                appendRemoteVideoElement(connection.toId)

                if (connection.type === 'offer')
                {
                    console.log('Send offer to ' + connection.toId + ' on peer connection ' + peerConnection);
                    peerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
                }
                else if (connection.type === 'answer')
                {
                    console.log('Send answer to ' + connection.fromId + ' on peer connection ' + peerConnection);
                    var rtcOffer = new RTCSessionDescription(connection.sdp);
                    peerConnection.setRemoteDescription(rtcOffer, function () {
                        peerConnection.createAnswer(onCreateAnswerSuccess, onCreateAnswerError);
                    });
                }
                // peerConnections[connection.toId] = peerConnection;
            }
            var onGetUserMediaError = function (e) {
                console.log(e.message);
            }
            var handleMessage = function (data) {
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

// toId == received fromId

            var sendAnswer = function (connection)
            {
                return function ()
                {
                    console.log("Send Answer to");
                    console.log(connection);
                    $scope.remoteUser = connection.toId;
                    startUserMedia();
                    console.log("Receive offer: ");
                    console.log(connection.type);
                };
            };

            var receiveAnswer = function (data)
            {
                if (data.toId === $scope.user.username)
                {
                    console.log("Received SDP answer");
                    $scope.remoteUser = data.user;
                    connection.fromId = data.toId;
                    connection.toId = data.fromId;
                    connection.sdp = data.sdp;
                    connection.type = 'answer-received';
                    peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                }
            }

            $scope.sendOffer = function (toId) {
                console.log('Starting call to');
                console.log(toId);
                connection.formId = $scope.user.username;
                connection.toId = toId;
                connection.type = 'offer'
                $scope.remoteUser = toId;
                if ($scope.user.username && connection.toId)
                {
                    hangupButton.disabled = false;
                    // may be wiil added for second time --- check this????
                    console.log('pc1 createOffer start');
                    // getPeerConnection(connection.toId);
                    startUserMedia();
                } else {
                    errors.push("Missing user name");
                }

            }

            var receiveOffer = function (data) {
                console.log("Received SDP offer data: ");
                console.log(data);
                if (data.toId === $scope.user.username)
                {
                    $("#incomingCall").show();
                    connection.fromId = data.toId;
                    connection.toId = data.fromId;
                    connection.type = 'answer';
                    connection.sdp = data.sdp;

                    console.log(' createAnswer start to' + data.fromId);
                    console.log(connection);
                    $scope.remoteUser = data.user;
                    //getPeerConnection(connection.fromId);
                    //should set peer connection to the pearconnections array and take peer connections between each two users
                    //peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    //peerConnection[connection.toId] = peerConnection;
                    answerButton.onclick = sendAnswer(connection);

                }
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

            var createVideoElement = function (stream)
            {
                console.log("Set stream to the videoe element per remote user id " + $scope.remoteUser);

                var remoteVideo = document.getElementById('remote-video-' + $scope.remoteUser);
                console.log(remoteVideo);
                /*var vid = document.createElement("video");
                 ;*
                 vid.src = windowv.URL.createObjectURL(event.stream);*/
                remoteVideo.src = window.URL.createObjectURL(stream)
                // remoteVideo.srcObject = stream;
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



            $scope.switchRoom = function (room) {
                console.log('switch to room: ' + room)
                socket.emit('switchRoom', room);
            }
            $scope.senddata = function (data, room) {
                console.log("Send message data")
                console.log(data);
                $('#data-' + room).html(''); 
                data.room = room
                // tell server to execute 'sendchat' and send along one parameter
                socket.emit('sendchat', data);
            }
            $scope.sendImages = function()
            {
                console.log($scope.files);
            }
            $scope.init = function () {
                $scope.message  = {text: "alabala"};
                console.log('document ready');
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
            
        
            
            $scope.init();
        });
