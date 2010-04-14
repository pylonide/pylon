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

// #ifdef __AMLCHART || __INC_ALL

/**
 * Element displays a chart.
 *
 * @classDescription This class creates a new chart
 * @return {Chart} Returns a new chart
 * @type {Chart}
 * @constructor
 * @allowchild {elements}, {anyaml}
 * @addnode elements:chart
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       0.4
 */

 apf.Graph     = function(struct, tagName){
    this.$init(tagName || "graph", apf.NODE_VISIBLE, struct);
};

apf.aml.setElement("graph", apf.Graph);
 
(function(){
    //this.$attrExcludePropBind = apf.extend({
    //���style : 1
    //}, this.$attrExcludePropBind);

    //this.$supportedProperties = ["type","series","formula"];
    this.$focussable = false;

    this.$drawCode = 0;
    this.$_style = null;
	this.$docompile = true;
	this.$doinit = true;
	this.style = '';

    this.$microtime = 0;
	this.$datasource = null;
    this.$datamode = null;
	this.$datatype = null;
    this.dataslice = '1X';
    this.steps = 100;
    this.$data = null;
    this.$tilex = 0;
    this.$tiley = 0;
    this.m={x:0,y:0};
    this.nc = 0;
	this.$styletag = '';	
    this.$propHandlers["left"] = 
    this.$propHandlers["top"] =
    this.$propHandlers["width"] =
    this.$propHandlers["height"] =function(value){
    }
    
    this.$propHandlers["series"] = function(value){
        var v_yval = this.v_yval  = [];
        var v_xval = this.v_xval  = [];
        var v_zval = this.v_zval  = [];
        var v_time = this.v_time  = [];
        var v_caption = this.v_caption  = []; // mouseover title
        var v_class = this.v_class = []; // class
        var v_state = this.v_state = []; // class
        this.v_stateresolve = false;
        // x / y value array
        var p,v,n,k,l,t = (new Date()).getTime()*0.001, css;
        var series, split, delim, caption, cls, formula, length, mip;
        if (typeof value == "string") {
            series  = value;
            split   = ",";
            delim   = " ";
            css     = "#";
            caption = null;
        }
        else {
            series   = value.series;
            split    = value.split;
            caption  = value.caption;
            delim    = value.delim;
            css      = value.css;
            formula  = value.formula;
            length   = value.length;
        }
        
        if (!series)
            return;
        if(formula){
            //alert(formula);
            var mdl = this.getModel();
            if(!mdl.v_yval){
                var f = new Function('length','v_yval',apf.draw.baseMacro(
                        ["for(v = 0;v<length;v++){",
                            "v_yval[v] = ",[formula],";",
                        "}"]));
                f(length,v_yval);
                mdl.v_yval = v_yval;
            } else v_yval = mdl.v_yval;
            // now we need to generate the v_yval mipmapping array
            if(this.mipstep>1){
                var step = this.mipstep;
                // lets switch mipdiv type
                var v_yvalmip = this.v_yvalmip = [v_yval];
                var newd = [], oldd = v_yval,i, j, v, n, m, c;

                switch(this.mipset){
                    case 'avg':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v / step;
                                    v = oldd[n];
                                }else v += oldd[n];
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'add':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else v += oldd[n];
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'min':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else if( v > (c=oldd[n])) v = c;
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'max':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else if( v < (c=oldd[n])) v = c;
                            }
                            oldd= newd, newd = [];
                        }
                    break;                
                }
                this.$datamode = 'series';
            }   
        }else{
            p = series.split(delim);
            for( v = 0; v < p.length; v++ ){
                
                this.v_time[v] = t;
                n = p[v].split(css);
                // todo, add support for procedural class selection
                this.v_state[v] = 0;
                if(n.length>1){// we have a clsname
                    this.v_class[v] = n[1];
                }
                
                if(caption){
                    k = n[0].split(caption);
                    if(k.length>1)
                        v_caption[v] = k[1];
                    k=k[0].split(split);
                }else k = n[0].split(split);
                var dim = 1;
                if ((l = k.length) > 0){
                    if (l == 1)
                        v_yval[v] = parseFloat(k[0]);
                    else if (l >= 2){
                        v_xval[v] = parseFloat(k[0]);
                        v_yval[v] = parseFloat(k[1]);
                        if(l>=3)
                            v_zval[v] = parseFloat(k[2]);
                    }
                }
            }
            // lets pick a series type
            this.$datamode = 'series';
            
        }
        // set source type
    }
    
    this.$propHandlers["formula"] = function(value){
        this.pformula = apf.draw.parseJSS(value);
        // set source type
        this.$datamode = 'math';
        this.$docompile = true;
    }
    
    this.$propHandlers["mode"] = function(value){
        this.$regenerate();
    }

    this.$propHandlers["style"] = function(value){
        this.$regenerate();
    }
    
    this.$propHandlers["a"] = 
    this.$propHandlers["b"] =
    this.$propHandlers["c"] = 
    this.$propHandlers["d"] = function(value){
        this.$redraw();
    }
    
    this.$redraw = function(now,resize){
        // call parent to repaint
        if(this.$parentChart)
            this.$parentChart.$redraw(now,resize);
    }
    
    this.$regenerate = function(){
        this.$_style = null;
        this.$docompile = true;
    }
    
    this.$drawGraph = function( v, doresize ){
		if(this.$doinit){
            this.$doinit = false;
            this.$parentAxis.$copySubPos(this);
			apf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentAxis.$copySubPos(this);
 			apf.draw.resizeLayer(this, this.$parentChart);
		}
	    
		if(this.$docompile){
			// if we dont have a sourcetype, the data is not ready yet
			if(!this.$datamode) return this.$redraw();
		
            this.$docompile = false;
            var err = {};
			var mode = this.mode+this.$parentAxis.mode;
            // go and reparse style
           if(!this.$_style)this.$_style = 
                    apf.draw.parseStyle( apf.chart_draw['_'+mode], this.style+this.$styletag, err );
            if(this.$_style.graph && this.$_style.graph.$clslist && this.v_class){
                for(var t,c = this.v_class,s = this.v_state,i=0,j=c.length;i<j;i++){
                    if(t=c[i]){
                        s[i] = this.$_style.graph.$clslist[t];
                    }
                }
            }
            //alert(this.$datatype);
			this.$datatype = apf.chart_draw['dt_'+this.$datamode+this.dataslice](this);
			this.$drawCode  = apf.chart_draw[mode]( this, this.$datatype, this.$_style );
            // we'll also have to compile the balloon and knob code.
        }
	
        if (this.$drawCode){
            this.$drawCode( this, v);
            if(this._anim){
                this.$redraw();
            }
        }
    }
    
    this.$drawBalloons = function(v, doresize){
        if(this.$doinit){
            this.$doinit = false;
			apf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentAxis.$copySubPos(this);
 			apf.draw.resizeLayer(this, this.$parentChart);
		}
	    
		if(this.$docompile){
			// if we dont have a sourcetype, the data is not ready yet
			if(!this.$datamode) return this.$redraw();
		
            this.$docompile = false;
            var err = {};
			var mode = this.mode+this.$parentAxis.mode;
            // go and reparse style
           if(!this.$_style){
				this.$_style = 
                    apf.draw.parseStyle( apf.chart_draw['_'+mode], this.style+this.$styletag, err );
            }
			if(this.$_style.graph.$clslist && this.v_class){
                for(var t,c = this.v_class,s = this.v_state,i=0,j=c.length;i<j;i++){
                    if(t=c[i]){
                        s[i] = this.$_style.graph.$clslist[t];
                    }
                }
            }
            //alert(this.$datatype);
			this.$datatype = apf.chart_draw['dt_'+this.$datamode+this.dataslice](this);
			this.$drawCode  = apf.chart_draw[mode]( this, this.$datatype, this.$_style );
            // lets get some ballooons.
            //this.$balloonCode = apf.chart_draw[
            // we'll also have to compile the balloon and knob code.
        }
	
        if (this.$drawCode){
            this.$drawCode( this, v);
            if(this._anim){
                this.$redraw();
            }
        }
    }
    
    this.$mouseDown = function(x,y,bt){

    }
    
    this.$mouseUp = function(x,y){

    }
    
    this.lastOver = -1;
    this.$mouseMove = function(dx,dy,bt,ox,oy,lx,ly){
	
        if (!this.$drawCode) //@todo en zo verder
            return;
        var m = this.m;m.x = lx*this.ds, m.y = ly*this.ds;
        var o = this.$drawCode( this, this.parentNode, this.m), l, nlt;
        var t = (new Date()).getTime()*0.001;
        var _self = this;
        function switchState(i, newstate, oldstate){
            var s,c,ht,v,vn;
            s = (v=_self.v_state[i])&0xffff0000, c = v&0xffff;
			
            ht = Math.min(1,(t-_self.v_time[i])*(_self.$_style.graph.$speedlut?(_self.$_style.graph.$speedlut[v]||1):1));
            _self.v_state[i] = vn = c | newstate;
            if(_self.$_style.graph.notransit==1 || _self.$_style.graph.nogap==1) ht = 1;
            _self.v_time[i]  = s==oldstate?(t-(1-ht)/(_self.$_style.graph.$speedlut?(_self.$_style.graph.$speedlut[vn]||1):1)):t;
        }
        
        function setState(i, newstate, t, lt){
            var s,c,v,vn;
            s = (v=_self.v_state[i])&0xffff0000, c = v&0xffff;
            _self.v_state[i] = vn = c | newstate, 
            _self.v_time[i]  = (t-(1-lt)/(this.$_style.graph.$speedlut?(this.$_style.graph.$speedlut[vn]||1):1));
        }
        
        if(o!=(l=this.lastOver)){
            var sb = apf.draw.stateBit;
            // we should remove the over-state from the last
            if(l>=0){
                switchState(l, sb.hoverout, sb.hoverin );
                
                if( this.$_style.graph.nogap==1 &&  t - this.lasttime<0.3 ){
                    if(t-this.lasttime==0){
                        //logw( this.$microtime - this.lastMicro);
                    }
                    var s = this.lastOut, e = l;
                    if( s > e )
                        for(var i = s;i>e;i--)
                            setState(i, sb.hoverout, t - (t-this.lasttime)*(1-(s-i)/(s-e)), 1);
                   else
                        for(var i = s;i<e;i++)
                            setState(i, sb.hoverout, t - (t-this.lasttime)*((e-i)/(e-s)), 1);
                }
                this.lasttime = t, this.lastOut = l, this.lastMicro = this.$microtime;
            }
            if(o>=0){
                switchState(o, sb.hoverin, sb.hoverout );
            }
  
            this.lastOver = o;
			this.$redraw();
        }
    }
    /**** Databinding ****/
    this.$load = function(XMLRoot){
	
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        var v_yval = this.v_yval  = [];
        var v_xval = this.v_xval  = [];
        var v_zval = this.v_zval  = [];
        var v_time = this.v_time  = [];
        var v_caption = this.v_caption  = []; // mouseover title
        var v_state = this.v_state = []; // class

        if (this.$hasBindRule("series")) {
            var rule   = (this.$getBindRule("series", XMLRoot) || {})[4];
            this.setProperty("series", {
                series  : this.$applyBindRule("series", XMLRoot),
                split   : rule.getAttribute("split") || ",",
                datatype   : rule.getAttribute("datatype") || "1X",
                caption : rule.getAttribute("caption") || null,
                cls : rule.getAttribute("class") || null,
                delim   : rule.getAttribute("delimeter") || " ",
                formula : rule.getAttribute("formula") || null,
                length :  rule.getAttribute("length") || null,
                mip :  rule.getAttribute("mip") || null
                
            });
        }
        else if (this.$hasBindRule("formula")) {
            this.setProperty("formula", this.$applyBindRule("formula", XMLRoot));
        }
        else {
            // this.info = [];
            // this.ylabel = {};hoeveel 
            var v_nodes = this.v_nodes  = this.getTraverseNodes(XMLRoot);
            // x / y value array
            var n,p,v,k,length,t = (new Date()).getTime()*0.001;
            if (!this.$hasBindRule("y")){
                apf.console.warn("No y binding rule found for graph "
                                 + this.name + " [" + this.localName + "]");
            }
            else {
                var bz = this.$hasBindRule("z") ? true : false, 
                    bx = this.$hasBindRule("x") ? true : false;
                for (v = 0, length = v_nodes.length; v < length; v++) {
                    n = v_nodes[v];
                    //caching
                    //v_cacheid[apf.xmldb.nodeConnect(this.documentId, n, null, this)] = v;
                
                    this.v_time[v] = t;
                    v_yval[v] = parseFloat(this.$applyBindRule("y", n));
                    if (bx) {
                        v_xval[v] = parseFloat(this.$applyBindRule("x", n));
                        if (bz)
                            v_zval[v] = parseFloat(this.$applyBindRule("z", n));
                    }
                    var cls = this.$applyBindRule("css", n);
                    v_caption[v] = this.$applyBindRule("caption", n);
                    //// TODO write code that looks up class
                    v_state[v] = 0;
                }
                this.$sourcetype = 'seriesX';
            }
            //#ifdef __WITH_PROPERTY_BINDING
            if (length != this.length)
                this.setProperty("length", length);
            //#endif
        }
    };
    
/*	
addEventListener("DOMNodeInsertedIntoDocument", function( e ){

});
 $loadAml
 addEventListener("DOMNodeInserted", function( e ){

});
 addEventListener("DOMNodeRemoved", function( e ){

});
 addEventListener("DOMNodeRemovedFromDocument", function( e ){

});
	addEventListener("DOMNodeInsertedIntoDocument", function( e ){

	});
*/
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
	
        //Clear this component if some ancestor has been detached
        if (action == "redo-remove") {
            var retreatToListenMode = false, model = this.getModel(true);
            if (model) {
                var xpath = model.getXpathByAmlNode(this);
                if (xpath) {
                    var xmlNode = model.data.selectSingleNode(xpath);
                    if (xmlNode != this.xmlRoot)
                        retreatToListenMode = true;
                }
            }
            
            if (retreatToListenMode || this.xmlRoot == xmlNode) {
                //Set Component in listening state untill data becomes available again.
                return model.$waitForXml(this);
            }
        }
    
        if (this.$hasBindRule("series") || this.$hasBindRule("formula")) { 
            //Action Tracker Support
            if (UndoObj && !UndoObj.xmlNode)
                UndoObj.xmlNode = this.xmlRoot;
                
            //#ifdef __WITH_PROPERTY_BINDING
            //@todo apf3.0 check if this is still needed
            /*var lrule, rule;
            for (rule in this.bindingRules) {
                lrule = rule.toLowerCase();
                if (this.$supportedProperties.contains(lrule)) {
                    var value = this.$applyBindRule(rule, this.xmlRoot) || "";

                    if (this[lrule] != value)
                        this.setProperty(lrule, value, true);
                }
            }*/
            // #endif
        }
        else {
            //this should be made more optimal
            var v_yval = this.v_yval  = [];
            var v_xval = this.v_xval  = [];
            var v_zval = this.v_zval  = [];
            var v_time = this.v_time  = [];
            var v_caption = this.v_caption  = []; // mouseover title
            var v_state = this.v_state = []; // class
        
            //cacheid = xmlNode.getAttribute(apf.xmldb.xmlIdTag);
            // this.info = [];
            // this.ylabel = {};hoeveel 
            var v_nodes = this.v_nodes  = this.getTraverseNodes(this.xmlRoot);
            // x / y value array
            var n,p,v,k,length,t = (new Date()).getTime()*0.001;
            if (!this.$hasBindRule("y")){
                apf.console.warn("No y binding rule found for graph "
                                 + this.name + " [" + this.localName + "]");
            }
            else {
                var bz = this.$hasBindRule("z") ? true : false, 
                    bx = this.$hasBindRule("x") ? true : false;
                for (v = 0, length = v_nodes.length; v < length; v++) {
                    n = v_nodes[v];
                    //caching
                    //v_cacheid[apf.xmldb.nodeConnect(this.documentId, n, null, this)] = v;
                
                    this.v_time[v] = t;
                    v_yval[v] = parseFloat(this.$applyBindRule("y", n));
                    if (bx) {
                        v_xval[v] = parseFloat(this.$applyBindRule("x", n));
                        if (bz)
                            v_zval[v] = parseFloat(this.$applyBindRule("z", n));
                    }
                    var cls = this.$applyBindRule("css", n);
                    v_caption[v] = this.$applyBindRule("caption", n);
                    //// TODO write code that looks up class
                    v_state[v] = 0;
                }
                this.$sourcetype = 'seriesX';
            }
            //if (this.focussable)
                //apf.document.activeElement == this ? this.$focus() : this.$blur();

            //#ifdef __WITH_PROPERTY_BINDING
            if (length != this.length)
                this.setProperty("length", length);
            //#endif
			this.$redraw();
        }
    }
    
    /**** Selection ****/
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$parentAxis = this.parentNode;
        this.$parentChart = this.$parentAxis.parentNode;
		var n = this.getElementsByTagNameNS(apf.ns.apf, "style");
		if(n.length>0){
			this.$styletag = n[0].firstChild.nodeValue;
		}
    });
}).call(apf.Graph.prototype = new apf.AmlElement());
// #endif