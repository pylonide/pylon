apf.process.handler.xsd = function(oParser){
    apf.makeClass(this);
    this.inherit(apf.ProjectBase);
    
    var parser = this;
    var groups = {
        "all-bindings" : [],
        "all-actions" : [],
        "global" : [],
        "anyjml" : []
    };
    
    function addNode(str){
        var data = str.trim().split(/\s*\,\s*/);
        for(var i=0;i<data.length;i++){
            var info = data[i].split(":");
            if (!groups[info[0]]) groups[info[0]] = [];
            groups[info.shift()].pushUnique(info.join(":"));
        }
    }
    
    function addDoc(node, text){
        if (!text) return;
        
        var dNode = docFrag.cloneNode(true);
        dNode.removeAttribute("id");
        node.insertBefore(dNode, node.firstChild);
        dNode.selectSingleNode("documentation").firstChild.nodeValue = text || "";
    }

    function hasProperties(struct){
        for(var prop in struct){
            return true;
        }
        return false;
    }
    
    function checkBase(item, type, name){
        var bc = item.metadata.inherits;
        if (!bc) return false;

        for(var i=0;i<bc.length;i++){
            if (!oParser.data.global.baseclasses[bc[i].replace(/^apf\./, "")])
                continue;
            
            if (oParser.data.global.baseclasses[bc[i].replace(/^apf\./, "")][type][name])
                return true;
        }
        
        return false;
    }
    
    this.save = function(){
        var template = this.template.cloneNode(true);
    
        apf.console.info("Saving xsd " + fOutput.path);
    
        function remove(node){
            node.parentNode.removeChild(node);
        }

        //cleanup
        remove(template.selectSingleNode("annotation[@id='docFrag']"));
        remove(template.selectSingleNode("sequence[@id='itemSequence']"));
        remove(template.selectSingleNode("node()[@name='baseclass-bindings']"));
        remove(template.selectSingleNode("node()[@name='baseclass-actions']"));
        remove(template.selectSingleNode("node()[@name='baseclass-attributes']"));
        remove(template.selectSingleNode("node()[@name='component-smartbinding']"));
        remove(template.selectSingleNode("node()[@name='component-children']"));
        remove(template.selectSingleNode("node()[@name='component-subnodes']"));
        remove(template.selectSingleNode("node()[@name='class']"));
        remove(template.selectSingleNode("node()[@name='group']"));

        var nodes = template.selectNodes("//choice[not(node()[2])]");
        for(var i=0;i<nodes.length;i++) remove(nodes[i]);

        //template.normalize();
        var nodes = template.selectNodes("//complexType[not(node()[2])]");
        for(var i=0;i<nodes.length;i++) remove(nodes[i]);

        fOutput.data = template.xml//apf.formatXML();
    }
    
    this.__addClass = function(item){
        var template = this.template.selectSingleNode("element[@name='" + item.name.toLowerCase() + "']");
        if (!template){
            template = this.template.selectSingleNode("element[@name='class']");

            //build element for each class
            t = this.template.appendChild(template.cloneNode(true));
            t.setAttribute("name", item.name.toLowerCase());
        }
        else t = template;
    
        if (!item.metadata)
            item.metadata = {description:[]};
    
        if (item.metadata.description[0])
            addDoc(t, item.metadata.description[0]);
        
        //Attributes
        if (item.metadata.attribute){
            var point = t.selectSingleNode("complexType");
            
            for(var name, str, node, i=0;i<item.metadata.attribute.length;i++){
                node = point.appendChild(this.templateDoc.createElement("attribute"));//ownerDocument
                str = item.metadata.attribute[i].split(/\s+/);
                node.setAttribute("name", str.shift());
                addDoc(node, str.join(" "));
            }
        }
        
        //Nodes
        var point = t.selectSingleNode(".//choice");
        if (item.metadata.allowchild){
            for(var options, node, i=0;i<item.metadata.allowchild.length;i++){
                options = item.metadata.allowchild[i].split(/,\s+/);
                for(var j=0;j<options.length;j++){
                    if (options[j] == "[cdata]"){
                        
                    }
                    else if (options[j].match(/^\{(.*)\}$/)){
                        node = point.appendChild(this.templateDoc.createElement("group"));//ownerDocument
                        node.setAttribute("ref", RegExp.$1);
                    }
                    else{
                        node = point.appendChild(this.templateDoc.createElement("element"));//ownerDocument
                        node.setAttribute("ref", options[j]);
                    }                            
                }
            }
        }
        /*else{
            point.parentNode.removeChild(point);
        }*/
        
        //Defines
        if (item.metadata.define){
            for(var i=0;i<item.metadata.define.length;i++){
                this.__addClass(item.metadata.define[i]);
            }
        }
        
        //Addnode
        if (item.metadata.addnode){
            for(var i=0;i<item.metadata.addnode.length;i++){
                addNode(item.metadata.addnode[i]);
            }
        }
    }
    
    this.__addBaseClass = function(item){
        //create baseclass-bindings
        if (!item.name.match(/^(?:MultiLevelBinding|Rename)$/) && hasProperties(item.bindings)){
            var template = this.template.selectSingleNode("group[@name='baseclass-bindings']");
            var t = this.template.appendChild(template.cloneNode(true));
            t.setAttribute("name", item.name + "-bindings");
            var added = false, node, point = t.selectSingleNode(".//choice");
            
            for(var name in item.bindings){
                node = point.appendChild(this.templateDoc.createElement("element"));
                node.setAttribute("name", name);
                node.setAttribute("type", "binding");
                if (item.bindings[name].metadata)
                    addDoc(node, item.bindings[name].metadata.description);
                
                groups["all-bindings"].pushUnique(name);
            }
            
            this.addBaseStuff(item, point, "bindings");
        }
        
        //create baseclass-actions
        if (hasProperties(item.actions)){
            var template = this.template.selectSingleNode("group[@name='baseclass-actions']");
            var t = this.template.appendChild(template.cloneNode(true));
            t.setAttribute("name", item.name + "-actions");
            var added = false, node, point = t.selectSingleNode(".//choice");
            
            for(var name in item.actions){
                node = point.appendChild(this.templateDoc.createElement("element"));
                node.setAttribute("name", name);
                node.setAttribute("type", "action");
                if (item.actions[name].metadata)
                    addDoc(node, item.actions[name].metadata.description);
                
                groups["all-actions"].pushUnique(name);
            }
            
            this.addBaseStuff(item, point, "actions");
        }
        
        //create baseclass-attributes
        if (!item.name.match(/^(?:MultiLevelBinding|Transaction)$/) && hasProperties(item.jmlprop)){
            var template = this.template.selectSingleNode("attributeGroup[@name='baseclass-attributes']");
            var t = this.template.appendChild(template.cloneNode(true));
            t.setAttribute("name", item.name + "-attributes");
            var point = t;
            
            var lookup = {};
            if (item.metadata.attributes){
                for(var str, i=0;i<item.metadata.attributes.length;i++){
                    str = item.metadata.attribute[i].split(/\s+/);
                    lookup[str.shift()] = str.join(" ");
                }
            }
            
            for(var name in item.jmlprop){
                if (item.name == "JmlNode" && name.match(/^(?:smartbinding|actiontracker|align|right|left|top|width|height|ref)$/)) continue;
                
                node = point.appendChild(this.templateDoc.createElement("attribute"));
                node.setAttribute("name", name);
                if (lookup[name]) addDoc(node, lookup[name]);
            }
            
            this.addBaseAttr(item, t, true);
        }
        
        //Defines
        if (item.metadata.define){
            for(var str, node, i=0;i<item.metadata.define.length;i++){
                this.__addClass(item.metadata.define[i]);
            }
        }
        
        //Addnode
        if (item.metadata.addnode){
            for(var i=0;i<item.metadata.addnode.length;i++){
                addNode(item.metadata.addnode[i]);
            }
        }
    }
    
    this.addBaseStuff = function(item, t, type){
        if (item.metadata.inherits){
            point = t;//.selectSingleNode(".//element[@name='" + type + "']/complexType/sequence/choice");
            for(var i=0;i<item.metadata.inherits.length;i++){
                var str = item.metadata.inherits[i].replace(/^apf\./, "") + "-" + type;
                if (this.template.selectSingleNode(".//group[@name='" + str + "']"))
                    point.appendChild(this.templateDoc.createElement("group")).setAttribute("ref", str);
            }
        }
    }
    
    this.addBaseAttr = function(item, point, queued){
        //if (queued) return setTimeout(function(){parser.addBaseAttr(item, point)});

        if (item.metadata.inherits){
            for(var i=0;i<item.metadata.inherits.length;i++){
                var str = item.metadata.inherits[i].replace(/^apf\./, "") + "-attributes";
                if (this.template.selectSingleNode(".//attributeGroup[@name='" + str + "']"))
                    point.appendChild(this.templateDoc.createElement("attributeGroup")).setAttribute("ref", str);
            }
        }
    }
    
    this.__addControl = function(item){
        var node, point, template, t;
        //create elements based on type

        if (item.metadata.inherits && (item.name == "radiobutton" 
          || item.metadata.inherits.contains("apf.DataBinding")
          || item.metadata.inherits.contains("apf.MultiLevelBinding")
          || hasProperties(item.bindings) || hasProperties(item.actions))){
            template = this.template.selectSingleNode("element[@name='component-smartbinding']");
            t = this.template.appendChild(template.cloneNode(true));
            
            if (item.metadata.inherits.contains("apf.MultiSelect"))
                t.selectSingleNode("complexType/sequence").appendChild(itemSequence.cloneNode(true)).removeAttribute("id");
            
            this.addBaseStuff(item, t, "bindings");
            this.addBaseStuff(item, t, "actions");
            
            //create baseclass-bindings
            if (hasProperties(item.bindings)){
                point = t.selectSingleNode(".//element[@name='bindings']/complexType/sequence/choice");
                for(var name in item.bindings){
                    if (checkBase(item, "bindings", name)) continue;
                    
                    node = point.appendChild(this.templateDoc.createElement("element"));
                    node.setAttribute("name", name);
                    node.setAttribute("type", "binding");

                    if (!item.bindings[name].metadata)
                        item.bindings[name].metadata = {};

                    addDoc(node, item.bindings[name].metadata.description);
                    
                    groups["all-bindings"].pushUnique(name);
                }
            }
            
            //create baseclass-actions
            if (hasProperties(item.actions)){
                point = t.selectSingleNode(".//element[@name='actions']/complexType/sequence/choice");
                for(var name in item.bindings){
                    if (checkBase(item, "actions", name)) continue;
                    
                    node = point.appendChild(this.templateDoc.createElement("element"));
                    node.setAttribute("name", name);
                    node.setAttribute("type", "action");
                    addDoc(node, item.bindings[name].metadata.description);
                    
                    groups["all-actions"].pushUnique(name);
                }
            }
        }
        else if (!item.canHaveChildren){
            template = this.template.selectSingleNode("element[@name='component-subnodes']");
            t = this.template.appendChild(template.cloneNode(true));
            point = t.selectSingleNode("complexType/choice");
            
            if (item.metadata.allowchild){
                for(var options, node, i=0;i<item.metadata.allowchild.length;i++){
                    options = item.metadata.allowchild[i].split(/,\s+/);
                    for(var j=0;j<options.length;j++){
                        if (options[i] == "[cdata]"){
                            
                        }
                        else if (options[i].match(/^\{(.*)\}$/)){
                            node = point.appendChild(this.templateDoc.createElement("group"));
                            node.setAttribute("ref", RegExp.$1);
                        }
                        else{
                            node = point.appendChild(this.templateDoc.createElement("element"));
                            node.setAttribute("ref", options[i]);
                        }                            
                    }
                }
            }
        }
        else{
            template = this.template.selectSingleNode("element[@name='component-children']");
            t = this.template.appendChild(template.cloneNode(true));
        }
        
        //set name and description
        t.setAttribute("name", item.name.toLowerCase());
        if (item.metadata.description) addDoc(t, item.metadata.description[0]);
        
        //create attributes nodes
        var point = t.selectSingleNode("complexType");
        this.addBaseAttr(item, point);
        
        if (hasProperties(item.jmlprop)){
            var lookup = {};
            if (item.metadata.attributes){
                for(var str, i=0;i<item.metadata.attributes.length;i++){
                    str = item.metadata.attribute[i].split(/\s+/);
                    lookup[str.shift()] = str.join(" ");
                }
            }
            
            for(var name in item.jmlprop){
                if (name.match(/^(?:ref|jml|zindex|skin|id|minwidth|minheight)$/) 
                  || checkBase(item, "jmlprop", name)) 
                    continue;
                //|skin|css|cssclass
                
                node = point.appendChild(this.templateDoc.createElement("attribute"));
                node.setAttribute("name", name);
                if (lookup[name]) addDoc(node, lookup[name]);
            }
        }
        
        //Defines
        if (item.metadata.define){
            for(var str, node, i=0;i<item.metadata.define.length;i++){
                this.__addClass(item.metadata.define[i]);
            }
        }
        
        //Addnode
        if (item.metadata.addnode){
            for(var i=0;i<item.metadata.addnode.length;i++){
                addNode(item.metadata.addnode[i]);
            }
        }
        
        //Aliasses (should be done using complexType ref but dirty for now)
        if (item.metadata.alias){
            for(var i=0;i<item.metadata.alias.length;i++){
                this.template.appendChild(t.cloneNode(true))
                    .setAttribute("name", item.metadata.alias[i].replace(/^apf\./, ""));
            }
        }
    }

    this.generate = function(){
        var data = oParser.data.global;
        
        //process addnode and create groups
        
        //Loop through all classes of apf
        var t, item, context = data.objects.apf.classes;
        for(item in context){
            //ignore private
            if (context[item].metadata.private) continue
            
            //ignore classes without metadata.type
            if (!context[item].metadata.type 
              || !(context[item].metadata.attribute 
              || context[item].metadata.allowchild 
              || context[item].metadata.addnode)) 
                continue
            
            this.__addClass(context[item]);
        }
        
        //Loop through all the baseclass of apf
        var t, item, context = data.baseclasses;
        for(item in context){
            this.__addBaseClass(context[item]);
        }
        
        //Loop through controls
        var t, item, context = data.controls;
        for(item in context){
            this.__addControl(context[item]);
        }
        
        //Loop through teleport modules
        /*var t, item, context = data.teleport;
        for(item in context){
            this.__addControl(context[item]);
        }*/
        
        //Defines
        if (data.objects.apf.metadata.define){
            for(var str, node, i=0;i<data.objects.apf.metadata.define.length;i++){
                this.__addClass(data.objects.apf.metadata.define[i]);
            }
        }
        
        //Groups
        for(var name in groups){
            var template = this.template.selectSingleNode("group[@name='group']");
            var t = this.template.appendChild(template.cloneNode(true));
            var point = t.selectSingleNode("choice");
            
            t.setAttribute("name", name);
            for(var i=0;i<groups[name].length;i++){
                var el = point.appendChild(this.templateDoc.createElement("element"));
                
                if (name == "all-bindings"){
                    el.setAttribute("name", groups[name][i]);
                    el.setAttribute("type", "binding");
                }
                else if (name == "all-actions"){
                    el.setAttribute("name", groups[name][i]);
                    el.setAttribute("type", "action");
                }
                else
                    el.setAttribute("ref", groups[name][i]);
            }
        }
    }
    
    var docFrag, itemSequence, fOutput;
    this.$loadPml = function(x){
        fOutput = fs.get(this.output);
        //if (!fOutput.exists) {
            var file = cwd.get("template.xsd");
            
            if (!file.exists)
                apf.console.error("File not found: template.xsd");
        //}
        
        apf.console.info("Reading template.");

        //Load        
        this.templateDoc = apf.getXmlDom(file.data);
        this.template = this.templateDoc.documentElement;
        docFrag = this.template.selectSingleNode("annotation[@id='docFrag']");
        itemSequence = this.template.selectSingleNode("sequence[@id='itemSequence']");

        apf.console.info("Generating xsd.")
        this.generate();
        
        //Proces queue
        this.save();
    }
}
