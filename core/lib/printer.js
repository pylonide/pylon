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
 * Printer 
 * Example:
 * <code>
 * <j:appsettings>
 *     <j:printer onbeforeprint="jpf.printer.preview(getHtml())" />
 * </j:appsettings>
 * </code>
 */
jpf.printer = {
    //#ifdef __WITH_JMLDOM_FULL
    tagName  : "printer",
    nodeFunc : jpf.NODE_HIDDEN,
    //#endif
    
    lastContent : "",
    inited      : false,
    
    init : function(jml){
        this.inited = true;
        this.$jml    = jml;
        
        this.contentShower = document.body.appendChild(document.createElement("DIV"));
        this.contentShower.id = "print_content"
        
        with (this.contentShower.style) {
            width           = "100%";
            height          = "100%";
            backgroundColor = "white";
            zIndex          = 100000000;
        }
        
        jpf.importCssString(document, "#print_content{display:none}");
        jpf.importCssString(document,
            "body #print_content, body #print_content *{display:block} body *{display:none}", "print");
        
        if (jml) {
            //Events
            var a, i, attr = jml.attributes;
            for (i = 0; i < attr.length; i++) {
                a = attr[i];
                if (a.nodeName.indexOf("on") == 0)
                    jpf.addEventListener(a.nodeName, new Function(a.nodeValue));
            }
        }
        
        window.onbeforeprint = function(){
            jpf.dispatchEvent("onbeforeprint");
        }
        window.onafterprint = function(){
            jpf.dispatchEvent("onafterprint");
        }
    },
    
    preview : function(strHtml){
        if (!this.inited)
            this.init();
        
        if (typeof strHtml != "string")
            strHtml = strHtml.outerHTML || strHtml.xml || strHtml.serialize();
        
        this.lastContent = strHtml;
        this.contentShower.innerHTML = strHtml;
    }
};

/**
 * Sents html to a printer in formatted form.
 */
jpf.print = function(strHtml){
    if (!jpf.printer.inited)
        jpf.printer.init();
    
    jpf.printer.preview(strHtml);
    window.print();
}

// #endif
