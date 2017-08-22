// #ifdef __SUPPORT_O3
/**
 * @private
 */
apf.runO3 = function(){
    document = new DOMParser().parseFromString("<html><body /></html>", "text/xml");
    document.body = document.documentElement.firstChild;

    apf.runXpath();

    var ASYNCNOTSUPPORTED = false;
    
    Array.prototype.item = function(i){return this[i];};
    Array.prototype.expr = "";
    
    apf.getHttpReq = function(){
        var xhr = require("./node/XMLHttpRequest").XMLHttpRequest;
        return new xhr();
    };

    apf.getSocket = function() {
        var net = require("net");
        return new net.Stream(); // 'new' not required, doesn't do anything
    };
    
    apf.getXmlDom = function(message, noError){
    	xmlParser     = new DOMParser().parseFromString(message, "text/xml");
        
        if (!noError)
            this.xmlParseError(xmlParser);
        
        return xmlParser;
    };
    
    apf.xmlParseError = function(xml){
        if (!xml){
            apf.console.error("no xml document was passed to the xml parse error function");
            return;
        }
        if (xml.documentElement.tagName == "parsererror") {
            var str     = xml.documentElement.firstChild.nodeValue.split("\n");
            var linenr  = str[2].match(/\w+ (\d+)/)[1];
            var message = str[0].replace(/\w+ \w+ \w+: (.*)/, "$1");
            
            var srcText = xml.documentElement.lastChild.firstChild.nodeValue.split("\n")[0];
            
            throw new Error(apf.formatErrorString(1050, null, 
                "XML Parse Error on line " +  linenr, message + 
                "\nSource Text : " + srcText.replace(/\t/gi, " ")));
        }
        
        return xml;
    };
}
//#endif
