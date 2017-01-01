// OOBE controller

angular.module('cordovaNG').controller('oobeController', function ($scope, globalService, $state) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoView = function () {
        localStorage.setItem('RYB_oobeflag','1');  // set the flag that OOBE is done
        $state.go('signin');
    };

    // Configuration and Setup of views Slider
    // ------------------------------------------
    $scope.options = {
      loop: false,
      effect: 'slide',
      //effect: 'fade',
      //speed: 500,
    }
    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
      // data.slider is the instance of Swiper
      $scope.slider = data.slider;
    });
    $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
      //console.log('Slide change is beginning');
    });
    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
      // note: the indexes are 0-based
      $scope.activeIndex = data.activeIndex;
      $scope.previousIndex = data.previousIndex;
    });
    // ------------------------------------------


}); //controller end