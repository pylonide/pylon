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

//#ifdef __PARSER_XFORMS

/**
 * Object creating the XForms namespace for the aml parser.
 *
 * @constructor
 * @parser
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.xforms = new apf.AmlNamespace();
apf.setNamespace("http://www.w3.org/2002/xforms", apf.xforms);
//#endif

//#ifdef __WITH_XFORMS
xforms : {
    "label"       : 3, //any non-has-children node

    "action"      : 1, //stacked processing
    "dispatch"    : 1,
    "rebuild"     : 1,
    "recalculate" : 1,
    "revalidate"  : 1,
    "refresh"     : 1,
    "setfocus"    : 1,
    "load"        : 1,
    "setvalue"    : 1,
    "send"        : 1,
    "reset"       : 1,
    "message"     : 1,
    "insert"      : 1,
    "delete"      : 1,

    "filename"    : 2, //widget specific processing
    "mediatype"   : 2,
    "itemset"     : 2,
    "item"        : 2,
    "choices"     : 2,
    "copy"        : 2,
    "help"        : 2,
    "hint"        : 2
},
//#endif

//XForms
//#ifdef __WITH_XFORMS
else if (amlParent && (amlParent.hasFeature(apf.__XFORMS__)
  && (this.xforms[tagName] || amlParent.setCaption
  && this.xforms[tagName] > 2))) {
    switch (this.xforms[tagName]) {
        case 1: //Set Event
            if (x.getAttribute("ev:event")) {
                amlParent.dispatchEvent(x.getAttribute("ev:event"),
                    function(){
                        this.executeXFormStack(x);
                    });
            }
            else
                amlParent.executeXFormStack(x);
            break;
        case 2: //Parse in Element
            amlParent.parseXFormTag(x);
            break;
        case 3: //Label
            if (amlParent.setCaption) {
                amlParent.setCaption(x.firstChild.nodeValue); //or replace it or something...
                break;
            }

            //Create element using this function
            var oLabel = this.nsHandler[apf.ns.aml].call(this, x,
                amlParent.$ext.parentNode, amlParent.parentNode);

            //Set Dom stuff
            oLabel.parentNode = amlParent.parentNode;
            for (var i = 0; i < amlParent.parentNode.childNodes.length; i++) {
                if (amlParent.parentNode.childNodes[i] == amlParent) {
                    amlParent.parentNode.childNodes[i] = oLabel;
                }
                else if (amlParent.parentNode.childNodes[i] == oLabel) {
                    amlParent.parentNode.childNodes[i] = amlParent;
                    break;
                }
            }

            //Insert element to parentHtmlNode of amlParent and before the node
            oLabel.$ext.parentNode.insertBefore(oLabel.$ext, amlParent.$ext);

            //Use for
            oLabel.setProperty("for", amlParent);
            break;
    }
}
//#endif

//#ifdef __WITH_XFORMS
if (tagName == "select1" && x.getAttribute("appearance") == "minimal") {
    objName = "dropdown";
}
//#endif
//#ifdef __WITH_XFORMS
                var models = apf.nameserver.getAll("model");
                for (var i = 0; i < models.length; i++)
                    models[i].dispatchEvent("xforms-ready");
                //#endif