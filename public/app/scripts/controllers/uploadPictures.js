chatApp.controller('uploadPicturesCtrl', function ($sce, $location, $routeParams, $scope, $filter, config, $http,imagesUpload) {
            this.awesomeThings = [
                'HTML5 Boilerplate',
                'AngularJS',
                'Karma'
            ];
            
            $scope.formdata = new FormData();
            $scope.getTheFiles = function ($files) {
                angular.forEach($files, function (value, key) {
                   $scope.formdata.append(key, value);
                });
            };

            // NOW UPLOAD THE FILES.
            $scope.uploadFiles = function () {

                var request = {
                    method: "POST",
                    url:config.apiUrl+'photo_upload.php',
                    headers: {'Content-Type': undefined},
                    data: $scope.formdata,
                    
                };

                // SEND THE FILES.
                $http(request)
                    .success(function (d) {
                        alert(d);
                    })
                    .error(function () {
                    });
            }
        });


