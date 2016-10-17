// clientstartController

angular.module('cordovaNG').controller('clientstartController', function ($scope, globalService, Azureservice, $state) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY



    // ==========================================
    //  Get local user name, guid, and avatar
    // ==========================================

    var clientGUID = globalService.userarray[0];
    $scope.avatarID = globalService.getAvatarFromID(globalService.userarray[3]); // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2
    $scope.clientName = globalService.userarray[4];

    // ==========================================

    // Set the local data model here to the data in the global service between views
    $scope.eventarray = globalService.eventArray;
    $scope.friendArray = globalService.friendArray;

    if (globalService.lastTimeChecked < (Date.now() - 300000)) { // if last data pull was over 5 MIN ago, then check again
        getEventLog();
        getFriendsArray();
        globalService.lastTimeChecked = Date.now();
    };


    // ==========================================
    //  Get friends from Azure based on Client GUID.  
    // ==========================================
    var len, j;

    function getFriendsArray() {

        var tempFriendArray = [];

        Azureservice.read('friends', "$filter=kid1_id eq '" + clientGUID + "' or kid2_id eq '" + clientGUID + "'")
            .then(function (items) {
                if (items.length == 0) { // if no Friend record found, then
                    // 'noFriendsFlag' is a flag the UI uses to check for 'show/hide' msg div
                    $scope.noFriendsFlag = true;
                    console.log('no connections yet')
                }
                else { // if friend records found, add to friendsarray  // @@@@@@ MAYBE 'PUSH' INTO ARRAY FOR MULTIPLE CLIENTS TO AVOID LOTS OF AZURE CALLS

                    $scope.friendArray = []  // @@@ Make a brand New Array (( Dumping any existing one ))

                    // Go through Friend items and reorder it 
                    // --------------------------------------
                    len = items.length;
                    for (i = 0; i < len; i++) {
                        if (items[i].kid1_id == clientGUID) {  // If the first kid is this client, using the 2nd
                            var element = {  // make a new array element
                                client_id: clientGUID,
                                record_id: items[i].id,
                                friend_id: items[i].kid2_id,
                                friend_name: items[i].kid2_name,
                                friend_avatar: items[i].kid2_avatar,
                                //friend_parentname: ' ',
                                //friend_parentemail: ' ',
                            };
                            tempFriendArray.push(element); // add back to array
                        }
                        else { // else use the first kid
                            var element = {  // make a new array element
                                client_id: clientGUID,
                                record_id: items[i].id,
                                friend_id: items[i].kid1_id,
                                friend_name: items[i].kid1_name,
                                friend_avatar: items[i].kid1_avatar,
                                //friend_parentname: ' ',
                                //friend_parentemail: ' ',
                            };
                            tempFriendArray.push(element); // add back to array
                        };
                    };//end for

                    globalService.friendArray = tempFriendArray;
                    $scope.friendArray = globalService.friendArray; // @@@ Set to $scope array

                };
            }).catch(function (error) {
                console.log(error); alert(error);
            });

    };//end function
    // ==========================================



    // ==========================================
    //  Get the Event log based on Client GUID.   THIS CODE USED ON CLIENTPROPERTIESCONTROLLER.JS and CLIENTSTARTCONTROLLER.JS and ADMINDASHCONTROLLER.JS
    // ==========================================

    function getEventLog() {

        // Before getting the event log from Azure, take Imagepropertiesarray and make a new local array of ['ImageIDUserID',] so its easy to check against
        // ---------------
        var likesArrayFlattened = [];
        var imagepropertiesarray = [];
        if(localStorage.getItem('RYB_imagepropertiesarray')){
            imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
            var imagepropertiesarraylength = imagepropertiesarray.length
            for (x = 0; x < imagepropertiesarraylength; x++) { // Loop through to array for ImageID
                for (y = 0; y < imagepropertiesarray[x].commentarray.length; y++) {  // Loop through subarray for comments
                    var el = imagepropertiesarray[x].id + imagepropertiesarray[x].commentarray[y].kid_id;
                    likesArrayFlattened.push(el);
                };
            }; //end for
        };


        var tempArray = []; // This resets the local array (which $scope is set to later)
        // Read Event Log from Azure
        // ------------------------
        Azureservice.read('events', "$filter=fromkid_id eq '" + clientGUID + "' or tokid_id eq '" + clientGUID + "'")
          .then(function (items) {

              if (items.length == 0) { // if no Event record found, then
                  $scope.noEventsFlag = true;   // '...Flag' is a flag the UI uses to check for 'show/hide' msg div
                  console.log('no events in last 2 weeks')
              }
              else {

                  // Go through Event items and reorder it 
                  var tempArray = [];
                  var len = items.length;
                  var today = new Date(); // today for comparison
                  var day, time, fromkid, tokid, lastimageurl, lasteventtype;
                  thiseventday = new Date();
                  nexteventday = new Date();
                  montharray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                  for (i = 0; i < len; i++) {

                      thiseventday = new Date(items[i].datetime); // convert datetime to number
                      if ((i + 1) < len) { //  Don't go over array length
                          nexteventday = new Date(items[i + 1].datetime);
                      };

                      // @@@ Get Day - Compare Day and Month
                      // ---------------------
                      if (i < (len-1)) { // If this is NOT last in array, check if you need to show it.
                          if ((thiseventday.getDate() == nexteventday.getDate()) && (thiseventday.getMonth() == nexteventday.getMonth())) {
                              day = null; // then it's the same as the last one and don't need to repeat the date
                          }
                              // may never have this case?
                          else if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Today';}
                              // If Day is Today-1, Then its Yesterday
                          else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Yesterday';}
                          else { day = montharray[thiseventday.getMonth()] + " " + thiseventday.getDate(); }
                      }
                      else { // If this IS last in array, then it has to have the date header
                          if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Today';}
                              // If Day is Today-1, Then its Yesterday
                          else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Yesterday';}
                          else { day = montharray[thiseventday.getMonth()] + " " + thiseventday.getDate(); }
                      }

                      // @@@ Get time 
                      // --------
                      var t = thiseventday.getHours();  //+1 to make up for 0 base
                      var minutes = thiseventday.getMinutes();
                      if (minutes < 10) {
                          minutes = "0" + minutes;
                      };
                      if (t > 12) {
                          time = Math.abs(12 - t) + ":" + minutes + "pm";  // break down the 24h and use Am/pm
                      }
                      else {
                          time = t + ":" + minutes + "am";  // break down the 24h and use Am/pm
                      }

                      // @@@ Small check to personalize the event details if it is YOU
                      // ------------------
                      var from_check;
                      if (items[i].fromkid_id == clientGUID) {
                          from_check = "You";
                      }
                      else { from_check = items[i].fromkid_name };


                      // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

                      //make a new array based on urls.  url is like object key index.  its all about the Image Url.
                      //then each event adds properties around that url Object

                      // Look at Image URL and see if it is in the tempArray.  If not, make new object.  If so, add to Object
                      var event_type = items[i].event_type;

                      // @@@ If a 'friend' event, it does not have a URL
                      // ---------------------------------
                      if (event_type == 'friends') {
                          var element = {  // @@@ Make a new array object.  If items[i] is NULL, the HTML binding for ng-show will hide the HTML templating
                              //picture_url: items[i].picture_url,  // not relevant in this case
                              //fromkid: from_check,  // who shared it
                              fromkid: items[i].fromkid_name,
                              fromkidavatar: globalService.getAvatarFromID(items[i].fromkid_avatar),
                              fromkid_id: items[i].fromkid_id,
                              tokid: [{ // this is a notation for a nested object.  If someone sent to YOU, this has just your name in it
                                  tokidname: items[i].tokid_name,  // each kids shared with
                                  tokid_id: items[i].tokid_id,
                                  tokidavatar: globalService.getAvatarFromID(items[i].tokid_avatar),
                                  tokidreply: '',  // null in this case
                              }],
                              event_type: event_type, // 
                              comment_content: items[i].comment_content,
                              day: day,
                              time: time,
                          };
                          tempArray.push(element); // add into array for UI & $scope
                      }

                      else { // If not a 'friend' event, it should have a URL
                      // ---------------------------------

                          // Get Image ID from Picture URL.  It's the last part.
                      var imageID = items[i].picture_url.replace('https://rtwdevstorage.blob.core.windows.net/imagecontainer/',''); 
                      imageID = imageID.replace('.png', ''); // Cut off the .png at the end

                      var imageurlfound = false;
                      var tempArrayLength = tempArray.length;
                      for (x = 0; x < tempArrayLength; x++) { // Loop through to array for ImageID

                          if (tempArray[x].picture_url == items[i].picture_url) {

                              ///alert('found imageurl')
                              // Inspect to know how to add to Object
                              // ------------
                              // cases: SharePicture - track this url.  Like Picture - append to tracked url.  
                              
                              // url, shared, to any kid
                              if (event_type == 'sharepicture') {
                                  // Update object to add ToKid element
                                  // ------------
                                  var kidobject = {
                                      tokidname: items[i].tokid_name,
                                      tokidavatar: globalService.getAvatarFromID(items[i].tokid_avatar),
                                      tokidreply: '', //null in this case
                                  };
                                  tempArray[x].tokid.push(kidobject);
                              }

                                  // @@@@@@@@@@@@@@@@@@@@
                              // url, liked, from any kid
                              else if (event_type == 'like') {
                                  // Update your reply in the ToKid element
                                  // ------------
                                  //tempArray[x].tokid[items[i].tokid_id == clientGUID].tokidreply = items[i].comment_content
                                  var kidArrayLength = tempArray[x].tokid.length; // 'tokid' is a subarray
                                  for (y = 0; y < kidArrayLength; y++) { // Loop through to subarray for tokid_id

                                      if (tempArray[x].tokid[y].tokid_id == items[i].fromkid_id) {
                                          tempArray[x].tokid[y].tokidreply = 'likes' //items[i].comment_content

                                          // @@@@ NEED TO SAVE LIKES INTO LOCAL IMAGEPROPERTIES ARRAY.  
                                          // Check to see if this Like (ImageID, UserID) is in the quick check array.  IF NOT, then add to local imagepropertiesarray
                                          // ------------------
                                          if (likesArrayFlattened.indexOf(imageID + items[i].fromkid_id) == -1) {  // Not found in array
                                              // Make new JSON element with the Like event details
                                              var event = items[i].event_type;
                                              var name = items[i].fromkid_name;
                                              var avatar = items[i].fromkid_avatar;
                                              var kid_id = items[i].fromkid_id;
                                              var comment_element = { event_type: event, name: name, avatar: avatar, kid_id: kid_id }; // New object
                                              // Update 'RYB_imagepropertiesarray' in LocalStorage
                                              var imagepropertiesarray = [];
                                              imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
                                              for (x = 0; x < imagepropertiesarray.length; x++) { // Loop through to array for ImageID
                                                  if (imagepropertiesarray[x].id == imageID) {
                                                      imagepropertiesarray[x].commentarray.push(comment_element);
                                                  };
                                              }; //end for
                                              localStorage["RYB_imagepropertiesarray"] = JSON.stringify(imagepropertiesarray); //push back to localStorage
                                              //alert("update image array with like comment" + JSON.stringify(imagepropertiesarray))
                                          };

                                          break;
                                      };
                                  }; // end for
                              }
                              else { alert('unknown case') };

                              imageurlfound = true;
                              break;
                          } // end if URL found

                      }; //end for

                      if ((imageurlfound == false) && (event_type == 'sharepicture')) {  // New SharedUrl found 

                          // @@@@ Make new array object for UI 
                          // ==============================
                          var element = {  // @@@ Make a new array object.  If items[i] is NULL, the HTML binding for ng-show will hide the HTML templating
                              picture_url: items[i].picture_url, // this object is all about what happens around this image url
                              fromkid: from_check,  // who shared it
                              fromkidavatar: globalService.getAvatarFromID(items[i].fromkid_avatar),
                              fromkid_id: items[i].fromkid_id,
                              tokid: [{ // this is a notation for a nested object.  If someone sent to YOU, this has just your name in it
                                  tokidname: items[i].tokid_name,  // each kids shared with
                                  //tokidname: from_check,  // each kids shared with
                                  tokid_id: items[i].tokid_id,
                                  tokidavatar: globalService.getAvatarFromID(items[i].tokid_avatar),
                                  tokidreply: "",  // null right now
                              }],
                              event_type: event_type, // 
                              comment_content: items[i].comment_content,
                              day: day,
                              time: time,
                          };
                          tempArray.push(element); // add into array for UI & $scope
                      };

                      }; //end if event type

                  }; // ------ end for


                  // @@@ Push the cleaned up array of objects into the $scope
                  globalService.eventArray = tempArray.reverse();// Reverse order of array so most recent is first
                  $scope.eventarray = globalService.eventArray;

              }; // end if


          }).catch(function (error) {
              console.log(error)
          });


    }; //end function

    // ==========================================







    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoCanvasView = function () {
        //globalService.changeView('/canvas');
        $state.go('canvas');
        globalService.lastView = 'clientstart';
    };
    $scope.gotoGalleryView = function () {
        globalService.lastView = 'clientstart';  // for knowing where to go with the back button
        //globalService.changeView('/gallery');
        $state.go('gallery');
    };


    // Click on image in timeline
    // ------------------------------------------------
    $scope.gotoPictureView = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.idParameters = clickEvent.target.id;  // div ID has 3 values shoved in it

        // Split the parameter string to decide which image view UI to use - GalleryPictureView or PictureView
        var picturesplitarray = clickEvent.target.id.split(","); // The ID has values shoved in. Split string into array by ","
        var fromkid_id = picturesplitarray[3];

        // Look to see if fromkid is client
        // -- Switch the Picture View controller click is directed to
        if (fromkid_id == globalService.userarray[0]) { // If it's from client, you have to redo the parameters and send to a different view to pull from local storage with the data there.
            // clean up image id out of url
            var imageid = picturesplitarray[0];
            var filepath;
            imageid = imageid.replace('https://rtwdevstorage.blob.core.windows.net/imagecontainer/', '')
            imageid = imageid.replace('.png', '')
            // look up file path in local storage imagepropertiesarray
            var imagepropertiesarray = [];
            imagepropertiesarray = JSON.parse(localStorage.getItem('RYB_imagepropertiesarray')); // get array from localstorage key pair and string
            var imagepropertiesarraylength = imagepropertiesarray.length;
            for (x = 0; x < imagepropertiesarraylength; x++) { // Loop through to array for ImageID
                if (imagepropertiesarray[x].id == imageid) {
                    filepath = imagepropertiesarray[x].filepath;
                    break;
                };
            }; //end for
            $scope.idParameters = imageid + ',' + filepath;
            globalService.pictureViewParams = $scope.idParameters;  // this next view requires imageid and filepath
            alert(globalService.pictureViewParams)
            //globalService.changeView('/gallerypicture');
            $state.go('gallerypicture');
        }
        else {
            globalService.pictureViewParams = $scope.idParameters;  // pass the 3 values as a string and split at the next view
            //globalService.changeView('/picture');
            $state.go('picture');
        };

        //globalService.pictureViewParams = $scope.idParameters;  // pass the 3 values as a string and split at the next view
        globalService.lastView = 'clientstart';  // for knowing where to go with the back button
    };

}); //controller end