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

apf.__DELAYEDRENDER__ = 1 << 11

// #ifdef __WITH_DELAYEDRENDER

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have delayed
 * rendering features. Any element that is (partially) hidden at startup has the
 * possibility to delay rendering it's childNodes by setting render="runtime" on
 * the element. These elements include window, tab, pages, form and container.
 * For instance a Tab page in a container is initally hidden and does not
 * need to be rendered. When the tab button is pressed to activate the page
 * the page is rendered and then displayed. This can dramatically decrease
 * the startup time of the application.
 * Example:
 * In this example the button isn't rendered until the advanced tab becomes active.
 * <code>
 *  <a:tab width="200" height="150">
 *      <a:page caption="General">
 *      ...
 *      </a:page>
 *      <a:page caption="Advanced" render="runtime">
 *         <a:button>OK</a:button>
 *      </a:page>
 *  </a:tab>
 * </code>
 *
 * @event beforerender  Fires before elements are rendered. Use this event to display a loader.
 *   cancelable: Prevents rendering of the childNodes
 * @event afterrender   Fires after elements are rendered. User this event to hide a loader.
 *
 * @attribute {String}  render           when the contents of this element is rendered.
 *   Possible values:
 *   init     elements are rendered during init of the application.
 *   runtime  elements are rendered when the user requests them.
 * @attribute {Boolean} use-render-delay whether there's a short delay between showing this element and rendering it's contents.
 *   Possible values:
 *   true   The elements are rendered immediately
 *   false  There is a delay between showing this element and the actual rendering,
 *          allowing the browsers' render engine to draw (for instance a loader).
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8.9
 */
apf.DelayedRender = function(){
    this.$regbase   = this.$regbase | apf.__DELAYEDRENDER__;
    this.$rendered  = false;
    
    /**
     * Renders the children of this element.
     *
     * @param {Boolean} [usedelay] whether a delay is added between calling 
     * this function and the actual rendering. This allows the browsers' 
     * render engine to draw (for instance a loader).
     */
    this.$render = function(usedelay){
        if (this.$rendered)
            return;

        if (this.dispatchEvent("beforerender") === false)
            return;

        if (this["render-delay"] || usedelay)
            $setTimeout("apf.lookup(" + this.$uniqueId + ").$renderparse()", 10);
        else
            this.$renderparse();
    };

    this.$renderparse = function(){
        if (this.$rendered)
            return;

        // Hide render pass from sight for inner callstack 
        // redrawing browsers like firefox
        this.$ext.style.visibility = "hidden";

        var domParser = this.ownerDocument.$domParser;
        domParser.parseFromXml(this.$aml, {
            amlNode       : this,
            doc           : this.ownerDocument,
            //nodelay       : true,
            delayedRender : true
        });
        domParser.$continueParsing(this);

        this.$rendered = true;

        this.dispatchEvent("afterrender");

        this.$ext.style.visibility = "";
    };
    
    var f;
    this.addEventListener("prop.visible", f = function(){
        if (arguments[0].value) {
            // #ifdef __WITH_DELAYEDRENDER
            this.$render();
            // #endif
            
            this.removeEventListener("prop.visible", f);
        }
    });
};

apf.GuiElement.propHandlers["render"] = function(value) {
    if (!this.hasFeature(apf.__DELAYEDRENDER__) && value == "runtime") {
        this.implement(apf.DelayedRender);
    
        if (this.localName != "page") {
            this.visible = false;
            this.$ext.style.display = "none";
        }
        
        if (typeof this["render-delay"] == "undefined")
            this.$setInheritedAttribute("render-delay");
    }
};

apf.config.$inheritProperties["render-delay"] = 1;

// #endif