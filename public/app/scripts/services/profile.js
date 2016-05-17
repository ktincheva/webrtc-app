chatApp.service('Profile', function($http, config) {
            var getProfileByUsername = function(username)
            {
                console.log(username);
                return $http({
                   method: "POST",
                    url:config.apiUrl+'load_profile.php',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    data: $.param({username: username}),
                });
            }
   
           return {
             getProfileByUsername: getProfileByUsername, 
           }
        });


