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

//#ifdef __WITH_SORTING

//<Traverse select="" sort="@blah" data-type={"string" | "number" | "date"} date-format="" sort-method="" order={"ascending" | "descending"} case-order={"upper-first" | "lower-first"} />
/*
 <Traverse select="group|contact" sort="self::group/@name|self::contact/screen/text()" order="ascending" case-order="upper-first" />
 <Traverse select="group|contact" sort="@date" date-format="DD-MM-YYYY" order="descending"/>
 <Traverse select="group|contact" sort-method="compare" />
 */
/**
 * Object representing the window of the JML application
 *
 * @classDescription		This class creates a new sort object
 * @return {Sort} Returns a new sort object
 * @type {Sort}
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.Sort = function(xmlNode){
    var sort_intmask = ["", "0", "00", "000", "0000", "00000", "000000",
        "0000000", "00000000", "000000000", "0000000000", "00000000000",
        "000000000000", "0000000000000", "00000000000000"];
    var isAscending, xpath, type, method, getNodes, dateFormat, dateReplace,
        sort_dateFmtStr, getValue;
    
    //use this function to parse the traverse node
    this.parseXml = function(xmlNode){
        isAscending = xmlNode.getAttribute("order") != "descending";
        xpath       = xmlNode.getAttribute("sort");
        getNodes    = self[xmlNode.getAttribute("nodesmethod")];
        getValue    = function(item){
            return jpf.getXmlValue(item, xpath);
        }
        
        if (xmlNode.getAttribute("type")) 
            method = eval("sort_" + xmlNode.getAttribute("type"));
        if (xmlNode.getAttribute("sortmethod")) 
            method = self[xmlNode.getAttribute("sortmethod")];
        if (!method) 
            method = sort_alpha;
        
        var str = xmlNode.getAttribute("dateformat");
        if (str) {
            sort_dateFmtStr = str;
            var result = str.match(/(D+|Y+|M+|h+|m+|s+)/g);
            if (result) {
                for (var pos = {}, i = 0; i < result.length; i++) 
                    pos[result[i].substr(0, 1)] = i + 1;
                dateFormat = new RegExp(str.replace(/[^\sDYMhms]/g, '\\$1')
                    .replace(/YYYY/, "(\\d\\d\\d\\d)")
                    .replace(/(DD|YY|MM|hh|mm|ss)/g, "(\\d\\d)"));
                dateReplace = "$" + pos["M"] + "/$" + pos["D"] + "/$" + pos["Y"];
                if (pos["h"]) 
                    dateReplace += " - $" + pos["h"] + ":$" + pos["m"] + ":$" + pos["s"];
            }
        }
    }
    if (xmlNode) 
        this.parseXml(xmlNode);
    
    this.set = function(struct){
        var prop, x;
        for (prop in struct) {
            x = struct[prop];
            eval(prop + " = x;");
        }
        
        if (struct["type"]) 
            method = eval("sort_" + struct["type"]);
        if (struct["method"]) 
            method = struct["method"];
        if (!method) 
            method = sort_alpha;
    }
    
    //use this function in __xmlUpdate [this function isnt done yet]
    this.findSortSibling = function(pNode, xmlNode){
        var nodes = getNodes ? getNodes(pNode, xmlNode) : this.getTraverseNodes(pNode);
        
        for (var i = 0; i < nodes.length; i++) 
            if (!compare(xmlNode, nodes[i], true, sortSettings)) 
                return nodes[i];
        
        return null;
    }
    
    // Sorting methods for sort()
    function sort_alpha(n){
        return n.toString().toLowerCase()
    }
    
    function sort_number(t){
        return (t.length < sort_intmask.length
            ? sort_intmask[sort_intmask.length - t.length]
            : "") + t;
    }
    
    function sort_date(t, args){
        if (!sort_dateFormat || (args && sort_dateFmtStr != args[0])) 
            sort_dateFmt(args ? args[0] : "*");
        
        var d;
        if (sort_dateFmtStr == '*') 
            d = Date.parse(t);
        else 
            d = (new Date(t.replace(sort_dateFormat, sort_dateReplace))).getTime();
        t = "" + parseInt(d);
        if (t == "NaN") 
            t = "0";
        return (t.length < sort_intmask.length ? sort_intmask[sort_intmask.length
            - t.length] : "") + t;
    }
    
    /*
     sort(xpath, sort_xpath, sort_alpha, boolDesc, from, len)
     jsort(n,f,p,ps,sm,desc,sp,ep)
     */
    //var isAscending, xpath, type, method, getNodes, dateFormat, dateReplace, sort_dateFmtStr, getValue;
    this.apply = function(n, args, func, start, len){
        var sa = [], i = n.length;
        
        // build string-sortable list with sort method
        while (i--) {
            var v = getValue(n[i]);
            if (n) 
                sa[sa.length] = {
                    toString: function(){
                        return this.v;
                    },
                    pn      : n[i],
                    v       : method(v, args, n[i])
                };
        }
        
        // sort it
        sa.sort();
        
        //iterate like foreach
        end = len ? Math.min(sa.length, start + len) : sa.length;
        if (!start) 
            start = 0;
        
        if (func) {
            if (isAscending) 
                for (i = start; i < end; i++) 
                    f(i, end, sa[i].pn, sa[i].v);
            else 
                for (i = end - 1; i >= start; i--) 
                    f(end - i - 1, end, sa[i].pn, sa[i].v);
        }
        else {
            //this could be optimized by reusing n... time it later
            var res = [];
            if (isAscending) 
                for (i = start; i < end; i++) 
                    res[res.length] = sa[i].pn;
            else 
                for (i = end - 1; i >= start; i--) 
                    res[res.length] = sa[i].pn;
            return res;
        }
    }
    
    /*Implement this api for JSON support
    
     function jsort(n,f,p,ps,sm,desc,sp,ep){
    
     sm = sm ? sm : sort_alpha;
    
     var sa = [], t = n.selectNodes(p), i = t.length, args = null;
    
     if(typeof sm != "function"){var m = sm.shift();args = sm; sm = m;}
    
     // build string-sortable list with sort method
    
     while(i--){
    
     var n = getValue(t[i]);
    
     if(n) sa[sa.length] = {toString:function(){return this.v;}, pn:t[i], v:sm(n,args)};
    
     }
    
     // sort it
    
     sa.sort();
    
     
    
     //iterate like foreach
    
     var end = ep==null?sa.length:Math.min(sa.length,(sp+ep));
    
     var start = (sp==null)?0:sp;
    
     if(desc){
    
     for(var i = end-1;i>=start;i--)f(end-i-1,end,sa[i].pn,sa[i].v);
    
     }else{
    
     for(var i = start;i<end;i++)f(i,end,sa[i].pn,sa[i].v);
    
     }
    
     }*/
    
}

/*

 //ebuddy sorting

 function compare(xmlNode1, xmlNode2, testEqual){

 //if(testEqual) return n1>=n2;

 //return (n1>n2);

 

 if(!xmlNode1) return true;

 if(!xmlNode2) return false;

 if(xmlNode1.tagName == "group"){

 var str1 = xmlNode1.getAttribute("name").toLowerCase();

 var str2 = xmlNode2.getAttribute("name").toLowerCase();

 }

 else{

 var str3 = xmlNode1.selectSingleNode("status/text()").nodeValue;

 var str4 = xmlNode2.selectSingleNode("status/text()").nodeValue;

 if(str3 == "FLN" && str4 != "FLN") return true;

 if(str3 != "FLN" && str4 == "FLN") return false;

 

 var str1 = xmlNode1.selectSingleNode("screen/text()").nodeValue.toLowerCase();

 var str2 = xmlNode2.selectSingleNode("screen/text()").nodeValue.toLowerCase();

 }

 

 if(testEqual && str1 == str2) return true;

 

 var len = Math.max(str1.length, str2.length);

 for(var i=0;i<len;i++) if(str1.charCodeAt(i) != str2.charCodeAt(i)){

 if(!str1.charCodeAt(i)) return true;

 return str1.charCodeAt(i) > str2.charCodeAt(i);

 }

 

 return false;

 }

 

 //ebuddy

 function getNodes(pNode, xmlNode){

 return doGroup ?

 pNode.selectNodes("group[@name]") :

 pNode.selectNodes("contact[" + (getXmlValue(xmlNode, "status/text()") == "FLN" ? "status/text()='FLN'" : "not(status/text()='FLN')") + "]");

 }

 

 */

//#endif
