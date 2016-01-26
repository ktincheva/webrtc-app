'use strict';

/**
 * @ngdoc service
 * @name publicApp.Io
 * @description
 * # Io
 * Factory in the publicApp.
 */
angular.module('publicApp')
  .factory('Io', function () {
    // Service logic
    // ...

    var meaningOfLife = 42;

    // Public API here
    return {
      someMethod: function () {
        return meaningOfLife;
      }
    };
  });
