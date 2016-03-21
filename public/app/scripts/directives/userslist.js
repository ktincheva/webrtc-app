var userslist = angular.module('publicApp');

userslist.directive('usersList', function(){
   
        console.log("Directive users list templates");
       
   
    return {
        restrict: "E", 
        scope: {
            users:'=',
            user:'=',
            content:'='
        },
        templateUrl: "partials/users_list.html"
    }
    
});

