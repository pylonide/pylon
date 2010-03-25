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

//#ifdef __WITH_HTML5

/**
 * Object creating the HTML5 namespace for the aml parser.
 *
 * @constructor
 * @parser
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.html5 = new apf.AmlNamespace();
apf.setNamespace("", apf.html5);
//#endif

//#ifdef __WITH_HTML5
/**
 * @define input
 * Remarks:
 * Ajax.org Platform supports the input types specified by the WHATWG html5 spec.
 * @attribute {String} type the type of input element.
 *   Possible values:
 *   email      provides a way to enter an email address.
 *   url        provides a way to enter a url.
 *   password   provides a way to enter a password.
 *   datetime   provides a way to pick a date and time.
 *   date       provides a way to pick a date.
 *   month      provides a way to pick a month.
 *   week       provides a way to pick a week.
 *   time       provides a way to pick a time.
 *   number     provides a way to pick a number.
 *   range      provides a way to select a point in a range.
 *   checkbox   provides a way to set a boolean value.
 *   radio      used in a set, it provides a way to select a single value from multiple options.
 *   file       provides a way to upload a file.
 *   submit     provides a way to submit data.
 *   image      provides a way to submit data displaying an image instead of a button.
 *   reset      provides a way to reset entered data.
 * @addnode elements
 */
/**
 * @private
 */
apf.HTML5INPUT = {
    "email"    : "textbox",
    "url"      : "textbox",
    "password" : "textbox",
    "datetime" : "spinner", //@todo
    "date"     : "calendar",
    "month"    : "spinner", //@todo
    "week"     : "spinner", //@todo
    "time"     : "spinner", //@todo
    "number"   : "spinner",
    "range"    : "slider",
    "checkbox" : "checkbox",
    "radio"    : "radiobutton",
    "file"     : "upload",
    "submit"   : "submit",
    "image"    : "submit",
    "reset"    : "button"
};

/* way to implement this:
var o = (new function(){
})
o.constructor.prototype = new apf.list();

*/

//#endif

/* #-ifdef __WITH_HTML5
if (tagName == "input") {
    objName = apf.HTML5INPUT[objName = x.getAttribute("type")]
        || objName || "textbox";
}
//#-endif*/
