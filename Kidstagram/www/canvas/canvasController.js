//canvasController

//////////////////////////////////////////////////////////////////////////////////////////
//  ISSUES
//  -------
//  iOS
//  -------
//  ANDROID
//  -------
//
//  TODO
//  - BE MINIMAL
//
//
//////////////////////////////////////////////////////////////////////////////////////////



angular.module('cordovaNG').controller('canvasController', function ($scope, $http, globalService, Azureservice) {

    // Scope is like the partial view datamodel.  'message' is defined in the partial html view
    //$scope.message = "Let's draw";


    // Variables
    // -----------
    var ctx, ctx2, ctx0, color = "#000";
    var line_Width, size = 5;
    var tool = 'pen'
    var x, y, lastx, lasty = 0;
    var backgroundImage = new Image();
    var coloringBookPage = new Image();
    var UniquePictureID = globalService.makeUniqueID(); // Makes a GUID for a Picture for PouchDB and for uploading to Azure Blob Storage
    var isTouch
    $scope.shareActionSheet = false; $scope.coloringbookActionSheet = false;  // boolean for ng-show for UI toggle
    $scope.shareSelectionArray = []; // array of friends to share with
    $scope.toggleSelectArray = []; // array just for toggeling friend selection UI
    $scope.coloringbookArray =[]; // array for coloring book pages

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
                tempfriendarr.push(element); // add back to array
            };
            $scope.friendArray = tempfriendarr;
         };
    };
    // -----------



    //// Test for touch device - NOT USED
    //// ---------------------
    //function isTouchDevice() {
    //    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    //}
    //if (isTouchDevice() === true) {
    //    //alert('Touch Device'); 
    //    isTouch = 1;
    //} else {
    //    //alert('Not a Touch Device');
    //}


    // For choosing the drawing tools
    // ------------------------------------------
    $scope.choosePen1 = function () {
        resetdrawingtoolbar();
        drawTouch();
        $('#penicon1').addClass('pen1select');
        size = 5;
        ctx.beginPath(); // start a new line
        ctx.lineWidth = size; // set the new line size
        // if brush was selected and canvas is there, draw canvas2 down on original canvas and remove canvas2
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
    };
    $scope.choosePen2 = function () {
        resetdrawingtoolbar();
        drawTouch();
        $('#penicon2').addClass('pen2select');
        size = 12;
        ctx.beginPath(); // start a new line
        ctx.lineWidth = size; // set the new line size
        // if brush was selected and canvas is there, draw canvas2 down on original canvas and remove canvas2
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
    };
    $scope.choosePen3 = function () {
        resetdrawingtoolbar();
        drawTouch();
        $('#penicon3').addClass('pen3select');
        size = 30;
        ctx.beginPath(); // start a new line
        ctx.lineWidth = size; // set the new line size
        // if brush was selected and canvas is there, draw canvas2 down on original canvas and remove canvas2
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
    };

    $scope.chooseEraser = function () {
        resetdrawingtoolbar();
        eraseTouch();
        $('#erasericon').addClass('eraserselect');
        // if brush was selected and canvas is there, draw canvas2 down on original canvas and remove canvas2
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
    };

    $scope.chooseBrush1 = function () {
        resetdrawingtoolbar();
        if ($('#canvas2').length) { // Part of resetting is removing the 2nd canvas
            $('#canvas2').remove();
        };
        brushTouch(); // use for deploy to touch device.  This also adds the 2nd canvas
        $('#brushicon1').addClass('brush1select');
        size = 8;
        // use for web
        //if (isTouch == 1) {
        //    brushTouch();
        //}

    };
    $scope.chooseBrush2 = function () {
        resetdrawingtoolbar();
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
        brushTouch(); // use for deploy to touch device
        $('#brushicon2').addClass('brush2select');
        size = 18;
    };
    $scope.chooseBrush3 = function () {
        resetdrawingtoolbar();
        if ($('#canvas2').length) {
            $('#canvas2').remove();
        };
        brushTouch(); // use for deploy to touch device
        $('#brushicon3').addClass('brush3select');
        size = 40;
    };

    // For choosing the color
    // ------------------------------------------
    $scope.selectColor = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent); // clean up click event

        // toggle the UI for the selected color
        for (var i = 0; i < document.getElementsByClassName("palette").length; i++) {
            document.getElementsByClassName("palette")[i].style.borderColor = "#fff";
        }
        clickEvent.target.style.borderColor = "transparent";

        color = window.getComputedStyle(clickEvent.target).backgroundColor; // set color to palette
        ctx.beginPath(); // start a new line
        ctx.strokeStyle = color; // set the new line color

        ////if eraser selected then pick the pen
        //if (line_width == 18) { // hack because the erase line width is 18
        //    // select icon
        //    // run drawmouse and drawtouch
        //};
    };


    // Function to setup a new canvas for drawing. Called on button click.
    // ------------------------------------------
    $scope.newCanvas = function () {
        //define, resize, and insert canvas wiping out anything under "content" in the DOM
        document.getElementById("content").style.height = window.innerHeight - 200;
        var canvas = '<canvas id="canvas0" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '" style="position: absolute; left: 0px; z-index: 1000;"></canvas><canvas id="canvas" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas><canvas id="savecanvas" style="position: absolute; left: 0px; z-index:-100; display:none" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas>';
        document.getElementById("content").innerHTML = canvas;
        // setup initial canvas
        ctx = document.getElementById("canvas").getContext("2d");
        ctx.imageSmoothingEnabled = false; // Important to get a drawing without pixeled edges       
        ctx.lineCap = "round";
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        $('.black').css("borderColor", "transparent"); //show black as selected color
        // setup initial top level coloringbook 
        ctx0 = document.getElementById("canvas0").getContext("2d");
        ctx0.imageSmoothingEnabled = false; // Important for a clear image
        coloringBookPage.src = "";
        $scope.choosePen1();
    };



    resetdrawingtoolbar = function () {
        $('#canvas').off(); // reset event handler
        $('#canvas2').off();
        $('#canvas0').off();

        $('#erasericon').removeClass('eraserselect');
        $('#penicon1').removeClass('pen1select');
        $('#penicon2').removeClass('pen2select');
        $('#penicon3').removeClass('pen3select');
        $('#brushicon3').removeClass('brush3select');
        $('#brushicon2').removeClass('brush2select');
        $('#brushicon1').removeClass('brush1select');
    };



    // prototype to	start drawing on TOUCH using canvas moveTo and lineTo
    // ------------------------------------------
    var drawTouch = function () {
        ctx.globalCompositeOperation = 'source-over'; // reset this back to drawing
        var start = function (e) {
            ctx.globalAlpha = 1; // Because the canvas CSS is set to transparent, you don't need it here.  Make sure set to 1.0 before drawing.
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130; // 130 came from trial and error
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        };
        var move = function (e) {
            e.preventDefault();
            ctx.beginPath(); // after dot, start a new line
            ctx.moveTo(x, y);
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130;
            ctx.lineTo(x, y);
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.stroke();
        };
        $('#canvas0').on('touchstart', start); // drawing is alwasy Canvas0 and written down to CanvasX context
        $('#canvas0').on('touchmove', move);
    };


    function eraseTouch() {
        ctx.lineWidth = 18;
        size = 18;
        ctx.globalAlpha = 1; // Because the canvas CSS is set to transparent, you don't need it here.  Make sure set to 1.0 before drawing.
        ctx.globalCompositeOperation = 'destination-out'; // reset this back to drawing
        var starteraser = function (e) {
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();
        };
        var moveeraser = function (e) {
            e.preventDefault();
            ctx.beginPath(); // after dot, start a new line
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.moveTo(x, y);
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130;
            ctx.lineTo(x, y);
            ctx.closePath();
            ctx.stroke();
        };
        $('#canvas0').on('touchstart', starteraser); // drawing is alwasy Canvas0 and written down to CanvasX context
        $('#canvas0').on('touchmove', moveeraser);

    };


    var brushTouch = function () {
        var canvas2
        var Canvas2Image = new Image();
        //new canvas
        if (!($('#canvas2').length)) {
            canvas2 = document.createElement('canvas');
            canvas2.id = 'canvas2';
            canvas2.style.opacity = "0.5";
            canvas2.width = window.innerWidth;
            canvas2.height = window.innerHeight - 90;
            canvas2.style.position = "absolute";
            canvas2.style.left = 0;
            $('#content').append(canvas2);
            ctx2 = canvas2.getContext("2d");
            ctx2.lineCap = "round";
            ctx2.lineJoin = 'round';
            ctx2.strokeStyle = color;
            ctx2.lineWidth = size;
            ctx2.fillStyle = color;
        };
        var startbrush = function (e) {
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130; // 130 came from trial and error
            ctx2.beginPath();
            ctx2.moveTo(x, y);
            // make a dot on tap
            ctx2.arc(x, y, size / 1.9, 0, 2 * Math.PI, false);
            ctx2.fillStyle = color;
            ctx2.fill(); 
        };
        var movebrush = function (e) {
            e.preventDefault();
            ctx2.lineWidth = size;
            ctx2.beginPath(); // need it here to draw new segments buts drops the dots in ~ AND have the TOUCH DOT and LINE different sizes.
            ctx2.moveTo(x, y);
            x = e.originalEvent.changedTouches[0].pageX;
            y = e.originalEvent.changedTouches[0].pageY - 130;
            ctx2.lineTo(x, y);
            ctx2.closePath();
            ctx2.strokeStyle = color;
            ctx2.stroke();
        };
        var stopbrush = function (e) {
            e.preventDefault;
            // draw canvas2 down on original canvas and remove canvas2
            Canvas2Image.onload = function () { // May take some time to load the src of the new image.  Just in case, do this:
                ctx.globalCompositeOperation = 'source-over'; // reset this back to drawing
                ctx.globalAlpha = 0.5;  // change the tranparency before copying down
                ctx.drawImage(Canvas2Image, 0, 0); // Draw the Brush image down Main Canvas
            }
            Canvas2Image.src = canvas2.toDataURL(); //convert brush canvas to image.
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height); // Clear the Brush canvas for the next line 
        };
        $('#canvas0').on('touchstart', startbrush); // drawing is alwasy Canvas0 and written down to CanvasX context
        $('#canvas0').on('touchmove', movebrush);
        $('#canvas0').on('touchend', stopbrush);

    };

    // ------------------------------------------




    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================




    // Function to get picuture from camera and insert onto canvas
    // ------------------------------------------------------------------
    $scope.getPicture = function () {

        // Take picture using device camera and retrieve image as base64-encoded string
        navigator.camera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
            quality: 75, // reduced size to avoid memory  0-100
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true,
            sourceType: Camera.PictureSourceType.CAMERA, // @@@@@@@@@@@@@@@@@@  Can also choose to select from photo album
        });
    }
    //Callback function when the picture has been successfully taken
    function onPhotoDataSuccess(imageData) {

        // *************************************************
        // ***** Does MegaPixelImage Detection need to happen here also?????

        //var megaPixelImg = new MegaPixImage(imageData);
        //var h = window.innerHeight - 90;
        //var w = window.innerWidth;
        //megaPixelImg.render(backgroundImage, { maxWidth: w, maxHeight: h, quality: 0.5 });

        // *************************************************

        backgroundImage.src = imageData; // use this for saving the canvas to file later
        $('#canvas').css('background-image', 'url(' + imageData + ')');// Set as Canvas background CSS

        //ctx.drawImage(backgroundImage, 0, 0); // draw resampled photo on top of canvas.  Right here, this will cover up any drawing!!!!

    }
    //Callback function when the picture has not been successfully taken
    function onPhotoDataFail(message) {
        console.log('Failed to load picture because: ' + message);
        $('#log').innerHTML += 'Failed to load picture because: ' + message;  // FOR TESTING ONLY
    }



    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================

    // -----------------------------------------------------------------------
    // SAVING
    // -----------------------------------------------------------------------

    // Function to save the Canvas contents to an image in LocalStore - Not permanently in the file system - so you don't lose image when navigating around
    // ------------------------------------------------------------------
    $scope.saveTempImage = function () {
        var canvasInProgress = document.getElementById('canvas');
        var DrawingInProgressDataURL = canvasInProgress.toDataURL("image/png");
        var DrawingInProgressBase64 = DrawingInProgressDataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        localStorage.setItem("DrawingInProgress", DrawingInProgressBase64);

        var canvasInProgressOverlay = document.getElementById('canvas0');
        var DrawingInProgressOverlayDataURL = canvasInProgressOverlay.toDataURL("image/png");
        var DrawingInProgressOverlayBase64 = DrawingInProgressOverlayDataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        localStorage.setItem("DrawingInProgressOverlay", DrawingInProgressOverlayBase64);
    };



    // Function to save the Canvas contents to an image on the file system
    // ------------------------------------------------------------------
    $scope.saveImage = function () {
        var w = window.innerWidth;
        var h = window.innerHeight - 90;
        var savecanvas = document.getElementById("savecanvas");
        var savecanvasctx = savecanvas.getContext("2d");
        // Draw white background
        savecanvasctx.fillStyle = "#FFFFFF";
        savecanvasctx.fillRect(0, 0, w, h);
        // Copy drawing down
        var initimage = new Image();
        var initcanvas = document.getElementById("canvas");
        initimage.src = initcanvas.toDataURL();
        initimage.onload = function () {
            savecanvasctx.drawImage(initimage, 0, 0);
            // Copy coloring book down
            //drawImageScaled(coloringBookPage, "savecanvas"); // draw coloring book down
            var initimage2 = new Image();
            var initcanvas2 = document.getElementById("canvas0");
            initimage2.src = initcanvas2.toDataURL();
            initimage2.onload = function () {
                savecanvasctx.drawImage(initimage2, 0, 0);
                // Save the whole thing
                saveImageDataToLibrary('savecanvas');
            };
        };
        //$('#canvas').css('background-image', 'url()');// reset the CSS background 
    };

    // Using plugin to save to camera roll / photo gallery and return file path
    function saveImageDataToLibrary(CanvasID) {
        window.canvas2ImagePlugin.saveImageDataToLibrary(
            function (filepath) {
                //alert(filepath);
                //console.log('image file path is: ' + filepath); //filepath is the filename path (for android and iOS)
                //var uid = new Date().toJSON(); // make the ID a timestamp because PouchDB returns ordered ID (so now by datetime)

                // @@@ Put the image properties into localstorage
                var record = { id: UniquePictureID, filepath: filepath, datetime: Date.now(), commentarray: [] }; //JSON for unique id for picture, filepath to retrieve it, datetime in milliseconds, array of comments
                var imagepropertiesarray = [];
                // if it exists already, retrieve it.
                if (localStorage.getItem('RYB_imagepropertiesarray')) {
                    imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
                }
                imagepropertiesarray.push(record);
                localStorage["RYB_imagepropertiesarray"] = JSON.stringify(imagepropertiesarray); //push back to localStorage
                // @@@@ NEED BETTER SAVED INDICATOR
                alert("Saved");

            },
            function (err) {console.log(err);},
            document.getElementById(CanvasID) // This names the element that is the Canvas.  Other params can follow here with commas...format, quality,etc... ",'.jpg', 80," 
       );
    };




    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================

    // -----------------------------------------------------------------------
    // SHARING
    // -----------------------------------------------------------------------


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
        SaveandUploadImage(); // @@@ When this is done, it will call shareOutToFriends to Insert Event records in Azure to Friends
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
        if (globalService.userarray[1] == 'admin') {fromavatar = globalService.userarray[5];}
        else {fromavatar = globalService.userarray[3];};
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

    // -----------------------------------------------------------------------
    // UPLOADING TO AZURE
    // -----------------------------------------------------------------------

    function SaveandUploadImage () {
        // Save part
        // -----
        var w = window.innerWidth;
        var h = window.innerHeight - 90;
        var savecanvas = document.getElementById("savecanvas");
        var savecanvasctx = savecanvas.getContext("2d");
        // Draw white background
        savecanvasctx.fillStyle = "#FFFFFF";
        savecanvasctx.fillRect(0, 0, w, h);
        // Copy drawing down
        var initimage = new Image();
        var initcanvas = document.getElementById("canvas");
        initimage.src = initcanvas.toDataURL();
        initimage.onload = function () {
            savecanvasctx.drawImage(initimage, 0, 0);
            // Copy coloring book down
            //drawImageScaled(coloringBookPage, "savecanvas"); // draw coloring book down
            var initimage2 = new Image();
            var initcanvas2 = document.getElementById("canvas0");
            initimage2.src = initcanvas2.toDataURL();
            initimage2.onload = function () {
                savecanvasctx.drawImage(initimage2, 0, 0);
                // Save the whole thing
                saveImageDataToLibrary('savecanvas');
                // Upload part
                // ----------- // This has to be chained
                uploadImage();
            };
        };
        //$('#canvas').css('background-image', 'url()');// reset the CSS background 
    };


    // To upload file to Azure blob storage.  1. Call API to get a sasURL.  2. PUT the file using the sasURL 
    //  Upload call SaveImage and implicityly saves the canvas and and background to the 'photolibrary'
    // ----------------------------------
    function uploadImage() {
        var sasUrl;
        var photoId;
        var requestUrl = "https://service-poc.azure-mobile.net/api/getuploadblobsas" // URL to the custom rest API

        var mycanvas = document.getElementById('savecanvas');
        var blob = dataURItoBlob(mycanvas.toDataURL("image/png", 1.0));// Convert the Base64 encoded image to just the blob


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
                headers: { 'X-ZUMO-APPLICATION': 'IfISqwqStqWVFuRgKbgJtedgtBjwrc24', 'UniquePictureID': UniquePictureID } // need a custom header for Azure Mobile Service Application key for "service-poc"
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



    // Function to nav to gallery view
    // ------------------------------------------------------------------
    $scope.goToGallery = function () {
        globalService.lastView = '/canvas';  // for knowing where to go with the back button
        globalService.changeView('/gallery');
    };


    // Catching navigation away from this View to save drawing to localstorage
    // -----------------------------------------------------------------------
    $scope.$on("$routeChangeStart", function (event, next, current) {
        $scope.saveTempImage();
    });




    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================
   
    // -----------------------------------------------------------------------
    // Coloring book options
    // -----------------------------------------------------------------------

    $scope.coloringbookArray = [
        "./images/lion-small.svg",
        "./images/unicorn-small.svg",
        "./images/catface-small.svg",
        "./images/tigerface-small.svg",
        "./images/giraffe-small.svg",
        "./images/shark-small.svg",
        //"./images/unicorn.svg",
        //"./images/unicorn.svg",
    ];

    $scope.coloringbookImageClick = function (clickEvent) {

        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        var imagepath = clickEvent.target.id; // DOM attribute

        // Overlay this image on the canvas.  Remove a previous image first
        
        // if Canvas 0 exists, clear it.  If not, make it.
        if (($('#canvas0').length)) {
            var canvas0 = document.getElementById("canvas0");
            ctx0 = document.getElementById("canvas0").getContext("2d");
            ctx0.clearRect(0, 0, canvas0.width, canvas0.height); // Clear the canvas 
        }
        else {
            var canvas0;
            canvas0 = document.createElement('canvas');
            canvas0.id = 'canvas0';
            canvas0.width = window.innerWidth;
            canvas0.height = window.innerHeight - 90;
            canvas0.style.position = "absolute";
            canvas0.style.left = 0;
            canvas0.style.zIndex = 1000;
            $('#content').append(canvas0); // Adding canvas to DOM
            ctx0 = canvas0.getContext("2d");
        };

        imagepath = imagepath.replace("-small", ""); // from the thumbnail, get the full image path
        coloringBookPage.src = imagepath;
        coloringBookPage.onload = function () { // May take some time to load the src of the new image.  Just in case, do this:
            drawImageScaled(coloringBookPage, "canvas0");
        };

        $scope.coloringbookActionSheet = false;
    }; // end func

    //  Function to scale and center the coloring book overlay in the canvas
    function drawImageScaled(drawimg, canvasid) {
        var drawcanvas = document.getElementById(canvasid);
        drawctx = drawcanvas.getContext("2d")
        drawctx.imageSmoothingEnabled = false; // Important to get a drawing without pixeled edges       
        var hRatio = drawcanvas.width / drawimg.width;
        var vRatio = drawcanvas.height / drawimg.height;
        var ratio = Math.min(hRatio, vRatio);
        var centerShift_x = (drawcanvas.width - drawimg.width * ratio) / 2;
        var centerShift_y = (drawcanvas.height - drawimg.height * ratio) / 2;
        // Difference betweein iOS and Android
        if (device.platform === 'iOS') {
            drawctx.drawImage(drawimg, 0, 0, drawimg.width, drawimg.height, centerShift_x, centerShift_y, drawimg.width * ratio, drawimg.height * ratio);
        }
        else {
            drawimg.width = drawcanvas.width;
            drawctx.drawImage(drawimg, 0, 0);
        };
    }; // end func

    // ==================================================================================================================================
    // ==================================================================================================================================
    // ==================================================================================================================================


    // -----------------------------------------------------------------------
    // Ugly hack to create an HTML canvas when the HTML partial view is loaded
    // -----------------------------------------------------------------------

    // if there is a temp drawing, use it.  Check localstorage
    if (localStorage.getItem('DrawingInProgress')) {
        
        //alert(localStorage.getItem('DrawingInProgress'));
        //alert(localStorage.getItem('DrawingInProgressOverlay'));

        //define, resize, and insert canvas wiping out anything under "content" in the DOM
        document.getElementById("content").style.height = window.innerHeight - 200;
        var canvas = '<canvas id="canvas0" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '" style="position: absolute; left: 0px; z-index: 1000;"></canvas><canvas id="canvas" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas><canvas id="savecanvas" style="position: absolute; left: 0px; z-index:-100; display:none" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas>';
        document.getElementById("content").innerHTML = canvas;

        // setup initial canvases
        ctx = document.getElementById("canvas").getContext("2d");
        ctx0 = document.getElementById("canvas0").getContext("2d");
        ctx0.imageSmoothingEnabled = false; // Important for a clear image
        $scope.canvaswidth = ctx0.canvas.width;
        $scope.canvasheight = ctx0.canvas.height;
        ctx.lineCap = "round";
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        $('.black').css("borderColor", "transparent"); //show black as selected color

        // Draw down the DrawingInProgress
        var DrawingInProgressBase64 = localStorage.getItem('DrawingInProgress');
        var DrawingInProgress = new Image();
        DrawingInProgress.src = "data:image/png;base64," + DrawingInProgressBase64;
        DrawingInProgress.onload = function () { // May take some time to load the src of the new image.  Just in case, do this:
            ctx.drawImage(DrawingInProgress, 0, 0); // Draw image down on top Canvas
        };

        // setup initial top level coloringbook 
        var coloringBookPageSource = localStorage.getItem('DrawingInProgressOverlay');
        var coloringBookPageOverlay = new Image();
        coloringBookPageOverlay.src = "data:image/png;base64," + coloringBookPageSource;
        coloringBookPageOverlay.onload = function () { // May take some time to load the src of the new image.  Just in case, do this:
            drawImageScaled(coloringBookPageOverlay, "canvas0");
        };

        $scope.choosePen1();

    }
    else{ // if not, make new

        //define, resize, and insert canvas wiping out anything under "content" in the DOM
        document.getElementById("content").style.height = window.innerHeight - 200;
        var canvas = '<canvas id="canvas0" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '" style="position: absolute; left: 0px; z-index: 1000;"></canvas><canvas id="canvas" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas><canvas id="savecanvas" style="position: absolute; left: 0px; z-index:-100; display:none" width="' + window.innerWidth + '" height="' + (window.innerHeight - 200) + '"></canvas>';
        document.getElementById("content").innerHTML = canvas;
        // setup initial canvas
        ctx = document.getElementById("canvas").getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        $('.black').css("borderColor", "transparent"); //show black as selected color
        // setup initial top level coloringbook 
        ctx0 = document.getElementById("canvas0").getContext("2d");
        ctx0.imageSmoothingEnabled = false; // Important for a clear image
        $scope.canvaswidth = ctx0.canvas.width;
        $scope.canvasheight = ctx0.canvas.height;
        coloringBookPage.src = "";
        $scope.choosePen1();
    };



    }); // end controller