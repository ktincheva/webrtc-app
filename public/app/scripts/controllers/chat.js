'use strict';

/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
        .controller('ChatCtrl', function ($sce, VideoStream, $location, $routeParams, $scope, Room) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];
            var stream;
            console.log($scope);
            VideoStream.get()
                    .then(function (s) {
                        stream = URL.createObjectURL(s);
                    }, function () {
                        $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
                    });
            $scope.getLocalVideo = function () {
                return $sce.trustAsResourceUrl(stream);
            };        
        });
