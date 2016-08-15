// galleryController

angular.module('cordovaNG').controller('galleryController', function ($scope, globalService, Azureservice, $state) {

    // Scope is like the view datamodel.  'gallerymessage' is defined in the paritial view
    //$scope.gallerymessage = "Nothing here yet";  //- TEST ONLY

    if (globalService.userarray[1] == 'admin') {$scope.kidavatar = globalService.userarray[5];}
    else { $scope.kidavatar = globalService.userarray[3];};
    $scope.kidname = globalService.userarray[4];

    // Get local storage for saved images filepath.  @@@@@@@ NEED TO ACCOUNT FOR WHEN AN IMAGE IS REMOVED FROM PHONE GALLERY (TRY/CATCH)
    if (localStorage.getItem('RYB_imagepropertiesarray')) {
        var imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
        $scope.galleryItems = imagepropertiesarray; // Put the array of records into this view's scope
        alert(JSON.stringify($scope.galleryItems));
    };


    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.goBack = function () {
        //globalService.changeView(globalService.lastView); // go back to Previous view
        $state.go(globalService.lastView);
    };


    // Method for getting the UID in PouchDB from the DOM attributes
    // ----------------
    $scope.galleryImageClick = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.image_ID_Src = clickEvent.target.id; // DOM attribute

        //alert($scope.image_ID_Src);  
        globalService.pictureViewParams = $scope.image_ID_Src; // put in global var to pass to the next view.  Should have Image ID and Image filepath data
        //globalService.changeView('/gallerypicture'); // Go to gallerypicture view
        $state.go('gallerypicture');
    };

}); //controller end