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
// #ifdef 0 && (__JRICHTEXTEDITOR || __INC_ALL)

/*
 Has to be loaded BEFORE RTETemplateViewer.js
 */
function RTEHelper(oRTEToBe, skin){
    this.skin = skin;
    //this.nodeType = jpf.GUI_NODE;
    //this.uniqueId = W.jpf.all.push(this) - 1;
    this.tagName = "RTEHelper";
    this.oExt    = oRTEToBe;
    
    /* ***************
     API
     ****************/
    this.initContent = function(html){
        this.oExt.innerHTML = html;
    }
    
    this.getHTMLElement = function(){
        return this.oExt;
    }
    
    this.setValue = function(value){
        this.oExt.innerHTML = value;
        this.fixContent();
    }
    
    this.getValue = function(){
        var str = this.oExt.innerHTML.replace(/<\/P/ig, "</div");
        str = str.replace(/<P/ig, "<div");
        
        return str;
    }
    
    this.fixContent = function(){
        //Images
        var found, img = (this.nodeValue ? this : this.oExt).getElementsByTagName("IMG");
        
        for (var i = 0; i < img.length; i++) {
            if (!img[i].src.match(/^https?:\/\/|upload_needed/)) {
                //POSSIBLE?: img[i].src = (self.this.mediaPath || top.this.mediaPath || "") + "upload_needed.gif";
                img[i].src = (this.mediaPath || "") + "upload_needed.gif";
                found = true;
            }
        }
        
        if (found) 
            alert("One or more images have to be uploaded before they can be used. They have been replaced.");
    }
    
    this.insertImage = function(path){
        if (document.activeElement != this.oExt) 
            this.oExt.focus();
        
        var r = document.selection.createRange();
        try {
            r.collapse();
            r.pasteHTML("<img src='" + path + "'>");
            r.collapse(true);
            r.select();
        } 
        catch (e) {
            ACTIVE.appendChild(document.createElement("IMG")).src = path;
        }
    }
    
    this.normalizeImage = function(){
        var r = document.selection.createRange();
        if (!r.length) 
            return;
        
        for (var i = 0; i < r.length; i++) {
            if (r.item(i).tagName.toLowerCase() == "img") {
                var img = r.item(i);
                
                img.style.height = "";
                img.style.width = "";
                img.removeAttribute("width");
                img.removeAttribute("height");
            }
        }
    }
    
    this.focus = function(){
        if (document.activeElement != this.oExt) 
            this.oExt.focus();
    }
    
    this.protectEnvironment = function(){
        for (i = 0; i < document.all.length; i++) 
            document.all(i).unselectable = "on";
        this.oExt.unselectable = "off";
    }
    
    this.selectAll = function(){
        var r = document.selection.createRange();
        r.moveToElementText(this.oExt);
        r.select();
    }
    
    /* ***************
     INTERACTION
     ****************/
    this.mHoverOver = function(dark){
        if (this.hideBorder) 
            this.style.border = "1px dotted " + (dark ? "black" : "gray");
        this.style.padding = "5px";
    }
    
    this.mHoverOut = function(){
        if (!this.hideBorder) 
            return;
        this.style.border = "0px solid gray";
        this.style.padding = "6px";
    }
    
    this.activate = function(fromRoot){
        if (!fromRoot && self.RTETemplateViewer) {
            RTETemplateViewer.deActivate();
            RTETemplateViewer.active = this;
        }
        
        this.oExt.onmouseover = this.oExt.onmouseout = null;
        this.mHoverOver.call(this.oExt, true);
        
        this.oExt.style.cursor    = "text";
        this.oExt.style.overflowX = "auto";
    }
    
    this.deActivate = function(fromRoot){
        if (!fromRoot && self.RTETemplateViewer) 
            RTETemplateViewer.active = null;
        
        this.oExt.onmouseover = this.mHoverOver;
        this.oExt.onmouseout  = this.mHoverOut;
        this.mHoverOut.call(this.oExt);
        
        this.oExt.style.cursor    = "hand";
        this.oExt.style.overflowX = "hidden";
    }
    
    this.keyHandler = function(key){
        if (this.onkeypress) 
            this.onkeypress();
        
        if (key == 13) {
            /*var r = document.selection.createRange();
            
             r.pasteHTML("<div></div>");
            
             r.move("character", -1);
            
             r.select();*/
            
            //setTimeout("Fix()");
            //return false;
        }
        
        /*if(this.oExt.innerHTML == ""){
        
         this.oExt.innerHTML = "<div>&nbsp;</div>";
        
         var r = document.selection.createRange();
        
         r.move("character", -1);
        
         r.select();
        
         }*/
        
    }
    
    /* ***************
     INIT
     ****************/
    this.Init = function(showBorder, argOverflow, font, wrap, align){
        this.showBorder = showBorder;
        
        //Apply Edit CSS
        with (this.oExt.style) {
            font = font || "8pt Verdana";
            if (wrap || wrap == null) 
                wordWrap = "break-word";
            textAlign = align || "left";
            overflowY = argOverflow || "auto";
            overflowX = "hidden";
        }
        
        //Set contentEditable
        if (top.IS_IE) 
            this.oExt.contentEditable = true;
        else 
            document.designMode = "on";
        
        //Interaction
        this.oExt.host = this;
        this.oExt.onclick = function(){
            this.host.activate();
        }
        this.oExt.onkeypress = function(){
            return this.host.keyHandler(event.keyCode);
        }
        this.oExt.ondrop = this.oExt.onpaste = function(){
            __TO = this.host;
            setTimeout("__TO.fixContent();__TO=null;")
        }
        if (self.RTETemplateViewer) 
            this.oExt.onkeydown = this.oExt.onkeyup = this.oExt.onmouseup = function(){
                RTETemplateViewer.redoButtons();
            }
            
        return this;
    }
}

/*function Fix(){

 var r = document.selection.createRange();

 r.moveEnd("character", 1);

 var q = r.duplicate();//o.createTextRange();

 q.moveToElementText(RTEToBe);

 //q.collapse();

 q.setEndPoint("EndToEnd", r);

 

 var l = q.text.length;

 

 str = RTEToBe.innerHTML.replace(/<\/P/ig, "</div");

 str = str.replace(/<P/ig, "<div");

 RTEToBe.innerHTML = str;

 

 status = l;

 

 var r = document.selection.createRange();

 r.moveToElementText(RTEToBe);

 r.collapse(true);

 r.move("character", l-1);

 r.select();

 }*/

// #endif
