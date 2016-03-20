'use strict';

/**
 * @ngdoc directive
 * @name publicApp.directive:videoPlayer
 * @description
 * # videoPlayer
 */

var video_template = '<div> <video class="remote-video free" autoplay id="remote-video"></video>adsadadadsadad</div>';
angular.module('publicApp')
        .directive('remoteVideoPlayers', function (config) {
            var tmpl = '';
            console.log("init video objects" + config.max_connections);
            for (var i =0; i < 5; i++)
            {
                tmpl += video_template
            }
            return {
                template: tmpl
            }
        });

