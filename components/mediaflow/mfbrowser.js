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

// #ifdef __JMFBROWSER || __INC_ALL

/**
 * @constructor
 */
jpf.MFBrowser = function(pHtmlNode){
    jpf.register(this, "MFBrowser", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    //Options
    //this.focussable = true; // This object can get the focus
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    //#endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.loadURL = function(src){
        this.oInt.global.location.href = src;
    }
    
    this.getURL = function(){
        return this.oInt.global.location.href
    }
    
    this.back = function(){
        this.oInt.global.history.back();
    }
    
    this.forward = function(){
        this.oInt.global.history.forward();
    }
    
    this.reload = function(){
        this.oInt.global.location.reload()
    }
    
    this.print = function(){
        this.oInt.global.print();
    }
    
    this.runCode = function(str, no_error){
        if (no_error)
            try {
                this.oInt.contentWindow.eval(str);
            } catch(e) {}
        else
            this.oInt.contentWindow.eval(str);
    }
    
    // #ifdef __WITH_DATABINDING
    /* ***************
        DATABINDING
    ****************/
    this.mainBind = "Source";
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj)
            UndoObj.xmlNode = this.XMLRoot;
        
        //Refresh Properties
        this.loadURL(this.applyRuleSetOnNode("Source", this.XMLRoot) || "about:blank");
    }
    
    this.__load = function(node){
        this.loadURL(this.applyRuleSetOnNode("Source", node));
    }
    
    // #endif
    
    /* *********
        INIT
    **********/
    this.draw = function(){
        var x = this.jml; 
        this.oExt = jdwin.CreateWidget( "window" );
        this.oExt.InitWindow( "child", x.getAttribute("url"), "",
            parseInt(x.getAttribute("left")),
            parseInt(x.getAttribute("top")),
            parseInt(x.getAttribute("width")),
            parseInt(x.getAttribute("height")));
        this.oExt.width  = parseInt( x.getAttribute("width") );
        this.oExt.height = parseInt( x.getAttribute("height") );
        //this.oExt.top   = 40;//parseInt( x.getAttribute("top") );
        //this.oExt.left  = 0;//parseInt( x.getAttribute("left") );
        setTimeout('jpf.lookup(' + this.uniqueId + ').oExt.SetOrder("first");', 100);

        if (this.jml.getAttribute("size") == "true") {
            var myId = 'jpf.lookup(' + this.uniqueId + ')';
            LayoutServer.setRules(this.pHtmlNode, this.uniqueId + "h",
                myId + '.oExt.width = document.documentElement.offsetWidth - 4 - '
                 + this.jml.getAttribute("left"));
            LayoutServer.setRules(this.pHtmlNode, this.uniqueId + "v",
                myId + '.oExt.height = document.documentElement.offsetHeight - 4 - ' 
                 + this.jml.getAttribute("top"));
            //LayoutServer.activateRules(document.documentElement);
        }

        jdshell.Update();
        //this.oExt.Show();
        //this.oExt.SetOrder("first");
        
        this.oInt = logwin;
        
        //this.oInt = this.oExt.contentWindow.document.body;
        //this.oExt.host = this;
        //this.oInt.host = this;
    }
    
    this.__loadJML = function(x){};
}
// #endif
