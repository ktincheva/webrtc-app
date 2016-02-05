'use strict'

/**
 * @ngdoc function
 * @name publicApp.controller:ConnectedCtrl
 * @description
 * # ConnectedCtrl
 * Controller of the publicApp
 */

angular.module('publicApp')
  .controller('ConnectedCtrl', function ( $routeParams, Connected) {
      this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    var gatherButton = document.querySelector('button#gather');
v
            gatherButton.onclick = Connected.start;
            
  });