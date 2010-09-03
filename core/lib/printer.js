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

// #ifdef __WITH_PRINTER

/**
 * @private
 */
apf.printer = {
    tagName     : "printer",
    nodeFunc    : apf.NODE_HIDDEN,
    lastContent : "",
    inited      : false,
    panel       : null,
    
    init : function(aml){
        if (this.inited) return this;
        
        this.inited = true;
        this.$aml   = aml;
        
        this.panel = document.body.appendChild(document.createElement("div"));
        this.panel.setAttribute("id", "print_content");
        this.panel.onmousedown = function(){
            apf.printer.hide();
        };
        with (this.panel.style) {
            position        = "absolute";
            top             = "0";
            left            = "0";
            width           = "100%";
            height          = "100%";
            backgroundColor = "white";
        }
        apf.window.zManager.set("print", this.panel);
        
        apf.importCssString("#print_content{display:none}");
        apf.importCssString(apf.hasCSSChildOfSelector && !apf.isIE
          ? "body #print_content{display:block} body>*{display:none}"
          : "body #print_content, body #print_content *{display:block} body *{display:none}",
          document, "print");

        //body #print_content, body #print_content *{display:block} 
        
        if (aml) {
            //Events
            var a, i, attr = aml.attributes;
            for (i = 0; i < attr.length; i++) {
                a = attr[i];
                if (a.nodeName.indexOf("on") == 0)
                    apf.addEventListener(a.nodeName, 
                      // #ifdef __WITH_JSLT_EVENTS
                      apf.lm.compile(a.nodeValue, {event: true, parsecode: true})
                      /* #else
                      new Function('event', a.nodeValue)
                      #endif */
                    );
            }
        }

        // #ifdef __WITH_IEPNGFIX
        function printPNGFix(disable) {
            if (apf.supportPng24) return;
            // #ifdef __WITH_APPSETTINGS
            if (!apf.config.iePngFix) return;
            // #endif
            for (var e, i = 0, j = document.all.length; i < j; i++) {
                e = document.all[i];
                if (e.filters['DXImageTransform.Microsoft.AlphaImageLoader'] || e._png_print) {
                    if (disable) {
                        e._png_print   = e.style.filter;
                        e.style.filter = '';
                    }
                    else {
                        e.style.filter = e._png_print;
                        e._png_print   = '';
                    }
                }
            }
        }
        // #endif
        
        window.onbeforeprint = function(){
            // #ifdef __WITH_IEPNGFIX
            printPNGFix(true);
            // #endif
            apf.dispatchEvent("beforeprint");
        };
        
        window.onafterprint = function(){
            // #ifdef __WITH_IEPNGFIX
            printPNGFix(false);
            // #endif
            apf.dispatchEvent("afterprint");
        };

        return this;
    },
    
    preview : function(strHtml, show){
        this.init();
        
        if (typeof strHtml != "string")
            strHtml = strHtml.outerHTML || strHtml.xml || strHtml.serialize();
        
        this.lastContent = strHtml;
        this.panel.innerHTML = strHtml;

        if (show)
            this.show();

        return this;
    },

    show : function() {
        if (!this.inited) return this;
        this.panel.style.display = "block";
        return this;
    },

    hide : function() {
        if (!this.inited) return this;
        this.panel.style.display = "none";
        this.panel.style.height  = document.body.scrollHeight + "px";
        this.panel.style.width   = document.body.scrollWidth  + "px";
        return this;
    }
};

/**
 * Sents html to a printer in formatted form.
 * @param {String} strHtml the html to be printed.
 */
apf.print = function(strHtml){
    apf.printer.init().preview(strHtml);
    window.print();
};

// #endif
