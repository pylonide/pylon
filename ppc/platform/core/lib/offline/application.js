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

// #ifdef __WITH_OFFLINE_APPLICATION

/**
 * Object handling the offline state of the application resources. This includes
 * the files that contain application logic themselve. In most cases the
 * functionality of this object will be managed from within the offline
 * element in AML.
 * Example:
 * <code>
 *  <a:offline
 *      version-get  = "version.php"
 *      providers    = "gears|air"
 *      auto-install = "true" />
 * </code>
 *
 * @define offline
 * @event beforeinstall Fires before installation of an offline provider
 *   cancelable: Cancels the installation of the offline provider
 * @event afterinstall  Fires after installation of an offline provider
 *
 * @attribute {String} [version-get]    a datainstruction for getting a version number of the current application
 * @attribute {String} [providers]      a pipe seperated list of possible providers.
 *   Possible values:
 *   gears  Uses the Google Gears plugin for storage of application files
 * @attribute {Boolean} [auto-install]  whether the required plugin is installed when it's not installed yet.
 *
 * @default_private
 * @todo a later version should also clear models and thus undo state
 */
apf.offline.application = {
    enabled   : false,
    urls      : [],
    providers : ["deskrun", "gears"],

    init : function(aml){
        if (this.enabled)
            return;

        this.namespace = apf.config.name + ".apf.offline.application";

        if (typeof aml == "string") {
            this.providers = aml.split("|");
        }
        else if (aml.nodeType) {
            if (aml.getAttribute("version-get"))
                this.application.versionGet = aml.getAttribute("version-get");

            if (aml.getAttribute("providers"))
                this.providers = aml.getAttribute("providers").split("|");

            if (aml.getAttribute("auto-install"))
                this.autoInstall = apf.isTrue(aml.getAttribute("auto-install"));
        }

        //Check for an available offline provider
        for (var i = 0; i < this.providers.length; i++) {
            if (!this[this.providers[i]]) {
                //#ifdef __DEBUG
                apf.console.warn("Module not loaded for offline provider: "
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
                    apf.console.warn("Could not install any of the preferred \
                                         offline providers:"
                                        + this.providers.join(", "));
                    //#endif

                    apf.offline.application = null; //Can't put the app offline
                    return this.providers[0];
                }
            }
            else {
                //#ifdef __DEBUG
                apf.console.warn("Could not find any of the specified \
                                     offline providers:"
                                    + this.providers.join(", "));
                //#endif

                apf.offline.application = null; //Can't put the app offline
                return this.providers[0];
            }
        }

        if (!apf.loaded) { //@todo you might want to consider creating single run events
            apf.addEventListener("load", function(){
                if (apf.offline.application.enabled)
                    apf.offline.application.save();
                apf.removeEventListener("load", arguments.callee);
            });
        }
        else {
            apf.offline.addEventListener("load", function(){
                apf.offline.application.save();
            });
        }

        this.enabled = true;

        return this.provider.name;
    },

    install : function(){
        if (apf.offline.dispatchEvent("beforeinstall") === false) {
            //#ifdef __DEBUG
            apf.console.warn("Installation cancelled");
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

        apf.offline.dispatchEvent("afterinstall");

        if (!this.provider)
            return false;
    },

    clear : function(){
        if (this.provider)
            this.provider.clear();
    },

    cache : function(url){
        //if(!new apf.url(url).isSameLocation())
            //return;
        if (url.indexOf(":") > -1 && url.indexOf("http://" + location.host) == -1)
            return;

        this.urls.pushUnique(url.replace(/\#.*$/, ""));
    },

    remove : function(url){
        this.urls.remove(url)
    },

    refresh : function(callback){
        var storage = apf.offline.storage;

        if(this.versionGet){
            var oldVersion = storage.get("oldVersion", this.namespace);
            var newVersion = null;
            var _self      = this;

            apf.getData(this.versionGet, {callback:
                function(newVersion, state, extra){
                    if (state == apf.TIMEOUT)
                        return extra.tpModule.retryTimeout(extra, state, apf.offline);

                    if (state == apf.OFFLINE)
                        return;

                    if (state == apf.ERROR)
                        storage.remove("oldVersion", _self.namespace);

                    if (apf.debug || !newVersion || !oldVersion
                        || oldVersion != newVersion){

                        //#ifdef __DEBUG
                        apf.console.info("Refreshing offline file list");
                        //#endif

                        // #ifdef __WITH_OFFLINE_STATE
                        if (apf.offline.state.enabled) {
                            apf.offline.state.clear();

                            if (apf.offline.state.realtime)
                                apf.offline.state.search();
                        }
                        // #endif

                        _self.search();
                        _self.provider.store(_self.urls,
                            callback, newVersion);
                    }
                    else{
                        //#ifdef __DEBUG
                        apf.console.info("No need to refresh offline file list");
                        //#endif

                        callback({
                            finished : true
                        });
                    }
                }
            });
        }
        else{
            //#ifdef __DEBUG
            apf.console.info("Refreshing offline file list");
            //#endif

            this.search();
            this.provider.store(this.urls, callback);
        }
    },

    //forEach???
    search : function(){
        //Html based sources
        this.cache(window.location.href);

        var i, nodes = document.getElementsByTagName("script");
        for (i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("src"));

        nodes = document.getElementsByTagName("link");
        for (i = 0; i < nodes.length; i++){
            if((nodes[i].getAttribute("rel") || "").toLowerCase() == "stylesheet")
                continue;

            this.cache(nodes[i].getAttribute("href"));
        }

        nodes = document.getElementsByTagName("img");
        for (i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("src"));

        nodes = document.getElementsByTagName("a");
        for (i = 0; i < nodes.length; i++)
            this.cache(nodes[i].getAttribute("href"));

        // @todo handle 'object' and 'embed' tag

        // parse our style sheets for inline URLs and imports
        var _self = this, j, rule, sheet, sheets = document.styleSheets;
        for (i = 0; i < sheets.length; i++) {
            sheet = sheets[i];
            if (apf.isIE) { //@todo multibrowser test this
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
        apf.skins.loadedCss.replace(/url\(\s*([^\) ]*)\s*\)/gi, function(m, url){
            _self.cache(url);
            return "";
        });

        //Aml based sources
        //@todo apf3.x this needs to be rewritten
        /*if (apf.AmlParser.$aml) { 
            function callback(item){
                if(!item.nodeType) return;

                var nodes = item.selectNodes("//include/@src|//skin/@src");
                for (var i = 0; i < nodes.length; i++) {
                    _self.cache(nodes[i].nodeValue);
                }
            }

            callback(apf.AmlParser.$aml);
            apf.includeStack.forEach(callback);
        }*/

        //Cached resources??
    },

    save : function(callback){
        if (!apf.offline.onLine) {
            var func = function(){
                apf.offline.application.save();
                apf.offline.removeEventListener("afteronline", func)
            }
            apf.offline.addEventListener("afteronline", func);

            return;
        }

        this.refresh(callback);
    }
};

// #endif
