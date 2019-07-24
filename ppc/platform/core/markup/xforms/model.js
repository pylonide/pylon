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

// #ifdef __WITH_XFORMSMODELELEMENT
/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.XformsModelElement = function(struct, tagName){
    this.$init(tagName || "model", apf.NODE_VISIBLE, struct);
    
    this.$bindValidation = [];
    this.$submissions    = {};
    
    //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
    /**
     * @private
     */
    this.getBindNode = function(bindId){
        //#ifdef __WITH_NAMESERVER
        var bindObj = apf.nameserver.get("bind", bindId);

        //#ifdef __DEBUG
        if (!bindObj) {
            throw new Error(apf.formatErrorString(0, this,
                "Binding Component", "Could not find bind element with name '"
                + x.getAttribute("bind") + "'"));
        }
        //#endif

        return bindObj;
        //#endif
    };
    
    /**
     * @private
    this.isValid = function(){
        //Loop throug bind nodes and process their rules.
        for (var bindNode, i = 0; i < this.$bindValidation.length; i++) {
            bindNode = this.$bindValidation[i];
            if (!bindNode.isValid()) {
                //Not valid
                return false;
            }
        }

        //Valid
        return true;
    };
    */
    //#endif
    
    //#ifdef __WITH_XFORMS
    /**
     * @private
     */
    this.getInstanceDocument = function(instanceName){
        return this.data;
    };

    var XEvents = {
        "xforms-submit": function(){
            this.submit();
            return false;
        },
        "xforms-reset": function(model){
            this.reset();
            return false;
        },
        "xforms-revalidate": function(model){
            this.revalidate();
        }
    };

    /**
     * @private
     */
    this.dispatchXFormsEvent = function(name, model, noEvent){
        if (XEvents[name] && XEvents[name].call(this, model) !== false && !noEvent)
            this.dispatchEvent.apply(this, name);
    };

    /**
     * @private
     */
    this.rebuild     = function(){};

    /**
     * @private
     */
    this.recalculate = function(){};

    /**
     * @private
     */
    this.revalidate  = function(){
        if (this.validate()) {
            this.dispatchEvent("xforms-valid"); //Is this OK, or should this be called on an element
        }
        else {
            this.dispatchEvent("xforms-invalid"); //Is this OK, or should this be called on an element
        }
    };

    /**
     * @private
     */
    this.refresh = function(){};
    //#endif
    
    /**
     * Resets data in this model to the last saved point.
     *
     */
    this.reset = function(){
        this.load(this.copy);

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-reset");

        //These should do something, that is now implied
        this.dispatchEvent("xforms-recalculate");
        this.dispatchEvent("xforms-revalidate");
        this.dispatchEvent("xforms-refresh");
        //#endif
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(x){
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct");
        //#endif
        
        //Parse this.$submissions
        var oSub, i, l;
        //#ifdef __WITH_XFORMS
        var subs = $xmlns(x, "submission", apf.ns.aml);
        for (i = 0, l = subs.length; i < l; i++) {
            if (!subs[i].getAttribute("id")) {
                if (!this.$defSubmission)
                    this.$defSubmission = subs[i];
                continue;
            }

            this.$submissions[subs[i].getAttribute("id")] = subs[i];
            oSub = apf.setReference(subs[i].getAttribute("id"), new cSubmission(subs[i]));
        }
        //#endif
        
        //#ifdef __WITH_XFORMS
        /*else {
            instanceNode = $xmlns(x, "instance", apf.ns.aml)[0];
            if (instanceNode && instanceNode.getAttribute("src"))
                this.$loadProcInstr = "" + instanceNode.getAttribute("src");
        } ^-- @todo apf3.0 syntax error in above code... */
        //#endif
        
        //Process bind nodes
        //#ifdef __WITH_XFORMS
        /*var binds = $xmlns(x, "bind", apf.ns.aml);
        for (i = 0, l = binds.length; i < l; i++) {
            this.$bindValidation.push([binds[i].getAttribute("nodeset"), binds[i]]);
            if (binds[i].getAttribute("id"))
                apf.nameserver.register("bind", binds[i].getAttribute("id"),
                    new cBind(binds[i]));
        } ^-- @todo apf3.0 no locally declared function 'cBind' found in current scope */
        //#endif
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct-done");
        //#endif
    });
    
    this.init = function(){
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-ready");
        //#endif
    };
    
    /**
     * Submit the data of the model to a data source.
     * @param {String} instruction  the id of the submission element or the data instruction on how to sent data to the data source.
     * @param {XMLElement} xmlNode  the data node to send to the server.
     * @param {String} type         how to serialize the data, and how to sent it.
     *   Possible values:
     *   post            sent xml using the http post protocol. (application/xml)
     *   get             sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
     *   put             sent xml using the http put protocol. (application/xml)
     *   multipart-post  not implemented (multipart/related)
     *   form-data-post  not implemented (multipart/form-data)
     *   urlencoded-post sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
     * @todo: PUT ??
     * @todo: build in instruction support
     */
     //@todo rewrite this for apf3.0
    this.submit = function(instruction, xmlNode, type, useComponents, xSelectSubTree){
        //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
        /*if (!this.isValid()) {
            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-submit-error");
            //#endif
            this.dispatchEvent("submiterror");
            return;
        }*/
        //#endif

        if (!instruction && !this.$defSubmission)
            return false;
        if (!xmlNode)
            xmlNode = this.data;
        if (!instruction && typeof this.$defSubmission == "string")
            instruction = this.$defSubmission;

        //#ifdef __DEBUG
        if (!xmlNode) {
            throw new Error(apf.formatErrorString(0, this, 
                "Submitting model",
                "Could not submit data, because no data was passed and the \
                 model does not have data loaded."));
        }
        //#endif

        //First check if instruction is a known submission
        var sub;
        if (this.$submissions[instruction] || !instruction && this.$defSubmission) {
            sub = this.$submissions[instruction] || this.$defSubmission;

            //<a:submission id="" value="[/]" bind="" action="url" method="post|get|urlencoded-post" set="" />
            useComponents  = false;
            type           = sub.getAttribute("method")
                .match(/^(?:urlencoded-post|get)$/) ? "native" : "xml";
            xSelectSubTree = sub.getAttribute("ref") || "/";//Bind support will come later
            instruction    = (sub.getAttribute("method")
                .match(/post/) ? "post " : "") + sub.getAttribute("action");
            var file       = sub.getAttribute("action");

            //set contenttype oRpc.contentType
        }
        else
            if (instruction) {
                if (!type)
                    type = this.submitType || "native";
                if (!useComponents)
                    useComponents = this.useComponents;
            }
            else {
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, "Submitting a Model", "Could not find a submission with id '" + id + "'"));
                //#endif
            }

        //#ifdef __DEBUG
        //if(type == "xml" || type == "post")
        //    throw new Error(apf.formatErrorString(0, this, "Submitting form", "This form has no model specified", this.$aml));
        //#endif

        if (this.dispatchEvent("beforesubmit", {
            instruction: instruction
        }) === false)
            return false;

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-submit");
        //#endif

        //this.showLoader();

        var model = this;
        function cbFunc(data, state, extra){
            if ((state == apf.TIMEOUT 
              || (_self.retryOnError && state == apf.ERROR))
              && extra.retries < apf.maxHttpRetries)
                return extra.tpModule.retry(extra.id);
            else
                if (state != apf.SUCCESS) {
                    model.dispatchEvent("submiterror", extra);

                    //#ifdef __WITH_XFORMS
                    /* For an error response nothing in the document is replaced, and submit processing concludes after dispatching xforms-submit-error.*/
                    model.dispatchEvent("xforms-submit-error");
                    //#endif
                }
                else {
                    model.dispatchEvent("submitsuccess", apf.extend({
                        data: data
                    }, extra));

                    //#ifdef __WITH_XFORMS
                    if (sub) {
                        /* For a success response including a body, when the value of the replace attribute on element submission is "all", the event xforms-submit-done is dispatched, and submit processing concludes with entire containing document being replaced with the returned body.*/
                        if (sub.getAttribute("replace") == "all") {
                            document.body.innerHTML = data; //Should just unload all elements and parse the new document.
                            model.dispatchEvent("xforms-submit-done");
                        }
                        /*
                            For a success response including a body, when the value of the replace attribute on element submission is "none", submit processing concludes after dispatching xforms-submit-done.
                            For a success response not including a body, submit processing concludes after dispatching xforms-submit-done.
                        */
                        else if (sub.getAttribute("replace") == "none") {
                            model.dispatchEvent("xforms-submit-done");
                        }
                        else {
                            /* For a success response including a body of an XML media type (as defined by the content type specifiers in [RFC 3023]), when the value of the replace attribute on element submission is "instance", the response is parsed as XML. An xforms-link-exception (4.5.2 The xforms-link-exception Event) occurs if the parse fails. If the parse succeeds, then all of the internal instance data of the instance indicated by the instance attribute setting is replaced with the result. Once the XML instance data has been replaced, the rebuild, recalculate, revalidate and refresh operations are performed on the model, without dispatching events to invoke those four operations. This sequence of operations affects the deferred update behavior by clearing the deferred update flags associated with the operations performed. Submit processing then concludes after dispatching xforms-submit-done.*/
                            if ((extra.http.getResponseHeader("Content-Type") || "").indexOf("xml") > -1) {
                                if (sub.getAttribute("replace") == "instance") {
                                    try {
                                        var xml = apf.xmldb.getXml(xml);
                                        this.load(xml);
                                        model.dispatchEvent("xforms-submit-done");
                                    }
                                    catch (e) {
                                        model.dispatchEvent("xforms-link-exception"); //Invalid XML sent
                                    }
                                }
                            }
                            else {
                                /* For a success response including a body of a non-XML media type (i.e. with a content type not matching any of the specifiers in [RFC 3023]), when the value of the replace attribute on element submission is "instance", nothing in the document is replaced and submit processing concludes after dispatching xforms-submit-error.*/
                                if (sub.getAttribute("replace") == "instance") {
                                    model.dispatchEvent("xforms-submit-error");
                                }
                                else {
                                    model.dispatchEvent("xforms-submit-done");
                                }
                            }
                        }
                    }
                //#endif
                }

            //this.hideLoader();
        }

        if (type == "array" || type == "json" || type == "xml") {
            var data = type == "xml"
                ? apf.getXmlString(xmlNode)
                : apf.convertXml(xmlNode, "json");

            apf.saveData(instruction, {
                xmlNode  : xmlNode,
                args     : [data], 
                callback : cbFunc
            });
        }
        else {
            var data = useComponents
                ? this.getCgiString()
                : apf.convertXml(apf.xmldb.getCleanCopy(xmlNode), 
                    type != "native" ? type : "cgivars");

            /*if (instruction.match(/^rpc\:/)) {
                var rpc  = rpc.split("."),
                    oRpc = self[rpc[0]];
                oRpc.callWithString(rpc[1], data, cbFunc);
                //Loop throught vars
                //Find components with the same name
                //Set arguments and call method
            }
            else {*/
                if (instruction.match(/^url/))
                    instruction += (instruction.match(/\?/) ? "&" : "?") + data;

                apf.saveData(instruction, xmlNode, null, cbFunc);
            //}
        }

        this.dispatchEvent("aftersubmit");
    };
};

(function(){
    
}).call(apf.XformsModelElement.prototype = new apf.XformsElement());

 /*#ifdef __WITH_XFORMS
var i, models = apf.nameserver.getAll("model");
for (i = 0; i < models.length; i++)
    models[i].dispatchEvent("xforms-model-destruct");
//#endif */

apf.xforms.setElement("html", apf.XformsModelElement);
// #endif