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

// #ifdef __WITH_LANG_SUPPORT

/**
 * Adds multilingual support for aml applications. Reads language symbols from
 * an xml file and distributes them among elements containing text elements
 * or images. When EditMode is turned on, it can subtract all text elements
 * necesary for translation and export them in an xml file. This file can be
 * sent to a translator to translate and then loaded back into the application.
 * Examples:
 * This examples shows a small language file. For example purpose it's loaded
 * inline in a model. Normally this file would be loaded from a web server.
 * There is a simple window and a couple of buttons that receive symbols from
 * the language file. Two buttons provide a means to switch the language of the
 * application, using the language symbols from the model.
 * <code>
 *   <a:model id="mdlLang">
 *       <groups>
 *           <!-- For French -->
 *           <french id="sub">
 *               <group id="main">
 *                   <key id="tab1">Textuele</key>
 *                   <key id="tab2">Arte</key>
 *                   <key id="title">Bonjour</key>
 *                   <key id="1">Adresse de courrier electronique *</key>
 *                   ...
 *               </group>
 *           </french>
 *
 *           <!-- For English -->
 *           <english id="sub">
 *               <group id="main">
 *                   <key id="tab1">Text</key>
 *                   <key id="tab2">Art</key>
 *                   <key id="title">Hello</key>
 *                   <key id="1">E-mail *</key>
 *                   ...
 *               </group>
 *           </english>
 *       </groups>
 *   </a:model>
 *
 *   <a:appsettings language="[mdlLang:english]" />
 *
 *   <a:window 
 *     title   = "$[sub/main/title]$" 
 *     width   = "400" 
 *     height  = "300" 
 *     visible = "true">
 *       <a:tab anchors="10 10 10 10">
 *           <a:page caption="$[sub/main/tab0]$">
 *               <a:label>$[sub/main/1]$</a:label>
 *               <a:textbox />
 *               <a:button>$[sub/main/2]$</a:button>
 *           </a:page>
 *           <a:page caption="$[sub/main/tab2]$">
 *               <a:picture src="$[sub/main/3]$" />
 *           </a:page>
 *       </a:tab>
 *   </a:window>
 *
 *   <a:button icon="us.gif"
 *     onclick="apf.language.$loadFrom(%[mdlLang::english]);">
 *        English
 *   </a:button>
 *   <a:button icon="fr.gif"
 *     onclick="apf.language.$loadFrom(%[mdlLang::french]);">
 *        French
 *   </a:button>
 * </code>
 *
 * @default_private
 * @todo get appsettings to understand language
 */
apf.language = {
    /**
     * Boolean specifying whether read strings are tried to match themselves if no key
     * was gives.
     */
    automatch : false,
    
    loaded    : false,
    
    /**
     * String setting the prefix to the set of language symbols. This is a tree path
     * using a dott (.) as a seperation symbol.
     */
    prefix    : "sub.main.",
    words     : {},
    texts     : {},
    elements  : {},
    bindings  : {},
    count     :  0,

    /**
     * Loads the symbol list from an xml node.
     * @param {XMLElement} xmlNode   the root of the symbol tree for the choosen language.
     * @param {String}     [prefix]  the prefix that overrides the default prefix.
     */
    load   : function(xmlNode, prefix){
        if (!xmlNode)
            return;
        
        if (typeof xmlNode == "string") {
            if (xmlNode.charAt(0) == "<")
                xmlNode = apf.getXmlDom(xmlNode).documentElement;
            else
                return this.loadFrom(xmlNode); //assuming data instruction
        }
        
        this.parseSection(xmlNode, prefix);
        this.redraw();
        this.loaded = true;
    },

    /**
     * Loads the symbol list using a {@link term.datainstruction data instruction}
     * @param {String} instruction  the {@link term.datainstruction data instruction} to load the symbol xml from.
     */
    loadFrom  : function(instruction) {
        apf.getData(instruction, {callback: function(xmlNode){
            if (!xmlNode) 
                return;

            //#ifdef __DEBUG
            if (!xmlNode) {
                throw new Error(apf.formatErrorString(0, null,
                    "Loading language",
                    "Could not find language symbols using processing \
                     instruction: '" + instruction + "'"));

                return;
            }
            //#endif

            apf.language.load(xmlNode);
        }});
    },

    parseSection: function(xmlNode, prefix){
        if (!prefix)
            prefix = xmlNode.getAttribute("id") || "";

        if (xmlNode.tagName == "key") {
            prefix += "/" + xmlNode.getAttribute("id");
            this.words[prefix] = xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "";
            
/* @todo apf3.0 MIKE I think this is something you did
         var val     = xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "",
                aliases = xmlNode.getAttribute("aliases");
            this.update(prefix + "/" + xmlNode.getAttribute("id"), val);
            if (aliases) {
                aliases = aliases.splitSafe(",");
                for (var i = 0, l = aliases.length; i < l; i++)
                    this.update(prefix + "/" + aliases[i], val);
            }
*/
            return;
        }

        //if(xmlNode.tagName == "lang") prefix = xmlNode.getAttribute("id");
        if (xmlNode.tagName == "group")
            prefix += (prefix ? "/" : "") + xmlNode.getAttribute("id");

        var nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++)
            if (nodes[i].nodeType == 1)
                this.parseSection(nodes[i], prefix);
    },
    
    redraw : function(){
        var id, fParsed, prop, props, els = this.elements, amlNode;
        for (id in els) {
            props = els[id], amlNode = apf.all[id];
            for (prop in props) {
                fParsed = props[prop];
                try {
                    if (fParsed.asyncs) { //if async
                        return fParsed.call(this, amlNode.xmlRoot, function(value){
                            amlNode.setProperty(prop, value, true);
                        }); 
                    }
                    else {
                        var value = fParsed.call(amlNode, amlNode.xmlRoot);
                    }
                }
                catch(e){
                    apf.console.warn("[275] Could not execute language update for " 
                        + prop + "\n\n" + e.message);
                    continue;
                    //return;
                }
                
                amlNode.setProperty(prop, value, true);
            }
        }
        
        var sel, amlNode, bds = this.bindings;
        for (id in bds) {
            amlNode = apf.all[id];
            if (amlNode.selection) {
                sel = amlNode.getSelection();
                amlNode.reload();
                amlNode.selectList(sel);
            }
            else amlNode.reload();
        }
    },
    
    getWord : function(symbol) {
        return this.words[symbol];
    },
    
    addProperty : function(amlNode, prop, func){
        (this.elements[amlNode.$uniqueId] || (this.elements[amlNode.$uniqueId] = {}))[prop] = func;
    },
    
    removeProperty : function(amlNode, prop){
        delete (this.elements[amlNode.$uniqueId] || false)[prop];
    },
    
    addBinding : function(amlNode){
        this.bindings[amlNode.$uniqueId] = true;
    },
    
    removeBinding : function(amlNode){
        delete this.bindings[amlNode.$uniqueId];
    }
};

// #endif
