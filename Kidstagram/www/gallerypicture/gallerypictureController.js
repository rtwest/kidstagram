// gallerypictureController

angular.module('cordovaNG').controller('gallerypictureController', function ($scope, $http, globalService, Azureservice, $state) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    // Variables
    // -------------------
    $scope.clientavatar = globalService.userarray[3];
    $scope.clientname = globalService.userarray[4];

    // UI show/hide flags
    $scope.showDeleteOverlay = false; // boolean for ng-show for UI toggle
    $scope.shareActionSheet = false;  // boolean for ng-show for UI toggle
    $scope.shareSelectionArray = []; // array of friends to share with
    $scope.toggleSelectArray = []; // array just for toggeling friend selection UI

    // if User if Clients, friends are friend. 
    if (globalService.userarray[1] == 'client') {
        $scope.friendArray = globalService.friendArray; // this was set up on ClientStartController
    }
    else { //Else, User is Admin and friends are clients
        if (localStorage.getItem('RYB_clientarray')) {
            // need to reformat this data because client friends and admin clients are JSON and Array formats.  HTML side need consistency.
            //var tempclientarr = [];
            var tempclientarr = JSON.parse(localStorage.getItem('RYB_clientarray')); // get array from localstorage key pair and string
            var tempclientarrlen = tempclientarr.length;
            var tempfriendarr = [];
            for (i = 0; i < tempclientarrlen; i++) {
                var element = {  // make a new array element
                    friend_id: tempclientarr[i][0],
                    friend_name: tempclientarr[i][1],
                    friend_avatar: tempclientarr[i][2],
                };
                alert(element);
                tempfriendarr.push(element); // add back to array
            };
            $scope.friendArray = tempfriendarr;
         };
    };

    var picturesplitarray = globalService.pictureViewParams.split(","); // Global var passed to the view. The div ID had 2 values shoved in. Split string into array by ","
    $scope.pictureID = picturesplitarray[0];
    $scope.pictureFilePath = picturesplitarray[1];

    // -------------------




    //Get Comments on this picture by looking up picture details in the local storage array
    // ---
    var imagepropertiesarray = [];
    imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
    for (x = 0; x < imagepropertiesarray.length; x++) { // Loop through to array for ImageID
        if (imagepropertiesarray[x].id == $scope.pictureID) {
            //alert(JSON.stringify(imagepropertiesarray[x].commentarray));
            $scope.commentarray = imagepropertiesarray[x].commentarray;
            break;
        };
    }; //end for


    //// Trying to work on a dynamic Back button  
    //// Not working.  It might need to reside in App.Run section say StackExchange
    //// ------------
    //var previousView
    //// @@@ rootScope has some special methods to know about the route path before. Remember to add $rootScope to the controller definition
    //$rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
    //    //assign the "from" parameter to something
    //    previousView = from.name;
    //    alert(from.name);
    //});



    // Delete this picutre and return to Gallery View
    // ---------------
    $scope.deleteClick = function () {

        // Update 'RYB_imagepropertiesarray' in LocalStorage
        var imagepropertiesarray = [];
        imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
        for (x = 0; x < imagepropertiesarray.length; x++) { // Loop through to array for ImageID
            if (imagepropertiesarray[x].id == $scope.pictureID) {
                imagepropertiesarray.splice(x, 1) // remove from this element at index number from 'clientarray'
                localStorage["RYB_imagepropertiesarray"] = JSON.stringify(imagepropertiesarray); //push back to localStorage
                break;
            };
        }; //end for

        //globalService.changeView('/gallery');  // Back location using the captured previous view's name
        $state.go(galllery);
    };



    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================


    // Share 
    // ---------------
    // -- GO HEAD AND UPLOAD TO AZURE AGAIN.  WHAT IS IMAGEID IF NOT PULLED FROM AZURE BLOB STORAGE?
  
    // Function for toggling selection to share with
    // ----------------------------------
    $scope.toggleSelect = function (clickEvent, listindex) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.clientId = clickEvent.target.id;
        //alert('id = ' + $scope.clientId);

        //if in Selection array, then remove.  Else, add it.  // need Kid ID and Name
        // -------
        //alert(JSON.stringify($scope.shareSelectionArray))
        var index = $scope.shareSelectionArray.indexOf($scope.clientId)
        if (index > -1) { //if FOUND, the remove
            $scope.shareSelectionArray.splice(index, 1);
        }
        else { // if NOT found, then add
            $scope.shareSelectionArray.push($scope.clientId);
        };
        //alert(JSON.stringify($scope.shareSelectionArray))

        // This is an array toggleSelectArray just for toggling UI selection ClassName with ng-class conditional
        // ----------
        var pos = $scope.toggleSelectArray.indexOf(listindex)
        if (pos > -1) { //if FOUND, the remove
            $scope.toggleSelectArray.splice(index, 1);
        }
        else { // if NOT found, then add
            $scope.toggleSelectArray.push(listindex);
        };
        //alert(JSON.stringify($scope.toggleSelectArray))

    };

    // Go through SelectionArray and share / upload images to users
    // ----------------------------------
    var sharecount;
    var sharearraylength;

    // This is the function called on the UI button click.  It sets the initial variables.
    // ----------------
    $scope.Share = function () {
        // 1. Upload image once.  When done,
        // 2. Then go through shareArray to make the Event per friend
        sharecount = 0;
        sharearraylength = $scope.shareSelectionArray.length;
        $scope.uploadImage(); // @@@ When this is done, it will call shareOutToFriends to Insert Event records in Azure to Friends
    };

    //  @@@ After image is uploaded, this is the loop to Share per friend
    //  @@@ For Loop didn't work so this uses Recursion to go through the share selection array
    //  ----------------------------------
    function shareOutToFriends(picture_url) {
        var friend = $scope.shareSelectionArray[sharecount]; // format of item is "id,name".  ShareCount is looping through array
        var friendsplitarray = friend.split(","); // Split the string into an array by ","
        var tokid_id = friendsplitarray[0];
        var tokid_name = friendsplitarray[1];
        var tokid_avatar = friendsplitarray[2];
        var fromavatar;
        if (globalService.userarray[1] == 'admin') { fromavatar = globalService.userarray[5]; }
        else { fromavatar = globalService.userarray[3]; };

        //alert(tokid_name + " - " + tokid_id + " - " + tokid_avatar);

        Azureservice.insert('events', {
            //id: globalService.makeUniqueID(), // i don't need to track this so let Azure handle it
            picture_url: picture_url,
            fromkid_id: globalService.userarray[0],
            fromkid_name: globalService.userarray[4],
            event_type: "sharepicture", // 
            tokid_id: tokid_id,
            tokid_name: tokid_name,
            fromkid_avatar: fromavatar, // because the Admin and Client local storage user array are different, you have detect user type and pick avatar differently
            tokid_avatar: tokid_avatar,
            //comment_content: 'this is a comment here',
            datetime: Date.now(),
        })
        .then(function () {
            sharecount++;
            if (sharecount < sharearraylength) {
                shareOutToFriends(picture_url);  // @@@ Recursive part to go through selection array
            }
            else {
                // When all chained functions are done with URL creating, Image updating, and Record creation
                // --------------------------
                // @@@@@@@@@@@@@@@@@@@@@@@@@@   NEED BETTER SUCCESS MESSAGE    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2
                alert("Picture uploaded");
                console.log('Insert successful');
                $scope.shareSelectionArray = []; //empty the array
            };
        }, function (err) {
            console.log('Azure Error: ' + err);
        });

    };



    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================




    // To upload file to Azure blob storage.  1. Call API to get a sasURL.  2. PUT the file using the sasURL 
    //  Upload call SaveImage and implicityly saves the canvas and and background to the 'photolibrary'
    // ----------------------------------
    $scope.uploadImage = function () {

        var sasUrl;
        var photoId;
        var requestUrl = "https://service-poc.azure-mobile.net/api/getuploadblobsas" // URL to the custom rest API


        // Convert Image to blob by using Canvas.toDataUrl then calling URItBlob
        // ---------------------
        var img = document.getElementById("galleryDrawing");
        // Create an empty canvas element
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        // Copy the image contents to the canvas
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        // Get the data-URL formatted image
        var blob = dataURItoBlob(canvas.toDataURL("image/png", 1.0));// Convert the Base64 encoded image to just the blob

        alert(blob);

        // -------------------
        // Using a callback function passed as a para is supposed to work on StackOverflow
        // $scope.saveImage(getSasUrlandUpload);
        // .saveImage needs to be written to take a param and 'return true' at the very end to allow the next fuction to be called * I think
        // -------------------

        getSasUrlandUpload();


        // Get SAS URL using AJAX and Angular.  OnSuccess, update the image the SASUrl points to with our image
        // ----------------------------------------------------------------------------------------------------
        function getSasUrlandUpload() {
            var response = $http.get(requestUrl, {
                //headers: { 'X-ZUMO-APPLICATION': 'IfISqwqStqWVFuRgKbgJtedgtBjwrc24' } // need a custom header for Azure Mobile Service Application key for "service-poc"
                headers: { 'X-ZUMO-APPLICATION': 'IfISqwqStqWVFuRgKbgJtedgtBjwrc24', 'UniquePictureID': $scope.pictureID } // need a custom header for Azure Mobile Service Application key for "service-poc"
            })
            response.success(function (data, status, headers, config) { // response will send json in the parts

                sasUrl = data.sasUrl;
                picture_url = "https://rtwdevstorage.blob.core.windows.net/imagecontainer/" + data.photoId;  //  // photoID is image created on the Node side script

                // Image URL is https://rtwdevstorage.blob.core.windows.net/imagecontainer/6364260670030.png  or http://rtwdevstorage.blob.core.windows.net:80/imagecontainer/6364260670030.png            

                // @@@ Function to update the path with the real image AND call function to Share Out to Friends loop
                // ------
                updateFile(sasUrl,picture_url);

            });
            response.error(function (data, status, headers, config) {
                console.log("error - " + status);
                //alert(status);
            });
        };

        // Use SAS URL and PhotID to PUT the image into the Azure Blob Storage container in the SASUrl
        // ----------------------------------
        function updateFile(Url, picture_url) {
            var xhr = new XMLHttpRequest();

            // Look for response success
            xhr.onreadystatechange = function () {

                // @@@ If the SasBlobUrl is successful update with PNG, then call Function to SHARE out to friends
                // ReadyState=4 means response ready.  Status 201 is custom sent from Azure Node when done.   Response = "Created" is success.
                // ----------
                if (xhr.readyState == 4 && xhr.status == 201) {

                    // @@@@@@@@@@@   Call function for iterating the Share through the selected friends array
                    shareOutToFriends(picture_url);

                }
            }
            xhr.open('PUT', Url, true);
            xhr.setRequestHeader('Content-Type', 'image/png');
            xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
            xhr.send(blob);
        }




        // Convert base64/URLEncoded data component to raw binary data held in a string
        // ------------------------------
        function dataURItoBlob(dataURI) {
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);
            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ia], { type: mimeString });
        }

    };




    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================





    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.goBack = function () {
        //globalService.changeView('/gallery');  // Back location using the captured previous view's name
        $state.go('gallery');
    };




}); //controller end