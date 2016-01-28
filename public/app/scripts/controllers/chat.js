'use strict';

/**
 * @ngdoc function
 * @name publicApp.controller:ChatCtrl
 * @description
 * # ChatCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
  .controller('ChatCtrl', function ($routeParams, $scope) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
   $scope.roomId= $routeParams.roomId
   console.log($scope);
  });
