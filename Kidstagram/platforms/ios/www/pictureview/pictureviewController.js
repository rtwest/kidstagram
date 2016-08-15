// pictureviewController

angular.module('cordovaNG').controller('pictureviewController', function ($scope, globalService, Azureservice,$state) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    var clientavatar = globalService.userarray[3];
    var clientname = globalService.userarray[4];
    var clientID = globalService.userarray[0];

    // These are global var passed to the view so you know who and what to show
    var picturesplitarray = globalService.pictureViewParams.split(","); // Split the string into an array by ","
    $scope.kidname = picturesplitarray[1];
    $scope.kidavatar = picturesplitarray[2];
    var kidID = picturesplitarray[3];
    $scope.pictureurl = picturesplitarray[0];
    // trim down URL to just the image file name
    var pictureID = $scope.pictureurl.replace('https://rtwdevstorage.blob.core.windows.net/imagecontainer/','');
    pictureID = pictureID.replace('.png','');
    //alert(pictureID);


    // Check LikeHistory to see if you've Liked this before and if Like button should be shown.  
    // Note: if this is Admin looking at Client's timeline, they can't Like drawing here.  Look for LastView = ClientProperties to know.
    //---------------
    if (globalService.lastView != '/clientproperties'){ // if you didn't come from ClientProperties, then you're not an Admin
        var likeHistoryArray = [];
        if (localStorage.getItem('RYB_likehistoryarray')) { // if Like history exists
            likeHistoryArray = JSON.parse(localStorage.getItem('RYB_likehistoryarray')); // get array from localstorage key pair and string
            //alert(JSON.stringify(likeHistoryArray));
            if (likeHistoryArray.indexOf(pictureID) == -1) {
                $scope.showLikeButton = true;
            };
        }
        else {
            $scope.showLikeButton = true;
        };
    };


    // Like the picture *** Have to track 'Likes' locally so you don't repeated like a picture
    // ---------------
    $scope.likeClick = function () {
        // Send the Event
        // ---
        Azureservice.insert('events', {
            fromkid_id: clientID,
            tokid_id: kidID, 
            fromkid_name: clientname,
            tokid_name: $scope.kidname,
            event_type: 'like',
            picture_url: $scope.pictureurl,
            fromkid_avatar: clientavatar,
            tokid_avatar: $scope.kidavatar,
            datetime: Date.now(),
            comment_content:'',
        })
        .then(function () {
            console.log('Insert successful');
        }, function (err) {
            console.log('Azure Error: ' + err);
        });
        // Update the local storage array
        // ---
        likeHistoryArray.push(pictureID)
        localStorage["RYB_likehistoryarray"] = JSON.stringify(likeHistoryArray); //push back to localStorage
        // Update the UI
        // ---
        $scope.showLikeButton = false; // hide the button
        alert(JSON.stringify(likeHistoryArray));
    };

    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.goBack = function () {
        //globalService.changeView(globalService.lastView);  // Back location using the captured previous view's name
        $state.go(globalService.lastView);
    };

}); //controller end