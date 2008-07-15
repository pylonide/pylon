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

// #ifdef __JCOLORPICKER || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component giving the user a visual choice of several colors presented in a grid.
 *
 * @classDescription		This class creates a new colorpicker
 * @return {Colorpicker} Returns a new colorpicker
 * @type {Colorpicker}
 * @constructor
 * @addnode components:colorpicker
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.colorpicker = function(pHtmlNode){
    jpf.register(this, "colorpicker", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /** 
     * @inherits jpf.JmlNode
     * @inherits jpf.Presentation
     */
    this.inherit(jpf.Presentation, jpf.JmlNode);
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    //Options
    this.focussable = true; // This object can get the focus
    
    // PUBLIC METHODS
    this.setValue = function(value, type){
        //this.value = value;
        if (!type) type = "RGBHEX";
        switch (type) {
            case "HSL":
                this.fill(value[0], value[1], value[2]);
                break;
            case "RGB":
                var a = this.RGBtoHLS(value[0], value[1], value[2]);
                this.fill(a[0], a[1], a[2]);
                break;
            case "RGBHEX":
                var RGB = arguments[0].match(/(..)(..)(..)/);
                var a = this.RGBtoHLS(Math.hexToDec(RGB[0]), Math.hexToDec(RGB[1]), Math.hexToDec(RGB[2]));
                this.fill(a[0], a[1], a[2]);
                break;
        }
    }
    
    this.getValue = function(type){
        return this.HSLRangeToRGB(this.cH, this.cS, this.cL);
    }
    
    // PRIVATE METHODS
    this.cL       = 120;
    this.cS       = 239;
    this.cH       = 0;
    this.cHex     = "#FF0000";
    this.HSLRange = 240;
    
    this.HSLRangeToRGB = function(H, S, L){
        return this.HSLtoRGB (H / (this.HSLRange-1), S / this.HSLRange,
            Math.min(L / this.HSLRange, 1))
    }
    
    this.RGBtoHLS = function(R,G,B){
        var RGBMAX = 255;
        var HLSMAX = this.HSLRange;
        var UNDEF  = (HLSMAX*2/3);
    
       /* calculate lightness */ 
       cMax = Math.max(Math.max(R,G), B);
       cMin = Math.min(Math.min(R,G), B);
       L    = (((cMax + cMin) * HLSMAX) + RGBMAX) / (2 * RGBMAX);
    
       if(cMax == cMin) {           /* r=g=b --> achromatic case */ 
          S = 0;                     /* saturation */ 
          H = UNDEF;             		/* hue */ 
       } else{                        /* chromatic case */ 
          /* saturation */ 
          if (L <= (HLSMAX/2))
              S = (((cMax - cMin) * HLSMAX) + ((cMax + cMin) / 2)) / (cMax + cMin);
          else
              S = (((cMax - cMin) * HLSMAX) + ((2 * RGBMAX - cMax - cMin) / 2))
                  / (2 * RGBMAX - cMax - cMin);
    
          /* hue */ 
          Rdelta = (((cMax - R) * (HLSMAX / 6)) + ((cMax - cMin) / 2)) / (cMax - cMin);
          Gdelta = (((cMax - G) * (HLSMAX / 6)) + ((cMax - cMin) / 2)) / (cMax - cMin);
          Bdelta = (((cMax - B) * (HLSMAX / 6)) + ((cMax - cMin) / 2)) / (cMax - cMin);
    
          if (R == cMax)
              H = Bdelta - Gdelta;
          else if (G == cMax)
              H = (HLSMAX / 3) + Rdelta - Bdelta;
          else
              H = ((2 * HLSMAX) / 3) + Gdelta - Rdelta;
    
          if (H < 0)
              H += HLSMAX;
          if (H > HLSMAX)
              H -= HLSMAX;
       }

       return [H, S, L];
    }
    
    this.HueToColorValue = function(Hue){
        var V;
      
        if (Hue < 0)
            Hue = Hue + 1
        else if (Hue > 1)
            Hue = Hue - 1;
        
        if (6 * Hue < 1)
            V = M1 + (M2 - M1) * Hue * 6
        else if (2 * Hue < 1)
            V = M2
        else if (3 * Hue < 2)
            V = M1 + (M2 - M1) * (2 / 3 - Hue) * 6
        else
            V = M1;

        return Math.max(Math.floor(255 * V), 0);
    }
    
    this.HSLtoRGB = function(H, S, L){
        var R,  G,  B;
        
        if (S == 0)
            G = B = R = Math.round (255 * L);
        else{
            M2 = (L <= 0.5) ? (L * (1 + S)) : (L + S - L * S);
        
            M1 = 2 * L - M2;
            R = this.HueToColorValue(H + 1 / 3);
            G = this.HueToColorValue(H);
            B = this.HueToColorValue(H - 1 / 3);
        }

        return Math.decToHex(R) + "" + Math.decToHex(G) + "" + Math.decToHex(B);
    }
    
    this.fill = function(H, S, L){
        var Hex    = this.HSLRangeToRGB(H,S,L);
        this.value = Hex;

        //RGB
        var RGB            = Hex.match(/(..)(..)(..)/);
        this.tbRed.value   = Math.hexToDec(RGB[1]);
        this.tbGreen.value = Math.hexToDec(RGB[2]);
        this.tbBlue.value  = Math.hexToDec(RGB[3]);
        
        //HSL
        this.tbHue.value       = Math.round(H);
        this.tbSatern.value    = Math.round(S);
        this.tbLuminance.value = Math.round(L);
        
        //HexRGB
        this.tbHexColor.value  = Hex;
        
        //Shower
        this.shower.style.backgroundColor = Hex;
    
        //Luminance
        var HSL120                        = this.HSLRangeToRGB(H, S, 120);
        this.bar1.style.backgroundColor   = HSL120;
        this.bgBar1.style.backgroundColor = this.HSLRangeToRGB(H, S, 240);
        this.bar2.style.backgroundColor   = this.HSLRangeToRGB(H, S, 0);
        this.bgBar2.style.backgroundColor = HSL120;
    }		
    
    this.movePointer = function(){
        var cs = __ColorPicker;
        
        var ty = cs.pHolder.ty;
        if ((event.clientY - ty >= 0) && (event.clientY - ty <= cs.pHolder.offsetHeight - cs.pointer.offsetHeight + 22))
            cs.pointer.style.top = event.clientY - ty;
        if (event.clientY - ty < 21)
            cs.pointer.style.top = 21;
        if (event.clientY - ty > cs.pHolder.offsetHeight - cs.pointer.offsetHeight + 19)
            cs.pointer.style.top = cs.pHolder.offsetHeight - cs.pointer.offsetHeight + 19;

        var y = cs.pointer.offsetTop - 22;
        cs.cL = (255-y) / 2.56 * 2.4;
        cs.fill(cs.cH, cs.cS, cs.cL);
        
        window.event.returnValue  = false;
        window.event.cancelBubble = true;
    }
    
    this.setLogic = function(){
        this.pHolder.host         = this;
        this.pHolder.style.zIndex = 10;
        this.pHolder.onmousedown  = function(){
            __ColorPicker = this.host;
            
            this.ty = jpf.compat.getAbsolutePosition(this)[1] - 20;
            
            this.host.movePointer();
            document.onmousemove = this.host.movePointer
            document.onmouseup   = function(){ this.onmousemove = function(){}; };
        }
        
        this.container.host        = this;
        this.container.onmousedown = function(e){
            __ColorPicker = this.host;
            
            this.active = true;
            if (event.srcElement == this) {
                if (event.offsetX >= 0 && event.offsetX <= 256
                  && event.offsetY >= 0 && event.offsetY <= 256) {
                    this.host.cS = (256 - event.offsetY) / 2.56 * 2.4
                    this.host.cH = event.offsetX / 2.56 * 2.39
                }
                this.host.fill(this.host.cH, this.host.cS, this.host.cL);
                this.host.shower.style.backgroundColor = this.host.currentColor;
            }
            this.host.point.style.display = "none";
            
            event.cancelBubble = true;
        }
        
        this.container.onmouseup = function(e){
            this.active                   = false;	
            this.host.point.style.top     = event.offsetY - this.host.point.offsetHeight - 2;
            this.host.point.style.left    = event.offsetX - this.host.point.offsetWidth - 2;
            this.host.point.style.display = "block";
            
            this.host.change(this.host.tbHexColor.value);
        }
        
        this.container.onmousemove = function(e){
            if (this.active) {
                if (event.offsetX >= 0 && event.offsetX <= 256
                  && event.offsetY >= 0 && event.offsetY <= 256) {
                    this.host.cS = (256 - event.offsetY) / 2.56 * 2.4
                    this.host.cH = event.offsetX / 2.56 * 2.39
                }
                this.host.fill(this.host.cH, this.host.cS, this.host.cL);
                this.host.shower.style.backgroundColor = this.host.currentColor;
            }
        }
        
        /*this.tbHexColor.host = 
        this.tbRed.host = 
        this.tbGreen.host = 
        this.tbBlue.host = this;
        this.tbHexColor.onblur = function(){this.host.setValue("RGBHEX", this.value);}
        this.tbRed.onblur = function(){this.host.setValue("RGB", this.value, this.host.tbGreen.value, this.host.tbBlue.value);}
        this.tbGreen.onblur = function(){this.host.setValue("RGB", this.host.tbRed.value, this.value, this.host.tbBlue.value);}
        this.tbBlue.onblur = function(){this.host.setValue("RGB", this.host.tbRed.value, this.host.tbGreen.value, this.value);}
        */
    }
    
    // Databinding
    this.mainBind = "color";
    
    this.draw = function(parentNode, clear){
        //Build Main Skin
        this.oExt    = this.__getExternal(); 

        this.tbRed   = this.__getLayoutNode("Main", "red", this.oExt);
        this.tbGreen = this.__getLayoutNode("Main", "green", this.oExt);
        this.tbBlue  = this.__getLayoutNode("Main", "blue", this.oExt);
        
        this.tbHue       = this.__getLayoutNode("Main", "hue", this.oExt);
        this.tbSatern    = this.__getLayoutNode("Main", "satern", this.oExt);
        this.tbLuminance = this.__getLayoutNode("Main", "luminance", this.oExt);
        
        this.tbHexColor          = this.__getLayoutNode("Main", "hex", this.oExt);
        this.tbHexColor.host     = this;
        this.tbHexColor.onchange = function(){
            this.host.setValue(this.value, "RGBHEX");
        }
        
        this.shower = this.__getLayoutNode("Main", "shower", this.oExt);
        
        this.bar1   = this.__getLayoutNode("Main", "bar1", this.oExt);
        this.bgBar1 = this.__getLayoutNode("Main", "bgbar1", this.oExt);
        this.bar2   = this.__getLayoutNode("Main", "bar2", this.oExt);
        this.bgBar2 = this.__getLayoutNode("Main", "bgbar2", this.oExt);
        
        this.pHolder   = this.__getLayoutNode("Main", "pholder", this.oExt);
        this.pointer   = this.__getLayoutNode("Main", "pointer", this.oExt);
        this.container = this.__getLayoutNode("Main", "container", this.oExt);
        this.point     = this.__getLayoutNode("Main", "point", this.oExt);

        var nodes = this.oExt.getElementsByTagName("input");
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].onselectstart = function(e){
                if(!e) e = event;
                e.cancelBubble = true;
            };
        }

        this.setLogic();
        
        this.setValue("ffffff");
        //this.fill(this.cH, this.cS, this.cL);
    }
    
    this.__loadJML = function(x){
        if (x.getAttribute("color"))
            this.setValue(x.getAttribute("color"));
    }
    
    this.__destroy = function(){
        this.container.host  =
        this.tbRed.host      = 
        this.tbGreen.host    = 
        this.tbBlue.host     = 
        this.tbHexColor.host = 
        this.pHolder.host    = null;
    }
}

// #endif