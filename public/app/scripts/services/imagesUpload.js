chatApp.service('imagesUpload', function($http, config) {
            var uploadImages = function(formdata)
            {
                console.log(formdata);
                return $http({
                    method: "GET",
                    url:config.apiUrl+'photo_upload.php',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    data: formdata,
                });
            }
   
           return {
             uploadImages: uploadImages, 
           }
        });