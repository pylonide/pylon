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

// #ifdef __ENABLE_TEXTBOX_AUTOCOMPLETE && (__JTEXTBOX || __INC_ALL)

/**
 * @constructor
 * @private
 */

jpf.textbox.autocomplete = function(){
    /*
        missing features:
        - web service based autocomplete
    */
    var autocomplete = {};
    
    this.initAutocomplete = function(ac){
        ac.parentNode.removeChild(ac);
        autocomplete.nodeset   = ac.getAttribute("nodeset").split(":");
        autocomplete.method    = ac.getAttribute("method");
        autocomplete.value     = ac.getAttribute("value");
        autocomplete.count     = parseInt(ac.getAttribute("count")) || 5;
        autocomplete.sort      = ac.getAttribute("sort");
        autocomplete.lastStart = -1;
        
        this.oContainer = jpf.xmldb.htmlImport(this.$getLayoutNode("container"),
            this.oExt.parentNode, this.oExt.nextSibling);	
    };
    
    this.fillAutocomplete = function(keyCode){
        if (keyCode) {
            switch(keyCode){
                case 9:
                case 27: 
                case 13:  
                    return this.oContainer.style.display = "none";
                case 40: //DOWN
                    if(autocomplete.suggestData 
                      && autocomplete.lastStart < autocomplete.suggestData.length){
                        this.clear();
                        var value       = autocomplete.suggestData[autocomplete.lastStart++];
                        this.oInt.value = value; //hack!
                        this.change(value);
                        //this.oInt.select(); this.oInt.focus();
                        this.oContainer.style.display = "none";
                        return;
                    }
                    break;
                case 38: //UP
                    if (autocomplete.lastStart > 0) {
                        if(autocomplete.lastStart >= autocomplete.suggestData.length) 
                            autocomplete.lastStart = autocomplete.suggestData.length - 1;

                        this.clear();
                        var value = autocomplete.suggestData[autocomplete.lastStart--];
                        this.oInt.value = value; //hack!
                        this.change(value);
                        //this.oInt.select(); this.oInt.focus();
                        this.oContainer.style.display = "none";
                        return;
                    }
                    break;
            }
            
            if (keyCode > 10 && keyCode < 20) return;
        }
        
        if (autocomplete.method) {
            var start = 0, suggestData = self[autocomplete.method]();
            autocomplete.count = suggestData.length;
        }
        else {
            if (this.oInt.value.length == 0){
                this.oContainer.style.display = "none";
                return;
            }
            if (!autocomplete.suggestData) {
                //Get data from model
                var nodes = self[autocomplete.nodeset[0]].data.selectNodes(autocomplete.nodeset[1]);
                for(var value, suggestData = [], i = 0; i < nodes.length; i++) {
                    value = jpf.getXmlValue(nodes[i], autocomplete.value);
                    if (value)
                        suggestData.push(value.toLowerCase());
                }
                if (autocomplete.sort)
                    suggestData.sort();
                autocomplete.suggestData = suggestData;
            }
            else {
                suggestData = autocomplete.suggestData;
            }
            
            //Find Startpoint in lookup list
            var value = this.oInt.value.toUpperCase();
            for(var start = suggestData.length - autocomplete.count, i = 0; i < suggestData.length; i++) {
                if (value <= suggestData[i].toUpperCase()) {
                    start = i;
                    break;
                }
            }
            autocomplete.lastStart = start;
        }
        
        //Create html items
        this.oContainer.innerHTML = "";
        
        for (var arr = [], j = start; j < Math.min(start + autocomplete.count, suggestData.length); j++) {
            this.$getNewContext("item")
            var oItem = this.$getLayoutNode("item");
            jpf.xmldb.setNodeValue(this.$getLayoutNode("item", "caption"), suggestData[j]);
            
            oItem.setAttribute("onmouseover", 'this.className = "hover"');
            oItem.setAttribute("onmouseout",  'this.className = ""');
            oItem.setAttribute("onmousedown", 'event.cancelBubble = true');
            oItem.setAttribute("onclick",
               "var o = jpf.lookup(" + this.uniqueId + ");\
                o.oInt.value = this.innerHTML;\
                o.change(this.innerHTML);\
                o.oInt.select();\
                o.oInt.focus();\
                o.oContainer.style.display = 'none';");
            
            arr.push(this.$getLayoutNode("item"));
        }
        jpf.xmldb.htmlImport(arr, this.oContainer);
        
        this.oContainer.style.display = "block";
    };
    
    this.setAutocomplete = function(model, traverse, value){
        autocomplete.lastStart   = -1;
        autocomplete.suggestData = null;
        
        autocomplete.nodeset = [model, traverse];
        autocomplete.value = value;
        this.oContainer.style.display = "none";
    };
};

// #endif
