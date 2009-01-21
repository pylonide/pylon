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

/**
 * Object handling sorting in a similar way as xslt.
 *
 * @constructor
 * @todo use a struct instead of lots of local variables, and stop using eval
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 *
 * @private
 */
jpf.Sort = function(xmlNode){
    var settings = {};
    //order, xpath, type, method, getNodes, dateFormat, dateReplace, sort_dateFmtStr, getValue;
    
    //use this function to parse the traverse node
    this.parseXml = function(xmlNode, clear){ 
        if (clear) settings = {};
        
        settings.order       = xmlNode.getAttribute("order");
        settings.xpath       = xmlNode.getAttribute("sort");
        settings.getNodes    = self[xmlNode.getAttribute("nodes-method")];
        settings.getValue    = function(item){
            return jpf.getXmlValue(item, settings.xpath);
        }

        settings.ascending = (settings.order || "").indexOf("desc") == -1;
        settings.order = null;

        if (xmlNode.getAttribute("data-type")) 
            settings.method = sort_methods[xmlNode.getAttribute("data-type")];
        else if (xmlNode.getAttribute("sort-method")) {
            settings.method = self[xmlNode.getAttribute("sort-method")];
            
            //#ifdef __DEBUG
            if (!settings.method) {
                throw new Error(jpf.formatErrorString(0, null, 
                    "Sorting nodes",
                    "Invalid or missing sort function name provided '" 
                    + xmlNode.getAttribute("sort-method") + "'", xmlNode));
            }
            //#endif
        }
        else
            settings.method = sort_methods["alpha"];
        
        var str = xmlNode.getAttribute("date-format");
        if (str) {
            settings.sort_dateFmtStr = str;
            settings.method = sort_methods["date"];
            var result = str.match(/(D+|Y+|M+|h+|m+|s+)/g);
            if (result) {
                for (var pos = {}, i = 0; i < result.length; i++) 
                    pos[result[i].substr(0, 1)] = i + 1;
                settings.dateFormat = new RegExp(str.replace(/[^\sDYMhms]/g, '\\$1')
                    .replace(/YYYY/, "(\\d\\d\\d\\d)")
                    .replace(/(DD|YY|MM|hh|mm|ss)/g, "(\\d\\d)"));
                settings.dateReplace = "$" + pos["M"] + "/$" + pos["D"] + "/$" + pos["Y"];
                if (pos["h"]) 
                    settings.dateReplace += " - $" + pos["h"] + ":$" + pos["m"] + ":$" + pos["s"];
            }
        }
    };
    
    this.set = function(struct, clear){
        if (clear) settings = {};
        
        jpf.extend(settings, struct);

        if (struct.order && !settings.ascending)
            settings.ascending = struct.order.indexOf("desc") == -1;
        
        settings.order = null;
        
        if (struct["type"]) 
            settings.method = sort_methods[struct["type"]];
        else if (struct["method"])
            settings.method = self[struct["method"]];
        else if (!settings.method) 
            settings.method = sort_methods["alpha"];
        
        if (!settings.getValue) {
            settings.getValue = function(item){
                return jpf.getXmlValue(item, settings.xpath);
            }
        }
    };
    
    this.get = function(){
        return jpf.extend({}, settings);
    };
    
    //use this function in __xmlUpdate [this function isnt done yet]
    this.findSortSibling = function(pNode, xmlNode){
        var nodes = getNodes ? getNodes(pNode, xmlNode) : this.getTraverseNodes(pNode);
        
        for (var i = 0; i < nodes.length; i++) 
            if (!compare(xmlNode, nodes[i], true, sortSettings)) 
                return nodes[i];
        
        return null;
    };
    
    // Sorting methods for sort()
    var sort_intmask = ["", "0", "00", "000", "0000", "00000", "000000",
        "0000000", "00000000", "000000000", "0000000000", "00000000000",
        "000000000000", "0000000000000", "00000000000000"];
    var sort_methods = {
        "alpha" : function (n){
            return n.toString().toLowerCase()
        },

        "number" : function (t){
            return (t.length < sort_intmask.length
                ? sort_intmask[sort_intmask.length - t.length]
                : "") + t;
        },

        "date" : function (t, args){
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
    };

    /*
     sort(xpath, sort_xpath, sort_alpha, boolDesc, from, len)
     jsort(n,f,p,ps,sm,desc,sp,ep)
     */
    //var order, xpath, type, method, getNodes, dateFormat, dateReplace, sort_dateFmtStr, getValue;
    this.apply = function(n, args, func, start, len){
        var sa = [], i = n.length;
        
        // build string-sortable list with sort method
        while (i--) {
            var v = settings.getValue(n[i]);
            if (n) 
                sa[sa.length] = {
                    toString: function(){
                        return this.v;
                    },
                    xmlNode : n[i],
                    v       : (settings.method || sort_methods.alpha)(v || "", args, n[i])
                };
        }
        
        // sort it
        sa.sort();
        
        //iterate like foreach
        var end = len ? Math.min(sa.length, start + len) : sa.length;
        if (!start) 
            start = 0;
        
        if (func) {
            if (settings.ascending) 
                for (i = start; i < end; i++) 
                    f(i, end, sa[i].xmlNode, sa[i].v);
            else 
                for (i = end - 1; i >= start; i--) 
                    f(end - i - 1, end, sa[i].xmlNode, sa[i].v);
        }
        else {
            //this could be optimized by reusing n... time it later
            var res = [];
            if (settings.ascending) 
                for (i = start; i < end; i++) 
                    res[res.length] = sa[i].xmlNode;
            else 
                for (i = end - 1; i >= start; i--) 
                    res[res.length] = sa[i].xmlNode;
            return res;
        }
    };
    
    if (xmlNode) 
        this.parseXml(xmlNode);
};

//#endif
