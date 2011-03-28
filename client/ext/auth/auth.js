/**
 * In App Authentication for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/auth/auth.xml");

var ServiceLut = {
    "github": {
        url: "/auth/github",
        width: 1000,
        height: 650
    },
    "facebook": {
        url: "/auth/facebook",
        width: 800,
        height: 460
    },
    "twitter": {
        url: "/auth/twitter",
        width: 800,
        height: 460
    }
},
def = "github",
crtOrigin, winSignin, winPayment, winListener, uid, username, context;

function winCloseCheck() {
    if (winSignin && !winSignin.closed)
        return;
    clearInterval(winListener);
    if (stSignedIn.active)
        return;
    var pager = crtOrigin === 1 ? pgAuth : pgReserve;
    pager.set(crtOrigin + 2);
    self.focus();
}

return ext.register("ext/auth/auth", {
    dev         : "Ajax.org",
    name        : "Auth",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [],
    markup      : markup,
    
    init    : function(){
        auth.addEventListener("authrequired", function(e){
            ide.loggedIn = false;
            ide.socket.disconnect();
            
            ide.dispatchEvent("logout");
        });
        
        //@todo fire this event;
        ide.addEventListener("login", function(e){
            ide.loggedIn = true;
            ide.socket.connect();
        });
    },
    
    enable  : function(){},
    disable : function(){},
    destroy : function(){},

    register : function() {
        var _self = this;
        var data =  "firstname=" + tbRgFirstName.getValue() + 
                    "&lastname=" + tbRgLastName.getValue() +
                    "&email=" + tbRgEmail.getValue() + 
                    "&username=" + tbRgUsername.getValue() + 
                    "&password=" + tbRgPassword.getValue();
        comm.auth("create",
            data,
            function(data, state, extra) {
                if (state !== apf.SUCCESS) {
                    //debugger;
                    return _self.showAlert("Registration failed", "Error:\n" + extra.data);
                }
    
                data = JSON.parse(data)[0];
                _self.login(data.username, data.password);
            }
        );
    },
    
    getAccount : function(callback) {
        var _self = this;
        comm.context("account", 
            null,
            function(data, state, extra) {
                if (state !== apf.SUCCESS)
                    return _self.showAlert("Cannot retrieve account data", "Error:\n" + extra.data);
                
                data = typeof data == "string" ? apf.getXml(data) : data;
                mdlAccount.load(data);
                if (callback)
                    callback();
            }
        );
    },
    
    signin : function(service, email) {
        var origin  = mnuAuth.visible ? 1 : 2,
            pager   = origin === 1 ? pgAuth : pgReserve,
            sText   = service.charAt(0).toUpperCase() + service.substr(1)
            service = ServiceLut[service || def],
            h4      = document.getElementById("statusMsg" + origin);
        if (h4) {
            if (!h4.origText)
                h4.origText = h4.innerHTML;
            h4.innerHTML = h4.origText.replace("%s", sText);
        }
        
        pager.set(origin);
        crtOrigin = origin;
    
        var screenHeight = screen.height;
        var left = Math.round((screen.width / 2) - (service.width / 2));
        var top = 0;
        if (screenHeight > service.height)
            top = Math.round((screenHeight / 2) - (service.height / 2))
    
        winSignin = window.open(apf.host + service.url + (email ? "/" + encodeURIComponent(email) : ""), "cloud9signin",
            "left=" + left + ",top=" + top + ",width=" + service.width + ",height=" + service.height +
            ",personalbar=0,toolbar=0,scrollbars=1,resizable=1"
        );
            
        winListener = setInterval(winCloseCheck, 1000);
        if (winSignin)
            winSignin.focus();
    },

    login : function(username, password) {
    //    alert("todo normal signin: <a:auth/> element?");
        var _self = this;
        comm.auth("login", "username="+username+"&password="+password,
            function(data, state, extra) {
                if (state !== apf.SUCCESS) {
                    //debugger;
                    return _self.showAlert("Login failed", "Error:\n" + extra.data);
                }
                
                mnuAuth.hide();
                self["stSignedIn"].activate();
                //document.getElementById("errorMsg1").innerHTML = "";
                /*
                setTimeout(function(){
                    pgAuth.set(3);
                },500);
                */
                data = JSON.parse(data);
                _self.switchContext(data.activecontext);
                _self.parseUserData(data.projects, data.blob, data.contexts, data.members);
            }
        );
    },
    
    signout : function() {
        comm.auth("signout", null, function(data, state, extra) {
            try {
                data = JSON.parse(data);
            }
            catch(ex) {
                data = {result: true};
            }
            
            uid = username = context = githubprojects = null;
            
            //self[!data.result ? "stSignedIn" : "stIdle"].activate();
            //pgReserve.set(0);
            //vboxRegister.show();
            
            //pgAuth.set(0);
            //if (data.result)
            //    username = null;
        });
    },

    signinCallback : function(service, success, projects, blob, activecontext, contexts, members, msg) {
        clearInterval(winListener);
        var origin  = mnuAuth.visible ? 1 : 2,
            pager   = origin === 1 ? pgAuth : pgReserve;
        if (success && pager === pgReserve) {
            pager.set(3);
        }
        else {
            if (success)
                mnuReserve.hide();
    	    self[success ? "stSignedIn" : "stIdle"].activate();
            document.getElementById("errorMsg" + origin).innerHTML = msg || "";
            setTimeout(function(){
                pager.set(origin + 2);
            },500);
        }    
        if (success) {
            this.switchContext(activecontext);
            this.parseUserData(projects, blob, contexts, members);
            
            if (treePrj.length == 0)//this should be something like mdlOrganization.queryNode('context')
                document.getElementById('biggreenarrow').style.display = 'block';
        }
    },

    signedIn : function() {
        btnSign.setAttribute("onclick", "app.signout()");
        mnuAuth.hide();
    },

    idle : function() {
        btnSign.setAttribute("onclick", "");
        tbClone.clear();
        document.getElementById('helloUser').style.display='none';
        // reset pages to first page:
        //if (typeof pgReserve != "undefined")
        //    pgReserve.set(0);
        //if (typeof pgAuth != "undefined")
        //    pgAuth.set(0);
    }
});


/*var githubprojects;
this.parseUserData = function(projects, blob, contexts, members) {
    if (blob && blob.user && blob.login) {
        // save the username 
        username = blob.login;
        uid = blob.uid;
        //console.log("projects: ", projects, "blob", blob);
        var helloUser = document.getElementById('helloUser');
        helloUser.innerHTML = 'Hi there <b>' + (blob.user.name || username) + '!</b> Welcome to Cloud9.';
        helloUser.style.display = 'block';
        
        if (blob.repos && blob.repos.length)
            githubprojects = this.parseRepos(username, blob.repos);
    }
    
    this.parseContexts(contexts);
    this.parseProjects(projects);
    this.parseMembers(members);
};*/

});