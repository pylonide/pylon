// #ifdef __SUPPORT_O3
/**
 * @private
 */
ppc.runO3 = function(){
    document = new DOMParser().parseFromString("<html><body /></html>", "text/xml");
    document.body = document.documentElement.firstChild;

    ppc.runXpath();

    var ASYNCNOTSUPPORTED = false;
    
    Array.prototype.item = function(i){return this[i];};
    Array.prototype.expr = "";
    
    ppc.getHttpReq = function(){
        var xhr = require("./node/XMLHttpRequest").XMLHttpRequest;
        return new xhr();
    };

    ppc.getSocket = function() {
        var net = require("net");
        return new net.Stream(); // 'new' not required, doesn't do anything
    };
    
    ppc.getXmlDom = function(message, noError){
    	xmlParser     = new DOMParser().parseFromString(message, "text/xml");
        
        if (!noError)
            this.xmlParseError(xmlParser);
        
        return xmlParser;
    };
    
    ppc.xmlParseError = function(xml){
        if (!xml){
            ppc.console.error("no xml document was passed to the xml parse error function");
            return;
        }
        if (xml.documentElement.tagName == "parsererror") {
            var str     = xml.documentElement.firstChild.nodeValue.split("\n");
            var linenr  = str[2].match(/\w+ (\d+)/)[1];
            var message = str[0].replace(/\w+ \w+ \w+: (.*)/, "$1");
            
            var srcText = xml.documentElement.lastChild.firstChild.nodeValue.split("\n")[0];
            
            throw new Error(ppc.formatErrorString(1050, null, 
                "XML Parse Error on line " +  linenr, message + 
                "\nSource Text : " + srcText.replace(/\t/gi, " ")));
        }
        
        return xml;
    };
}
//#endif
