
var Interface = require('./ToolingApiInterface');
var settings = require('./Settings');
var util = require('./Util');
var http = require('https');

if (!SfdcToolingApi) {
    var SfdcToolingApi = {};   
}

SfdcToolingApi.ToolingApiNodeJsImpl = function() {
    var ToolingApi = function() {
        this.getPath = function() {
            return '/services/data/v'+this.getVersion()+'/tooling/';
        };
    };
    util.extend(Interface, ToolingApi);
    
    ToolingApi.prototype.GET = function(/* String */ path, /* function */ success, /* function */ failure) {
        this.sendRequest(this.buildRequest(path, 'GET', success, failure));
    };
    
    ToolingApi.prototype.POST = function(path, dataToPost, success, failure) {
        var req = this.buildRequest(path, 'POST', success, failure);
        var data = [];
        for (var key in dataToPost) {
            if (dataToPost.hasOwnProperty(key)) {
                data.push(key+'='+dataToPost[key]);
            }
        }
        req.write(JSON.stringify(dataToPost));
        this.sendRequest(req);
    };
    
    ToolingApi.prototype.PATCH = function(path, data, success, failure) {
        var req = this.buildRequest(path, 'PATCH', success, failure);
        req.write(JSON.stringify(data));
        this.sendRequest(req);
    };
    
    ToolingApi.prototype.DELETE = function(path, success, failure) {
        this.sendRequest(this.buildRequest(path, 'DELETE', success, failure));
    };
    
    ToolingApi.prototype.buildRequest = function(/* String */ path, /* String */ method, /* function */ success, /* function */ failure, /* boolean */ returnRawData, /* boolean */ absolutePath) {
        var completePath = (absolutePath ? '' : this.getPath()) + path;
        console.log(completePath);
        var options = {
            host: this.getInstanceUrl(),
            path: completePath,
            method: method,
            headers: {
                'Authorization': 'Bearer '+this.getAuthToken(),
                'Accept' : 'application/json',
                'Content-Type' : 'application/json'
            }
        };
        
        if (absolutePath) {
            //Other resources that are not the tooling API may require the token in the cookie
            //options.headers.Cookie = 'sid=' + this.getAuthToken();//00Dx00000009WOP!AR0AQL1u5S8UbZiRDdIg7cgtAzAPHu8PjeNyErVqNSLnfRvmQXkx18wTgI04EQHEhL.cQ.quBDUm4rTzXPfGOuBhO_yTn.38';
        }
        
        var _self = this;
        var req = http.request(options, function(response) {
            //console.log('In send request');
            //console.log(req.headers);
            var data = '';
            
            response.on('data', function(d) {
                data += d;
            });
    
            response.on('end', function() {
                var results;
                try {
                    results = returnRawData ? data : JSON.parse(data);
                } catch (e) {
                    results = data;
                }
                
                if (results[0] && results[0].errorCode) {
                    //TODO Will there ever be more than one?
                    util.cont(failure ? failure : _self.failureHandler, {
                        errorCode : results[0].errorCode,
                        message : results[0].message
                    });
                } else {
                    util.cont(success, results);
                }
            });
        });
        req.on('error', function(e) {
            //console.log ('request error: '+e);
            util.cont(failure ? failure : _self.failureHandler);
        });
        return req;
    };
    
    ToolingApi.prototype.sendRequest = function(/* Request */ request) {
        //TODO This wont't work onces its sent. I need to do a deep clone of the request
        this.lastRequest = request;
        request.end();
    };
    
    ToolingApi.prototype.getAuthToken = function() {
        return decodeURIComponent(settings.get('access_token'));
    };
    
    ToolingApi.prototype.getInstanceUrl = function() {
        //The instance url from settings will include https:// which we 
        //node.js http's host param does not like
        var instance = decodeURIComponent(settings.get('instance_url'));
        return instance.substring(instance.indexOf('/')+2);
    };
    
    ToolingApi.prototype.authenticate = function(authOpts, success, failure) {
        //I should ask for these eventually
        //Localhost
        //var consumerKey = '3MVG9AOp4kbriZOJbC2XBtpNBkLgJ__BRAsfLbQWFRg5yc4IzETBCsrEGCGwc5LGBaKCSWc_ZCU47b_dWNPqU';
        //Blitz
        //var consumerKey ='3MVG9PhR6g6B7ps4D1umv0BuHTwiOU6Pou4MIHYNWOw8CeCunYlweU0kwwex_4XVg6Pd1AAXfDem88NJMSxC6';
        
        //localhost
        //var consumerSecret = '7971771023737084900';
        //Blitz
        //var consumerSecret ='4777044271605937244';
        
        //The redirest URL doens't seem with grant_type password except to make sure it is the same in salesforce setup
        //var redirectUri = 'https://localhost:8082/RestTest/oauth/_callback';
        
        //var username = 'td@lh.de';
        //var username = 'td@b01.de';
        
        //var password = '123456';
       // var password = '1234test';
        
        //localhost
        //var securityToken = '8Ckm1simLlOIuBy2bGbxzec7';
        //blitz
        //var securityToken = 'eoxdYfBsSkmv6EpkU4ILnAHrp';
        
        //var hostUrl = 'tdvornik-wsl2';
        //var hostUrl = 'login-blitz01.soma.salesforce.com';
        //
        
        var redirectUri = 'https://ec2-23-22-63-218.compute-1.amazonaws.com:3131/';
        var hostUrl = 'prerelna1.pre.salesforce.com';
        var authPath = '/services/oauth2/token';

        var options = {
            host: hostUrl,
            path: authPath,
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Accept' : 'application/x-www-form-urlencoded'
            }
        };
    
        //console.log(hostUrl + ' ' + authPath);
    
        var req = http.request(options, function(response) {
            var data = '';

            response.on('data', function(d) {
                data += d;
            });
    
            response.on('end', function() {
                var vals = settings.parse(data);
                
                //console.log(vals);
                if (vals.hasOwnProperty('access_token')) {
                    // The token and instance are in the response data, 
                    // so let's add it to the settings and write it
                    settings.add(data, true);
                    util.cont(success, vals);
                } else {
                    util.cont(failure, vals);
                }
            });
            
        });
        
        //We need these POST parameters for the authentication
        req.write(
            'client_id='+authOpts.consumerKey+
            '&client_secret='+authOpts.consumerSecret+
            '&redirect_uri='+redirectUri+
            '&grant_type='+'password'+
            '&username='+authOpts.username+
            '&password='+authOpts.password+authOpts.securityToken
        );
        /*
        req.write(
            'client_id='+consumerKey+
            '&client_secret='+consumerSecret+
            '&redirect_uri='+redirectUri+
            '&grant_type='+'password'+
            '&username='+username+
            '&password='+password+securityToken
            //'&scope=api%20id%20web'
        );
        */
        var _self = this;
        req.on('error', function(e) {
             util.cont(failure ? failure : _self.failureHandler, e);
        });
        req.end();
    };
    
    ToolingApi.prototype.getVersion = function() {
        return '26.0';
    };
    
    return ToolingApi;
}();

//Only for Node.js

var api = new SfdcToolingApi.ToolingApiNodeJsImpl();
//api.authenticate();

//console.log(settings.get('access_token'));
//console.log(settings.get('instance_url'));

api.failureHandler = function(error) {
    console.log('In Default Failure Handler');
    if (error && error.errorCode) {
        if (error.errorCode === 'INVALID_SESSION_ID') {
            console.log('Invalid session. Trying to get a valid token...');
            //Try to get a valid token
            api.authenticate(function() {
                console.log('Successfully got a new token. Resending last request...');
                if (api.lastRequest) {
                    api.sendRequest(api.lastRequest);
                } else {
                    console.log('Warning: no last request to send.');
                }
            }, function(e) {
                console.log('Failed to get a new token: ' + e);
            });
        } else {
            console.log(error.errorCode + ' : ' + error.message);
        }
    } else if (typeof error === 'string') {
        console.log(error);
    }
};


module.exports = api;
