/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

//@todo a new version should also clear models and thus undo state

// #ifdef __WITH_OFFLINE_APPLICATION
jpf.namespace("offline.application", {
    enabled   : false,
    urls      : [],
    providers : ["deskrun", "gears"],
    
    init : function(jml){
        if (this.enabled)
            return;
            
        this.namespace = jpf.appsettings.name + ".jpf.offline.application";
        
        if (typeof jml == "string") {
            this.providers = jml.split("|");
        }
        else if (jml.nodeType) {
            if (jml.getAttribute("version-get"))
                this.application.versionGet = jml.getAttribute("version-get");
                
            if (jml.getAttribute("providers"))
                this.providers = jml.getAttribute("providers").split("|");
            
            if (jml.getAttribute("auto-install"))
                this.autoInstall = jpf.isTrue(jml.getAttribute("auto-install"));
        }

        //Check for an available offline provider
        for (var i = 0; i < this.providers.length; i++) {
            if (!this[this.providers[i]]) {
                //#ifdef __DEBUG
                jpf.console.warn("Module not loaded for offline provider: " 
                                    + this.providers[i]);
                //#endif
                continue;
            }
            
            if (this[this.providers[i]].isAvailable()) {
                this.provider = this[this.providers[i]].init(this.storeName);
                
                if (this.provider !== false) {
                    this.provider.name = this.providers[i];
                    break;
                }
            }
        }
        
        //@todo if online please check if the latest version is loaded here
        
        if (!this.provider) {
            if (this.autoInstall) {
                if (this.install() === false) {
                    //#ifdef __DEBUG
                    jpf.console.warn("Could not install any of the preferred \
                                         offline providers:" 
                                        + this.providers.join(", "));
                    //#endif
                    
                    jpf.offline.application = null; //Can't put the app offline
                    return this.providers[0];
                }
            }
            else {
                //#ifdef __DEBUG
                jpf.console.warn("Could not find any of the specified \
                                     offline providers:" 
                                    + this.providers.join(", "));
                //#endif
                
                jpf.offline.application = null; //Can't put the app offline
                return this.providers[0];
            }
        }
        
        if (!jpf.loaded) { //@todo you might want to consider creating single run events
            jpf.addEventListener("onload", function(){
                if (jpf.offline.application.enabled)
                    jpf.offline.application.save();
            });
        }
        else { 
            jpf.offline.addEventListener("onload", function(){
                jpf.offline.application.save();
            });
        }
        
        this.enabled = true;
        
        return this.provider.name;
    },
    
    install : function(){
        if (jpf.offline.dispatchEvent("onbeforeinstall") === false) {
            //#ifdef __DEBUG
            jpf.console.warn("Installation cancelled");
            //#endif
            return false;
        }
        
        for (var i = 0; i < this.providers.length; i++) {
            if (!this[this.providers[i]])
                continue;
            
            if (this[this.providers[i]].install()) {
                this.provider = this[this.providers[i]].init(this.storeName);
                
                if (this.provider !== false)
                    break;
            }
        }
        
        jpf.offline.dispatchEvent("onafterinstall");
        
        if (!this.provider)
            return false;
    },
    
    clear : function(){
        if (this.provider)
            this.provider.clear();
    },

    cache : function(url){
        //if(!new jpf.url(url).isSameLocation())
            //return;
        if (url.indexOf(":") > -1 && url.indexOf("http://" + location.host) == -1)
            return;
            
        this.urls.pushUnique(url.replace(/\#.*$/, ""));
    },
    
    remove : function(url){
        this.urls.remove(url)
    },
    
    refresh : function(callback){
        var storage = jpf.offline.storage;
        
        if(this.versionGet){
            var oldVersion = storage.get("oldVersion", this.namespace);
            var newVersion = null;
            var _self      = this;
            
            jpf.getData(this.versionGet, null, null,
                function(newVersion, state, extra){
                    if (state == jpf.TIMEOUT)
                        return extra.tpModule.retryTimeout(extra, state, jpf.offline);
                    
                    if (state == jpf.OFFLINE)
                        return;
                    
                    if (state == jpf.ERROR)
                        storage.remove("oldVersion", _self.namespace);
                    
                    if (jpf.debug || !newVersion || !oldVersion 
                        || oldVersion != newVersion){
                        
                        //#ifdef __DEBUG
                        jpf.console.info("Refreshing offline file list");
                        //#endif
                        
                        // #ifdef __WITH_OFFLINE_STATE
                        if (jpf.offline.state.enabled) {
                            jpf.offline.state.clear();
                            
                            if (jpf.offline.state.realtime)
                                jpf.offline.state.search();
                        }
                        // #endif
                        
                        _self.search();
                        _self.provider.store(_self.urls, 
                            callback, newVersion);
                    }
                    else{
                        //#ifdef __DEBUG
                        jpf.console.info("No need to refresh offline file list");
                        //#endif

                        callback({
                            finished : true
                        });
                    }
                });
        }
        else{
            //#ifdef __DEBUG
            jpf.console.info("Refreshing offline file list");
            //#endif

            this.search();
            this.provider.store(this.urls, callback);
        }
    },
    
    //forEach???
    search : function(){
        //Html based sources
        this.cache(window.location.href);

        var nodes = document.getElementsByTagName("script");
        for (var i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("src"));
        
        var nodes = document.getElementsByTagName("link");
        for (var i = 0; i < nodes.length; i++){
            if((nodes[i].getAttribute("rel") || "").toLowerCase() == "stylesheet")
                continue;
            
            this.cache(nodes[i].getAttribute("href"));
        }
        
        var nodes = document.getElementsByTagName("img");
        for (var i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("src"));
        
        var nodes = document.getElementsByTagName("a");
        for (var i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("href"));
        
        // @todo handle 'object' and 'embed' tag
        
        // parse our style sheets for inline URLs and imports
        var _self = this, s, i, j, m, rule, sheet, sheets = document.styleSheets;
        for (i = 0; i < sheets.length; i++) {
            sheet = sheets[i];
            if (jpf.isIE) { //@todo multibrowser test this
                if (sheet.readOnly) {
                    sheet.cssText.replace(/url\(\s*([^\) ]*)\s*\)/gi, function(m, url){
                        _self.cache(url);
                        return "";
                    });
                }
            }
            else {
                if (sheet.ownerNode.tagName == "STYLE")
                    continue;
                
                for (j = 0; j < sheet.cssRules.length; j++) {
                    rule = sheet.cssRules[j].cssText;
                    if(!rule) 
                        continue;
                
                    rule.replace(/url\(\s*([^\) ]*)\s*\)/gi, function(m, url){
                        _self.cache(url);
                        return "";
                    });
                }
            }
        }
        
        //Cache Skin CSS
        jpf.skins.loadedCss.replace(/url\(\s*([^\) ]*)\s*\)/gi, function(m, url){
            _self.cache(url);
            return "";
        });
        
        //Jml based sources
        if (jpf.JmlParser.jml) {
            var _self = this;
            function callback(item){
                if(!item.nodeType) return;
                
                var nodes = item.selectNodes("//include/@src|//skin/@src");
                for (var i = 0; i < nodes.length; i++) {
                    _self.cache(nodes[i].nodeValue);
                }
            }
            
            callback(jpf.JmlParser.jml);
            jpf.IncludeStack.forEach(callback);
        }
        
        //Cached resources??
    },
    
    save : function(callback){
        if (!jpf.offline.isOnline) {
            var func = function(){
                jpf.offline.application.save();
                jpf.offline.removeEventListener("onafteronline", func)
            }
            jpf.offline.addEventListener("onafteronline", func);
            
            return;
        }
        
        this.refresh(callback);
    }
});
// #endif
