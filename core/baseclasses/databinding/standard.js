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

// #ifdef __WITH_DATABINDING

/**
 * @constructor
 * @private
 * @baseclass
 */
apf.StandardBinding = function(){
    this.$init(true);
    
    //#ifdef __WITH_VALIDATION
    if (apf.Validation)
        this.implement(apf.Validation);
    //#endif
    
    if (!this.setQueryValue)
        this.implement(apf.DataBinding);

    if (!this.defaultValue) //@todo please use this in a sentence
        this.defaultValue = "";

    /**
     * Load XML into this element
     * @private
     */
    this.$load = function(xmlNode){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(xmlNode, this);
        //Set Properties

        //#ifdef __WITH_PROPERTY_BINDING
        var b, lrule, rule, bRules, bRule, value;
        if (b = this.$bindings) {
	        for (rule in b) {
	            lrule = rule.toLowerCase();
	            if (this.$supportedProperties.indexOf(lrule) > -1) {
	                bRule = (bRules = b[lrule]).length == 1 
                      ? bRules[0] 
                      : this.$getBindRule(lrule, xmlNode);

                    value = bRule.value || bRule.match;

	                //#ifdef __WITH_PROPERTY_BINDING
                    //Remove any bounds if relevant
                    this.$clearDynamicProperty(lrule);
            
                    if (value.indexOf("{") > -1 || value.indexOf("[") > -1)
                        this.$setDynamicProperty(lrule, value);
                    else 
                    //#endif
                    if (this.setProperty)
                        this.setProperty(lrule, value, true);
	            }
	        }
	    }
        /* #else

        this.setProperty("value", this.$applyBindRule(this.$mainBind, xmlNode) || this.defaultValue, null, true);

        #endif */

        //Think should be set in the event by the Validation Class
        if (this.errBox && this.isValid && this.isValid())
            this.clearError();
    };

    /**
     * Set xml based properties of this element
     * @private
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Clear this component if some ancestor has been detached
        if (action == "redo-remove") {
            var retreatToListenMode = false, model = this.getModel(true);
            if (model) {
                var xpath = model.getXpathByAmlNode(this);
                if (xpath) {
                    xmlNode = model.data.selectSingleNode(xpath);
                    if (xmlNode != this.xmlRoot)
                        retreatToListenMode = true;
                }
            }
            
            if (retreatToListenMode || this.xmlRoot == xmlNode) {
                /*#ifdef __DEBUG
                //RLD: Disabled because sometimes indeed components do not 
                //have a model when their xmlRoot is removed.
                if (!model) {
                    throw new Error(apf.formatErrorString(0, this, 
                        "Setting change notifier on component", 
                        "Component without a model is listening for changes", 
                        this.$aml));
                }
                #endif*/

                //Set Component in listening state untill data becomes available again.
                return model.$waitForXml(this);
            }
        }

        //Action Tracker Support
        if (UndoObj && !UndoObj.xmlNode)
            UndoObj.xmlNode = this.xmlRoot;

        //Set Properties

        //#ifdef __WITH_PROPERTY_BINDING
        var b, lrule, rule, bRules, bRule, value;
        if (b = this.$bindings) {
	        for (rule in b) {
	            lrule = rule.toLowerCase();
	            if (this.$supportedProperties.indexOf(lrule) > -1) {
                    bRule = (bRules = b[lrule]).length == 1 
                      ? bRules[0] 
                      : this.$getBindRule(lrule, xmlNode);

                    value = bRule.value || bRule.match;

	                //#ifdef __WITH_PROPERTY_BINDING
                    //Remove any bounds if relevant
                    this.$clearDynamicProperty(lrule);
            
                    if (value.indexOf("{") > -1 || value.indexOf("[") > -1)
                        this.$setDynamicProperty(lrule, value);
                    else 
                    //#endif
                    if (this.setProperty)
                        this.setProperty(lrule, value);
	            }
	        }
	    }
        /* #else

        var value = this.$applyBindRule(this.$mainBind, this.xmlRoot) || this.defaultValue;
        if(this.selected != value) this.setProperty("value", value, true);

        #endif */

        //@todo Think should be set in the event by the Validation Class
        if (this.errBox && this.isValid && this.isValid())
            this.clearError();
        
        this.dispatchEvent("xmlupdate", {
            action : action,
            xmlNode: xmlNode,
            UndoObj: UndoObj
        });
    };

    /**
     * Clears the data loaded into this element resetting it's value.
     */
    //@todo apf3.0 this is wrong
    this.addEventListener("$clear", function(nomsg, do_event){
        if (this.$propHandlers && this.$propHandlers["value"]) {
            this.value = -99999; //force resetting
            this.$propHandlers["value"].call(this, "");
        }
    });
};
apf.StandardBinding.prototype = new apf.DataBinding();

apf.Init.run("standardbinding");
// #endif