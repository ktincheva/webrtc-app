/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';
var smilies_selector = angular.module('publicApp', ['ui.bootstrap'])
var
        main = "smile",
        smilies = ["biggrin", "confused", "cool", "cry", "eek", "evil", "like", "lol", "love", "mad", "mrgreen", "neutral", "question", "razz", "redface", "rolleyes", "sad", "smile", "surprised", "thumbdown", "thumbup", "twisted", "wink"],
        shorts = {":D": "biggrin", ":-D": "biggrin", ":S": "confused", ":-S": "confused", ";(": "cry", ";-(": "cry", "OO": "eek", "<3": "like", "^^": "lol", ":|": "neutral", ":-|": "neutral", ":P": "razz", ":-P": "razz", ":(": "sad", ":-(": "sad", ":)": "smile", ":-)": "smile", ":O": "surprised", ":-O": "surprised", ";)": "wink", ";-)": "wink"},
regex = new RegExp(':(' + smilies.join('|') + '):', 'g'),
        template = '<i class="smiley-$1" title="$1"></i>',
        escapeRegExp = function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        regExpForShort = function (str) {
            if (/^[a-z]+$/i.test(str)) { // use word boundaries if emoji is letters only
                return new RegExp('\\b' + str + '\\b', 'gi');
            }
            else {
                return new RegExp(escapeRegExp(str), 'gi');
            }
        },
        templateForSmiley = function (str) {
            console.log(str);
            
            return (template.replace('$1', str));
        },
        apply = function (input) {
            if (!input)
                return '';
            console.log(input)
            console.log(template);
            var output = input.replace(regex, (template));

            for (var sm in shorts) {
                if (shorts.hasOwnProperty(sm)) {
                    output = output.replace(regExpForShort(sm), templateForSmiley(shorts[sm]));
                }
            }

            return output;
        };




smilies_selector.directive("w3TestDirective", function () {
    return {
        template: '<input type="text" value="Click me!" uib-popover-template="I appeared on focus! Click away and I\'ll vanish..."  popover-trigger="focus" class="form-control">'
    };
});
smilies_selector.filter('smilies', function () {
    return apply;
})
smilies_selector.directive('smilies', '$sce', function ($sce) {
    console.log("smilies");
    return {
        restrict: 'A',
        scope: {
            source: '=smilies'
        },
        link: function ($scope, el, attrs) {
            console.log("tuka nakude sum");
            console.log($scope.source);

            console.log($scope.source);
            el.html($sce.trustAsHtm(apply($scope.source)));

        }
    };
})
smilies_selector.directive('smiliesSelector', ['$timeout', function ($timeout) {
        var templateUrl;
        try {
            angular.module('ui.bootstrap.popover');
            console.log("alabala");
            templateUrl = 'template/smilies/button-a.html';
        }
        catch (e) {
            try {
                angular.module('mgcrea.ngStrap.popover');
                templateUrl = 'template/smilies/button-b.html';
            }
            catch (e) {
                console.error('No Popover module found');
                return {};
            }
        }

        return {
            restrict: 'A',
            templateUrl: templateUrl,
            scope: {
                source: '=smiliesSelector',
                placement: '@smiliesPlacement',
                title: '@smiliesTitle'
            },
            link: function ($scope, el) {
                $scope.smilies = smilies;

                $scope.append = function (smiley) {
                    $scope.source += ' :' + smiley + ': ';

                    $timeout(function () {
                        el.children('i').triggerHandler('click'); // close the popover
                    });
                };
            }
        };

    }])
/* helper directive for input focusing */
smilies_selector.directive('focusOnChange', function () {
    return {
        link: function ($scope, el, attrs) {
            $scope.$watch(attrs.focusOnChange, function () {
                console.log("focus on change");
                el[0].focus();
                console.log("focus on changed");
            });
        }
    };
})
/* popover template */
smilies_selector.run(['$templateCache', function ($templateCache) {
        // use ng-init because popover-template only accept a variable
        $templateCache.put('template/smilies/button-a.html',
                '<i class="smiley-' + main + ' smilies-selector" ' +
                'ng-init="smiliesTemplate = \'template/smilies/popover-a.html\'" ' +
                'uib-popover-template="smiliesTemplate" ' +
                'popover-placement="{{!placement && \'left\' || placement}}" ' +
                'popover-title="{{title}}"></i>'
                );
        $templateCache.put('template/smilies/button-b.html',
                '<i class="smiley-' + main + ' smilies-selector" bs-popover ' +
                'data-template="template/smilies/popover-b.html" ' +
                'data-placement="{{!placement && \'left\' || placement}}" ' +
                'title="{{title}}"></i>'
                );
        $templateCache.put('template/smilies/popover-a.html',
                '<div ng-model="smilies" class="smilies-selector-content">' +
                '<i class="smiley-{{smiley}}" ng-repeat="smiley in smilies" ng-click="append(smiley)"></i>' +
                '</div>'
                );
        $templateCache.put('template/smilies/popover-b.html',
                '<div class="popover" tabindex="-1">' +
                '<div class="arrow"></div>' +
                '<h3 class="popover-title" ng-bind-html="title" ng-show="title"></h3>' +
                '<div class="popover-content">' +
                $templateCache.get('template/smilies/popover-a.html') +
                '</div>' +
                '</div>'
                );
    }]);

