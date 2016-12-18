// clientpropertiesController

angular.module('cordovaNG').controller('clientpropertiesController', function ($scope, globalService, Azureservice, $state, $ionicPopup) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    $scope.noFriendsFlag = false; // boolean for ng-show for 'no friends' message
    $scope.noEventsFlag = false;  


    // =======================================================
    // From the Client GUID, get the rest of Client Properties
    // =======================================================
    var selectedclientguid = globalService.selectedClient;
    var client = [];
    var clientarray = [];
    clientarray = JSON.parse(localStorage.getItem('RYB_clientarray')); // get array from localstorage key pair and string
    // Search through array of arrays
    // ----
    var foundIndex = '';
    var clientarraylength = clientarray.length;
    for (i = 0; i < clientarraylength; i++) {
        if (clientarray[i].indexOf(selectedclientguid) > -1) { // If GUID found in this subarray 
            foundIndex = i;
            client = clientarray[i];
            break;
        };
    };
    $scope.clientName = client[1];
    $scope.avatarID = client[2];
    $scope.registrationCode = client[3];
    $scope.AvatarURL = globalService.getAvatarFromID(client[2]);
    // =======================================================


    // Set the local data model here to the data in the global service between views
    // -------
    //$scope.eventarray = globalService.eventArray;

    // if last data pull was over 5 MIN ago, then check again
    // -------
    //if (globalService.lastTimeChecked < (Date.now() - 300000)) { 
    //    getEventLog();
    //    globalService.lastTimeChecked = Date.now();
    //};


    // ==========================================
    //  Get the Event log based on Client GUID.   THIS CODE USED ON CLIENTPROPERTIESCONTROLLER.JS and CLIENTSTARTCONTROLLER.JS and ADMINDASHCONTROLLER.JS
    // ==========================================

    //function getEventLog() {

        //alert(selectedclientguid)
        //alert('admin id is ' + globalService.userarray[0])

        Azureservice.read('events', "$filter=fromkid_id eq '" + selectedclientguid + "' or tokid_id eq '" + selectedclientguid + "'")
              .then(function (items) {

                  if (items.length == 0) { // if no Event record found, then
                      $scope.noEventsFlag = true;   // '...Flag' is a flag the UI uses to check for 'show/hide' msg div
                      console.log('no events in last 2 weeks')
                  }
                  else {
                      // Go through Friend items and reorder it 
                      // --------------------------------------
                      var tempArray = [];
                      var len = items.length;
                      var today = new Date(); // today for comparison
                      var day, time, fromkid, tokid, lastimageurl;
                      thiseventday = new Date();
                      nexteventday = new Date();
                      montharray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      dayarray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
                              else if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                                  day = 'Today';
                              }
                                  // If Day is Today-1, Then its Yesterday
                              else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                                  day = 'Yesterday';
                              }
                              else { day = montharray[thiseventday.getMonth()] + " " + thiseventday.getDate(); }
                          }
                          else { // If this IS first in array, then it has to have the date header
                              if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                                  day = 'Today';
                              }
                                  // If Day is Today-1, Then its Yesterday
                              else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                                  day = 'Yesterday';
                              }
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
                          if (items[i].fromkid_id == globalService.userarray[0]) {
                              from_check = "You";
                          }
                          else { from_check = items[i].fromkid_name };

                          //make a new array based on urls.  url is like object key index.  its all about the Image Url.
                          //then each event adds properties around that url Object

                          // Look at Image URL and see if it is in the tempArray.  If not, make new object.  If so, add to Object
                          var event_type = items[i].event_type;

                          // @@@ If a 'friend' event, it does not have a URL
                          // ---------------------------------
                          if (event_type == 'friends') {
                              //alert('found freind event')
                              var element = {  // @@@ Make a new array object.  If items[i] is NULL, the HTML binding for ng-show will hide the HTML templating
                                  //picture_url: items[i].picture_url,  // not relevant in this case
                                  fromkid: from_check,  // who shared it
                                  fromkidavatar: items[i].fromkid_avatar,
                                  fromkid_id: items[i].fromkid_id,
                                  tokid: [{ // this is a notation for a nested object.  If someone sent to YOU, this has just your name in it
                                      tokidname: items[i].tokid_name,  // each kids shared with
                                      tokid_id: items[i].tokid_id,
                                      tokidavatar: items[i].tokid_avatar,
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
                              var imageID = items[i].picture_url.replace('https://rtwdevstorage.blob.core.windows.net/imagecontainer/', '');
                              imageID = imageID.replace('.png', ''); // Cut off the .png at the end

                              var imageurlfound = false;
                              var tempArrayLength = tempArray.length;
                              for (x = 0; x < tempArrayLength; x++) { // Loop through to array for ImageID

                                  if (tempArray[x].picture_url == items[i].picture_url) {

                                      // Inspect to know how to add to Object
                                      // ------------
                                      // cases: SharePicture - track this url.  Like Picture - append to tracked url.  

                                      // url, shared, to any kid
                                      if (event_type == 'sharepicture') {
                                          // Update object to add ToKid element
                                          // ------------
                                          var kidobject = {
                                              tokidname: items[i].tokid_name,
                                              tokidavatar: items[i].tokid_avatar,
                                              tokidreply: '', //null in this case
                                          };
                                          tempArray[x].tokid.push(kidobject);
                                      }

                                          // url, liked, from any kid
                                      else if (event_type == 'like') {
                                          // Update your reply in the ToKid element
                                          // ------------
                                          //tempArray[x].tokid[items[i].tokid_id == clientGUID].tokidreply = items[i].comment_content
                                          var kidArrayLength = tempArray[x].tokid.length; // 'tokid' is a subarray
                                          for (y = 0; y < kidArrayLength; y++) { // Loop through to subarray for tokid_id
                                              if (tempArray[x].tokid[y].tokid_id == items[i].fromkid_id) {
                                                  tempArray[x].tokid[y].tokidreply = 'likes' //items[i].comment_content
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
                                      fromkidavatar: items[i].fromkid_avatar,
                                      fromkid_id: items[i].fromkid_id,
                                      tokid: [{ // this is a notation for a nested object.  If someone sent to YOU, this has just your name in it
                                          tokidname: items[i].tokid_name,  // each kids shared with
                                          //tokidname: from_check,  // each kids shared with
                                          tokid_id: items[i].tokid_id,
                                          tokidavatar: items[i].tokid_avatar,
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

                      }; //end for

                      //@@@@@@@@@@@@@@@@@@@@@@@
                      $scope.eventarray = tempArray.reverse(); // For some reason, this was reversing the order of the list chronologically
                      //$scope.eventarray = tempArray;

                  }; // end if


              }).catch(function (error) {
                  console.log(error)
              });

    //}; // end func


    // ==========================================









    // ==========================================
    //  Get friends from Azure based on Client GUID.  THIS CODE USED ON CLIENTPROPERTIESCONTROLLER.JS and CLIENTSTARTCONTROLLER.JS
    // ==========================================
    //function getfriends() {

    var friendsarraylen, j;
    var quickfriendarray = []; //this is for quickly looking up redundancies in friends list
    var tempArray = []; // This resets the local array (which $scope is set to later)       

    Azureservice.read('friends', "$filter=kid1_id eq '" + selectedclientguid + "' or kid2_id eq '" + selectedclientguid + "'")
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
                var len = items.length;
                for (i = 0; i < len; i++) {
                    if (items[i].kid1_id == selectedclientguid) {  // If the first kid is this client, using the 2nd
                        // check to make sure this friend isn't alredy in the tempArray by checking the quickfriendarray
                        if (quickfriendarray.indexOf(items[i].kid2_id) == -1) {
                            var element = {  // make a new array element
                                client_id: selectedclientguid,
                                record_id:items[i].id,
                                friend_id: items[i].kid2_id,
                                friend_name: items[i].kid2_name,
                                friend_avatar: ' ', //empty placeholder
                                friend_parentname: ' ',
                                friend_parentemail:' ',
                            };
                            tempArray.push(element); // add back to array
                            quickfriendarray.push(items[i].kid2_id)//add to quickfriendarray
                        };
                    }
                    else { // else use the first kid
                        // check to make sure this friend isn't alredy in the tempArray by checking the quickfriendarray
                        if (quickfriendarray.indexOf(items[i].kid1_id) == -1) {
                            var element = {  // make a new array element
                                client_id: selectedclientguid,
                                record_id: items[i].id,
                                friend_id: items[i].kid1_id,
                                friend_name: items[i].kid1_name,
                                friend_avatar: ' ', //empty placeholder
                                friend_parentname: ' ',
                                friend_parentemail: ' ',
                            };
                            tempArray.push(element); // add back to array
                            quickfriendarray.push(items[i].kid1_id)//add to quickfriendarray
                        };
                    };
                };//end for

                // Different way of setting up the loop to get kid details
                j = 0;
                friendsarraylen = tempArray.length;
                getkiddetails(); // @@@ Call recursive Azure call

            };
        }).catch(function (error) {
            console.log(error); alert(error);
        });
    // RECURSIVELY Go through Friend array and get addtional info Kid table in Azure 
    // !!!!! LOTS OF CALL TO AZURE NOW  // !!!!! BETTER TO HAVE A CUSTOM API IN NODE TO DO THIS JOINING
    // --------------------------------------
    function getkiddetails() {

        if (j < friendsarraylen) { // Don't know why this is going over the array size but this is a hack to fix
            if (tempArray[j].friend_id != globalService.userarray[0]) { //if not the Admin/parent GUID

                Azureservice.getById('kid', tempArray[j].friend_id)
                .then(function (item) {
                    // TRYING TO TAKE IT OUT OF THE OTHER AZURE CALL
                    // -----
                    tempArray[j].friend_avatar = item.avatar_id;
                    tempArray[j].friend_parentname = item.parent_name;
                    tempArray[j].friend_parentemail = item.parent_email;
                    $scope.friendArray = tempArray; // @@@ Set to $scope array;
                    // RECUSIVE PART.  Regular FOR loop didn't work.
                    j++;
                    if (j < friendsarraylen) {
                        getkiddetails();
                    };
                }, function (err) {
                    console.error('Azure Error: ' + err);
                });
            }
            else { //else if it is the parent ID, just recurse 
                tempArray[j].friend_name = "You";
                tempArray[j].friend_avatar = globalService.userarray[5];
                $scope.friendArray = tempArray; // @@@ Set to $scope array;
                // RECUSIVE PART.  Regular FOR loop didn't work.
                j++;
                if (j < friendsarraylen) {
                    getkiddetails();
                };
            };
        };
    };

    //}; // end getFriends
    // ==========================================







    // ==========================================
    // Delete on Friend record
    // ==========================================
    $scope.deleteFriendClick = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.clientId = clickEvent.target.id;
        //alert('delete item = ' + $scope.clientId);

        deleteFriendRecord($scope.clientId);
    }

    function deleteFriendRecord(id) {
        Azureservice.del('friends', {
            id: id // ID for the row to delete    
        })
        .then(function () {
            console.log('Delete successful');
            //alert('Delete successful')

            // Remove from $scope.friendArray.  Its a pain to rebuild
            // -----------
            var foundIndex;
            var len = $scope.friendArray.length;
            for (i = 0; i < len; i++) {
                //alert(JSON.stringify($scope.friendArray[i]));
                if ($scope.friendArray[i].record_id == id) { // If found in this subarray 
                    foundIndex = i;
                    //alert('found at: ' + foundIndex);
                    $scope.friendArray.splice(foundIndex, 1) // remove from this element at index number from 'clientarray'
                    //alert($scope.friendArray);
                    break;
                };
            };
            if ($scope.friendArray.length == 0) {
                $scope.noFriendsFlag = true; // UI flag
            };

        }, function (err) {
            console.error('Azure Error: ' + err);  //alert('Azure Error: ' + err);
        });
    }

    // ==========================================




    // ################################################################################################
    // ################################################################################################

    // ==========================================
    //  Create New Friend request record on Azure.  Store locally and create on Azure
    // ==========================================
    //1. enter parent email and lookup to verify, and get clients for this admin
    //2. enter the kids display name and lookup in client array verify
    //3. default to the display of the kid whose context you're creating the invitation in
    //4. create new invitation record with the 4 corresponding IDs
    // INVITATION RECORD: fromparent_id, toparent_id, fromkid, tokid, datetime

    var ToParentID, ToParentName, ToKidName2, FromKidName, FromKidID, ToKidID,ToKidAvatar,FromKidAvatar;
    var clientarray2 = [];


    // Choose Client (if needed)
    // ------------
    FromKidID = selectedclientguid;
    FromKidName = $scope.clientName;
    FromKidAvatar=$scope.avatarID;
    // ------------


    // Verify Parent
    // ------------
    $scope.verifyParent = function (email) {
        azureQueryParent(email)
        $scope.verifyParentError = false;
    };
    function azureQueryParent(email) {
        var query = "$filter=email eq '" + email + "'";
        Azureservice.read('parents', query).then(function (items) {  // query to see if this 'reg_code' exists
            if (items.length == 0) { // if email not found, then
                // 'verifyParentError' is a flag the UI uses to check for 'show/hide' error div
                $scope.verifyParentError = true;
                $scope.verifyParentErrorMessage = '"' + email + '" is not a valid email.  Please check and try again.'
                console.log('email not found')
            }
            else { // if email found, show verify success and kid verification UI
                $scope.verifyParentSuccess = true;
                ToParentID = items[0].id; // Get the GUID for the parent
                ToParentName = items[0].name; // Get the GUID for the parent
                azureQueryClientList(ToParentID)
            };
        }).catch(function (error) {
            console.log(error)
            alert(error);
        })
    };

    // Get Clients for Admin ID
    // ------------
    function azureQueryClientList(adminGUID) {
        var query = "$filter=parent_id eq '" + adminGUID + "'";
        Azureservice.read('kid', query).then(function (items) {  // query to see if this 'name' exists
            if (items.length == 0) { // if admin guid not found, then
                console.log('admin guid  not found')
            }
            else { // if admin guid found, get the client list (JSON) and put in array
                clientarray2 = items;  //alert(clientarray2[0].name);
            };
        }).catch(function (error) {
            console.log(error);
            alert(error);
        })
    };


    // Verify Kid by looking up in Client Array
    // ------------
    $scope.verifyKid = function (name) {
        $scope.verifyKidError = false;
        lookUpClientinArray(name)
    };
    function lookUpClientinArray(name) {
        var found = false;
        for (i = 0, len = clientarray2.length; i < len; i++) {
            //alert(clientarray2[i].name);
            if (clientarray2[i].name == name) {
                found = true;
                ToKidID = clientarray2[i].id; // Get the GUID for this client
                ToKidAvatar = clientarray2[i].avatar_id;
                break;
            };
        };
        if (found == true) { // name is in the Client array (-1 means not found), then show verify success and addNewInvitation button
            $scope.verifyKidSuccess = true;
            ToKidName2 = name; // use the name for the kid
        }
        else { // if kid name not found, 
            // 'verifyKidError' is a flag the UI uses to check for 'show/hide' error div
            $scope.verifyKidError = true;
            $scope.verifyKidErrorMessage = '"' + name + '" is not a valid user.  Please check and try again.'
            console.log('kid name not found')
        };
    };


    // Create invitation record
    // ------------
    $scope.addNewInvitation = function () {
        $scope.verifyKidSuccess = false; //toggle to turn off the UI modal (could be in html also)

        // Create on Azure
        // ---------------
        // @@@ Push Notification sent by Node after Insert to ToParent for invitation 
        Azureservice.insert('invitations', {
            id: globalService.makeUniqueID(), // made GUID for Azure table        
            fromparent_id: globalService.userarray[0],
            fromparent_name: globalService.userarray[4], //first name.  full name is [2]
            toparent_id: ToParentID,
            toparent_name: ToParentName,
            fromkid: FromKidName,
            tokid: ToKidName2,
            fromkid_id: FromKidID,
            tokid_id: ToKidID,
            tokid_avatar: ToKidAvatar,
            fromkid_avatar: FromKidAvatar,
            status: '0', // unaccepted
        })
        .then(function () {
            console.log('new invitation insert successful');
            $scope.invitationSuccess = true; // UI flag that invitation was sent
            $scope.showInvitationForm = false;
        },
        function (err) {
            console.error('Azure Error: ' + err);
            $scope.invitationError = true;
            $scope.invitationErrorMessage = err; // UI flag that invitation was sent
        });
    };

    // ==========================================




    // ==========================================
    //  Get local client array.   
    // ==========================================
    $scope.clientarray = []; //create as an array
    $scope.clientarray = JSON.parse(localStorage.getItem('RYB_clientarray')); // get array from localstorage key pair and string
    alert("array length: " + $scope.clientarray.length + " - " + $scope.clientarray)
    // ==========================================

    // ==========================================
    // Delete Client
    // ==========================================

    // Confirm popup code
    $scope.showdeleteConfirm = function () {     
        var deleteConfirmPopup = $ionicPopup.show({
            title:'',
            templateUrl: 'deleteConfirmPopup.html',
            scope: $scope,
            //cssClass: 'ConfirmPopup',
            buttons: [{
                text: 'CANCEL',
                type: 'button button-clear button-dark'
              },
              {
                  text: 'REMOVE',
                  type: 'button button-clear button-assertive',
                  onTap: function (e) {
                      //alert('delete item = ' + selectedclientguid);
                      deleteClient(selectedclientguid);
                  }
              },
            ]
        });
        //deleteConfirmPopup.then(function (res) {
        //});
    };

    function deleteClient(id) {
        // Delete from localStorage
        // ---------------
        var foundIndex;
        var len = $scope.clientarray.length;
        for (i = 0; i < len; i++) {
            if ($scope.clientarray[i].indexOf(id) > -1) { // If found in this subarray 
                foundIndex = i;
                //alert('found at: ' + foundIndex);
                $scope.clientarray.splice(foundIndex, 1) // remove from this element at index number from 'clientarray'
                //alert($scope.clientarray);
                localStorage["RYB_clientarray"] = JSON.stringify($scope.clientarray); //push back to localStorage

                // Delete on Azure
                // ---------------
                Azureservice.del('kid', {
                    id: id // ID for the row to delete    
                })
                .then(function () {
                    console.log('Delete successful');

                    // @@@ Once the Client is deleted, have to delecte other records this client is in
                    GetFriendRecordsAndDelete(id);

                }, function (err) {
                    //console.error('Azure Error: ' + err);
                    alert('Azure Error: ' + err);
                });

                break;
            };
        };
        if (len == 1) { $scope.noClientFlag = true }; // If only one item in client array and you remove it, then show no clients UI

    };
    // ==========================================

    // ==========================================
    //  Delete friends records from Azure based on Client GUID
    // ==========================================
    var len, j;

    function GetFriendRecordsAndDelete(id) {

        Azureservice.read('friends', "$filter=kid1_id eq '" + id + "' or kid2_id eq '" + id + "'")
           .then(function (items) {
               if (items.length == 0) { // if no Friend record found, then
                   console.log('no connections yet')
               }
               else { // if friend records found, Go through Items and Delete them  
                   alert(JSON.stringify(items));

                   // Different way of setting up the loop 
                   // ---
                   j = 0;
                   len = items.length;
                   DeleteFriendRecords(items); // @@@ Call recursive Azure call

               };
           }).catch(function (error) {
               console.log(error); alert(error);
           });
    };

    // RECURSIVELY Go through Friend array and delete each from Friends table in Azure 
    // !!!!! LOTS OF CALL TO AZURE NOW  // !!!!! BETTER TO HAVE A CUSTOM API IN NODE TO DO THIS JOINING
    // --------------------------------------
    function DeleteFriendRecords(items) {
        alert(j);
        // Delete on Azure
        // ---------------
        Azureservice.del('friends', {
            id: items[j].id // ID for the row to delete    
        })
        .then(function () {
            console.log('Delete successful');
            // @@@ RECUSIVE PART.  Regular FOR loop didn't work.
            // ------
            j++;
            if (j < len) {
                DeleteFriendRecords(items);
            }
            else { $scope.gotoAdminView() }; // You're done and go back to Dash view
        }, function (err) {
            //console.error('Azure Error: ' + err);
            alert('Azure Error: ' + err);
        });
        // ---------------

    };
    // ==========================================
    // ==========================================








    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoAdminView = function () {
        //globalService.changeView('/admindash');
        $state.go('admindash');
    };
    $scope.gotoPictureView = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.idParameters = clickEvent.target.id;  // div ID has 3 values shoved in it

        globalService.pictureViewParams = $scope.idParameters;  // pass the 3 values as a string and split at the next view
        globalService.lastView = 'clientproperties';  // for knowing where to go with the back button
        //globalService.changeView('/picture');
        $state.go('picture');
    }

}); //controller end