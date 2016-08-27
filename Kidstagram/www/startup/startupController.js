﻿// Startup controller

angular.module('cordovaNG').controller('startupController', ['$scope', '$state', 'Azureservice', 'globalService', function ($scope, $state, Azureservice, globalService) {

    //Azureservice
    //globalService

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    $scope.message = "Nothing here yet";  //- TEST ONLY




    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoView = function () {
        localStorage.setItem('RYB_oobeflag', '1');  // set the flag that OOBE is done
        $state.go('signin');
    };

}]); //controller end