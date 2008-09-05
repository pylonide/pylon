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

__DELAYEDRENDER__ = 1 << 11

// #ifdef __WITH_DELAYEDRENDER

/**
 * Baseclass adding Delayed rendering features to this Component.
 * A component can delay rendering of subcomponents when it offers the
 * ability to subrender JML components as children together with allowing
 * the components to become visible by some form of interaction. Examples
 * of these components are ModalWindow, Tab, Pages, Submitform, Container.
 * For instance a Tab page in a container is initally hidden and does not
 * need to be rendered. When the tab button is pressed to activate the page
 * the page is rendered and then displayed. This can dramatically decrease
 * the startup time of the application.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8.9
 */
jpf.DelayedRender = function(){
    this.__regbase = this.__regbase | __DELAYEDRENDER__;
    this.isRendered = false;
    
    var withheld = false;
    
    this.__checkDelay = function(x){
        if (x.getAttribute("render") == "runtime") {
            x.setAttribute("render-status", "withheld");
            if (!jpf.JMLParser.renderWithheld) 
                jpf.JMLParser.renderWithheld = [];
            jpf.JMLParser.renderWithheld.push(this);
            
            withheld = true;
            return true;
        }
        
        this.isRendered = true;
        return false;
    }
    
    /**
     *
     *
     * @param  {Boolean}  usedelay  optional  true  There is a delay between calling this function and the actual rendering, allowing the browsers render engine to draw (for instance a loader).
     *                                      false  The components are rendered immediately
     * @event onbeforerender  before components are rendered. Use this event to display a loader.
     * @event onafterrender  after components are rendered. User this event to hide a loader.
     * @attribute  {String}  render  init  default  components are rendered during init of the application.
     *                             runtime  components are rendered when the user requests them.
     * @attribute  {Boolean}  use-render-delay  true  The components are rendered immediately
     *                                        false  default  There is a delay between calling this function and the actual rendering, allowing the browsers render engine to draw (for instance a loader).
     */
    this.render = function(usedelay){
        if (this.isRendered || this.jml.getAttribute("render-status") != "withheld") 
            return;
        this.dispatchEvent("onbeforerender");
        
        if (jpf.isNull(this.usedelay)) 
            this.usedelay = jpf.xmldb.getInheritedAttribute(this.jml,
                "use-render-delay") == "true";
        
        if (this.usedelay || usedelay) 
            setTimeout("jpf.lookup(" + this.uniqueId + ").__render()", 10);
        else 
            this.__render();
    }
    
    this.__render = function(){
        if (this.isRendered) 
            return;
        
        jpf.JMLParser.parseFirstPass(this.jml);
        jpf.JMLParser.parseChildren(this.jml, this.oInt, this);
        
        // #ifdef __WITH_GRID
        jpf.layoutServer.activateGrid();
        // #endif
        jpf.layoutServer.activateRules();//document.body
        // #ifdef __DEBUG
        jpf.Profiler.end();
        jpf.console.time("[TIME] Total load time: " + jpf.Profiler.totalTime + "ms");
        jpf.Profiler.start(true);
        // #endif
        
        jpf.JMLParser.parseLastPass();
        //setTimeout("jpf.JMLParser.parseLastPass();");
        
        this.jml.setAttribute("render-status", "done");
        this.jml.removeAttribute("render"); //Experimental
        this.isRendered = true;
        withheld = false;
        
        this.dispatchEvent("onafterrender");
    }
}

// #endif
