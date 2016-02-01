'use strict';

/**
 * @ngdoc service
 * @name publicApp.Room
 * @description
 * # Room
 * Factory in the publicApp.
 */
angular.module('publicApp')
        .factory('Connected', function ($rootScope, $q, Io, config) {
            var iceConfig = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]},
            peerConnections = {},
                    currentId, roomId,
                    stream;
            var begin;
            var pc;
            var candidates;
            var candidateTBody = document.querySelector('tbody#candidatesBody');
            function start()
            {

                var candidateTBody = document.querySelector('tbody#candidatesBody');
                console.log("Gathet Connected");
                // Clean out the table.
                while (candidateTBody.firstChild) {
                    candidateTBody.removeChild(candidateTBody.firstChild);
                }

                // Read the values from the input boxes.
                var iceServers = [];
                var pcConstraints = {};
                for (var i = 0; i < servers.length; ++i) {
                    iceServers.push(JSON.parse(servers[i].value));
                }
                var transports = document.getElementsByName('transports');
                var iceTransports;
                for (i = 0; i < transports.length; ++i) {
                    if (transports[i].checked) {
                        iceTransports = transports[i].value;
                        break;
                    }
                }

                // Create a PeerConnection with no streams, but force a m=audio line.
                // This will gather candidates for either 1 or 2 ICE components, depending
                // on whether the unbundle RTCP checkbox is checked.

                var pcConstraints = {};
                var offerOptions = {offerToReceiveAudio: 1};
                // Whether we gather IPv6 candidates.
                // pcConstraints.optional = [{'googIPv6': ipv6Check.checked}];
                // Whether we only gather a single set of candidates for RTP and RTCP.
                // offerOptions.optional = [{'googUseRtpMUX': !unbundleCheck.checked}];

                console.log('Creating new PeerConnection with config=' + JSON.stringify(iceConfig) +
                        ', constraints=' + JSON.stringify(pcConstraints));
                pc = new RTCPeerConnection(iceConfig, pcConstraints);
                pc.onicecandidate = iceCallback;
                pc.createOffer(gotDescription, noDescription, offerOptions);
            }
            function iceCallback(event) {
                var elapsed = ((window.performance.now() - begin) / 1000).toFixed(3);
                var row = document.createElement('tr');
                appendCell(row, elapsed);
                if (event.candidate) {
                    var c = parseCandidate(event.candidate.candidate);
                    appendCell(row, c.component);
                    appendCell(row, c.type);
                    appendCell(row, c.foundation);
                    appendCell(row, c.protocol);
                    appendCell(row, c.address);
                    appendCell(row, c.port);
                    appendCell(row, formatPriority(c.priority));
                    candidates.push(c);
                } else {
                    appendCell(row, getFinalResult(), 7);
                    pc.close();
                    pc = null;
                }
                candidateTBody.appendChild(row);
            }
            function gotDescription(desc) {
                begin = window.performance.now();
                candidates = [];
                pc.setLocalDescription(desc);
            }
            function noDescription(error) {
                console.log('Error creating offer: ', error);
            }

            function appendCell(row, val, span) {
                var cell = document.createElement('td');
                cell.textContent = val;
                if (span) {
                    cell.setAttribute('colspan', span);
                }
                row.appendChild(cell);
            }

// Parse a candidate:foo string into an object, for easier use by other methods.
            function parseCandidate(text) {
                var candidateStr = 'candidate:';
                var pos = text.indexOf(candidateStr) + candidateStr.length;
                var fields = text.substr(pos).split(' ');
                return {
                    'component': fields[1],
                    'type': fields[7],
                    'foundation': fields[0],
                    'protocol': fields[2],
                    'address': fields[4],
                    'port': fields[5],
                    'priority': fields[3]
                };
            }

            // Parse the uint32 PRIORITY field into its constituent parts from RFC 5245,
// type preference, local preference, and (256 - component ID).
// ex: 126 | 32252 | 255 (126 is host preference, 255 is component ID 1)
            function formatPriority(priority) {
                var s = '';
                s += (priority >> 24);
                s += ' | ';
                s += (priority >> 8) & 0xFFFF;
                s += ' | ';
                s += priority & 0xFF;
                return s;
            }

            return {start: start};

        });
