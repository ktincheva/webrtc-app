'use strict';

/**
 * @ngdoc overview
 * @name publicApp
 * @description
 * # publicApp
 *
 * Main module of the application.
 */
angular
        .module('publicApp', [
            'ngAnimate',
            'ngCookies',
            'ngResource',
            'ngRoute',
            'ngSanitize',
            'ngTouch',
            'ui.bootstrap'
        ])
        .config(function ($routeProvider) {
            $routeProvider
                    .when('/', {
                        templateUrl: 'views/main.html',
                        controller: 'MainCtrl',
                        controllerAs: 'main'
                    })
                    .when('/room/:roomId', {
                        templateUrl: 'views/room.html',
                        controller: 'RoomCtrl'
                    })
                    .when('/room', {
                        templateUrl: 'views/room.html',
                        controller: 'RoomCtrl'
                    })

                    .when('/chat', {
                        templateUrl: 'views/chat.html',
                        controller: 'ChatCtrl'
                    })
                    .when('/chat/:roomId', {
                        templateUrl: 'views/chat.html',
                        controller: 'ChatCtrl'
                    })
                    .when('/messaging', {
                        templateUrl: 'views/messaging_rooms.html',
                        controller: 'MessagingCtrl'
                    })
                    .when('/messaging/:roomId', {
                        templateUrl: 'views/messaging_rooms.html',
                        controller: 'MessagingCtrl'
                    })
                    .when('/connected', {
                        templateUrl: 'views/connected.html',
                        controller: 'ConnectedCtrl'
                    })
                    .when('/message', {
                        templateUrl: 'views/chatapp.html',
                        controller: 'ChatappCtrl'
                    })

                    .otherwise({
                        redirectTo: '/room'
                    });
        })
        .constant('config', {
            // Change it for your app URL
            SIGNALIG_SERVER_URL: 'http://192.168.1.5:5555'
            //SIGNALIG_SERVER_URL: 'https://10.2.2.201:5555'
        });

