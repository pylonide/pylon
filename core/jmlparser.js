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

// #ifdef __WITH_APP || __WITH_TELEPORT || __WITH_PARSER
/**
 * @parser
 */
jpf.JMLParser = {
	// #ifdef __WITH_DATABINDING
	sbInit     : {},
	// #endif
	
	stateStack : [],
	modelInit  : [],

	/* ******** INIT ***********
		Initialize Application
	
		INTERFACE:
		this.Init();
	****************************/
	parse : function(x){
		// #ifdef __STATUS
		jpf.status("Start parsing main application");
		// #endif
		// #ifdef __DEBUG
		jpf.Profiler.start();
		// #endif
		this.jml = x;
		
		// #ifdef __DEBUG
		//Check for children in Jml node
		if (!x.childNodes.length)
            throw new Error(1014, jpf.formatErrorString(1014, null, "jpf.JMLParser", "Init\nMessage : Parser got JML without any children"));
		// #endif
		
		//First pass parsing of all JML documents
		for (var docs = [x], i = 0; i < jpf.IncludeStack.length; i++)
            if(jpf.IncludeStack[i].nodeType)
                docs.push(jpf.IncludeStack[i]);
		this.parseFirstPass(docs);

		// #ifdef __WITH_APP

		//Create window and document
		jpf.window                 = new jpf.WindowImplementation();
		jpf.document               = new jpf.DocumentImplementation();
		jpf.window.document        = jpf.document;
		jpf.window.__ActionTracker = new jpf.ActionTracker();
		
		//Main parsing pass
		jpf.JMLParser.parseChildren(x, document.body, jpf.document);//, this);
		
		//Activate Layout Rules [Maybe change idef to something more specific]
		//#ifdef __WITH_ALIGNMENT
		if (jpf.appsettings.layout) {
			jpf.setModel(jpf.appsettings.layout, {
				load: function(xmlNode){
					if (!xmlNode || this.isLoaded) return;
					
					if (!xmlNode)
                        throw new Error(0, jpf.formatErrorString(0, null, "Loading default layout", "Could not find default layout using processing instruction: '" + jpf.appsettings.layout + "'"));
					jpf.layoutServer.loadXml(xmlNode);
					this.isLoaded = true;
				},
				
				setModel: function(model, xpath){
					if (typeof model == "string")
                        model = jpf.NameServer.get("model", model);
					model.register(this, xpath);
				}
			});
		}
		// #endif
		
		//#ifdef __WITH_ALIGNMENT || __WITH_GRID || __WIDTH_ANCHORING
		// #ifdef __WITH_GRID
		jpf.layoutServer.activateGrid();
		// #endif
		
		jpf.layoutServer.activateRules();
		//#endif

		//Last pass parsing
		setTimeout('jpf.JMLParser.parseLastPass();', 1);
		
		//Set init flag for subparsers
		this.inited = true;
		
		// #endif
		
		// #ifdef __DEBUG
		jpf.Profiler.end();
		jpf.status("[TIME] Total load time: " + jpf.Profiler.totalTime + "ms");
		jpf.Profiler.start(true);
		// #endif
	},
	
	parseFirstPass: function(xmlDocs){
		// #ifdef __STATUS
		jpf.status("Parse First Pass");
		// #endif
		
		for (var i = 0; i < xmlDocs.length; i++)
            this.preLoadRef(xmlDocs[i], ["teleport", "presentation", "settings",
                "skin", "bindings[@id]", "actions[@id]", "dragdrop[@id]", "remote"]);
		for (var i = 0; i < xmlDocs.length; i++)
            this.preLoadRef(xmlDocs[i], ["style", "model[@id]", "smartbinding[@id]"], true);
	},
	
	preLoadRef : function(xmlNode, sel, parseLocalModel){
		/*BUG: IE document handling bugs
		- removed to see what this does
		if (jpf.isIE) {
			if (xmlNode.style) return;
		}*/

		var prefix = jpf.findPrefix(xmlNode, jpf.ns.jpf);
        if (prefix) prefix += ":";
		var nodes  = jpf.XMLDatabase.selectNodes("//" + prefix + sel.join("|//"
            + prefix) + (parseLocalModel ? "|" + prefix + "model" : ""), xmlNode);

		//for (var i = nodes.length - 1; i >= 0; i--) {
		for (var i = 0; i < nodes.length; i++) {
			//Check if node should be rendered
			if (jpf.XMLDatabase.getInheritedAttribute(nodes[i], "render") == "runtime")
                continue;

			//Process Node
			if (this.handler[nodes[i][jpf.TAGNAME]]) {
				jpf.status("Processing [preload] '" + nodes[i][jpf.TAGNAME] + "' node");

				this.handler[nodes[i][jpf.TAGNAME]](nodes[i]);
			}

			//Remove Node
			if (nodes[i][jpf.TAGNAME] != "presentation" && nodes[i].parentNode)
				nodes[i].parentNode.removeChild(nodes[i]);
		}
	},
	
	// #ifdef __WITH_APP

    parseMoreJml : function(x, pHtmlNode, jmlParent, noImpliedParent){
        this.parseFirstPass(x);
        this.parseChildren(x, pHtmlNode, jmlParent, noImpliedParent);
        
        jpf.layoutServer.activateGrid();
        jpf.layoutServer.activateRules();//document.body ?? is this allright
        
        this.parseLastPass();
    },

	/**
	 * @private
	 * 
	 * @attribute grid
	 */
	reWhitespaces : /[\t\n\r]+/g,
	parseChildren : function(x, pHtmlNode, jmlParent, checkRender, noImpliedParent){
		// #ifdef __STATUS
		//jpf.status("Parsing children of node '" + x.tagName + "'"); // The slow making line
		// #endif
		// #ifdef __DEBUG
		if (!jpf.Profiler.isStarted) jpf.Profiler.start();
		// #endif
		
		//if (!pHtmlNode) pHtmlNode = document.body;
		
		// Check for delayed rendering flag
		if (checkRender && jmlParent 
		  && jmlParent.hasFeature(__DELAYEDRENDER__) 
		  && jmlParent.__checkDelay(x)) {
			// #ifdef __STATUS
			jpf.status("Delaying rendering of children");
			// #endif
			
			return pHtmlNode;
		}
		if (jmlParent)
            jmlParent.isRendered = true;

		// Dynamicaly load JML
		/*
		if (x.getAttribute("jml")) {
            jmlParent.insertJML(x.getAttribute("jml"), pHtmlNode, x, true);
            x.removeAttribute("jml");
            return;
        }
        */
		if (x.namespaceURI == jpf.ns.jpf)
            this.lastNsPrefix = x.prefix || x.scopeName;
		
		//Loop through Nodes
		for (var oCount = 0,i = 0; i < x.childNodes.length; i++) {
			var q = x.childNodes[i];
			if (q.nodeType == 8) continue;

			// Text nodes and comments
			if (q.nodeType != 1) {
				if (!pHtmlNode) continue;
				
				if (q.nodeType == 3 || pHtmlNode.style && q.nodeType == 4) {
					//if(jmlParent.name == "barTest") debugger;
					pHtmlNode.appendChild(pHtmlNode.ownerDocument
                      .createTextNode(!jpf.hasTextNodeWhiteSpaceBug
                      ? q.nodeValue
                      : q.nodeValue.replace(this.reWhitespaces, " ")));
                      
				}
                else if (q.nodeType == 4)
					pHtmlNode.appendChild(pHtmlNode.ownerDocument.createCDataSection(q.nodeValue));
				//pHtmlNode.appendChild(q);
				//jpf.XMLDatabase.htmlImport(q, pHtmlNode); 
				
				//#ifdef __WITH_LANG_SUPPORT
				jpf.KeywordServer.addElement(q.nodeValue.replace(/^\$(.*)\$$/,
                    "$1"), {htmlNode : pHtmlNode});
				//#endif
				continue;
			}
			
			//Parse node using namespace handler
			if (!this.nsHandler[q.namespaceURI || jpf.ns.xhtml])
                continue; //ignore tag
			this.nsHandler[q.namespaceURI || jpf.ns.xhtml].call(this, q,
                pHtmlNode, jmlParent, noImpliedParent);
		}
		
		if (pHtmlNode) {
			// Grid layout support
			// #ifdef __WITH_GRID
			var gridCols = x.getAttribute("grid");
			if (gridCols)
                jpf.layoutServer.addGrid("var o = jpf.lookup("
                    + jmlParent.uniqueId + ");if(o.oExt.offsetHeight) jpf.compat.gridPlace(o)",
                    pHtmlNode);
			// #endif
	
			//Calculate Alignment and Anchoring
			// #ifdef __WITH_ALIGNMENT
			if(jmlParent && jmlParent.vbox)
				jmlParent.vbox.compileAlignment();
				//jpf.layoutServer.compile(pHtmlNode);
			// #endif
			
			// #ifdef __WITH_ANCHORING || __WITH_ALIGNMENT
			//jpf.layoutServer.activateRules(pHtmlNode);
			// #endif
		}
		
		return pHtmlNode;
	},
	
	addNamespaceHandler : function(xmlns, func){
		this.nsHandler[xmlns] = func;
	},
	
	//Benchmark this with ifs please
	/**
	 *
	 * @define include
	 * @addnode global:include
	 */
	nsHandler : {
		//Javeline PlatForm
		"http://www.javeline.com/2005/PlatForm" : function(x, pHtmlNode, jmlParent, noImpliedParent){
			var tagName = x[jpf.TAGNAME];
			
			// #ifdef __WITH_INCLUDES
			// Includes
			if (tagName == "include") {
				// #ifdef __STATUS
				jpf.status("Switching to include context");
				// #endif
				
				var xmlNode = jpf.IncludeStack[x.getAttribute("iid")];
				//#ifdef __DEBUG
				if (!xmlNode)
                    return jpf.issueWarning(0, "No include file found");
				// #endif
				
				this.parseChildren(xmlNode, pHtmlNode, jmlParent, null, true);
			}
            else 
			// #endif

			// Handler
			if (this.handler[tagName]) {
				// #ifdef __STATUS
				jpf.status("Processing '" + tagName + "' node");
				// #endif
				
				this.handler[tagName](x, noImpliedParent ? null : jmlParent);
			}
			//XForms
			//#ifdef __WITH_XFORMS
			else if (jmlParent && (jmlParent.hasFeature(__XFORMS__)
              && (this.xforms[tagName] || jmlParent.setCaption
              && this.xforms[tagName] > 2))) {
				switch (this.xforms[tagName]) {
					case 1: //Set Event
						if (x.getAttribute("ev:event")) {
							jmlParent.dispatchEvent(x.getAttribute("ev:event"),
                                function(){
    								this.executeXFormStack(x);
    							});
						}
                        else
                            jmlParent.executeXFormStack(x);
					    break;
					case 2: //Parse in Element
						jmlParent.parseXFormTag(x);
					    break;
					case 3: //Label
						if (jmlParent.setCaption) {
							jmlParent.setCaption(x.firstChild.nodeValue); //or replace it or something...
							break;
						}
					
						//Create element using this function
						var oLabel = this.nsHandler[jpf.ns.jpf].call(this, x,
                            jmlParent.oExt.parentNode, jmlParent.parentNode);
						
						//Set Dom stuff
						oLabel.parentNode = jmlParent.parentNode;
						for (var i = 0; i < jmlParent.parentNode.childNodes.length; i++) {
							if (jmlParent.parentNode.childNodes[i] == jmlParent) {
								jmlParent.parentNode.childNodes[i] = oLabel;
							}
                            else if (jmlParent.parentNode.childNodes[i] == oLabel) {
								jmlParent.parentNode.childNodes[i] = jmlParent;
								break;
							}
						}
						
						//Insert element to parentHtmlNode of jmlParent and before the node
						oLabel.oExt.parentNode.insertBefore(oLabel.oExt, jmlParent.oExt);
						
						//Use for
						oLabel.setFor(jmlParent);
					    break;
				}
			}
			//#endif
			//JML Components
			else if(pHtmlNode) {
				// #ifdef __DEBUG
				if (!jpf[tagName] || typeof jpf[tagName] != "function")
                    throw new Error(1017, jpf.formatErrorString(1017, null, "Initialization", "Could not find Class Definition '" + tagName + "'.", x));
				// #endif
				if (!jpf[tagName])
                    throw new Error(0, "Could not find class " + tagName);
				var objName = tagName;
				
				//Check if Class is loaded in current Window
				//if(!self[tagName]) main.window.jpf.importClass(main.window[tagName], false, window);
		
				//#ifdef __WITH_XFORMS
				if (tagName == "select1" && x.getAttribute("appearance") == "minimal") {
					objName = "dropdown";
				}
				//#endif
		
				//Create Object en Reference
				var o = new jpf[objName](pHtmlNode, tagName, x);
				if (x.getAttribute("id"))
                    jpf.setReference(x.getAttribute("id"), o);
	
				//Process JML
				if (o.loadJML)
                    o.loadJML(x, jmlParent);
			}
			
			return o;
		}
	
		//#ifdef __WITH_XSD
		//XML Schema Definition
		,"http://www.w3.org/2001/XMLSchema" : function(x, pHtmlNode, jmlParent, noImpliedParent){
			var type = jpf.XSDParser.parse(x);
			if (type && jmlParent)
                jmlParent.setProperty("datatype", type);
		}
		//#endif
	
		// #ifdef __WITH_HTML_PARSING
		//XHTML
		,"http://www.w3.org/1999/xhtml" :  function(x, pHtmlNode, jmlParent, noImpliedParent){
			var parseWhole = x.tagName.match(/table|object|embed/i) ? true : false;
			
			// Move all this to the respective browser libs in a wrapper function
			if (x.tagName == "option") {
				var o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.createElement("option"));
				if (x.getAttribute("value"))
                    o.setAttribute("value", x.getAttribute("value"));
			}
            else if (jpf.isIE) {
				var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x.cloneNode(false))
                    : jpf.XMLDatabase.htmlImport(x.cloneNode(parseWhole), pHtmlNode);
			}
            else if (jpf.isSafari) { //SAFARI importing cloned node kills safari.. temp workaround in place
				//o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.importNode(x));//.cloneNode(false)
				var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x)
                    : jpf.XMLDatabase.htmlImport(x.cloneNode(parseWhole), pHtmlNode);
			}
            else {
				var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x.cloneNode(false))
                    : jpf.XMLDatabase.htmlImport(x.cloneNode(false), pHtmlNode);
				//o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.importNode(x.cloneNode(false), false));	
			}
			
			//Check attributes for j:left etc and j:repeat-nodeset
			var tagName;
            var prefix = this.lastNsPrefix || jpf.findPrefix(x.parentNode, jpf.ns.jpf) || "";
			if (prefix) {
				if (!jpf.supportNamespaces)
                    x.ownerDocument.setProperty("SelectionNamespaces", "xmlns:"
                        + prefix + "='" + jpf.ns.jpf + "'");
				prefix += ":";
			}
			
			var done = {}, aNodes = x.selectNodes("@" + prefix + "*");
			for (var i = 0; i < aNodes.length; i++) {
				tagName = aNodes[i][jpf.TAGNAME];
				
				if (tagName.match(/^(left|top|right|bottom|width|height|align)$/)) {
					if (done["position"]) continue;
					done["position"] = true;
					//Create positioning object - remove attributes when done
					var html = new jpf.HtmlWrapper(pHtmlNode, o, prefix);
					
					if (x.getAttribute(prefix + "align")
                      || x.getAttribute(prefix + "align-position")) {
						html.enableAlignment()
					}
                    else if (x.getAttribute(prefix + "width")
                      || x.getAttribute(prefix + "height")
                      || x.getAttribute(prefix + "left")
                      || x.getAttribute(prefix + "top")
                      || x.getAttribute(prefix + "right")
                      || x.getAttribute(prefix + "bottom")
                      || x.getAttribute(prefix + "anchoring") == "true") {
						html.getDiff();
						html.setHorizontal(x.getAttribute(prefix + "left"),
                            x.getAttribute(prefix + "right"),
                            x.getAttribute(prefix + "width"));
						html.setVertical(x.getAttribute(prefix + "top"),
                            x.getAttribute(prefix + "bottom"),
                            x.getAttribute(prefix + "height"));
					}

					//return o;
				}
				
				//#ifdef __WITH_XFORMS
				/* XForms support
					- repeat-model 
					- repeat-bind 
					- repeat-nodeset 
					- repeat-startindex 
					- repeat-number 
				*/
				else if (tagName.match(/^repeat-/)) {
					if (done["repeat"]) continue;
					done["repeat"] = true;
					//Create repeat object - remove attributes when done
					
				}
				//#endif
			}
			
			if (jpf.canUseInnerHtmlWithTables || !parseWhole)
				this.parseChildren(x, o, jmlParent);
			else {
				//#ifdef __DEBUG
				jpf.issueWarning(0, "Not parsing children of table, ignoring all Javeline Platform Elements.");
				//#endif
			}
			
			// #ifdef __WITH_EDITMODE || __WITH_MULTI_LANG
			if (jpf.XMLDatabase.getTextNode(x)) {
				var data = {
					jmlNode  : x,
					htmlNode : o
				}
				
				/* #ifdef __WITH_EDITMODE
				EditServer.register(data);
				#endif */
				// #ifdef __WITH_MULTI_LANG
				jpf.KeywordServer.addElement(jpf.XMLDatabase.getTextNode(x)
                    .nodeValue.replace(/^\$(.*)\$$/, "$1"), data);
				// #endif
			}
			// #endif
			
			return o;
		}
		// #endif
	},
	
	//#ifdef __WITH_XFORMS
	xforms : {
		"label"       : 3, //any non-has-children node
		
		"action"      : 1, //stacked processing
		"dispatch"    : 1,
		"rebuild"     : 1,
		"recalculate" : 1,
		"revalidate"  : 1,
		"refresh"     : 1,
		"setfocus"    : 1,
		"load"        : 1,
		"setvalue"    : 1,
		"send"        : 1,
		"reset"       : 1,
		"message"     : 1,
		"insert"      : 1,
		"delete"      : 1,
		
		"filename"    : 2, //widget specific processing
		"mediatype"   : 2,
		"itemset"     : 2,
		"item"        : 2,
		"choices"     : 2,
		"copy"        : 2,
		"help"        : 2,
		"hint"        : 2
	},
	//#endif
	
	//#endif
			
	handler : {
		/**
		 * @define script
		 * @addnode global:script, anyjml:script
		 */
		"script" : function(q){
			//if(IS_SAFARI) return;
			if (q.getAttribute("src")) {
				//temp solution
				if (jpf.isOpera)
                    setTimeout(function(){
                        jpf.window.loadCodeFile(jpf.hostPath + q.getAttribute("src"));
                    }, 1000);
				else
                    jpf.window.loadCodeFile(jpf.hostPath + q.getAttribute("src"));
			}
            else if (q.firstChild) {
				var scode = q.firstChild.nodeValue;// + ";\nvar __LoadedScript = true;"
				jpf.exec(scode);
					
				//#ifdef __DEBUG
				//if(!__LoadedScript)
				//	throw new Error(0, jpf.formatErrorString(0, null, "Inserting Code Block", "An Error has occurred inserting the javascript code block", q));
				//#endif
			}
		},
		
		//#ifdef __WITH_PRESENTATION
		/**
		 * @define style
		 * @addnode global:style, anyjml:style
		 */
		"style" : function(q){
			jpf.importCssString(document, q.firstChild.nodeValue);
		},
		
		/**
		 * @define comment
		 * @addnode anyjml:comment
		 */
		"comment" : function (q){
			//do nothing
		},
		
		/**
		 * @define presentation
		 * @addnode global:presentation, anyjml:presentation
		 */
		"presentation" : function(q){
			var name = "skin" + Math.round(Math.random() * 100000);
			q.parentNode.setAttribute("skin", name);
			jpf.PresentationServer.skins[name] = {name:name,templates:{}}
			var t    = q.parentNode[jpf.TAGNAME];
			var skin = q.ownerDocument.createElement("skin"); skin.appendChild(q);
			jpf.PresentationServer.skins[name].templates[t] = skin;
		},
		
		/**
		 * @define skin
		 * @addnode global:skin, anyjml:skin
		 */
		"skin" : function(q, jmlParent){
			if (jmlParent) {
				var name = "skin" + Math.round(Math.random() * 100000);
				q.parentNode.setAttribute("skin", name);
				jpf.PresentationServer.skins[name] = {name: name, templates: {}};
				jpf.PresentationServer.skins[name].templates[q.parentNode[jpf.TAGNAME]] = q;
			}
            else if (q.childNodes.length) {
				jpf.PresentationServer.Init(q);
			}
            else {
				var path = q.getAttribute("src")
                    ? jpf.getAbsolutePath(jpf.hostPath, q.getAttribute("src"))
                    : jpf.getAbsolutePath(jpf.hostPath, q.getAttribute("name")) + "/index.xml";
				
				jpf.loadJMLInclude(q, true, path);
			}
		},
		//#endif
		
		//#ifdef __WITH_DATABINDING || __WITH_XFORMS
		
		"model" : function(q, jmlParent){
			if (jmlParent && !jmlParent.hasFeature(__DATABINDING__))
                jmlParent = null;
			
			//Model
			var modelId, m = new jpf.Model().register(jmlParent).loadJML(q);
			if (jmlParent) {
				modelId = "model" + this.uniqueId;
				jmlParent.jml.setAttribute("model", modelId);
			}
            else
                modelId = q.getAttribute("id");
			
			if (!jpf.JMLParser.globalModel)
                jpf.JMLParser.globalModel = m;
			else
                jpf.JMLParser.globalModel = -1;
			
			return modelId
                ? jpf.setReference(modelId, jpf.NameServer.register("model", modelId, m))
                : m;
		},
		
		//#ifdef __WITH_SMARTBINDINGS
		
		"smartbinding" : function(q, jmlParent){
			var bc = new jpf.SmartBinding(q.getAttribute("id"), q);
			if (q.getAttribute("id"))
                jpf.NameServer.register("smartbinding", q.getAttribute("id"), bc)
			if (jmlParent && jmlParent.hasFeature(__DATABINDING__))
                jpf.JMLParser.addToSbStack(jmlParent.uniqueId, bc);
		},
		//getFromSbStack
		
		/**
		 * @define ref
		 * @addnode smartbinding:ref
		 */
		"ref" : function(q, jmlParent){
			var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
			bc.addBindRule(q, jmlParent);
		}, //not referencable
		
		/**
		 * @addnode global:bindings, smartbinding:bindings
		 */
		"bindings" : function(q, jmlParent){
			var rules = jpf.getRules(q);
			if (q.getAttribute("id"))
                jpf.NameServer.register("bindings", q.getAttribute("id"), rules);
			if (jmlParent && jmlParent.hasFeature(__DATABINDING__)) {
				var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                    || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
				bc.addBindings(rules, q);
			}
		},
		
		/**
		 * @define action
		 * @addnode smartbinding:action
		 */
		"action" : function(q, jmlParent){
			var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
			bc.addActionRule(q, jmlParent);
		}, //not referencable
		
		/**
		 * @addnode global:actions, smartbinding:actions
		 */
		"actions" : function(q, jmlParent){
			var rules = jpf.getRules(q);
			if (q.getAttribute("id"))
                jpf.NameServer.register("actions", q.getAttribute("id"), rules);
			if (jmlParent && jmlParent.hasFeature(__DATABINDING__)) {
				var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                    || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
				bc.addActions(rules, q);
			}
		},
		
		// #endif
		// #endif
		
		// #ifdef __WITH_ACTIONTRACKER
		"actiontracker" : function(q, jmlParent){
			var at;
			
			if (q.getAttribute("id")) 
				at = jpf.setReference(q.getAttribute("id"),
                    jpf.NameServer.register("actiontracker",
                    q.getAttribute("id"), new jpf.ActionTracker()));
			
			if (jmlParent)
                jmlParent.__ActionTracker = at || new jpf.ActionTracker(jmlParent);
			
			if (!q.getAttribute("id") && !jmlParent) {
				// #ifdef __DEBUG
				throw new Error(1016, jpf.formatErrorString(1016, null, "ActionTracker", "Could not create ActionTracker without an id specified"));
				// #endif
			}
		},
		//#endif
		
		// #ifdef __WITH_CONTEXTMENU
		
		/**
		 * @define contextmenu 
		 * @addnode global:contextmenu, smartbinding:contextmenu
		 */
		"contextmenu" : function(q, jmlParent){
			if (!jmlParent) return; //not supported
			
			if (!jmlParent.contextmenus)
                jmlParent.contextmenus = [];
			jmlParent.contextmenus.push(q);
		},
		
		//#endif

		// #ifdef __WITH_DRAGDROP
		"allow-drag" : function(q, jmlParent){
			var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
			bc.addDragRule(q, jmlParent);
		},  //not referencable
		
		"allow-drop" : function(q, jmlParent){
			var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
			bc.addDropRule(q, jmlParent);
		},  //not referencable
		
		/**
		 * @addnode global:dragdrop[@id], smartbinding:dragdrop
		 */
		"dragdrop" : function(q, jmlParent){
			var rules = jpf.getRules(q);
			if (q.getAttribute("id"))
                jpf.NameServer.register("dragdrop", q.getAttribute("id"), rules);
			if (jmlParent && jmlParent.hasFeature(__DATABINDING__)) {
				var bc = jpf.JMLParser.getFromSbStack(jmlParent.uniqueId)
                    || jpf.JMLParser.addToSbStack(jmlParent.uniqueId, new jpf.SmartBinding());
				bc.addDragDrop(rules, q);
			}
		},
		// #endif
			
		// #ifdef __WITH_TELEPORT
		// #ifdef __TP_SOCKET
		"socket" : function(q){
			var o = new Socket();
			jpf.setReference(x.getAttribute("id"), o);
			o.load(q);
		},

		"poll" : function(q){
			jpf.setReference(x.getAttribute("id"), new jpf.poll().load(q));
		},
		// #endif
		
		//problem:
		"teleport" : function(q){
			//Initialize Communication Component
			//jpf.setReference(x.getAttribute("id"), new jpf.BaseComm(x));
			jpf.Teleport.loadJML(q);
		},
		
		// #endif
		
		// #ifdef __WITH_RSB
		/**
		 * @define remote
		 */
		"remote" : function(q){
			//Remote Smart Bindings
		    jpf.NameServer.register("remote", q.getAttribute("id"), new jpf.RemoteSmartBinding(q.getAttribute("id"), q))
		},
		// #endif
		
		/**
		 * @define appsettings
		 */
		"appsettings" : function(q, jmlParent){
			this.foundSettings = true;
			this.lastSettings  = q;
			
			jpf.appsettings.loadJML(q);
		}
		
		//#ifdef __DESKRUN
		/**
		 * @define deskrun
		 */
		, "deskrun" : function(q){
			if (!jpf.hasDeskRun) return;
			jpf.window.loadJML(q);
		}
		//#endif
		
		//#ifdef __WITH_APP
		, "window" : function(q){
			jpf.windowManager.addForm(q);
		},
		
		"loader" : function(q){
			//ignore, handled elsewhere
		}
		//#endif
	},
	
	// #ifdef __WITH_SMARTBINDINGS
	getSmartBinding : function(id){
        return jpf.NameServer.get("smartbinding", id);
    },
	// #endif
	
	// #ifdef __WITH_ACTIONTRACKER
	getActionTracker : function(id){
		var at = jpf.NameServer.get("actiontracker", id);
		if (at)
            return at;
		if (self[id])
            return self[id].getActionTracker();
	},
	// #endif
	
	// #ifdef __WITH_PRESENTATION
	replaceNode : function(newNode, oldNode){
		var nodes = oldNode.childNodes;
		for (var i = nodes.length - 1; i >= 0; i--) 
			newNode.insertBefore(nodes[i], newNode.firstChild);
			
		newNode.onresize = oldNode.onresize;
		
		return newNode;
	},
	// #endif
	
	/* ******** parseLastPass ***********
		Process Databinding Rules of all objects set
	
		INTERFACE:
		this.parseLastPass();
	****************************/
	parseLastPass : function(){
		/* #ifdef __WITH_EDITMODE
		return;
		#endif */
		
		// #ifdef __STATUS
		jpf.status("Processing SmartBinding hooks");
		// #endif
		
		/*
			All these component dependant things might
			be suited better to be in a component generation
			called event
		*/
		
		// #ifdef __WITH_DATABINDING || __WITH_XFORMS || __WITH_SMARTBINDINGS
		while (this.hasNewSbStackItems) {
			var sbInit              = this.sbInit;
            this.sbInit             = {};
			this.hasNewSbStackItems = false;
			
			//Initialize Databinding for all GUI Elements in Form
			for (var uniqueId in sbInit) {
				if (parseInt(uniqueId) != uniqueId)
                    continue;
	
				//Retrieve Jml Node
				var jNode = jpf.lookup(uniqueId);
	
				//Set Main smartbinding
				if (sbInit[uniqueId][0])
                    jNode.setSmartBinding(sbInit[uniqueId][0]);
				
				//Set selection smartbinding if any
				if (sbInit[uniqueId][1])
                    jNode.setSelectionSmartBinding(sbInit[uniqueId][1]);
			}
		}
		this.sbInit = {};
		// #endif
		
		//#ifdef __WITH_STATE
		// Initialize state bindings
		for (var i = 0; i < this.stateStack.length; i++) {
			if (this.stateStack[i][1] == "visible"
              && (jpf.isFalse(this.stateStack[i][2])
              || jpf.isTrue(this.stateStack[i][2])))
                continue;
			this.stateStack[i][0].setDynamicProperty(this.stateStack[i][1],
                this.stateStack[i][2]);
		}
		this.stateStack = [];
		//#endif

		// #ifdef __WITH_MODEL || __WITH_XFORMS
		//Initialize Models
		while (this.hasNewModelStackItems) {
			var jmlNode, modelInit     = this.modelInit;
            this.modelInit             = {};
			this.hasNewModelStackItems = false;
			
			for (var data,i = 0; i < modelInit.length; i++) {
				data    = modelInit[i][1];
				data[0] = data[0].substr(1);
				
				jmlNode = eval(data[0]);
				if (jmlNode.connect)
                    jmlNode.connect(modelInit[i][0], null, data[2], data[1] || "select");
				else
                    jmlNode.setModel(new jpf.Model().loadFrom(data.join(":")));
			}
		}
		this.modelInit = [];
		// #endif
		
		//Call the onload event
		if (jpf.onload) {
			jpf.onload();
			jpf.onload = null;
		}
		jpf.loaded = true;
		
		//#ifdef __WITH_OFFLINE
        if (jpf.appsettings.offline)
            jpf.offline.init(jpf.appsettings.offline)
        //#endif
		
		//#ifdef __WITH_XFORMS
		var models = jpf.NameServer.getAll("model");
		for (var i = 0; i < models.length; i++)
            models[i].dispatchEvent("xforms-ready");
		//#endif
		
		if (!this.loaded) {
			// #ifdef __DESKRUN
			if (jpf.window.useDeskRun)
                jpf.window.deskrun.Show();
			// #endif
			
			// Set the default selected element
			jpf.window.moveNext();
			
			this.loaded = true;
		}

		// END OF ENTIRE APPLICATION STARTUP
		
		// #ifdef __STATUS
		jpf.status("Initialization finished");
		// #endif
		// #ifdef __DEBUG
		jpf.Profiler.end();
		jpf.status("[TIME] Total time for SmartBindings: " + jpf.Profiler.totalTime + "ms");
		// #endif
	}
	
	// #ifdef __WITH_DATABINDING || __WITH_XFORMS || __WITH_SMARTBINDINGS
	, addToSbStack : function(uniqueId, sNode, nr){
		this.hasNewSbStackItems = true;
		if (!this.sbInit[uniqueId])
            this.sbInit[uniqueId] = [];
		this.sbInit[uniqueId][nr||0] = sNode;
		return sNode;
	},
	
	getFromSbStack : function(uniqueId, nr){
		return this.sbInit[uniqueId] ? this.sbInit[uniqueId][nr || 0] : null;
	},
	
	stackHasBindings : function(uniqueId){
		return (this.sbInit[uniqueId] && this.sbInit[uniqueId][0]
          && this.sbInit[uniqueId][0].bindings);
	},
	// #endif
	
	// #ifdef __WITH_MODEL
	modelInit       : [],
	addToModelStack : function(o, data){
		this.hasNewModelStackItems = true;
		this.modelInit.push([o, data]);
	}
	// #endif
}

//#endif

jpf.Init.run('jpf.JMLParser');
