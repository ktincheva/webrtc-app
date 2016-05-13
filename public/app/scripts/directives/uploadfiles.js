

chatApp.directive('uploadFiles', ['$parse', function ($parse) {
        return {
               link: function(scope, element, attrs) {
                  var onChange = $parse(attrs.uploadFiles);
                  element.on('change', function(event){
                     scope.$apply(function(){
                        onChange(scope,{$files: event.target.files});
                     });
                  });
               }
        };
    }])