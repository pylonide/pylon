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

apf.__XFORMS__ = 1 << 17;

//#ifdef __WITH_XFORMS

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have xforms support.
 *
 * @constructor
 * @todo possible ideas on how to extend xpath
 *  Firefox: http://mcc.id.au/xpathjs/
 *  IE:
 *  
 *  XSLT extension
 *  IE: http://msdn.microsoft.com/msdnmag/issues/02/03/xml/
 *
 * @experimental
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9.8
 */
apf.XForms = function(){
    this.$init(true);
};

apf.XForms.prototype = new (function() {
    this.$regbase = this.$regbase | apf.__XFORMS__;
    
    function getModel(name){
        if (name){
            //#ifdef __WITH_NAMESERVER
            var model = apf.nameserver.get("model", name);
            
            //#ifdef __DEBUG
            if (!model) {
                throw new Error(apf.formatErrorString(0, this, 
                    "Resetting form", 
                    "Could not find model '" + name + "'"));
            }
            //#endif
            
            return model;
            //#endif
        }
        else
            return this.getModel();
    }
    
    this.XEvents = {
        "xforms-submit" : function(name){
            getModel.call(this, name).submit(this.localName == "submission"
                ? this.name
                : null);
            return false;
        },
        "xforms-reset" : function(model){
            getModel.call(this, model).reset();
            return false;
        },
        "xforms-revalidate" : function(model){
            getModel.call(this, model).isValid(); 
        },
        "xforms-next" : function(){
            apf.window.moveNext(null, this);
            return false;
        },
        "xforms-previous" : function(){
            apf.window.moveNext(true, this);
            return false;
        },
        "xforms-focus" : function(){
            this.focus();
            return false;
        }
    };
    
    /*Notification only events
    this.XEvents["DOMActivate"] =
    this.XEvents["xforms-value-changed"] =
    this.XEvents["xforms-select"] =
    this.XEvents["xforms-deselect"] =
    this.XEvents["xforms-scroll-first"] =
    this.XEvents["xforms-scroll-last"] =
    this.XEvents["xforms-insert"] =
    this.XEvents["xforms-delete"] =
    this.XEvents["xforms-valid"] =
    this.XEvents["xforms-invalid"] =
    this.XEvents["DOMFocusIn"] =
    this.XEvents["DOMFocusOut"] =
    this.XEvents["xforms-readonly"] =
    this.XEvents["xforms-readwrite"] =
    this.XEvents["xforms-required"] =
    this.XEvents["xforms-optional"] =
    this.XEvents["xforms-enabled"] =
    this.XEvents["xforms-disabled"] =
    this.XEvents["xforms-in-range"] = this.XEvents["xforms-readonly"] =
    this.XEvents["xforms-out-of-range"] =
    this.XEvents["xforms-submit-done"] =
    this.XEvents["xforms-submit-error"] = function(){}
    */
    
    /**
     * @private
     */
    this.dispatchXFormsEvent = function(name, model, noEvent){
        if (this.XEvents[name] && this.XEvents[name].call(this, model) !== false && !noEvent)
            this.dispatchEvent.apply(this, name);
    };
    
    function findXFormsData(xmlNode){
        if (xmlNode.getAttribute("bind")) {
            return this.getModel().getBindNode(xmlNode.getAttribute("bind"))
                .selectNodes();
        }
        else if(xmlNode.getAttribute("ref")) {
            return this.getModel().data.selectSingleNode(xmlNode.getAttribute("ref"));
        }
    }
    
    /**
     * @private
     */
    this.executeXFormStack = function(actionNode){
        var el;
        switch (actionNode[TAGNAME]) {
            case "action":
                var nodes = actionNode.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    this.executeXFormStack(nodes[i]);
                }
                break;
            case "dispatch":
                el = self[actionNode.getAttribute("target")];
                el.dispatchXFormsEvent(actionNode.getAttribute("name")); //some element
                break;
            case "reset":
                this.dispatchXFormsEvent("xforms-reset",
                    actionNode.getAttribute("model"));
                break;
            case "rebuild":
            case "recalculate":
            case "revalidate":
            case "refresh":
            case "reset":
                this.dispatchXFormsEvent("xforms-" + actionNode[TAGNAME],
                    actionNode.getAttribute("model"), true);
                break;
            case "setfocus":
                el = self[actionNode.getAttribute("control")];
                el.dispatchXFormsEvent("xforms-focus");
                break;
            case "load": //Is this like a link in HTML, or am I mistaking?
                var link = actionNode.getAttribute("resource"); //url assumed for now
                if(actionNode.getAttribute("show") == "new")
                    window.open(link);
                else
                    location.href = link;
                break;
            case "setvalue":
                var value = actionNode.getAttribute("value")
                    ? this.getModel().data.selectSingleNode(actionNode.getAttribute("value"))
                    : getXmlValue(actionNode, "text()");
            
                var dataNode = findXFormsData.call(this, actionNode);
                apf.setNodeValue(dataNode, value, true);
                break;
            case "setindex":
                break;
            case "send":
                el = self[actionNode.getAttribute("submission")];
                el.dispatchXFormsEvent("xforms-submit");
                break;
            case "message":
                var message = getXmlValue(actionNode, "text()");
            
                switch (actionNode.getAttribute("level")) {
                    case "ephemeral":
                        self.status = message;
                        break;
                    case "modeless":
                        document.title = message;
                        break;
                    case "modal":
                        alert(message);
                        break;
                }
                break;
            case "insert":
                //actionNode.getAttribute("at");
                //actionNode.getAttribute("position") == "before" ? ;
                this.dispatchXFormsEvent("xforms-insert");
                break;
            case "delete":
                this.dispatchXFormsEvent("xforms-delete");
                break;
        }
    };
    
    /**
     * @private
     */
    this.parseXFormTag = function(xmlNode){
        switch (xmlNode[apf.TAGNAME]) {
            case "filename":
            case "mediatype":
            case "itemset":
            case "item":
            case "choices":
            case "copy":
            case "help":
            case "hint":
            default:
                break;
                /*  <upload value="[mail/attachment]" mediatype="image/*">
                      <label>Select image:</label>
                      <filename value="[@filename]" />
                      <mediatype value="[@mediatype]" />
                    </upload>
                */
        }
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.addEventListener(this.hasFeature(apf.__MULTISELECT__) ? "click" : "choose",
            function(){
                var model = this.getModel(); 
                if (model)
                    model.dispatchEvent("DOMActivate");
            });
        this.addEventListener(this.hasFeature(apf.__MULTISELECT__) ? "afterchange" : "afterselect",
            function(){
                var model = this.getModel(); 
                if (model)
                    model.dispatchEvent("xforms-value-changed")
            });
        
        if (this.hasFeature(apf.__MULTISELECT__)) {
            this.addEventListener("afterselect", function(e){
                this.dispatchEvent(e.selection.contains(e.xmlNode)
                    ? "xforms-select"
                    : "xforms-deselect");
            });
        }
    });
})();

//#endif
