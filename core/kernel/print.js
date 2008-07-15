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

// #ifdef __WITH_PRINT

jpf.printServer = {
    lastContent: "",
    inited: false,
    
    init: function(){
        this.inited = true;
        this.contentShower = document.body.appendChild(document.createElement("DIV"));
        this.contentShower.id = "print_content"
        
        //LATER REPLACE THIS BY A SKIN
        with (this.contentShower.style) {
            /*position = "absolute";
             left = "0px";
             top = "0px";*/
            width           = "100%";
            height          = "100%";
            backgroundColor = "white";
            zIndex          = 100000000;
            //if(jpf.isIE) display = "none";
        }
        
        //if(!jpf.isIE){
        jpf.importCssString(document, "#print_content{display:none}");
        jpf.importCssString(document,
            "body #print_content, body #print_content *{display:block} body *{display:none}", "print");
        
        /*styleElement = document.createElement('style');
         styleElement.type = 'text/css';
         styleElement.media = 'print';
         styleElement.appendChild(document.createTextNode("#print_content {display:block}"));
         document.getElementsByTagName('head').item(0).appendChild(styleElement);*/
        //}
    },
    
    printContent: function(v){
        this.setContent(v);
        this.print();
    },
    
    setContent: function(v){
        if (!this.inited) 
            this.init();
        this.lastContent = v;
        //if(!IS_IE) 
        this.contentShower.innerHTML = v;
    },
    
    print: function(){
        window.print();
    }
}
/*
 window.onbeforeprint = function(){
 if(!PrintServer.lastContent && PrintServer.onbeforeprint) PrintServer.onbeforeprint();
 if(PrintServer.lastContent){
 PrintServer.contentShower.innerHTML = PrintServer.lastContent;
 PrintServer.lastContent = false;
 
 this.hidden = [];
 for(var i=0;i<document.body.childNodes.length;i++){
 if(document.body.childNodes[i].nodeType != 1) continue;
 
 if(document.body.childNodes[i].style.display == "none")
 this.hidden.push(document.body.childNodes[i])
 document.body.childNodes[i].style.display = "none";
 }
 PrintServer.contentShower.style.display = "block";
 }
 }
 window.onafterprint = function(){
 if(PrintServer.inited){
 for(var i=0;i<document.body.childNodes.length;i++) {
 if(document.body.childNodes[i].nodeType != 1) continue;
 
 document.body.childNodes[i].style.display = "block";
 }
 
 for(var i=0;i<this.hidden.length;i++)
 this.hidden[i].style.display = "none";
 
 PrintServer.contentShower.style.display = "none";
 if(self.hider) hider.style.display = "none";
 
 if(PrintServer.onafterprint) PrintServer.onafterprint();
 }
 }*/
// #endif
