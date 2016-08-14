// invitationlistController

angular.module('cordovaNG').controller('invitationlistController', function ($scope, globalService, Azureservice) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    $scope.noNewInvitationsMessage = false; // boolean for ng-show for 'no invitations' message
    $scope.noSentInvitationsMessage = false; // boolean for ng-show for 'no invitations' message
    $scope.selectedclientguid, $scope.selectedclientname, $scope.selectedclientavatar, $scope.selectedclientindex;

    // ==========================================
    //  Get local client array.   
    // ==========================================
    $scope.clientarray = []; //create as an array

    if (localStorage.getItem('RYB_clientarray')) {
        $scope.clientarray = JSON.parse(localStorage.getItem('RYB_clientarray')); // get array from localstorage key pair and string
        //alert("array length: " + $scope.clientarray.length + " - " + $scope.clientarray)
        // default select the first kid
        $scope.selectedclientguid = $scope.clientarray[0][0]; 
        $scope.selectedclientname = $scope.clientarray[0][1];
        $scope.selectedclientavatar = $scope.clientarray[0][2];
        alert($scope.selectedclientguid + " - " + $scope.selectedclientname + " - " + $scope.selectedclientavatar);
    }
    else { // if no clients, show special message for this case 
        alert('no clients found')
        $scope.noClientFlag = true;
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


    var ToParentID, ToParentName, ToKidName2, FromKidName, FromKidID, ToKidID, ToKidAvatar;
    var clientarray2 = [];


    // Choose Client (if needed)
    // ------------
    //FromKidID = selectedclientguid;
    //FromKidName = $scope.clientName;
    // ------------
    $scope.selectedClient = function (clickEvent,listindex) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        var selectedclient = clickEvent.target.id;
        var selectedclientsplitarray = selectedclient.split(","); // Split the string into an array by ","
        $scope.selectedclientguid = selectedclientsplitarray[0];
        $scope.selectedclientname = selectedclientsplitarray[1];
        $scope.selectedclientavatar = selectedclientsplitarray[2];   
        $scope.selectedclientindex = listindex;
        alert(selectedclient + " ; " + $scope.selectedclientguid + " - " + selectedclientsplitarray[1]);
    };

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
            fromkid: $scope.selectedclientname, //FromKidName,
            tokid: ToKidName2,
            fromkid_id: $scope.selectedclientguid, //FromKidID,
            tokid_id: ToKidID,
            tokid_avatar: ToKidAvatar,
            fromkid_avatar: $scope.selectedclientavatar,
            status: '0', // unaccepted
        })
        .then(function () {
            console.log('new invitation insert successful');
            $scope.invitationSuccess = true; // UI flag that invitation was sent
            $scope.showInvitationForm = false;
            // add to the local $scope array
            var element = {
                fromkid: $scope.selectedclientname,
                tokid: ToKidName2,
                toparent_name: ToParentName,
            };
            $scope.sentInvitationArray.push(element);
            $scope.noSentInvitationsMessage = false;
        },
        function (err) {
            console.error('Azure Error: ' + err);
            $scope.invitationError = true;
            $scope.invitationErrorMessage = err; // UI flag that invitation was sent
        });
    };

    // ==========================================


    // ==========================================
    //  Query Azure to get RECIEVED Invitiations and add to Invitation Array on the $scope
    // ==========================================
    $scope.newInvitationArray = []
    var localuserGUID = globalService.userarray[0]; //locally stored data about the user

    // Get new invitations sent to you
    // -----
    Azureservice.query('invitations', {
        criteria: { // Query for records where localuser is 'toparent_id'
            toparent_id: localuserGUID,
            status: '0'
            }
        })
        .then(function (items) {
            if (items.length == 0) { // if no invitations found, then
                // 'noInvitationsMessage' is a flag the UI uses to check for 'show/hide' msg div
                $scope.noNewInvitationsMessage = true;
                console.log('no invitations not found')
            }
            else { // if invitations found, add to invitationArray
                $scope.newInvitationArray = items; // Get the GUID for the parent
                alert(JSON.stringify(items));
            };
        }).catch(function (error) {
            console.log(error); alert(error);
        })
    // ==========================================


    // ==========================================
    //  Query Azure to get SENT Invitiations and add to Invitation Array on the $scope
    // ==========================================
    $scope.sentInvitationArray = []

    // Get invitations from you
    // -----
    Azureservice.query('invitations', {
        criteria: {   // Query for records where localuser is 'fromparent_id'
            fromparent_id: localuserGUID,
            status: '0'
            }
        })
        .then(function (items) {
            if (items.length == 0) { // if no invitations found, then
                // 'noInvitationsMessage' is a flag the UI uses to check for 'show/hide' msg div
                $scope.noSentInvitationsMessage = true;
                console.log('no sent invitations not found')
            }
            else { // if invitations found, add to invitationArray
                $scope.sentInvitationArray = items; // Get the Azure data into local array
                alert(JSON.stringify(items));
            };
        }).catch(function (error) {
            console.log(error); alert(error);
        });
    // ==========================================




    // ==========================================
    //  Accept invitation.  Update invitation record from Azure Invitation table.  
    //  Add Friend Record to Azure Friends table. 
    // ==========================================
    $scope.acceptInvitationClick = function (clickEvent) {
        $scope.clickEvent = globalService.simpleKeys(clickEvent);
        $scope.clientId = clickEvent.target.id;
        alert('accept invitation id = ' + $scope.clientId);

        // call AcceptInvitation with record ID
        acceptInvitation($scope.clientId);  // If the accept/delete is successful, this call Insert Friend record
    }

    // Update invitation record from Azure Invitation Table
    // ---------------
    function acceptInvitation(record_id) {
        var foundIndex;
        // Get the clicked record ID and look up in new invitation array to get kid names and GUID to pass to create Friends Record 
        for (i = 0, len = $scope.newInvitationArray.length; i < len; i++) {
            if ($scope.newInvitationArray[i].id == record_id) {
                foundIndex = i;
                kid1id = $scope.newInvitationArray[i].fromkid_id;
                kid2id = $scope.newInvitationArray[i].tokid_id;
                kid1name = $scope.newInvitationArray[i].fromkid;
                kid2name = $scope.newInvitationArray[i].tokid;
                kid1avatar = $scope.newInvitationArray[i].fromkid_avatar;
                kid2avatar = $scope.newInvitationArray[i].tokid_avatar;
                break;
            };
        };
        // ----------
        // Azure part
        // ----------
        // @@@ Push Notification is sent from Node on Update to let FromParent know invitation was accepted.
        Azureservice.update('invitations', {
            id: record_id, // ID for the row to update
            status: '1', // column name to update. 1=accepted
        })
        .then(function () { // if success,
            console.log('Accept/Delete successful'); //alert('Accept/Delete successful')
            InsertFriendRecord(kid1id, kid2id, kid1name, kid2name,kid1avatar,kid2avatar); // @@@ On success, Insert new Friend record in Azure Friend Table
            //InsertEventRecord(kid1id, kid2id, kid1avatar, kid2avatar, kid1name, kid2name); // @@@ On success, Insert new Event record in Azure Event Table

            $scope.newInvitationArray.splice(foundIndex, 1) // remove from this element at index number from 'sentInvitationArray'

        }, function (err) {
            console.error('Azure Error: ' + err);
            alert('Azure Error: ' + err);
        });
        if ($scope.newInvitationArray.length == 1) { $scope.noNewInvitationsMessage = true }; // If only one item in new invitations array and you accept/remove it, then show no new invitations UI
    };

    // Insert new Friend record in Azure Friend Table
    // ---------------
    function InsertFriendRecord(kid1id, kid2id, kid1name, kid2name,kid1avatar,kid2avatar) {
        // Create on Azure
        // ---------------
        // @@@ Push Notification is sent from Node on Insert to let both Kids know Friend connection made
        // !!! NOTE: You can't get a push notification if the client haven't ever signed in and registered yet
        Azureservice.insert('friends', {
            //id: guid, // I'll let Azure handle this GUID since I don't need to track it locally        
            kid1_id: kid1id,
            kid2_id: kid2id,
            kid1_name:kid1name,
            kid2_name: kid2name,
            kid1_avatar:kid1avatar,
            kid2_avatar: kid2avatar
        })
        .then(function () {
            console.log('new friend insert successful');
            // --- THIS WASN'T FIRING SO I'M CHAINING THE AZURE INSERTS IN SERIAL IN CASE THEY CAN'T FIRE IN PARRALLEL.  WOULD BE BETTER AS 1 CALL AND DO IT IN NODE.JS
            InsertEventRecord(kid1id, kid2id, kid1name, kid2name,kid1avatar, kid2avatar); // @@@ On success, Insert new Event record in Azure Event Table
        },
        function (err) {
            console.error('Azure Error: ' + err);
        });

    };
    // ==========================================


    // Insert new Event record in Azure Event Table
    // ==========================================
    function InsertEventRecord(kid1id, kid2id, kid1name, kid2name, kid1avatar, kid2avatar) {
        // Create on Azure
        // ---------------
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
            alert('freind record inserted');
            console.log('new event insert successful');
        },
        function (err) {
            console.error('Azure Error: ' + err);
        });

    };
    // ==========================================




    // View changer.  Have to use $scope. to make available to the view
    // --------------
    $scope.gotoView = function () {
        globalService.changeView('/');
    };
    $scope.gotoAdminView = function () {
        globalService.changeView('/admindash');
    };
    

}); //controller end