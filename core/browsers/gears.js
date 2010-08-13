//#ifdef __SUPPORT_GEARS
/**
 * @private
 */
apf.initGears = function(){
    // summary:
    //		factory method to get a Google Gears plugin instance to
    //		expose in the browser runtime environment, if present
    var factory, results;
    //#ifdef __WITH_NAMESERVER
    var gearsObj = apf.nameserver.get("google", "gears");
    if(gearsObj)
        return gearsObj; // already defined elsewhere

    if (typeof GearsFactory != "undefined") { // Firefox
        factory = new GearsFactory();
    }
    else {
        if(apf.isIE){
            // IE
            try {
                factory = new ActiveXObject("Gears.Factory");
            }
            catch(e) {
                // ok to squelch; there's no gears factory.  move on.
            }
        }
        else if(navigator.mimeTypes["application/x-googlegears"]) {
            // Safari?
            factory = document.createElement("object");
            factory.setAttribute("type", "application/x-googlegears");
            factory.setAttribute("width", 0);
            factory.setAttribute("height", 0);
            factory.style.display = "none";
            document.documentElement.appendChild(factory);
        }
    }

    // still nothing?
    if (!factory)
        return null;

    return apf.nameserver.register("google", "gears", factory);
    //#endif
};
//#endif