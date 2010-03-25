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

// #ifdef __WITH_XFORMSSUBMISSIONELEMENT
/**
 * Element serving as a referencable entry to a way of submitting data to the server.
 * @attribute  {String}  action       the url to post the data to.
 * @attribute  {String}  method       the way of data serializing, and the transport method.
 *   Possible values:
 *   post            sent xml using the http post protocol. (application/xml)
 *   get             sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
 *   put             sent xml using the http put protocol. (application/xml)
 *   multipart-post  not implemented (multipart/related)
 *   form-data-post  not implemented (multipart/form-data)
 *   urlencoded-post sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
 * @attribute  {String}  set          the {@link term.datainstruction data instruction} on how to record the data from the data source from this model.
 * @see element.model
 * @see element.model.attribute.submission
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.XformsSubmissionElement = function(struct, tagName){
    this.$init(tagName || "Submission", apf.NODE_VISIBLE, struct);
    
    /* *********** PARSE ***********/
    //#ifdef __WITH_XFORMS
    //@todo move this to use apf.subnode
    function cSubmission(x){
        this.localName  = "submission";
        this.name       = x.getAttribute("id");
        this.parentNode = model; //@todo apf3.0 global var usage??

        var _self = this;
        this.getModel = function(){
            return _self;
        };

        //apf.makeClass(this);

        //this.implement(apf.XForms); /** @inherits apf.XForms */
        //#ifdef __WITH_AMLNODE
        this.implement(apf.AmlNode); /** @inherits apf.AmlNode */
        //#endif
    }
    // #endif
};

(function(){
    
}).call(apf.XformsSubmissionElement.prototype = new apf.XformsElement());

apf.xforms.setElement("html", apf.XformsSubmissionElement);
// #endif