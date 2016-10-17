// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('cordovaNG', [
    'ionic',
    'azure-mobile-service.module',//NG wrapper around Azure mobile service
    'ngOpenFB', //NG wrapper for OpenFB wrapper around FB api
])

// Configuration for AzureMobileServiceClient
.constant('AzureMobileServiceClient', { API_URL: "https://service-poc.azure-mobile.net/", API_KEY: 'IfISqwqStqWVFuRgKbgJtedgtBjwrc24' })


.run(['$ionicPlatform', '$state', 'globalService', 'Azureservice', function ($ionicPlatform, $state, globalService, Azureservice) {

    $ionicPlatform.ready(function () {

        if (cordova.platformId === "ios" && window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        };
        if (window.StatusBar) {
            StatusBar.styleDefault();
        };

    // =========================================================================================
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

    

    // ==================================================
    // Things to check for on start up 
    // ==================================================

        // Check for permission on Android for Android 6+
        // ----------------------
        var platform = device.platform;
        if ((platform == 'android' || platform == 'Android')) {
            var permissions = cordova.plugins.permissions;
            permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

            function checkPermissionCallback(status) {
                if (!status.hasPermission) {
                    var errorCallback = function () { console.warn('storage permission is not turned on'); }
                    permissions.requestPermission(
                      permissions.WRITE_EXTERNAL_STORAGE,
                      function (status) {
                          if (!status.hasPermission) errorCallback();
                      }, errorCallback);
                }
            }
        }
        // ----------------------

    //console.log("local stored user data is: " + localStorage.getItem('RYB_userarray'));

    // Check for User Array - for registration
        if (localStorage.getItem('RYB_userarray')) {

            // add to globalservice var to make available to all views
            globalService.userarray = JSON.parse(localStorage.getItem('RYB_userarray')); // get array from localstorage key pair and string

            if (globalService.userarray[1] == 'admin') { // if user type is 'admin', go to admin home screen
                PushNotificationSetup();  // register for push notification after you know the user has an ID
                $state.go('admindash');
                console.log('user is admin');
            }
            else if (globalService.userarray[1] == 'client') { // if user type is 'client', go to client home screen
                PushNotificationSetup(); // register for push notification after you know the user has an ID
                $state.go('clientstart');
                console.log('user is client');
                //alert('user is client');
            }
            else { //if neither, go to user type screen and start over
                $state.go('signin');
                console.log('user is unknown type, go to user role selection');
            };

        }
            // If no user but first time start up flag is set, go to user type screen
        else if (localStorage.RYB_oobeflag) {
            $state.go('signin');
            console.log('user is unknown type - but oobe flag set, go to user role selection');
        }
            // If first time start up flag no set, go to start up screen
        else {
            console.log('no oobe flag, go to oobe');
            $state.go('oobe');
        };
    // ==================================================
    });// end ready

}]) // end run



.config(['$stateProvider','$urlRouterProvider','$compileProvider', '$ionicConfigProvider',function ($stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider) {

    // PERFORMANCE BOOTS ???
    // Performance Boosts 
    // 1. Disable default scope references in the DOM
    // 2. Force native scrolling (esp. for iOS) 
    // =====================================================
    //if () { /* test if in production */
    $compileProvider.debugInfoEnabled(false);
    //};
    //$ionicConfigProvider.scrolling.jsScrolling(false);



    // Routing Setup
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    // =====================================================

    // Now set up the states
    $stateProvider
      .state('signin', {
          url: "/signin",
          templateUrl: "signin/signin.html",
          controller: 'signinController'
      })
      .state('oobe', {
          url: "/oobe",
          templateUrl: "oobe/oobe.html",
          controller: 'oobeController'
      })
    .state('clientstart', {
        url: '/clientstart',
        templateUrl: 'clientstart/clientstart.html',
        controller: 'clientstartController'
    })
    .state('admindash', {
        url: '/admindash',
        templateUrl: 'admindash/admindash.html',
        controller: 'admindashController'
    })
    .state('gallery', {
        url: '/gallery',
        templateUrl: 'gallery/gallery.html',
        controller: 'galleryController'
    })
    .state('canvas', {
        url: '/canvas',
        templateUrl: 'canvas/canvas.html',
        controller: 'canvasController'
    })
    .state('clientproperties', {
        url: '/clientproperties',
        templateUrl: 'clientproperties/clientproperties.html',
        controller: 'clientpropertiesController'
    })
    .state('invitationlist', {
        url: '/invitationlist',
        templateUrl: 'invitationlist/invitationlist.html',
        controller: 'invitationlistController'
    })
    .state('picture', {
        url: '/pictureview',
        templateUrl: 'pictureview/pictureview.html',
        controller: 'pictureviewController'
    })
    .state('gallerypicture', {
        url: '/gallerypicture',
        templateUrl: 'gallerypicture/gallerypicture.html',
        controller: 'gallerypictureController'
    })

    // If you don't use this, you can programmatically detect and redirect in .run
    // For any unmatched url, redirect to /state1
    //$urlRouterProvider.otherwise('startup');


}])//end config


// ==================================================
// Configure service for global use - global data model and localStorage.
// Common Global Functions and Variables to reuse across controllers.  Service seems like a classes with methods and vars.
// Service can have dependencies with a weird 'injection notation' []
// Inject factory/service <name> as a dependency to controllers to make available.
// ==================================================

.service('globalService', ['$location', function ($location) {

    var userarray = []; //user data
    var selectedClient = '';// for passing between Admin view and Client Properties
    var eventArray = []; // global var used to retrieve once from Azure and use for session
    var friendArray = []; //user data
    var lastTimeChecked = Date.now() - 300001; // Timestamp for last Azure data pull.  Initially set for > 5 MIN ago so the data will be pulled again.
    var pictureViewParams; // Picture Detail view string of paramters from div id
    var lastView; // For knowing what view you came where and where the back button goes

    return {
        // Functions for get/set on global vars.  
        //----------

        // Global functions
        // ----------------

        simpleKeys: function (original) { // Helper Recommedation from AngularJS site. Return a copy of an object with only non-object keys we need this to avoid circular references - though I'm not really sure why
            return Object.keys(original).reduce(function (obj, key) {
                obj[key] = typeof original[key] === 'object' ? '{ ... }' : original[key];
                return obj;
            }, {});
        },

        // Database  methods
        // -----------------
        //drawappDatabase: drawappDatabase, // return the Database

        // Variables needs to pass between views 
        // -----------------
        userarray: userarray, // return the glabal array for local user data
        selectedClient: selectedClient,  // used in Admin view to view client details
        lastTimeChecked: lastTimeChecked, // used to not repeated make Azure calls
        friendArray: friendArray, // used to store a Clients related friends
        eventArray: eventArray, // used to store all events with a Client
        pictureViewParams: pictureViewParams, // Picture Detail view string of paramters from div id 
        lastView: lastView, // For knowing what view you came where and where the back button goes

        // Clever function to make a GUID compliant with standard format cast as type STRING
        // ----------------
        makeUniqueID: function generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },

        //Get Avatar from AvatarID
        //------------------------
        getAvatarFromID: function getAvatar(id) {
            avatarimagenamearray = [
                "avatar.bear",
                "avatar.bee",
                "avatar.bird",
                "avatar.catgrey",
                "avatar.catred",
                "avatar.dogbrown",
                "avatar.dogears",
                "avatar.doggrey",
                "avatar.dogred",
                "avatar.elephant",
                "avatar.fox",
                "avatar.horse",
                "avatar.horsegrey",
                "avatar.koala",
                "avatar.leopard",
                "avatar.lion",
                "avatar.monkey",
                "avatar.moose",
                "avatar.panda",
                "avatar.rabbitbrown",
                "avatar.rabbitred",
                "avatar.racoon",
                "avatar.robot",
                "avatar.zebra",
            ];
            avatarimage = "./img/avatars/" + avatarimagenamearray[id] + ".svg";
            return avatarimage;
        },


    };//end global function defintion

}])
// ==================================================
// ==================================================
