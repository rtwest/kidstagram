// admindashController

// - Load the client array.  CRUD operations here are pushed to web, so the local store is always most current


angular.module('cordovaNG').controller('admindashController', function ($scope, globalService, Azureservice, $state) {
    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    $scope.showaddclientui = false; // boolean for ng-show for add client modal
    $scope.showClientAddedUI = false; // boolean for ng-show for ClientAdded message
    $scope.noClientFlag = false; // boolean for ng-show for 'no client' message
    $scope.showInvitationForm = false; // boolean for ng-show for add invitation modal
    var adminGuid = globalService.userarray[0];

    // Grab event log and see if it should be updated
    $scope.eventarray = globalService.eventArray;
    if (globalService.lastTimeChecked < (Date.now() - 300000)) { // if last data pull was over 5 MIN ago, then check again
        getEventLog();
        globalService.lastTimeChecked = Date.now();
    };

    // ==========================================
    //  Get the Event log based on Admin GUID.   THIS CODE USED ON CLIENTPROPERTIESCONTROLLER.JS and CLIENTSTARTCONTROLLER.JS and ADMINDASHCONTROLLER.JS
    // ==========================================

    function getEventLog() {

        // Before getting the event log from Azure, take Imagepropertiesarray and make a new local array of ['ImageIDUserID',] so its easy to check against
        // ---------------
        var likesArrayFlattened = [];
        var imagepropertiesarray = [];
        if (localStorage.getItem('RYB_imagepropertiesarray')) {
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
        Azureservice.read('events', "$filter=fromkid_id eq '" + adminGuid + "' or tokid_id eq '" + adminGuid + "'")
          .then(function (items) {

              if (items.length == 0) { // if no Event record found, then
                  $scope.noEventsFlag = true;   // '...Flag' is a flag the UI uses to check for 'show/hide' msg div
                  console.log('no events in last 2 weeks')
              }
              else {

                  // Go through Event items and reorder it
                  // --------------------------------------
                  var tempArray = [];
                  var len = items.length;
                  var today = new Date(); // today for comparison
                  var day, time, fromkid, tokid, lastimageurl, lasteventtype;
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
                      if (i < (len - 1)) { // If this is NOT last in array, check if you need to show it.
                          if ((thiseventday.getDate() == nexteventday.getDate()) && (thiseventday.getMonth() == nexteventday.getMonth())) {
                              day = null; // then it's the same as the last one and don't need to repeat the date
                          }
                              // may never have this case?
                          else if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Today';
                          }
                              // If Day is Today-1, Then its Yesterday
                          else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Yesterday';
                          }
                          else { day = dayarray[thiseventday.getDay()] + ", " + montharray[thiseventday.getMonth()] + " " + thiseventday.getDate(); }
                      }
                      else { // If this IS last in array, then it has to have the date header
                          if ((thiseventday.getDate() == today.getDate()) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Today';
                          }
                              // If Day is Today-1, Then its Yesterday
                          else if ((thiseventday.getDate() == (today.getDate() - 1)) && (thiseventday.getMonth() == today.getMonth())) {
                              day = 'Yesterday';
                          }
                          else { day = dayarray[thiseventday.getDay()] + ", " + montharray[thiseventday.getMonth()] + " " + thiseventday.getDate(); }
                      }

                      // @@@ Get time 
                      // --------
                      var t = thiseventday.getHours();  //+1 to make up for 0 base
                      var minutes = thiseventday.getMinutes();
                      if (minutes < 10) {
                          minutes = "0" + minutes;
                      };
                      if (t > 12) {
                          time = Math.abs(12 - t) + ":" + minutes + " pm";  // break down the 24h and use Am/pm
                      }
                      else {
                          time = t + ":" + minutes + " am";  // break down the 24h and use Am/pm
                      }

                      // @@@ Small check to personalize the event details if it is YOU
                      // ------------------
                      var from_check;
                      if (items[i].fromkid_id == adminGuid) {
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

                                      // @@@@@@@@@@@@@@@@@@@@
                                      // url, liked, from any kid
                                  else if (event_type == 'like') {
                                      // Update your reply in the ToKid element
                                      // ------------
                                      //tempArray[x].tokid[items[i].tokid_id == adminGuid].tokidreply = items[i].comment_content
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




    // ==========================================
    //  Get local client array.   
    // ==========================================
    $scope.clientarray = []; //create as an array

    if (localStorage.getItem('RYB_clientarray')) { 
        $scope.clientarray = JSON.parse(localStorage.getItem('RYB_clientarray')); // get array from localstorage key pair and string
        alert("array length: " + $scope.clientarray.length + " - " + $scope.clientarray)
    }
    else { // if no clients, show special message for this case 
        alert('no clients found')
        $scope.noClientFlag = true;
    };
    // ==========================================

    // This will be a default avatar the kid can change on first logon
    // ==========================================
    $scope.randomAvatarID = function() {
        $scope.avatarID = Math.floor(Math.random() * 24); // Random number between 0-23 // 24 items in array
    };
    // ==========================================



    // ==========================================
    //  Create new client.  Store locally and create on Azure
    // ==========================================
    $scope.addNewClient = function (name) {
        addKid(name);
        $scope.showaddclientui = false;
    };

    function makeRegistrationCode() {
        var text = "";
        //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";        
        var possible = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < 6; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    function addKid(name) {

        var guid = globalService.makeUniqueID();
        var registrationCode = makeRegistrationCode();

        // Store new Client info in localStorage
        // ---------------
        var clientitemarray = [];
        clientitemarray[0] = guid;
        clientitemarray[1] = name;
        clientitemarray[2] = $scope.avatarID;
        clientitemarray[3] = registrationCode

        $scope.clientarray.push(clientitemarray); //add first item to localstorage arraystring
        localStorage["RYB_clientarray"] = JSON.stringify($scope.clientarray); //push back to localStorage
        //if ($scope.clientarray.length > 0) { // if it exists already (not the first one)
        //    var arraylength = $scope.clientarray.length; // 'length' is actually array+1 because of zero index
        //    $scope.clientarray[arraylength] = clientitemarray; //add new item to client array
        //    localStorage["RYB_clientarray"] = JSON.stringify($scope.clientarray); //push back to localStorage
        //}
        //else{ // it doesn't already exist and this is the first one
        //    $scope.clientarray[0] = clientitemarray; //add first item to localstorage arraystring
        //    localStorage["RYB_clientarray"] = JSON.stringify($scope.clientarray); //push back to localStorage
        //};
        $scope.clientarray = JSON.parse(localStorage.getItem('RYB_clientarray')); // get updated array from localstorage key pair and string
        //alert("array length = "+ $scope.clientarray.length + " - " + $scope.clientarray)

        // Confirmation message
        $scope.showClientAddedUI = true; // toggle this boolean for ng-show in the UI
        $scope.noClientFlag = false;

        // Create on Azure
        // ---------------
        Azureservice.insert('kid', {
            id: guid, // made GUID for Azure table        
            name: name,
            parent_id: globalService.userarray[0],
            registration_code: registrationCode,
            reg_status: '0',
            avatar_id: $scope.avatarID,
            parent_name:globalService.userarray[4],
            parent_email: globalService.userarray[3],
        })
        .then(function () {
            console.log('new client insert successful');

            // Make array of parent and friends to iterate through recursively to add as friends
            var kid_array = [guid, name, $scope.avatarID];// new kid
            var client_item_array = [];
            client_item_array = $scope.clientarray.slice(0); // add all the clients.  ".slice(0)" make sure you copy the array, not link to it.
            var admin_array = [globalService.userarray[0], globalService.userarray[4], globalService.userarray[5]];  // id, firstname, avatar
            client_item_array.push(admin_array); // push the admin/parent in there

            // Call function with this array, start index, end index
            CheckAndInsertFriendRecord(kid_array,client_item_array, 0, client_item_array.length);

        },
        function (err) {
            console.error('Azure Error: ' + err);
        });
    };
    // ==========================================

    // ==========================================
    // Insert family friend record in Azure Friend Table
    // ==========================================
    function CheckAndInsertFriendRecord(kid_array,client_item_array, startindex, endindex) {

        if (startindex < endindex) {

            var friend_array = client_item_array[startindex];
            var kid2id = friend_array[0];
            var kid2name = friend_array[1];
            var kid2avatar = friend_array[2];

            var kid1id = kid_array[0];
            var kid1name = kid_array[1];
            var kid1avatar = kid_array[2];

            if (kid2id != kid1id) { // check IDs so you don't add kid as friend to themself

                Azureservice.insert('friends', {
                    //id: guid, // I'll let Azure handle this GUID since I don't need to track it locally        
                    kid1_id: kid1id,
                    kid2_id: kid2id,
                    kid1_name: kid1name,
                    kid2_name: kid2name,
                    kid1_avatar: kid1avatar,
                    kid2_avatar: kid2avatar
                })
                .then(function () {
                    console.log('new friend insert successful');
                    //InsertEventRecord(kid1id, kid2id, kid1name, kid2name, kid1avatar,kid2avatar); // @@@ On success, Insert new Event record in Azure Event Table
                },
                function (err) {
                    console.error('Azure Error: ' + err);
                });

                Azureservice.insert('events', {
                    //id: guid, // I'll let Azure handle this GUID since I don't need to track it locally        
                    fromkid_id: kid1id,
                    tokid_id: kid2id,
                    fromkid_avatar: kid1avatar,
                    tokid_avatar: kid2avatar,
                    fromkid_name: kid1name,
                    tokid_name: kid2name,
                    datetime: Date.now(),
                    event_type: "friends",
                })
                .then(function () {
                    //alert('freind record inserted');
                    console.log('new event insert successful');
                },
                function (err) {
                    console.error('Azure Error: ' + err);
                });

            }; // end if

            // @@@ Recursive part
            CheckAndInsertFriendRecord(kid_array, client_item_array, startindex + 1, endindex)

        }; // end if
    };


    // ==========================================
    // Delete Client
    // ==========================================
    $scope.deleteClientClick = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.clientId = clickEvent.target.id;
        alert('delete item = ' + $scope.clientId);

        deleteClient($scope.clientId);
    }

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
            };
        }, function (err) {
            //console.error('Azure Error: ' + err);
            alert('Azure Error: ' + err);
        });
        // ---------------

    };

    // ==========================================





    // ==========================================
    // Click on Client
    // ==========================================
    // Ng-repeat used to list DOM elements with DB table rowid loaded into elementID so its captured on the target.id
    // Need this to retreive GUID in Div ID property for record CRUD
    // ------------------------------------------
    $scope.clientclick = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        globalService.selectedClient = clickEvent.target.id; // Tracked the selected client in Global Var in Service
        alert('selected item = ' + globalService.selectedClient);
        //globalService.changeView('/clientproperties');
        $state.go('clientproperties');

    };
    // ==========================================





    // ==========================================
    //  Create New Friend request record on Azure.  Store locally and create on Azure
    // ==========================================
    //1. enter parent email and lookup to verify, and get clients for this admin
    //2. enter the kids display name and lookup in client array verify
    //3. default to the display of the kid whose context you're creating the invitation in
    //4. create new invitation record with the 4 corresponding IDs
    // INVITATION RECORD: fromparent_id, toparent_id, fromkid, tokid, datetime

    // #########################################################################################################################################################
    //var ToParentID, ToParentName, ToKidName, FromKidName, FromKidID, ToKidID;
    //var clientarray2 = [];

    // Choose Client (if needed)
    // ------------
    //FromKidID = '08ba64e5-4271-412f-9fd1-c59738e4c4a5' // FOR TESTING
    //FromKidName = 'Berk'
    // ------------


    //// Verify Parent
    //// ------------
    //$scope.verifyParent = function (email) {
    //    azureQueryParent(email)
    //    $scope.verifyParentError = false;
    //};
    //function azureQueryParent(email) {
    //    var query = "$filter=email eq '" + email + "'";
    //    Azureservice.read('parents', query).then(function (items) {  // query to see if this 'reg_code' exists
    //        if (items.length == 0) { // if email not found, then
    //            // 'verifyParentError' is a flag the UI uses to check for 'show/hide' error div
    //            $scope.verifyParentError = true;
    //            $scope.verifyParentErrorMessage = '"' + email + '" is not a valid email.  Please check and try again.'
    //            console.log('email not found')
    //        }
    //        else { // if email found, show verify success and kid verification UI
    //            $scope.verifyParentSuccess = true;
    //            ToParentID = items[0].id; // Get the GUID for the parent
    //            ToParentName = items[0].name; // Get the GUID for the parent
    //            azureQueryClientList(ToParentID)
    //        };
    //    }).catch(function (error) {
    //        console.log(error)
    //        alert(error);
    //    })
    //};

    //// Get Clients for Admin ID
    //// ------------
    //function azureQueryClientList(adminGUID) {
    //    var query = "$filter=parent_id eq '" + adminGUID + "'";
    //    Azureservice.read('kid', query).then(function (items) {  // query to see if this 'name' exists
    //        if (items.length == 0) { // if admin guid not found, then
    //            console.log('admin guid  not found')
    //        }
    //        else { // if admin guid found, get the client list (JSON) and put in array
    //            clientarray2 = items;  //alert(clientarray2[0].name);
    //        };
    //    }).catch(function (error) {
    //        console.log(error);
    //        alert(error);
    //    })
    //};

    //// Verify Kid by looking up in Client Array
    //// ------------
    //$scope.verifyKid = function (name) {
    //    $scope.verifyKidError = false;
    //    lookUpClientinArray(name)
    //};
    //function lookUpClientinArray(name) {
    //    var found = false;
    //    for (i = 0, len = clientarray2.length; i < len; i++) {
    //        //alert(clientarray2[i].name);
    //        if (clientarray2[i].name == name) {
    //            found = true;
    //            ToKidID = clientarray2[i].id; // Get the GUID for this client
    //            break;
    //        };
    //    };
    //    if (found == true) { // name is in the Client array (-1 means not found), then show verify success and addNewInvitation button
    //        $scope.verifyKidSuccess = true;
    //        ToKidName = name; // use the name for the kid
    //    }
    //    else { // if kid name not found, 
    //        // 'verifyKidError' is a flag the UI uses to check for 'show/hide' error div
    //        $scope.verifyKidError = true;
    //        $scope.verifyKidErrorMessage = '"' + name + '" is not a valid user.  Please check and try again.'
    //        console.log('kid name not found')
    //    };
    //};

    //// Create invitation record
    //// ------------
    //$scope.addNewInvitation = function () {
    //    $scope.verifyKidSuccess = false; //toggle to turn off the UI modal (could be in html also)

    //    // Create on Azure
    //    // ---------------
    //    // @@@ Push Notification sent by Node after Insert to ToParent for invitation 
    //    Azureservice.insert('invitations', {
    //        id: globalService.makeUniqueID(), // made GUID for Azure table        
    //        fromparent_id: globalService.userarray[0],
    //        fromparent_name: globalService.userarray[4], //first name.  full name is [2]
    //        toparent_id: ToParentID,
    //        toparent_name: ToParentName,
    //        fromkid: FromKidName,
    //        tokid: ToKidName,
    //        fromkid_id: FromKidID,
    //        tokid_id: ToKidID,
    //        status: '0', // unaccepted
    //    })
    //    .then(function () {
    //        console.log('new invitation insert successful');
    //        $scope.invitationSuccess = true; // UI flag that invitation was sent
    //        $scope.showInvitationForm = false;
    //    },
    //    function (err) {
    //        console.error('Azure Error: ' + err);
    //        $scope.invitationError = true;
    //        $scope.invitationErrorMessage = err; // UI flag that invitation was sent
    //    });
    //};

    // ==========================================



    // View changers.  Have to use $scope. to make available to the view
    // --------------

    $scope.gotoInvitationView = function () {
        //globalService.changeView('/invitationlist');
        $state.go('invitationlist');
    };
    $scope.gotoCanvasView = function () {
        //globalService.changeView('/canvas');
        $state.go('canvas');
        globalService.lastView = '/admindash';
    };
    $scope.gotoGalleryView = function () {
        globalService.lastView = '/admindash';  // for knowing where to go with the back button
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
        globalService.lastView = '/admindash';  // for knowing where to go with the back button
    }; //end func




}); //controller end