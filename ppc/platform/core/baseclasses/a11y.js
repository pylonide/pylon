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

apf.__ALIGNMENT__ = 1 << 29;

// #ifdef __WITH_A11Y

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have
 * accessibility features.
 *
 * @constructor
 * @baseclass
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @default_private
 */
apf.A11y = function(){
    this.setRole = function(oNode, sRole) {
        if (!oNode)
            throw new Error();
        if (!apf.A11y.ROLES[sRole])
            throw new Error();

        oNode.setAttribute("role", sRole);
    };

    this.setWidgetAttr = function(oNode, sAttr, mValue) {
        var rel = apf.A11y.ATTR_WIDGETS[sAttr];

        if (!rel)
            throw new Error("attr does not exist");
        if ((typeof rel == "boolean" && typeof mValue != "boolean")
          || (typeof rel == "number" && typeof mValue != "number")
          || ((typeof rel == "string" || apf.isArray(rel)) && typeof mValue != "string"))
            throw new Error("invalid type");

        oNode.setAttribute("aria-" + sAttr, mValue);
    };

    this.updateLiveRegion = function(oNode, sAttr, mValue) {
        var rel = apf.A11y.ATTR_LIVEREGION[sAttr];

        if (!rel)
            throw new Error("attr does not exist");
        if ((typeof rel == "boolean" && typeof mValue != "boolean")
          || (apf.isArray(rel) && typeof mValue != "string"))
            throw new Error("invalid type");

        if (oNode) {
            oNode.setAttribute("aria-" + sAttr, mValue);
        }
        else {
            // create a hidden element, cache it and set the attributes on that
            // element.
        }
    };

    this.setDragDropAttr = function(oNode, sAttr, mValue) {
        var rel = apf.A11y.ATTR_LIVEREGION[sAttr];

        if (!rel)
            throw new Error("attr does not exist");
        if ((typeof rel == "boolean" && typeof mValue != "boolean")
          || (apf.isArray(rel) && typeof mValue != "string"))
            throw new Error("invalid type");

        oNode.setAttribute("aria-" + sAttr, mValue);
    };

    this.setRelationAttr = function() {
        var args  = Array.prototype.slice.call(arguments),
            oNode = args.shift(),
            sAttr = args.shift(),
            sVal  = args.join(" "); // space delimited list of values (for example IDs)

        if (!apf.A11y.ATTR_RELATIONS[sAttr])
            throw new Error();

        oNode.setAttribute("aria-" + sAttr, sVal);
    };
};

apf.A11y.ROLES = {
    "alert":1, "alertdialog":1, "application":1, "article":1, "banner":1, "button":1,
    "checkbox":1, "columnheader":1, "combobox":1, "complementary":1, "contentinfo":1,
    "definition":1, "dialog":1, "directory":1, "grid":1, "gridcell":1, "group:":1,
    "heading":1, "img":1, "link":1, "list":1, "listbox":1, "listitem":1, "log":1,
    "main":1, "marquee":1, "math":1, "menu":1, "menubar":1, "menuitem":1,
    "menuitemcheckbox":1, "menuitemradio":1, "navigation": 1, "note":1, "option":1,
    "presentation":1, "progressbar":1, "radio":1, "radiogroup":1, "region":1,
    "row":1, "rowheader":1, "search":1, "seperator":1, "slider":1, "slinbutton":1,
    "status":1, "tab":1, "tablist":1, "tabpanel":1, "textbox":1, "timer":1,
    "toolbar":1, "tooltip":1, "tree":1, "treegrid":1, "treeitem":1
};

apf.A11y.ATTR_WIDGETS = {
    "autocomplete":true, "checked":true, "disabled":true, "expanded":true,
    "haspopup":true, "hidden":true, "invalid":["grammar", "false", "spelling", 
    "true"], "level":1, "multiline":true, "multiselectable":true, "pressed":
    ["true", "false", "pressed"], "readonly":true, "required":true,
    "selected":true, "sort":["ascending", "descending", "none", "other"],
    "valuemax":1, "valuemin":1, "valuenow":1, "valuetext":"string"
};

apf.A11y.ATTR_LIVEREGION = {
    "atomic":true, "busy":true, "live":["off", "polite", "assertive"],
    "relevant":["additions", "removals", "text", "all", "additions text"]
};

apf.A11y.ATTR_DRAGDROP = {
    "dropeffect":["copy", "move", "reference", "execute", "popup", "none"],
    "grabbed":true
};

apf.A11y.ATTR_RELATIONS = {
    "activedescendant":{}, "controls":{}, "describedby":{}, "flowto":{},
    "label":"1", "labelledby":{}, "owns":{}, "posinset":1, "setsize":1
};

// #endif