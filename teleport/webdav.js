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

// #ifdef __TP_WEBDAV
// #define __WITH_TELEPORT 1

/**
 * Component implementing WebDAV remote filesystem protocol.
 * Depends on implementation of WebDAV server.
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @classDescription This class intantiation a new WebDAV connector object
 * @return {jpf.xmpp} A new WebDAV connector object
 * @type {Object}
 * @constructor
 *
 * @inherits jpf.BaseComm
 * @inherits jpf.http
 * @namespace jpf
 */

jpf.webdav = function(){
    this.server  = null;
    this.timeout = 10000;
    this.useHTTP = true;
    this.method  = "GET";

    this.oModel         = null;
    this.modelContent   = null;
    this.TelePortModule = true;

    var _self = this;

    // Collection of shorthands for all namespaces known and used by this class
    this.NS   = {
        D    : "DAV:",
        ns0  : "DAV:",
        lp1  : "DAV:",
        lp2  : "http://apache.org/dav/props/"
    };

    if (!this.uniqueId) {
        jpf.makeClass(this);

        this.inherit(jpf.BaseComm, jpf.http);
    }

    this.doRequest = function(fCallback, sPath, sBody, oHeaders, bUseXml, fCallback2) {
        if (bUseXml) {
            if (!oHeaders)
                oHeaders = {};
            oHeaders["Content-type"] = "text/xml; charset=utf-8";
        }
        return this.get(this.server + sPath || "",
            function(data, state, extra) {
                if (state != jpf.SUCCESS) {
//                    var cb = getVar('login_callback');
//                    if (cb) {
//                        unregister('login_callback');
//                        return cb(null, jpf.ERROR, extra);
//                    }

                    var oError;

                    //#ifdef __DEBUG
                    oError = new Error(jpf.formatErrorString(0,
                        _self, "WebDAV Communication error",
                        "Url: " + extra.url + "\nInfo: " + extra.message));
                    //#endif

                    if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;

                    throw oError;
                }

                if (typeof fCallback == "function")
                    fCallback.call(_self, data, state, extra, fCallback2);
            }, {
                nocache       : false,
                useXML        : true,
                ignoreOffline : true,
                data          : sBody || "",
                headers       : oHeaders
            });
    };

    this.connect = function(username, password, callback) {

    };

    this.disconnect = function() {

    };

    this.reset = function() {

    };

    function generalCallback(oXml, status, extra) {
        window.console.dir(oXml);
    }

    //------------ Filesystem operations ----------------//

    this.read = function(sPath) {
        this.method = "GET";
        this.doRequest(generalCallback, sPath);
    };

    this.readDir = function(sPath, callback) {
        if (sPath.charAt(sPath.length - 1) != "/")
            sPath += "/";
        return this.getProperties(sPath, 1, callback);
    };

    this.write = function(sPath, sContent, sLock) {
        this.method = "PUT";
        this.doRequest(generalCallback, sPath, sContent, sLock ? {
            "If": "<" + sLock + ">"
        } : null, true);
    };

    this.copy = function(sFrom, sTo, bOverwrite, sLock) {
        this.method = "COPY";
        var oHeaders = {
            "Destination": sTo
        };
        if (bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (sLock)
            oHeaders["If"] = "<" + sLock + ">";
        this.doRequest(generalCallback, sFrom, null, oHeaders);
    };

    this.move = function(sFrom, sTo, bOverwrite, sLock) {
        this.method = "MOVE";
        var oHeaders = {
            "Destination": sTo
        };
        if (bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (sLock)
            oHeaders["If"] = "<" + sLock + ">";
        this.doRequest(generalCallback, sFrom, null, oHeaders);
    };

    this.remove = function(sPath, sLock) {
        this.method = "DELETE";
        this.doRequest(generalCallback, sPath, null, sLock ? {
            "If": "<" + sLock + ">"
        } : null, true);
    };

    this.mkdir = function(sPath, sLock) {
        this.method = "MKCOL";
        this.doRequest(generalCallback, sPath, null, sLock ? {
            "If": "<" + sLock + ">"
        } : null, true);
    };

    this.list = function(sPath) {
        return this.getProperties(sPath, 0);
    };

    /**
     *
     * @param {String} sPath
     * @param {String} sOwner   URL of the owning party (e.g. 'javeline.com')
     * @param {Number} iDepth   Depth of lock recursion down the tree, should be '1' or 'Infinity'
     * @param {String} sType    Type of the lock, default is 'write' (no other possibility)
     * @param {Number} iTimeout
     * @param {String} sLock    Previous lock token
     * @type  {void}
     */
    this.lock = function(sPath, sOwner, iDepth, sType, iTimeout, sLock) {
        // first, check for existing lock

        this.method = "LOCK"

        if (!sType)
            sType = "write";
        
        iTimeout = iTimeout ? "Infinite, Second-4100000000" : "Second-" + iTimeout;
        var oHeaders = {
            "Timeout": iTimeout
        };
        if (iDepth)
            oHeaders["Depth"] = iDepth || Infinity;
        if (sLock)
            oHeaders["If"] = "<" + sLock + ">";
        var xml = '<?xml version="1.0" encoding="utf-8"?>\n'+
            '<D:lockinfo xmlns:D="DAV:">\n' +
            '<D:lockscope><D:exclusive /></D:lockscope>\n' +
            '<D:locktype><D:' + sType + ' /></D:locktype>\n' +
            '<D:owner>\n<D:href>' +
            sOwner + //what is string.entitize?
            '</D:href>\n</D:owner>\n' +
            '</D:lockinfo>\n';
        this.doRequest(generalCallback, sPath, xml, oHeaders, true);
    };

    this.unlock = function(sPath, sLock) {
        this.method = "UNLOCK";
        this.doRequest(generalCallback, sPath, null, {
            "Lock-Token": "<" + sLock + ">"
        }, true)
    };

    this.getProperties = function(sPath, iDepth, callback) {
        // IMPORTANT: cache listings!
        this.method = "PROPFIND";
        // XXX maybe we want to change this to allow getting selected props
        var xml = '<?xml version="1.0" encoding="UTF-8" ?>' +
                    '<D:propfind xmlns:D="DAV:">' +
                    '<D:allprop />' +
                    '</D:propfind>';
        this.doRequest(parsePropertyPackets, sPath, xml, {
            "Depth": typeof iDepth != "undefined" ? iDepth : 1
        }, true, callback);
    };

    this.setProperties = function(sPath, oPropsSet, oPropsDel, sLock) {
        this.method = "PROPPATCH";
        
        this.doRequest(generalCallback, sPath, 
            buildPropertiesBlock(oPropsSet, oPropsDel),
            sLock ? {"If": "<" + sLock + ">"} : null, true);
    };

    /**
     * create the XML for a PROPPATCH request.
     * 
     * @param {Object} oPropsSet A mapping from namespace to a mapping of key/value pairs (where value is an *entitized* XML string)
     * @param {Object} oPropsDel A mapping from namespace to a list of names
     * @type  {String}
     * @private
     */
    function buildPropertiesBlock(oPropsSet, oPropsDel) {
        var aOut = ['<?xml version="1.0" encoding="utf-8" ?>\n',
            '<D:propertyupdate xmlns:D="DAV:">\n'];

        var bHasProps = false, ns, i, j;
        for (ns in oPropsSet) {
            bHasProps = true;
            break;
        }
        if (bHasProps) {
            aOut.push('<D:set>\n');
            for (ns in oPropsSet) {
                for (i in oPropsSet[ns])
                    aOut.push('<D:prop>\n', oPropsSet[ns][i], '</D:prop>\n')
            }
            aOut.push('</D:set>\n');
        }
        bHasProps = false;
        for (ns in oPropsDel) {
            bHasProps = true;
            break;
        }
        if (bHasProps) {
            aOut.push('<D:remove>\n<D:prop>\n');
            for (ns in oPropsDel) {
                for (i = 0, j = oPropsDel[ns].length; i < j; i++)
                    aOut.push('<', oPropsDel[ns][i], ' xmlns="', ns, '"/>\n')
            }
            aOut.push('</D:prop>n</D:remove>\n');
        }

        aOut.push('</D:propertyupdate>');
        return aOut.join('');
    }

    function parsePropertyPackets(oXml, state, extra, callback) {
        var aResp = $xmlns(oXml, 'response', _self.NS.D),
            aOut = [];
        for (var i = aResp.length > 1 ? 1 : 0, j = aResp.length; i < j; i++)
            aOut.push(itemToXml(aResp[i]));
        if (callback)
            callback.call(_self, "<files>" + aOut.join('') + "</files>", state, extra);
    }

    function itemToXml(oNode) {
        var sType       = $xmlns(oNode, "collection", _self.NS.D).length > 0 ? "folder" : "file";
        var aExecutable = $xmlns(oNode, "executable", _self.NS.lp2);
        var aCType      = $xmlns(oNode, "getcontenttype", _self.NS.D);
        var sPath       = $xmlns(oNode, "href", _self.NS.D)[0].firstChild.nodeValue.replace(/[\\\/]+$/, '');
        return "<" + sType + " " +
            "path='" + sPath + "' " +
            "type='" + sType + "' " +
            "size='" + parseInt(sType == "file"
                ? $xmlns(oNode, "getcontentlength", _self.NS.lp1)[0].firstChild.nodeValue
                : 0) + "' " +
            "name='" + sPath.split("/").pop() + "' " +
            "contenttype='" + (sType == "file" && aCType.length
                ? aCType[0].firstChild.nodeValue
                : "") + "' " +
            "creationdate='" + $xmlns(oNode, "creationdate", _self.NS.lp1)[0].firstChild.nodeValue + "' " +
            "lastmodified='" + $xmlns(oNode, "getlastmodified", _self.NS.lp1)[0].firstChild.nodeValue + "' " +
            "lockable='" + ($xmlns(oNode, "locktype", _self.NS.D).length > 0).toString() + "' " +
            "executable='" + (aExecutable.length > 0 && aExecutable[0].firstChild.nodeValue == "T").toString() +
            "'/>\n";
    }

    /**
     * Something went wrong during the authentication process; this function
     * provides a central mechanism for dealing with this situation
     *
     * @param     {String}  msg
     * @type      {Boolean}
     * @exception {Error} A general Error object
     * @private
     */
    function notAuth(msg) {
        unregister('password');

        var extra = {
            username : getVar('username'),
            server   : _self.server,
            message  : msg || "Access denied. Please check you username or password."
        }

        var cb = getVar('login_callback');
        if (cb) {
            cb(null, jpf.ERROR, extra);
            unregister('login_callback');
        }

        // #ifdef __DEBUG
        jpf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'xmpp');
        // #endif

        return _self.dispatchEvent("authfailure", extra);
    }

    /**
     * Our connection to the server has dropped, or the XMPP server can not be
     * reached at the moment. We will cancel the authentication process and
     * dispatch a 'connectionerror' event
     *
     * @param {String}  msg
     * @type  {Boolean}
     * @private
     */
    function connError(msg) {
        unregister('password');

        var extra = {
            username : getVar('username'),
            server   : _self.server,
            message  : msg || "Could not connect to server, please contact your System Administrator."
        }

        var cb = getVar('login_callback');
        if (cb) {
            cb(null, jpf.ERROR, extra);
            unregister('login_callback');
        }

        // #ifdef __DEBUG
        jpf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'xmpp');
        // #endif

        return _self.dispatchEvent("connectionerror", extra);
    }


    /**
     * This is the connector function between the JML representation of this
     * Teleport module. If specified, it will also setup the Remote SmartBinding
     * feature.
     *
     * Sample JML:
     *   <j:teleport>
     *       <j:webdav id="myWebDAV" url="http://http://test.webdav.org" model="myFilesystem" model-contents="all" />
     *   </j:teleport>
     *
     * @param     {XMLDom} x An XML document element that contains WebDAV metadata
     * @type      {void}
     * @exception {Error}  A general Error object
     */
    this.load = function(x){
        this.server  = x.getAttribute('url');
        var i, url   = new jpf.url(this.server);

        // do some extra startup/ syntax error checking
        if (!url.host || !url.protocol)
            throw new Error(jpf.formatErrorString(0, this,
                "WebDAV initialization error",
                "Invalid WebDAV server url provided."));

        this.domain  = url.host;
        this.tagName = "webdav";

        this.timeout  = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.resource = x.getAttribute('resource') || jpf.appsettings.name;

        // parse any custom events formatted like 'onfoo="doBar();"'
        var attr = x.attributes;
        for (i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.indexOf("on") == 0)
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
    };
};

jpf.webdav.STATUS_CODES = {
    '100': 'Continue',
    '101': 'Switching Protocols',
    '102': 'Processing',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'None-Authoritive Information',
    '204': 'No Content',
    '1223': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '207': 'Multi-Status',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '307': 'Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Time-out',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Request Entity Too Large',
    '414': 'Request-URI Too Large',
    '415': 'Unsupported Media Type',
    '416': 'Requested range not satisfiable',
    '417': 'Expectation Failed',
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Time-out',
    '505': 'HTTP Version not supported',
    '507': 'Insufficient Storage'
};

// #ifdef __WITH_DSINSTR

/**
 * Instruction handler for XMPP protocols. It supports the following directives:
 * - xmpp:name.login(username, password)
 * - xmpp:name.logout()
 * - xmpp:name.notify(message, to_address, thread, type)
 *
 * @param {XMLDoc}  xmlContext
 * @param {Object}  options    Valid options are
 *    instrType     {String}
 *    data          {String}
 *    multicall     {Boolean}
 *    userdata      {mixed}
 *    arg           {Array}
 *    isGetRequest  {Boolean}
 * @param {Function} callback
 * @type  {void}
 */
jpf.datainstr.webdav = function(xmlContext, options, callback){
    var parsed = options.parsed || this.parseInstructionPart(
        options.instrData.join(":"), xmlContext, options.args, options);

    if (options.preparse) {
        options.parsed = parsed;
        options.preparse = false;
        return;
    }

    var oWebDAV, name = parsed.name.split(".");
    if (name.length == 1) {
        var modules = jpf.teleport.modules;
        for (var i = 0; i < modules.length; i++) {
            if (modules[i].obj.tagName == "webdav") {
                oWebDAV = modules[i].obj;
                break;
            }
        }
    }
    else {
        oWebDAV = self[name[0]];
    }

    //#ifdef __DEBUG
    if (!oWebDAV) {
        throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
            name.length
                ? "Could not find WebDAV object by name '" + name[0] + "' in \
                   data instruction '" + options.instruction + "'"
                : "Could not find any WebDAV object to execute data \
                   instruction with"));
    }
    //#endif

    var args = parsed.arguments;
    var sPath = args[0];
    switch (name.shift()) {
        case "readdir":
            oWebDAV.readDir(sPath, callback);
            break;
        case "getroot":
            if (sPath.charAt(sPath.length - 1) != "/")
                sPath += "/";
            oWebDAV.getProperties(sPath, 0, callback);
            break;
        default:
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
                "Invalid WebDAV data instruction '" + options.instruction + "'"));
            //#endif
            break;
    }
};

// #endif

// #endif
