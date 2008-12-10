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

var __DELAYEDRENDER__ = 1 << 11

// #ifdef __WITH_DELAYEDRENDER

/**
 * Baseclass adding delayed rendering features to this element. Any element
 * that is (partially) hidden at startup has the possibility to delay rendering
 * it's childNodes by setting render="runtime" on the element. These elements
 * include window, tab, pages, form and container.
 * For instance a Tab page in a container is initally hidden and does not
 * need to be rendered. When the tab button is pressed to activate the page
 * the page is rendered and then displayed. This can dramatically decrease
 * the startup time of the application.
 * Example:
 * In this example the button isn't rendered until the advanced tab becomes active.
 * <code>
 *  <j:tab>
 *      <j:page caption="General">
 *          ...
 *      </j:page>
 *      <j:page caption="Advanced" render="runtime">
 *          <j:button>OK</j:button>
 *      </j:page>
 *  </j:tab>
 * </code>
 *
 * @event beforerender  Fires before elements are rendered. Use this event to display a loader.
 *   cancellable: Prevents rendering of the childNodes
 * @event afterrender   Fires after elements are rendered. User this event to hide a loader.
 *
 * @attribute {String}  render  
 *   Possible values:
 *   init     elements are rendered during init of the application.
 *   runtime  elements are rendered when the user requests them.
 * @attribute {Boolean} use-render-delay
 *   Possible values:
 *   true   The elements are rendered immediately
 *   false  There is a delay between calling this function and the actual rendering, allowing the browsers' render engine to draw (for instance a loader).
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8.9
 */
jpf.DelayedRender = function(){
    this.$regbase   = this.$regbase | __DELAYEDRENDER__;
    this.isRendered = false;
    
    var withheld    = false;
    
    this.$checkDelay = function(x){
        if (x.getAttribute("render") == "runtime") {
            x.setAttribute("render-status", "withheld");
            if (!jpf.JmlParser.renderWithheld) 
                jpf.JmlParser.renderWithheld = [];
            jpf.JmlParser.renderWithheld.push(this);
            
            withheld = true;
            return true;
        }
        
        this.isRendered = true;
        return false;
    };
    
    /**
     * Renders the children of this element.
     *
     * @param {Boolean} [usedelay] wether a delay is added between calling this function and the actual rendering. This allows the browsers' render engine to draw (for instance a loader).
     */
    this.$render = function(usedelay){
        if (this.isRendered || this.$jml.getAttribute("render-status") != "withheld") 
            return;
        this.dispatchEvent("beforerender");
        
        if (jpf.isNull(this.usedelay)) 
            this.usedelay = jpf.xmldb.getInheritedAttribute(this.$jml,
                "use-render-delay") == "true";
        
        if (this.usedelay || usedelay) 
            setTimeout("jpf.lookup(" + this.uniqueId + ").$renderparse()", 10);
        else 
            this.$renderparse();
    };
    
    this.$renderparse = function(){
        if (this.isRendered) 
            return;

        jpf.JmlParser.parseMoreJml(this.$jml, this.oInt, this)
        
        this.$jml.setAttribute("render-status", "done");
        this.$jml.removeAttribute("render"); //Experimental
        this.isRendered = true;
        withheld = false;
        
        this.dispatchEvent("afterrender");
    };
};

// #endif
