// #ifdef __PARSER_XPATH || __SUPPORT_WEBKIT || __SUPPORT_IE && __WITH_PRESENTATION
/**
 * @private
 */
apf.runXpath = function(){

/**
 *    Workaround for the lack of having an XPath parser on safari.
 *    It works on Safari's document and XMLDocument object.
 *
 *    It doesn't support the full XPath spec, but just enought for
 *    the skinning engine which needs XPath on the HTML document.
 *
 *    Supports:
 *    - Compilation of xpath statements
 *    - Caching of XPath statements
 *
 * @parser
 * @private
 */
apf.XPath = {
    cache : {},

    getSelf : function(htmlNode, tagName, info, count, num, sResult){
        var numfound = 0, result = null, data = info[count];

        if (data)
            data[0](htmlNode, data[1], info, count + 1, numfound++ , sResult);
        else
            sResult.push(htmlNode);
    },

    getChildNode : function(htmlNode, tagName, info, count, num, sResult){
        var numfound = 0, result = null, data = info[count];

        var nodes = htmlNode.childNodes;
        if (!nodes) return; //Weird bug in Safari
        for (var i = 0; i < nodes.length; i++) {
            //if (nodes[i].nodeType != 1)
                //continue;

            if (tagName && (tagName != nodes[i].tagName) && (nodes[i].style
              ? nodes[i].tagName.toLowerCase()
              : nodes[i].tagName) != tagName)
                continue;// || numsearch && ++numfound != numsearch
            
            htmlNode = nodes[i];

            if (data)
                data[0](nodes[i], data[1], info, count + 1, numfound++ , sResult);
            else
                sResult.push(nodes[i]);
        }

        //commented out :  && (!numsearch || numsearch == numfound)
    },

    doQuery : function(htmlNode, qData, info, count, num, sResult){
        var result = null, data = info[count];
        var query = qData[0];
        var returnResult = qData[1];
        try {
            var qResult = eval(query);
        }catch(e){
            apf.console.error(e.name + " " + e.type + ":" + apf.XPath.lastExpr + "\n\n" + query);
            //throw new Error(e.name + " " + e.type + ":" + apf.XPath.lastExpr + "\n\n" + query);
            return;
        }

        if (returnResult)
            return sResult.push(qResult);
        if (!qResult || qResult.dataType == apf.ARRAY && !qResult.length) 
            return;

        if (data)
            data[0](htmlNode, data[1], info, count + 1, 0, sResult);
        else
            sResult.push(htmlNode);
    },

    getTextNode : function(htmlNode, empty, info, count, num, sResult){
        var data  = info[count],
            nodes = htmlNode.childNodes;

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 3 && nodes[i].nodeType != 4)
                continue;

            if (data)
                data[0](nodes[i], data[1], info, count + 1, i, sResult);
            else
                sResult.push(nodes[i]);
        }
    },

    getAnyNode : function(htmlNode, empty, info, count, num, sResult){
        var data  = info[count],
            nodes = htmlNode.getElementsByTagName("*");//childNodes;

        for (var i = 0; i < nodes.length; i++) {
            if (data)
                data[0](nodes[i], data[1], info, count + 1, i, sResult);
            else
                sResult.push(nodes[i]);
        }
    },

    getAttributeNode : function(htmlNode, attrName, info, count, num, sResult){
        if (!htmlNode || htmlNode.nodeType != 1) return;

        if (attrName == "*") {
            var nodes = htmlNode.attributes;
            for (var i = 0; i < nodes.length; i++) {
                arguments.callee.call(this, htmlNode, nodes[i].nodeName, info,
                    count, i, sResult);
            }
            return;
        }

        var data = info[count],
            value = htmlNode.getAttributeNode(attrName);//htmlNode.attributes[attrName];//

        if (data)
            data[0](value, data[1], info, count + 1, 0, sResult);
        else if (value)
            sResult.push(value);
    },

    getAllNodes : function(htmlNode, x, info, count, num, sResult){
        var data = info[count],
            tagName  = x[0],
            inclSelf = x[1],
            prefix   = x[2],
            nodes, i, l;

        if (inclSelf && (htmlNode.tagName == tagName || tagName == "*" || tagName == "node()")) {
            if (data)
                data[0](htmlNode, data[1], info, count + 1, 0, sResult);
            else
                sResult.push(htmlNode);
        }

        if (tagName == "node()") {
            tagName = "*";
            prefix = "";
            if (apf.isIE) {
                nodes = htmlNode.getElementsByTagName("*");
            }
            else {
                nodes = [];
                (function recur(x){
                    for (var n, i = 0; i < x.childNodes.length; i++) {
                        n = x.childNodes[i];
                        if (n.nodeType != 1)
                            continue;
                        nodes.push(n);
                        
                        recur(n);
                    }
                })(htmlNode);
            }
        }
        else {
            nodes = htmlNode.getElementsByTagName((prefix
              && (apf.isGecko || apf.isOpera || htmlNode.nodeFunc) ? prefix + ":" : "") + tagName);
        }

        for (i = 0, l = nodes.length; i < l; i++) {
            if (data)
                data[0](nodes[i], data[1], info, count + 1, i, sResult);
            else
                sResult.push(nodes[i]);
        }
    },

    getAllAncestorNodes : function(htmlNode, x, info, count, num, sResult){
        var data = info[count],
            tagName  = x[0],
            inclSelf = x[1],
            i        = 0,
            s        = inclSelf ? htmlNode : htmlNode.parentNode;
        while (s && s.nodeType == 1) {
            if (s.tagName == tagName || tagName == "*" || tagName == "node()") {
                if (data)
                    data[0](s, data[1], info, count + 1, ++i, sResult);
                else
                    sResult.push(s);
            }
            s = s.parentNode
        }
    },

    getParentNode : function(htmlNode, empty, info, count, num, sResult){
        var data = info[count],
            node = htmlNode.parentNode;

        if (data)
            data[0](node, data[1], info, count + 1, 0, sResult);
        else if (node)
            sResult.push(node);
    },

    //precsiblg[3] might not be conform spec
    getPrecedingSibling : function(htmlNode, tagName, info, count, num, sResult){
        var data = info[count],
            node = htmlNode.previousSibling;

        while (node) {
            if (tagName != "node()" && (node.style
              ? node.tagName.toLowerCase()
              : node.tagName) != tagName){
                node = node.previousSibling;
                continue;
            }

            if (data)
                data[0](node, data[1], info, count+1, 0, sResult);
            else if (node) {
                sResult.push(node);
                break;
            }
        }
    },

    //flwsiblg[3] might not be conform spec
    getFollowingSibling : function(htmlNode, tagName, info, count, num, sResult){
        var result = null, data = info[count];

        var node = htmlNode.nextSibling;
        while (node) {
            if (tagName != "node()" && (node.style
              ? node.tagName.toLowerCase()
              : node.tagName) != tagName) {
                node = node.nextSibling;
                continue;
            }

            if (data)
                data[0](node, data[1], info, count+1, 0, sResult);
            else if (node) {
                sResult.push(node);
                break;
            }
        }
    },

    multiXpaths : function(contextNode, list, info, count, num, sResult){
        for (var i = 0; i < list.length; i++) {
            info = list[i][0];
            var rootNode = (info[3]
                ? contextNode.ownerDocument.documentElement
                : contextNode);//document.body
            info[0](rootNode, info[1], list[i], 1, 0, sResult);
        }

        sResult.makeUnique();
    },

    compile : function(sExpr){
        var isAbsolute = sExpr.match(/^\//);//[^\/]/

        sExpr = sExpr.replace(/\[(\d+)\]/g, "/##$1")
            .replace(/\|\|(\d+)\|\|\d+/g, "##$1")
            .replace(/\.\|\|\d+/g, ".")
            .replace(/\[([^\]]*)\]/g, function(match, m1){
                return "/##" + m1.replace(/\|/g, "_@_");
            }); //wrong assumption think of |

        if (sExpr == "/" || sExpr == ".")
            return sExpr;

        //Mark // elements
        //sExpr = sExpr.replace(/\/\//g, "/[]/self::");

        //Check if this is an absolute query
        return this.processXpath(sExpr.replace(/\/\//g, "descendant::"), isAbsolute);
    },

    processXpath : function(sExpr, isAbsolute){
        var results = [],
            i, l, m, query;
        sExpr = sExpr.replace(/'[^']*'/g, function(m){
            return m.replace("|", "_@_");
        });

        sExpr = sExpr.split("\|");
        for (i = 0, l = sExpr.length; i < l; i++)
            sExpr[i] = sExpr[i].replace(/_\@\_/g, "|");//replace(/('[^']*)\_\@\_([^']*')/g, "$1|$2");

        if (sExpr.length == 1) {
            sExpr = sExpr[0];
        }
        else {
            for (i = 0, l = sExpr.length; i < l; i++)
                sExpr[i] = this.processXpath(sExpr[i]);
            results.push([this.multiXpaths, sExpr]);
            return results;
        }

        var sections   = sExpr.split("/");
        for (i = 0, l = sections.length; i < l; i++) {
            if (sections[i] == "." || sections[i] == "")
                continue;
            else if (sections[i] == "..")
                results.push([this.getParentNode, null]);
            else if (sections[i].match(/^[\w\-_\.]+(?:\:[\w\-_\.]+){0,1}$/))
                results.push([this.getChildNode, sections[i]]);//.toUpperCase()
            else if (sections[i].match(/^\#\#(\d+)$/))
                results.push([this.doQuery, ["num+1 == " + parseInt(RegExp.$1)]]);
            else if (sections[i].match(/^\#\#(.*)$/)) {
                //FIX THIS CODE
                query = RegExp.$1;
                m     = [query.match(/\(/g), query.match(/\)/g)];
                if (m[0] || m[1]) {
                    while (!m[0] && m[1] || m[0] && !m[1]
                      || m[0].length != m[1].length){
                        if (!sections[++i]) break;
                        query += "/" + sections[i];
                        m = [query.match(/\(/g), query.match(/\)/g)];
                    }
                }

                results.push([this.doQuery, [this.compileQuery(query)]]);
            }
            else if (sections[i] == "*")
                results.push([this.getChildNode, null]); //FIX - put in def function
            else if (sections[i].substr(0,2) == "[]")
                results.push([this.getAllNodes, ["*", false]]);//sections[i].substr(2) ||
            else if (sections[i].match(/descendant-or-self::node\(\)$/))
                results.push([this.getAllNodes, ["*", true]]);
            else if (sections[i].match(/descendant-or-self::([^\:]*)(?:\:(.*)){0,1}$/))
                results.push([this.getAllNodes, [RegExp.$2 || RegExp.$1, true, RegExp.$1]]);
            else if (sections[i].match(/descendant::([^\:]*)(?:\:(.*)){0,1}$/))
                results.push([this.getAllNodes, [RegExp.$2 || RegExp.$1, false, RegExp.$1]]);
            else if (sections[i].match(/ancestor-or-self::([^\:]*)(?:\:(.*)){0,1}$/))
                results.push([this.getAllAncestorNodes, [RegExp.$2 || RegExp.$1, true, RegExp.$1]]);
            else if (sections[i].match(/ancestor::([^\:]*)(?:\:(.*)){0,1}$/))
                results.push([this.getAllAncestorNodes, [RegExp.$2 || RegExp.$1, false, RegExp.$1]]);
            else if (sections[i].match(/^\@(.*)$/))
                results.push([this.getAttributeNode, RegExp.$1]);
            else if (sections[i] == "text()")
                results.push([this.getTextNode, null]);
            else if (sections[i] == "node()")
                results.push([this.getChildNode, null]);//FIX - put in def function
            else if (sections[i].match(/following-sibling::(.*)$/))
                results.push([this.getFollowingSibling, RegExp.$1.toLowerCase()]);
            else if (sections[i].match(/preceding-sibling::(.*)$/))
                results.push([this.getPrecedingSibling, RegExp.$1.toLowerCase()]);
            else if (sections[i] == "self::node()")
                results.push([this.getSelf, null]);
            else if (sections[i].match(/self::(.*)$/))
                results.push([this.doQuery, ["apf.XPath.doXpathFunc(htmlNode, 'local-name') == '" + RegExp.$1 + "'"]]);
            else {
                //@todo FIX THIS CODE
                //add some checking here
                query = sections[i];
                m     = [query.match(/\(/g), query.match(/\)/g)];
                if (m[0] || m[1]) {
                    while (!m[0] && m[1] || m[0] && !m[1] || m[0].length != m[1].length) {
                        if (!sections[++i]) break;
                        query += "/" + sections[i];
                        m = [query.match(/\(/g), query.match(/\)/g)];
                    }
                }

                results.push([this.doQuery, [this.compileQuery(query), true]])

                //throw new Error("---- APF Error ----\nMessage : Could not match XPath statement: '" + sections[i] + "' in '" + sExpr + "'");
            }
        }

        results[0][3] = isAbsolute;
        return results;
    },

    compileQuery : function(code){
        return new apf.CodeCompilation(code).compile();
    },

    doXpathFunc : function(contextNode, type, nodelist, arg2, arg3, xmlNode, force){
        if (!nodelist || nodelist.length == 0)
            nodelist = "";

        if (type == "not")
            return !nodelist;

        if (!force) {
            var arg1, i, l;
            if (typeof nodelist == "object" || nodelist.dataType == apf.ARRAY) {
                if (nodelist && !nodelist.length)
                    nodelist = [nodelist];
                
                var res = false, value;
                for (i = 0, l = nodelist.length; i < l; i++) {
                    xmlNode = nodelist[i];
                    if (!xmlNode || typeof xmlNode == "string"
                      || "position|last|count|local-name|name".indexOf(type) > -1) {
                        value = xmlNode;
                    }
                    else {
                        if (xmlNode.nodeType == 1 && xmlNode.firstChild && xmlNode.firstChild.nodeType != 1)
                            xmlNode = xmlNode.firstChild;
                        value = xmlNode.nodeValue;
                    }
    
                    if (res = arguments.callee.call(this, contextNode, type, value, arg2, arg3, xmlNode, true))
                        return res;
                }
                return res;
            }
            else {
                arg1 = nodelist;
            }
        }
        else {
            arg1 = nodelist;
        }
        
        switch(type){
            case "position":
                return apf.getChildNumber(contextNode) + 1;
            case "format-number":
                return apf.formatNumber(arg1); //@todo this should actually do something
            case "floor":
                return Math.floor(arg1);
            case "ceiling":
                return Math.ceil(arg1);
            case "starts-with":
                return arg1 ? arg1.substr(0, arg2.length) == arg2 : false;
            case "string-length":
                return arg1 ? arg1.length : 0;
            case "count":
                return arg1 ? arg1.length : 0;
            case "last":
                return arg1 ? arg1[arg1.length-1] : null;
            case "name":
                var c = xmlNode || contextNode;
                return c.nodeName || c.tagName;
            case "local-name":
                var c = xmlNode || contextNode;
                if (c.nodeType != 1) return false;
                return c.localName || (c.tagName || "").split(":").pop();//[apf.TAGNAME]
            case "substring":
                return arg1 && arg2 ? arg1.substring(arg2, arg3 || 0) : "";
            case "contains":
                return arg1 && arg2 ? arg1.indexOf(arg2) > -1 : false;
            case "concat":
                var str = ""
                for (i = 1, l = arguments.length; i < l; i++) {
                    if (typeof arguments[i] == "object") {
                        str += getNodeValue(arguments[i][0]);
                        continue;
                    }
                    str += arguments[i];
                }
                return str;
            case "translate":
                for (i = 0, l = arg2.length; i < l; i++)
                    arg1 = arg1.replace(arg2.substr(i,1), arg3.substr(i,1));
                return arg1;
        }
    },

    selectNodeExtended : function(sExpr, contextNode, match){
        var sResult = this.selectNodes(sExpr, contextNode);

        if (sResult.length == 0)
            return null;
        if (!match)
            return sResult;

        for (var i = 0, l = sResult.length; i < l; i++) {
            if (String(getNodeValue(sResult[i])) == match)
                return [sResult[i]];
        }

        return null;
    },
    
    getRoot : function(xmlNode){
        while (xmlNode.parentNode && xmlNode.parentNode.nodeType == 1)
            xmlNode = xmlNode.parentNode;
        
        return xmlNode.parentNode;
    },

    selectNodes : function(sExpr, contextNode){
        if (!this.cache[sExpr])
            this.cache[sExpr] = this.compile(sExpr);

        //#ifdef __DEBUG
        if (sExpr.length > 20) {
            this.lastExpr    = sExpr;
            this.lastCompile = this.cache[sExpr];
        }
        //#endif
        
        if (typeof this.cache[sExpr] == "string"){
            if (this.cache[sExpr] == ".")
                return [contextNode];
            if (this.cache[sExpr] == "/") {
                return [(contextNode.nodeType == 9
                    ? contextNode.documentElement
                    : this.getRoot(contextNode))];
            }
        }

        if (typeof this.cache[sExpr] == "string" && this.cache[sExpr] == ".")
            return [contextNode];

        var info     = this.cache[sExpr][0],
            rootNode = (info[3]
                ? (contextNode.nodeType == 9
                    ? contextNode.documentElement
                    : this.getRoot(contextNode))
                : contextNode),//document.body*/
            sResult  = [];

        if (rootNode)
            info[0](rootNode, info[1], this.cache[sExpr], 1, 0, sResult);

        return sResult;
    }
};

function getNodeValue(sResult){
    if (sResult.nodeType == 1)
        return sResult.firstChild ? sResult.firstChild.nodeValue : "";
    if (sResult.nodeType > 1 || sResult.nodeType < 5)
        return sResult.nodeValue;
    return sResult;
}

/**
 * @constructor
 * @private
 */
apf.CodeCompilation = function(code){
    this.data = {
        F : [],
        S : [],
        I : [],
        X : []
    };

    this.compile = function(){
        code = code.replace(/ or /g, " || ")
            .replace(/ and /g, " && ")
            .replace(/!=/g, "{}")
            .replace(/=/g, "==")
            .replace(/\{\}/g, "!=");

        // Tokenize
        this.tokenize();

        // Insert
        this.insert();
        
        code = code.replace(/, \)/g, ", htmlNode)");

        return code;
    };

    this.tokenize = function(){
        //Functions
        var data = this.data.F;
        code = code.replace(/(translate|format-number|contains|substring|local-name|last|position|round|starts-with|string|string-length|sum|floor|ceiling|concat|count|not)\s*\(/g,
            function(d, match){
                return (data.push(match) - 1) + "F_";
            }
        );

        //Strings
        data = this.data.S;
        code = code.replace(/'([^']*)'/g, function(d, match){
                return (data.push(match) - 1) + "S_";
            })
            .replace(/"([^"]*)"/g, function(d, match){
                return (data.push(match) - 1) + "S_";
            });

        //Xpath
        data = this.data.X;
        code = code.replace(/(^|\W|\_)([\@\.\/A-Za-z\*][\*\.\@\/\w\:\-]*(?:\(\)){0,1})/g,
            function(d, m1, m2){
                return m1 + (data.push(m2) - 1) + "X_";
            })
            .replace(/(\.[\.\@\/\w]*)/g, function(d, m1, m2){
                return (data.push(m1) - 1) + "X_";
            });

        //Ints
        data = this.data.I;
        code = code.replace(/(\d+)(\W)/g, function(d, m1, m2){
            return (data.push(m1) - 1) + "I_" + m2;
        });
    };

    this.insert = function(){
        var data = this.data;
        code = code.replace(/(\d+)X_\s*==\s*(\d+S_)/g, function(d, nr, str){
                return "apf.XPath.selectNodeExtended('"
                    +  data.X[nr].replace(/'/g, "\\'") + "', htmlNode, " + str + ")";
            })
            .replace(/(\d+)([FISX])_/g, function(d, nr, type){
                var value = data[type][nr];

                if (type == "F") {
                    return "apf.XPath.doXpathFunc(htmlNode, '" + value + "', ";
                }
                else if (type == "S") {
                    return "'" + value + "'";
                }
                else if (type == "I") {
                    return value;
                }
                else if (type == "X") {
                    return "apf.XPath.selectNodeExtended('"
                        + value.replace(/'/g, "\\'") + "', htmlNode)";
                }
            })
            .replace(/, \)/g, ")");
    };
};

}
//#endif
