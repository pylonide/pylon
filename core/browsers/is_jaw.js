// #ifdef __SUPPORT_JAW
jpf.runJaw = function(){
    //jpf.importClass(runNonIe, true, self);
    
    var XMLDocument = create("DOMParser").parseFromString("<root />", "text/xml");
    var Element = XMLDocument.documentElement;
    var Node = Element;

    //XMLDocument.selectNodes
    XMLDocument.prototype.selectNodes  = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, contextNode || this);
    };
    
    //Element.selectNodes
    Element.prototype.selectNodes = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, contextNode || this);
    };
    
    //XMLDocument.selectSingleNode
    XMLDocument.prototype.selectSingleNode  = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
    };
    
    //Element.selectSingleNode
    Element.prototype.selectSingleNode = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
    };
    
    //jpf.importClass(runXpath, true, self);
    jpf.runXpath();
    jpf.runXslt();
    //jpf.importClass(runXslt, true, self);
    
    var ASYNCNOTSUPPORTED = false;
    
    //Test if Async is supported
    try {
        XMLDocument.prototype.async = true;
        ASYNCNOTSUPPORTED           = true;
    } catch(e) {/*trap*/} 
    
    //Document.prototype.onreadystatechange = null;
    //Document.prototype.parseError         = 0;
    
    Array.prototype.item = function(i){return this[i];};
    Array.prototype.expr = "";
    
    XMLDocument.prototype.readyState = 0;
    
    XMLDocument.prototype.$clearDOM = function(){
        while (this.hasChildNodes())
            this.removeChild(this.firstChild);
    };
    
    XMLDocument.prototype.$copyDOM = function(oDoc){
        this.$clearDOM();
        
        if (oDoc.nodeType == 9 || oDoc.nodeType == 11) {
           var oNodes = oDoc.childNodes;
    
           for (var i = 0; i < oNodes.length; i++)
                this.appendChild(this.importNode(oNodes[i], true));
        } else if(oDoc.nodeType == 1)
            this.appendChild(this.importNode(oDoc, true));
    };
    
    //XMLDocument.loadXML();
    XMLDocument.prototype.loadXML = function(strXML){
        jpf.xmldb.setReadyState(this, 1);
        var sOldXML = this.xml || this.serialize();
        var oDoc    = (create("DOMParser")).parseFromString(strXML, "text/xml");
        jpf.xmldb.setReadyState(this, 2);
        this.$copyDOM(oDoc);
        jpf.xmldb.setReadyState(this, 3);
        jpf.xmldb.loadHandler(this);
        return sOldXML;
    };
    
    Node.prototype.getElementById = function(id){};
    
    Element.prototype.replaceNode     = function(xmlNode){
        if (!this.parentNode) return;

        this.parentNode.insertBefore(xmlNode, this);
        this.parentNode.removeChild(this);
    };
    
    //XMLDocument.load
    XMLDocument.prototype.$load = XMLDocument.prototype.load;
    XMLDocument.prototype.load  = function(sURI){
        //@todo
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        this.parseError = 0;
        jpf.xmldb.setReadyState(this, 1);
    
        try {
            if (this.async == false && ASYNCNOTSUPPORTED) {
                var tmp = new XMLHttpRequest();
                tmp.open("GET", sURI, false);
                tmp.overrideMimeType("text/xml");
                tmp.send(null);
                jpf.xmldb.setReadyState(this, 2);
                this.$copyDOM(tmp.responseXML);
                jpf.xmldb.setReadyState(this, 3);
            } else
                this.$load(sURI);
        }
        catch (objException) {
            this.parseError = -1;
        }
        finally {
            jpf.xmldb.loadHandler(this);
        }
    
        return oDoc;
    };
    
    // #ifdef __PARSER_XSLT
    
    //Element.transformNodeToObject
    Element.prototype.transformNodeToObject = function(xslDoc, oResult){
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        oDoc.transformNodeToObject(xslDoc, oResult);
    };
    
    //Document.transformNodeToObject
    XMLDocument.prototype.transformNodeToObject = function(xslDoc, oResult){
        var xsltProcessor = null;
        try {
            xsltProcessor = new XSLTProcessor();
            
            if (xsltProcessor.reset) {
                // new nsIXSLTProcessor is available
                var xslDoc = jpf.getXmlDom(xslDoc.xml || xslDoc.serialize());
                xsltProcessor.importStylesheet(xslDoc);
                var newFragment = xsltProcessor.transformToFragment(this, oResult);
                oResult.$copyDOM(newFragment);
            }
            else {
                // only nsIXSLTProcessorObsolete is available
                xsltProcessor.transformDocument(this, xslDoc, oResult, null);
            }
        }
        catch(e) {
            if (xslDoc && oResult)
                throw new Error(jpf.formatErrorString(1043, null, "XSLT Transformation", "Failed to transform document. \nInfo : " + e));
            else if (!xslDoc)
                throw new Error(jpf.formatErrorString(1044, null, "XSLT Transformation", "No Stylesheet Document was provided. \nInfo : " + e));
            else if (!oResult)
                throw new Error(jpf.formatErrorString(1045, null, "XSLT Transformation", "No Result Document was provided. \nInfo : " + e));
            else if (xsltProcessor == null)
                throw new Error(jpf.formatErrorString(1046, null, "XSLT Transformation", "Could not instantiate an XSLTProcessor object. \nInfo : " + e));
            else
                throw e;
        }
    };
    
    //Element.transformNode
    Element.prototype.transformNode = function(xslDoc){
        return jpf.getXmlDom(this.xml || this.serialize())
            .transformNode(xslDoc);
    };
    
    //Document.transformNode
    XMLDocument.prototype.transformNode = function(xslDoc){
        var xsltProcessor = new XSLTProcessor();
        var xslDoc        = jpf.getXmlDom(xslDoc.xml || xslDoc.serialize());
        xsltProcessor.importStylesheet(xslDoc);
        var newFragment   = xsltProcessor.transformToFragment(this,
            document.implementation.createDocument("", "", null));
    
        return newFragment.xml || newFragment.serialize()
        
        /*try{
            var serializer = new XMLSerializer();
            str = serializer.serializeToString(out);
        }
        catch(e){
            throw new Error("---- Javeline Error ----\nProcess : XSLT Transformation\nMessage : Failed to serialize result document. \nInfo : " + e);
        }
        
        return str;*/
    };
    
    // #endif
    
    
    //XMLDocument.setProperty
    XMLDocument.prototype.setProperty  = function(x,y){};

    jpf.getHttpReq = function(){
        if (jpf.teleport.availHTTP.length)
            return jpf.teleport.availHTTP.pop();
        return new XMLHttpRequest();
    };
    
    jpf.getXmlDom = function(message, noError){
            var xmlParser = create("DOMParser");
            xmlParser     = xmlParser.parseFromString(message, "text/xml");

            if (!noError)
                this.xmlParseError(xmlParser);
        
        return xmlParser;
    };
    
    jpf.xmlParseError = function(xml){
        if (xml.documentElement.tagName == "parsererror") {
            var str     = xml.documentElement.firstChild.nodeValue.split("\n");
            var linenr  = str[2].match(/\w+ (\d+)/)[1];
            var message = str[0].replace(/\w+ \w+ \w+: (.*)/, "$1");
            
            var srcText = xml.documentElement.lastChild.firstChild.nodeValue.split("\n")[0];
            
            throw new Error(jpf.formatErrorString(1050, null, 
                "XML Parse Error on line " +  linenr, message + 
                "\nSource Text : " + srcText.replace(/\t/gi, " ")));
        }
        
        return xml;
    };

    jpf.xmldb = new jpf.XmlDatabase();
}
//#endif
