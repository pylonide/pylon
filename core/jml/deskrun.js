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

// #ifdef __DESKRUN
DeskRun = {
    widgets : [],
    
    register: function(widget){
        widget.show = function(dontset){
            if (!this.posInited) {
                var pos = jpf.getAbsolutePosition(this.pHtmlNode);
                
                //lp.write("DT",this.name);
                //alert((pos[0] + parseInt(this.$jml.getAttribute("left"))) + ":" + (pos[1] + parseInt(this.$jml.getAttribute("top"))));
                //if(this.name!='sldMCamKey')
                this.oExt.moveTo(pos[0] + parseInt(this.$jml.getAttribute("left"))
                    + 2, pos[1] + parseInt(this.$jml.getAttribute("top")) + 2);
                //if(this.name!='sldMCamKey')
                this.oExt.show();
                this.posInited = true;
                if (!dontset) 
                    this.isVisible = true;
            }
            else {
                this.oExt.show();
                if (!dontset) 
                    this.isVisible = true;
            }
        }
        
        widget.hide = function(dontset){
            this.oExt.hide();
            if (!dontset) 
                this.isVisible = false;
        }
        
        this.widgets.push(widget);
    },
    
    hideAll: function(){
        window.external.shell.update();
        
        for (var i = 0; i < this.widgets.length; i++) {
            this.widgets[i].hide(true);
            window.external.shell.update();
        }
    },
    
    showAll: function(){
        window.external.shell.update();
        
        for (var i = 0; i < this.widgets.length; i++) {
            if (this.widgets[i].pHtmlNode.offsetHeight && this.widgets[i].isVisible) 
                this.widgets[i].show(true);
            shell.update();
        }
    },
    
    fixShow: function(){
        window.external.shell.update();
        
        for (var i = 0; i < this.widgets.length; i++) {
            //if(this.widgets[i].tagName == "MFSlider") alert(this.widgets[i].parentNode.tagName + ":" + this.widgets[i].parentNode.outerHTML + ":" + this.widgets[i].parentNode.offsetHeight);
            if (this.widgets[i].pHtmlNode.offsetHeight && this.widgets[i].isVisible) 
                this.widgets[i].show(true);
            else {
                this.widgets[i].hide(true);
            }
            window.external.shell.update();
        }
    }
};

/*
if (jpf.isDeskrun) {
    window.onerror = function(){
        window.external.show();
    }
}
*/

// #endif

/*
// #ifdef __DESKRUN
this.doOptimize = function(left, top, width, height, right, bottom, align, no_optimize){
    //if(!self.JDepWindow)
    return; //temporarily disabled
    
    var addParent = this.parentNode == document.body;
    if (addParent)
        alert(addParent);
    var left   = parseInt(this.oExt.style.left) || parseInt(this.$jml.getAttribute("left"))
     + (addParent ? parseInt(this.parentNode.style.left) : null);
    var top    = parseInt(this.oExt.style.top) || parseInt(this.$jml.getAttribute("top"))
     + (addParent ? parseInt(this.parentNode.style.top) : null);
    var width  = parseInt(this.oExt.style.width) || parseInt(this.$jml.getAttribute("width"));
    var height = parseInt(this.oExt.style.height) || parseInt(this.$jml.getAttribute("height"));
    
    if (!left) return;
    var div            = document.body.appendChild(document.createElement("div"));
    div.style.zIndex   = 10000;
    div.style.border   = "1px solid red";
    div.style.left     = left;
    div.style.top      = top;
    div.style.width    = width;
    div.style.height   = height;
    div.style.position = "absolute";
    
    //x.getAttribute("left"), x.getAttribute("top"), x.getAttribute("width"), 
    //x.getAttribute("height"), x.getAttribute("right"), x.getAttribute("bottom"), 
    //x.getAttribute("align"),
    
    JDepWindow.MouseOptimize(
        parseInt(left)   || 0,
        parseInt(top)    || 0,
        parseInt(width)  || 0,
        parseInt(height) || 0,
        no_optimize ? 1 : 0
    );
}
// #endif
*/
