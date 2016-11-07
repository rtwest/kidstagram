// signinController


angular.module('cordovaNG').controller('signinController', function ($scope, globalService, ngFB, Azureservice, $state, $ionicLoading) {

    // Scope is like the view datamodel.  'message' is defined in the paritial view html {{message}}
    //$scope.message = "Nothing here yet";  //- TEST ONLY

    // check for local registration id (previous sign in)
    // select kid or parent mode
    // signin with kid id.  Check for valid kid ID and remove from invitation list
    // signin as parent
    // go to admin or client home view

    $scope.clientregistrationcode = ''; // define the $scope var to tie to the UI using the tag ng-model='clientregistrationcode' on the input element
    $scope.clientregistrationerror = false; // flag for use in the UI to toggle the error message
    $scope.usermode = ''; // flag for use in the UI to toggle the user sign in

    // ==========================================
    //  Admin Sign In
    // ==========================================
    // OpenFB / ngFB stuff
    // ---------------------

    ngFB.init({ appId: '550469961767419', tokenStore: window.localStorage });

    // -- KEPT FOR REFERENCE
    ////check localStorage for 'fbAccessToken' and use it for user properties
    //if (window.localStorage.getItem('fbAccessToken')) {
    //    ngFB.api({
    //        method: 'GET',
    //        path: '/me',
    //        params: { fields: 'id,name,email,first_name' }
    //    }).then(
    //        function (result) {
    //            $scope.user = result;
    //            // put JSON result into User Array
    //            var userarray = new Array();
    //            userarray[0] = globalService.makeUniqueID(); // made GUID for Azure table
    //            userarray[1] = "admin"; //user role
    //            userarray[2] = result.name;
    //            userarray[3] = result.email;
    //            userarray[4] = result.first_name;
    //            localStorage["RYB_userarray"] = JSON.stringify(userarray);
    //        },
    //        errorHandler);
    //};

    var guid = globalService.makeUniqueID(); // made GUID for Azure table
    var admin_avatar = Math.floor(Math.random() * 24); // Random number between 0-23 // 24 items in array

    $scope.adminLogin = function () {
        ngFB.login({ scope: 'email' }).then( // request other Facebook permissions in with scope with ", 'publish_action' "
            function (response) {
                console.log('Facebook login succeeded, got access token: ' + response.authResponse.accessToken);

                // ---- START SPINNER PROGRESS INDICATOR
                $scope.showLoader();


                // Get profile data to make User Array
                // -----------------------------------
                ngFB.api({
                    method: 'GET',
                    path: '/me',
                    params: { fields: 'id,name,email,first_name' }
                }).then(
                function (result) {
                    $scope.user = result;
                    // put JSON result into User Array
                    globalService.userarray[0] = guid;
                    globalService.userarray[1] = "admin"; //user role
                    globalService.userarray[2] = result.name;
                    globalService.userarray[3] = result.email;
                    globalService.userarray[4] = result.first_name;
                    globalService.userarray[5] = admin_avatar;
                    globalService.userarray[6] = 0; // inital start count
                    globalService.userarray[7] = 0; // inital coloring book status
                    localStorage["RYB_userarray"] = JSON.stringify(globalService.userarray); //push back to localStorage

                    azureCheckUserandInsert(result.email, result.name, admin_avatar); //@@@ Function to query azure 'parent' table to look for email and insert record
                    //$state.go(('admindash'); // @@@ this was moved to the end of azureCheckUserandInsert to ensure a serial order of successful tasks
                },
                errorHandler);
                // -----------------------------------

            },
            function (error) {
                alert('Facebook login failed: ' + error);
            });
    }


    // -- KEPT FOR REFERENCE
    //$scope.getInfo = function () {
    //    ngFB.api({ path: '/me' }).then(
    //        function (user) {
    //            console.log(JSON.stringify(user));
    //            alert(JSON.stringify(user));
    //            $scope.user = user;
    //        },
    //        errorHandler);
    //}
    //$scope.getProfile = function () {
    //    ngFB.api({
    //        method: 'GET',
    //        path: '/me',
    //        params: { fields: 'id,name,email,first_name' }
    //    }).then(
    //        function (result) {
    //            $scope.user = result;
    //        },
    //        errorHandler);
    //}
    //$scope.share = function () {
    //    ngFB.api({
    //        method: 'POST',
    //        path: '/me/feed',
    //        params: { message: document.getElementById('Message').value || 'Testing Facebook APIs' }
    //    }).then(
    //        function () {
    //            alert('the item was posted on Facebook');
    //        },
    //        errorHandler);
    //}
    //$scope.readPermissions = function () {
    //    ngFB.api({
    //        method: 'GET',
    //        path: '/me/permissions'
    //    }).then(
    //        function (result) {
    //            alert(JSON.stringify(result.data));
    //        },
    //        errorHandler
    //    );
    //}
    //$scope.revoke = function () {
    //    ngFB.revokePermissions().then(
    //        function () {
    //            alert('Permissions revoked');
    //        },
    //        errorHandler);
    //}
    //$scope.logout = function () {
    //    ngFB.logout().then(
    //        function () {
    //            alert('Logout successful');
    //        },
    //        errorHandler);
    //}
    function errorHandler(error) {
        //alert(error.message);
    }
    // ==========================================



    // ==========================================
    //  Store new Admin user on Azure
    // ==========================================
    function azureCheckUserandInsert(email, name, avatar) {
        var query = "$filter=email eq '" + email + "'";
        Azureservice.read('parents', query).then(function (items) {  // query to see if 'email' exists
            if (items.length == 0) { // if not found, then insert it
                //console.log('email not found')
                Azureservice.insert('parents', {
                    id: guid,
                    name: name,
                    email: email,
                    avatar:avatar
                })
                .then(function () {
                    PushNotificationSetup();

                    //---- END PROGRESS INDICATOR
                    $scope.hideLoader();

                    $state.go('admindash');// @@@ after user is added, go to admin dash
                }, function (err) {
                    alert('Azure Error: ' + err);
                });
            }
            else {
                //alert('email exists already'),
                console.log('email exists already');
                // use the found user's GUID and Avatar and store locally in user properties array
                globalService.userarray[0] = items[0].id; // guid
                globalService.userarray[5] = items[0].avatar; // avatar
                localStorage["RYB_userarray"] = JSON.stringify(globalService.userarray); //push back to localStorage
                alert(JSON.stringify(globalService.userarray));
                PushNotificationSetup();

                //----END PROGRESS INDICATOR
                $scope.hideLoader();

                $state.go('admindash'); // @@@ if user already exists, just go to admin dash
            };

        }).catch(function (error) {
            console.log(error)
        })
    };
    // ==========================================



    // ==========================================
    //  Client SignIn.  Update Client registration on Azure
    // ==========================================

    $scope.clientLogin = function (reg_code) {
        azureUpdateClientRegistration(reg_code)
        $scope.clientregistrationerror = false;
    }

    function azureUpdateClientRegistration(reg_code) {
        var query = "$filter=registration_code eq '" + reg_code + "'";
        Azureservice.read('kid', query).then(function (items) {  // query to see if this 'reg_code' exists
            if (items.length == 0) { // if reg_code not found, then

                // 'clientregistrationerror' is a flag the UI uses to check for 'show/hide' error div
                $scope.clientregistrationerror = true;
                $scope.clienterrormessage = '"' + reg_code + '" is not a valid sign in code.  Please check your code and try again.'
                console.log('reg code not found')
            }
            else {
                // Get client details and make localStorage array.  
                // Get row GUID to update.   
                console.log('reg found code: ' + JSON.stringify(items) + " -- " + items[0].id);
                // put JSON result into User Array
                //var userarray = [];
                globalService.userarray[0] = items[0].id; // GUID from Azure table
                globalService.userarray[1] = "client"; //user role
                globalService.userarray[2] = ""; //full name
                globalService.userarray[3] = items[0].avatar_id; //email for admin / avatar id for client.  default was created when Admin created the kid.
                globalService.userarray[4] = items[0].name; //first name
                globalService.userarray[5] = 0; // intial star count
                globalService.userarray[6] = 0; // inital coloring book status
                localStorage["RYB_userarray"] = JSON.stringify(globalService.userarray);

                // Update client 
                Azureservice.update('kid', {
                    id: items[0].id, // ID for the row to update
                    reg_status: '1', // column to update named 'reg_status'
                })
                .then(function () {
                    //console.log('Update successful');
                    PushNotificationSetup();
                    $state.go('clientstart'); // @@@ go to clientstart view
                }, function (err) {
                    console.error('Azure Error: ' + err);
                });

            };

        }).catch(function (error) {
            console.log(error)
        })
    };
    // ==========================================


    // =========================================================================================
    // Define the PushPlugin.
    // NOTE: PushNotificationSetup code used on SigninController and App.js
    // Includes Factory NG Azure Wrapper around the Azure Pluging and uses Push Plugin.
    // https://github.com/Azure/mobile-services-samples/blob/master/CordovaNotificationsArticle/BackboneToDo/www/services/mobileServices/settings/services.js
    // =========================================================================================
    // - Register for Push Notifications AFTER user is signed in and has a GUID.  That's needed for the Push Notification

    function PushNotificationSetup() {

        alert(globalService.userarray[0]);

        var tags = [];
        tags[0] = globalService.userarray[0]; //Azure Notification Hub 'Tags' var seems to expect an array.  Get the local user GUID to send to user

        var AMSClient = Azureservice.client;

        // Create a new PushNotification and start registration with the PNS.
        var pushNotification = PushNotification.init({
            "android": { "senderID": "168753624064" }, // This is my Google Developer Project ID # that has GCM API enabled
            "ios": { "alert": "true", "badge": "false", "sound": "false" }
        });

        // Handle the registration event.
        pushNotification.on('registration', function (data) {
            alert(JSON.stringify(data)); console.log(JSON.stringify(data));
            // Get the native platform of the device.
            var platform = device.platform;
            // Get the handle returned during registration.
            var handle = data.registrationId;
            // Set the device-specific message template.
            if (platform == 'android' || platform == 'Android') {
                // Template registration.
                var template = '{ "data" : {"message":"$(message)"}}';
                // Register for notifications.
                if (AMSClient.push) { alert('client push up') };
                AMSClient.push.gcm.registerTemplate(handle,
                    'myTemplate', template, tags)
                    .done(registrationSuccess, registrationFailure);
            } else if (device.platform === 'iOS') {
                // Template registration.
                var template = '{"aps": {"alert": "$(message)"}}';
                // Register for notifications.            
                AMSClient.push.apns.registerTemplate(handle,
                    'myTemplate', template, tags)
                    .done(registrationSuccess, registrationFailure);
            }
        });

        // Handles the notification received event.
        pushNotification.on('notification', function (data) {
            // Display the alert message in an alert.
            alert(data.message);
            // Reload the items list.
            //app.Storage.getData();
        });

        // Handles an error event.
        pushNotification.on('error', function (e) {
            // Display the error message in an alert.
            alert('error on registration = ' + e.message);
        });

        var registrationSuccess = function () {
            alert('Registered with Azure!'); console.log('Registered with Azure');
        }
        var registrationFailure = function (error) {
            alert('Failed registering with Azure: ' + error); console.log('Failed registering with Azure: ' + error);
        }

    };//end Push Notification setup


    // ====================================================================================
    // LOADER - Configuration for start and end -- don't forget to inject $ionicLoading into controller
    // ====================================================================================
    $scope.showLoader = function () {
        $ionicLoading.show({
            template: '<ion-spinner class="spinner-energized" icon="android"></ion-spinner><br /><span>Loading</span>',
            delay: 0,
        }).then(function () {
            console.log("The loading indicator is now displayed");
        });
    };
    $scope.hideLoader = function () {
        $ionicLoading.hide().then(function () {
            console.log("The loading indicator is now hidden");
        });
    };
    // ====================================================================================



}); //controller end