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

// #ifdef __PARSER_XSLT
/**
 * @private
 */
apf.runXslt = function(){
    /**
     * @constructor
     * @parser
     */
    apf.XSLTProcessor = function(){
        this.templates = {};
        this.p = {
            "value-of": function(context, xslNode, childStack, result){
                var value,
                    xmlNode = apf.XPath.selectNodes(xslNode.getAttribute("select"),
                              context)[0];// + "[0]"
                if (!xmlNode) {
                    value = "";
                }
                else {
                    if (xmlNode.nodeType == 1)
                        value = xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "";
                    else
                        value = typeof xmlNode == "object" ? xmlNode.nodeValue : xmlNode;
                }

                result.appendChild(this.xmlDoc.createTextNode(value));
            },

            "copy-of": function(context, xslNode, childStack, result){
                var xmlNode = apf.XPath.selectNodes(xslNode.getAttribute("select"),
                              context)[0];// + "[0]"
                if (xmlNode)
                    result.appendChild(apf.canImportNode
                        ? result.ownerDocument.importNode(xmlNode, true)
                        : xmlNode.cloneNode(true));
            },

            "if": function(context, xslNode, childStack, result){
                if (apf.XPath.selectNodes(xslNode.getAttribute("test"), context)[0])// + "[0]"
                    this.parseChildren(context, xslNode, childStack, result);
            },

            "for-each": function(context, xslNode, childStack, result){
                var i, l,
                    nodes = apf.XPath.selectNodes(xslNode.getAttribute("select"), context);
                for (i = 0, l = nodes.length; i < l; i++)
                    this.parseChildren(nodes[i], xslNode, childStack, result);
            },

            "choose": function(context, xslNode, childStack, result){
                var i, l,
                    nodes = xslNode.childNodes;
                for (i = 0, l = nodes.length; i < l; i++) {
                    if (!nodes[i].tagName)
                        continue;

                    if (nodes[i][apf.TAGNAME]  == "otherwise"
                      || nodes[i][apf.TAGNAME] == "when"
                      && apf.XPath.selectNodes(nodes[i].getAttribute("test"), context)[0])
                        return this.parseChildren(context, nodes[i], childStack[i][2], result);
                }
            },

            "output": function(context, xslNode, childStack, result){},

            "param": function(context, xslNode, childStack, result){},

            "attribute": function(context, xslNode, childStack, result){
                var nres = this.xmlDoc.createDocumentFragment();
                this.parseChildren(context, xslNode, childStack, nres);

                result.setAttribute(xslNode.getAttribute("name"), nres.xml);
            },

            "apply-templates": function(context, xslNode, childStack, result){
                var t, i, l, nodes;
                if (!xslNode) {
                    t = this.templates["/"] || this.templates[context.tagName];
                    if (t) {
                        this.parseChildren(t == this.templates["/"]
                            ? context.ownerDocument : context, t[0], t[1], result);
                    }
                }
                else {
                    if (xslNode.getAttribute("select")) {
                        t = this.templates[xslNode.getAttribute("select")];
                        if (t) {
                            if (xslNode.getAttribute("select") == "/")
                                return alert("Something went wrong. The / template was executed as a normal template");

                            nodes = context.selectNodes(xslNode.getAttribute("select"));
                            for (i = 0, l = nodes.length; i < l; i++)
                                this.parseChildren(nodes[i], t[0], t[1], result);
                        }
                    }
                    //Named templates should be in a different hash
                    else {
                        if (xslNode.getAttribute("name")) {
                            t = this.templates[xslNode.getAttribute("name")];
                            if (t)
                                this.parseChildren(context, t[0], t[1], result);
                        }
                        else {
                            //Copy context
                            var ncontext = context.cloneNode(true), //importnode here??
                                nres     = this.xmlDoc.createDocumentFragment(),
                                tName, p, k;

                            nodes = ncontext.childNodes;
                            for (i = nodes.length - 1; i >= 0; i--) {
                                if (nodes[i].nodeType == 3 || nodes[i].nodeType == 4) {
                                    //result.appendChild(this.xmlDoc.createTextNode(nodes[i].nodeValue));
                                    continue;
                                }
                                if (!nodes[i].nodeType == 1)
                                    continue;
                                var n = nodes[i];

                                //Loop through all templates
                                for (tName in this.templates) {
                                    if (tName == "/")
                                        continue;
                                    t = this.templates[tName];

                                    var snodes = n.selectNodes("self::" + tName);
                                    for (var j = snodes.length - 1; j >= 0; j--) {
                                        var s = snodes[j];
                                        p = s.parentNode;
                                        this.parseChildren(s, t[0], t[1], nres);
                                        if (nres.childNodes) {
                                            for (k = nres.childNodes.length - 1; k >= 0; k--)
                                                p.insertBefore(nres.childNodes[k], s);
                                        }
                                        p.removeChild(s);
                                    }
                                }

                                if (n.parentNode) {
                                    p = n.parentNode;
                                    this.p["apply-templates"].call(this, n, xslNode, childStack, nres);
                                    if (nres.childNodes) {
                                        for (k = nres.childNodes.length - 1; k >= 0; k--)
                                            p.insertBefore(nres.childNodes[k], n);
                                    }
                                    p.removeChild(n);
                                }
                            }

                            for (i = ncontext.childNodes.length - 1; i >= 0; i--)
                                result.insertBefore(ncontext.childNodes[i], result.firstChild);
                        }
                    }
                }
            },

            cache   : {},
            "import": function(context, xslNode, childStack, result){
                var file = xslNode.getAttribute("href");
                if (!this.cache[file]) {
                    var data = apf.oHttp.get(file);
                    this.cache[file] = data;
                }
                //compile
                //parseChildren
            },

            "include"  : function(context, xslNode, childStack, result){},

            "when"     : function(){},
            "otherwise": function(){},

            "copy-clone": function(context, xslNode, childStack, result){
                result = result.appendChild(apf.canImportNode 
                    ? result.ownerDocument.importNode(xslNode, false)
                    : xslNode.cloneNode(false));
                if (result.nodeType == 1) {
                    for (var value, i = 0, l = result.attributes.length; i < l; i++) {
                        var blah = result.attributes[i].nodeValue; //stupid Safari shit
                        if (!apf.isSafariOld && result.attributes[i].nodeName.match(/^xmlns/))
                            continue;
                        result.attributes[i].nodeValue = result.attributes[i].nodeValue
                            .replace(/\{([^\}]+)\}/g, function(m, xpath){
                                var xmlNode = apf.XPath.selectNodes(xpath, context)[0];

                                if (!xmlNode) {
                                    value = "";
                                }
                                else {
                                    if (xmlNode.nodeType == 1) {
                                        value = xmlNode.firstChild 
                                            ? xmlNode.firstChild.nodeValue
                                            : "";
                                    }
                                    else {
                                        value = typeof xmlNode == "object"
                                            ? xmlNode.nodeValue
                                            : xmlNode;
                                    }
                                }

                                return value;
                            });

                        result.attributes[i].nodeValue; //stupid Safari shit
                    }
                }

                this.parseChildren(context, xslNode, childStack, result);
            }
        }

        this.parseChildren = function(context, xslNode, childStack, result){
            if (!childStack) return;
            for (var i = 0, l = childStack.length; i < l; i++) {
                childStack[i][0].call(this, context, childStack[i][1],
                    childStack[i][2], result);
            }
        };

        this.compile = function(xslNode){
            var nodes = xslNode.childNodes;
            for (var stack = [], i = 0, l = nodes.length; i < l; i++) {
                if (nodes[i].nodeType != 1 && nodes[i].nodeType != 3 && nodes[i].nodeType != 4)
                    continue;

                if (nodes[i][apf.TAGNAME] == "template") {
                    this.templates[nodes[i].getAttribute("match")
                        || nodes[i].getAttribute("name")] = [nodes[i], this.compile(nodes[i])];
                }
                else {
                    if (nodes[i][apf.TAGNAME] == "stylesheet") {
                        this.compile(nodes[i])
                    }
                    else {
                        if (nodes[i].prefix == "xsl") {
                            var func = this.p[nodes[i][apf.TAGNAME]];
                            if (!func)
                                alert("xsl:" + nodes[i][apf.TAGNAME] + " is not supported at this time on this platform");
                            else
                                stack.push([func, nodes[i], this.compile(nodes[i])]);
                        }
                        else {
                            stack.push([this.p["copy-clone"], nodes[i], this.compile(nodes[i])]);
                        }
                    }
                }
            }
            return stack;
        };

        this.importStylesheet = function(xslDoc){
            this.xslDoc = xslDoc.nodeType == 9 ? xslDoc.documentElement : xslDoc;
            var xslStack = this.compile(xslDoc);

            //var t = this.templates["/"] ? "/" : false;
            //if(!t) for(t in this.templates) if(typeof this.templates[t] == "array") break;
            this.xslStack = [[this.p["apply-templates"], null]];//{getAttribute : function(n){if(n=="name") return t}
        };

        //return nodes
        this.transformToFragment = function(doc, newDoc){
            //new DOMParser().parseFromString("<xsltresult></xsltresult>", "text/xml");//
            this.xmlDoc = newDoc.nodeType != 9 ? newDoc.ownerDocument : newDoc;
            var docfrag = this.xmlDoc.createDocumentFragment();

            if (!apf.isSafariOld && doc.nodeType == 9)
                doc = doc.documentElement;
            var result = this.parseChildren(doc, this.xslDoc, this.xslStack, docfrag);
            return docfrag;
        };
    };

    self.XSLTProcessor = apf.XSLTProcessor;
};

//#endif
