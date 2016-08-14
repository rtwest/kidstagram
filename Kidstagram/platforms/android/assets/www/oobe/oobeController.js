// OOBE controller

angular.module('cordovaNG').controller('oobeController', function ($scope, globalService, $state) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY




    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoView = function () {
        localStorage.setItem('RYB_oobeflag','1');  // set the flag that OOBE is done
        //globalService.changeView('signin');
        $state.go('signin');
    };

}); //controller end