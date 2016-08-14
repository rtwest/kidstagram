// http://go.microsoft.com/fwlink/?LinkID=290993&clcid=0x409
var service_pocClient;
document.addEventListener("deviceready", function () {    
    service_pocClient = new WindowsAzure.MobileServiceClient(
                    "https://service-poc.azure-mobile.net/",
                    "IfISqwqStqWVFuRgKbgJtedgtBjwrc24");
});