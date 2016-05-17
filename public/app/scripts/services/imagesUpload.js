chatApp.service('imagesUpload', function($http, config) {
            var uploadImages = function(formdata)
            {
                console.log(formdata);
                return $http({
                   method: "POST",
                    url:config.apiUrl+'photo_upload.php',
                    headers: {'Content-Type': undefined},
                    data: formdata,
                });
            }
   
           return {
             uploadImages: uploadImages, 
           }
        });