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

var __XFORMS__ = 1 << 17;

//#ifdef __WITH_XFORMS

/**
 * All elements inheriting from this {@link term.baseclass} have xforms support.
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
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9.8
 */
jpf.XForms = function(){
    this.$regbase = this.$regbase|__XFORMS__;
    
    function getModel(name){
        if (name){
            var model = jpf.nameserver.get("model", name);
            
            //#ifdef __DEBUG
            if (!model) {
                throw new Error(jpf.formatErrorString(0, this, 
                    "Resetting form", 
                    "Could not find model '" + name + "'"));
            }
            //#endif
            
            return model;
        }
        else
            return this.getModel();
    }
    
    var XEvents = {
        "xforms-submit" : function(model){
            getModel.call(this, name).submit(this.tagName == "submission"
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
            jpf.window.moveNext(null, this);
            return false;
        },
        "xforms-previous" : function(){
            jpf.window.moveNext(true, this);
            return false;
        },
        "xforms-focus" : function(){
            this.focus();
            return false;
        }
    };
    
    /*Notification only events
    XEvents["DOMActivate"] = 
    XEvents["xforms-value-changed"] = 
    XEvents["xforms-select"] = 
    XEvents["xforms-deselect"] = 
    XEvents["xforms-scroll-first"] = 
    XEvents["xforms-scroll-last"] = 
    XEvents["xforms-insert"] = 
    XEvents["xforms-delete"] = 
    XEvents["xforms-valid"] = 
    XEvents["xforms-invalid"] = 
    XEvents["DOMFocusIn"] = 
    XEvents["DOMFocusOut"] = 
    XEvents["xforms-readonly"] = 
    XEvents["xforms-readwrite"] = 
    XEvents["xforms-required"] = 
    XEvents["xforms-optional"] = 
    XEvents["xforms-enabled"] = 
    XEvents["xforms-disabled"] = 
    XEvents["xforms-in-range"] = XEvents["xforms-readonly"] = 
    XEvents["xforms-out-of-range"] = 
    XEvents["xforms-submit-done"] = 
    XEvents["xforms-submit-error"] = function(){}
    */
    
    /**
     * @private
     */
    this.dispatchXFormsEvent = function(name, model, noEvent){
        if (XEvents[name] && XEvents[name].call(this, model) !== false && !noEvent) 
            this.dispatchEvent.apply(this, name);
    };
    
    function findXFormsData(xmlNode){
        if (xmlNode.getAttribute("bind")) {
            return this.getModel().getBindNode(xmlNode.getAttribute("bind"))
                .selectNodes();
        } else if(xmlNode.getAttribute("ref")) {
            return this.getModel().data.selectSingleNode(xmlNode.getAttribute("ref"));
        }
    }
    
    /**
     * @private
     */
    this.executeXFormStack = function(actionNode){
        switch (actionNode[TAGNAME]) {
            case "action":
                var nodes = actionNode.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    this.executeXFormStack(nodes[i]);
                }
                break;
            case "dispatch":
                var el = self[actionNode.getAttribute("target")];
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
                var el = self[actionNode.getAttribute("control")];
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
                jpf.xmldb.setNodeValue(dataNode, value, true);
                break;
            case "setindex":
                break;
            case "send":
                var el = self[actionNode.getAttribute("submission")];
                el.dispatchXFormsEvent("xforms-submit");
                break;
            case "message":
                var message = getXmlValue(actionNode, "text()");
            
                switch (actionNode.getAttribute("level")) {
                    case "ephemeral":
                        status = message;
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
        switch (xmlNode[jpf.TAGNAME]) {
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
                /*	<upload ref="mail/attachment" mediatype="image/*">
                      <label>Select image:</label>
                      <filename ref="@filename" />
                      <mediatype ref="@mediatype" />
                    </upload>
                */
        }
    };
    
    this.$addJmlLoader(function(x){
        this.addEventListener(this.hasFeature(__MULTISELECT__) ? "click" : "choose",
            function(){
                var model = this.getModel(); 
                if (model)
                    model.dispatchEvent("DOMActivate");
            });
        this.addEventListener(this.hasFeature(__MULTISELECT__) ? "afterchange" : "afterselect",
            function(){
                var model = this.getModel(); 
                if (model)
                    model.dispatchEvent("xforms-value-changed")
            });
        
        if (this.hasFeature(__MULTISELECT__)) {
            this.addEventListener("afterselect", function(e){
                this.dispatchEvent(e.list.contains(e.xmlNode)
                    ? "xforms-select"
                    : "xforms-deselect");
            });
        }
    });
};
//#endif
