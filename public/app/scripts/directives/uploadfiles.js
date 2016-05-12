var uploadfiles = angular.module('publicApp')

uploadfiles.directive('uploadFiles', ['$parse', function($parse){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                console.log(scope)
                element.bind('change', function(){
                    console.log(attrs.uploadFiles);
                    $parse(attrs.uploadFiles).assign(scope, element[0].files)
                    scope.$apply();
                });
            }
        };
}])