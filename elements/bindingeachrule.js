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

//#ifdef __WITH_DATABINDING

/**
 * @binding each Determines the list of elements for which each
 * gets a visual representation within the element. It also can determine
 * the sequence of how the elements are visualized by offering a way to
 * specify the sort order. (N.B. The sorting mechanism is very similar to
 * that of XSLT)
 * Example:
 * This example contains a list that displays elements with the tagName
 * 'mail' that do not have a deleted attribute set to 1.
 * <code>
 *  <a:model id="mdlList">
 *      <data>
 *          <item date="2009-11-12" deleted="0"></item>
 *          <item date="2009-11-11" deleted="0"></item>
 *          <item date="2009-11-10" deleted="0"></item>
 *          <item date="2009-11-09" deleted="1"></item>
 *          <item date="2009-11-08" deleted="1"></item>
 *      </data>
 *  </a:model>
 *  <a:list id="list" width="200" height="200" model="mdlList">
 *      <a:bindings>
 *          <a:caption match="[@date]" />
 *          <a:each match="[item[not(@deleted='1')]]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * Example:
 * This example shows how to use the each rule to order files based
 * on their modified data.
 * <code>
 *  <a:model id="mdlList">
 *      <data>
 *          <item date="2009-11-12"></item>
 *          <item date="2009-11-11"></item>
 *      </data>
 *  </a:model>
 *  <a:list width="200" height="200" model="mdlList">
 *      <a:each match="[item]" sort="[@date]" order="ascending">
 *          <a:caption match="[@date]" />
 *      </a:each>
 *  </a:list>
 * </code>
 * Example:
 * This example shows how to do complex sorting using a javascript callback function.
 * <code>
 *  <a:model id="mdlList">
 *      <data>
 *          <item date="2009-11-12" deleted="0"></item>
 *          <item date="2009-11-11" deleted="0"></item>
 *          <item date="2009-11-10" deleted="1"></item>
 *          <item date="2009-11-09" deleted="1"></item>
 *          <item2 date="2009-11-08" deleted="1"></item2>
 *      </data>
 *  </a:model>
 *  <a:list id="list" width="200" height="200" model="mdlList">
 *      <a:script>
 *          function sth_compare(value, args, xmlNode) {
 *          
 *          }
 *      </a:script>
 *      <a:each match="[item]" sort="[@date]" sort-method="sth_compare">
 *          <a:caption match="[@date]" />
 *      </a:each>
 *  </a:list>
 * </code>
 * @attribute {String} match        an xpath statement which selects the nodes
 *                                  which will be rendered.
 * @attribute {String} sort         an xpath statement which selects the value
 *                                  which is subject to the sorting algorithm.
 * @attribute {String} data-type    the way sorting is executed. See
 *                                  {@link baseclass.multiselectbinding.binding.each.attribute.sort-method}
 *                                  on how to specify a custom sort method.
 *   Possible values:
 *   string  Sorts alphabetically
 *   number  Sorts based on numerical value (i.e. 9 is lower than 10).
 *   date    Sorts based on the date sequence (21-6-1980 is lower than 1-1-2000).
 *           See {@link baseclass.multiselectbinding.binding.each.attribute.date-format}
 *           on how to specify the date format.
 * @attribute {String} date-format  the format of the date on which is sorted.
 *   Possible values:
 *   YYYY   Full year
 *   YY     Short year
 *   DD     Day of month
 *   MM     Month
 *   hh     Hours
 *   mm     Minutes
 *   ss     Seconds
 * Example:
 * <code>
 *  date-format="DD-MM-YYYY"
 * </code>
 * @attribute {String} sort-method  the name of a javascript function to executed
 *                                  to determine the value to sort on.
 * @attribute {String} order        the order of the sorted list.
 *   Possible values:
 *   ascending  Default sorting order
 *   descending Reverses the default sorting order.
 * @attribute {String} case-order   whether upper case characters have preference
 *                                  above lower case characters.
 *   Possible values:
 *   upper-first    Upper case characters are higher.
 *   lower-first    Lower case characters are higher.
 */
apf.BindingEachRule = function(struct, tagName){
    this.$init(tagName, apf.NODE_HIDDEN, struct);
    
    var _self = this;
    this.$noderegister = function(e){
        e.amlNode.$handleBindingRule(_self.match, "each");
    
        //#ifdef __WITH_SORTING
        e.amlNode.$sort = _self.sort ? new apf.Sort(_self) : null;
        //#endif
    }
};

(function(){
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        "sort"         : 1,
        "data-type"    : 1,
        "date-format"  : 1,
        "sort-method"  : 1,
        "order"        : 1,
        "case-order"   : 1
    }, this.$attrExcludePropBind);

    this.$booleanProperties["animate"] = true;

    this.$propHandlers["sort"]        = 
    this.$propHandlers["data-type"]   = 
    this.$propHandlers["date-format"] = 
    this.$propHandlers["order"]       = 
    this.$propHandlers["case-order"]  = function(value, prop){
        delete this["c" + prop];
        
        //@todo apf3.0 change sort
    }
    
    this.$updateEach = function(value){
        var pNode = this.parentNode;//@todo apf3.0 get a list via $bindings
        if (pNode.localName == "bindings") {
            var nodes = pNode.$amlNodes,
                i     = 0,
                l     = nodes.length;
            for (; i < l; ++i)
                if (nodes[i].each != value)
                    nodes[i].$handleBindingRule(value, "each");
        }
        else
            if (pNode.each != value)
                pNode.$handleBindingRule(value, "each");
    }
    
    this.$getFilteredMatch = function(value){
        if (!value)
            return this.match;

        var keywords = value.trim().toLowerCase().split(" ");
        
        var each = this.match.charAt(0) == "[" && this.match.charAt(this.match.length - 1) == "]"
            ? this.match.replace(/^\[|\]$/g, "")
            : this.match;
        
        var model;
        if (each.indexOf("::") > -1) {
            var parsed = each.split("::"); //@todo could be optimized
            if (!apf.xPathAxis[parsed[0]]) {
                model = parsed[0];
                each  = parsed[1];
            }
        }
        
        // show search results
        var search = [], word, words, fields = this.$fields || ["text()"];
        for (var i = 0, l = keywords.length; i < l; i++) {
            words = [], word = keywords[i];
            for (var j = 0, jl = fields.length; j < jl; j++) {
                words.push("contains(translate(" + fields[j] + ", 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + word + "')");
            }
            search.push(words.join(" or "));
        }
        
        var filter = "(" + search.join(") and (") + ")";
        var groups = this["filter-groups"] ? this["filter-groups"].split("|") : [];
        
        each = each.split("|");
        var newEach = [];
        for (i = 0, l = each.length; i < l; i++) {
            if (!groups.contains(each[i]))
                newEach.push(each[i] + "[" + filter + "]");
        }
        
        var subEach = newEach.join("|");
        
        for (i = 0; i < groups.length; i++) {
            newEach.push(groups[i] + "[" + subEach + "]");
        }

        return newEach.join("|");
    }
    
    /**
     *      <a:each 
     *         match="[group|item]"
     *         filter="{tb.value}"
     *         filter-fields="@caption"
     *         filter-groups="group"
     *      /> 
     */
    
    this.$propHandlers["filter"]  = function(value, prop){
        if (!this.$amlLoaded)
            return;

        this.$updateEach(this.$getFilteredMatch(value));
    }
    this.$propHandlers["filter-fields"]  = function(value, prop){
        this.$fields = value.splitSafe(",");
    }
    
    this.addEventListener("prop.match", function(e){
        if (!this.$amlLoaded)
            return;
        
        if (this.filter)
            this.$propHandlers["filter"].call(this, this.filter);
        else
            this.$updateEach(this.match);
    });
    
    //@todo apf3.0 optimize
    var f;
    this.addEventListener("DOMNodeInserted", f = function(e){
        if (e.currentTarget != this)
            return;

        var match = this.$getFilteredMatch(this.filter);
        var pNode = this.parentNode;//@todo apf3.0 get a list via $bindings
        if (pNode.localName == "bindings") {
            pNode.addEventListener("noderegister", this.$noderegister);
            
            var nodes = pNode.$amlNodes,
                i     = 0,
                l     = nodes.length;
            for (; i < l; ++i) {
                nodes[i].$handleBindingRule(match, "each");
    
                //#ifdef __WITH_SORTING
                nodes[i].$sort = this.sort ? new apf.Sort(this) : null;
                //#endif
            }
        }
        else {
            pNode.$handleBindingRule(match, "each");
    
            //#ifdef __WITH_SORTING
            pNode.$sort = this.sort ? new apf.Sort(this) : null;
            //#endif
        }
    });
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (e.currentTarget != this)
            return;
        
        //@todo apf3.0 how does this conflict with setting it through an attribute.
        //this.$clearDynamicProperty("each");
        //pNode.setProperty("each", null);//@todo double?
        //@todo remove model?
        
        //@todo this should be near $handleBindingRule...
        var pNode = this.parentNode;//@todo apf3.0 get a list via $bindings
        if (pNode.localName == "bindings") {
            pNode.removeEventListener("noderegister", this.$noderegister);
            
            var nodes = pNode.$amlNodes,
                i     = 0,
                l     = nodes.length;
            for (; i < l; ++i) {
                //delete nodes[i].each; //@todo apf3.x is already set by new one
    
                //#ifdef __WITH_SORTING
                delete nodes[i].$sort;
                //#endif
            }
        }
        else {
            //delete pNode.each; //@todo apf3.x is already set by new one
            
            //#ifdef __WITH_SORTING
            delete pNode.$sort;
            //#endif
        }
    });
    
    this.addEventListener("DOMNodeInsertedIntoDocument", f);
    
}).call(apf.BindingEachRule.prototype = new apf.BindingRule());

apf.aml.setElement("each", apf.BindingEachRule);
// #endif

