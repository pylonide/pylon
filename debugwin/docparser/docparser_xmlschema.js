/**
 * @author Admin
 */
/*
 * generate xmlschema file and Aptana metadata xml reference file 
 */
var outputPathObj = "";
var outputFolder = "";

function parse_xsd(docTree, outputFolderObj) {
    outputPathObj = outputFolderObj;
    outputFolder = (outputPathObj) ? outputPathObj.fullPath + "\\" : $o3.fs.fullPath + "\\";
    
    var output = '<?xml version="1.0" encoding="UTF-8"?>';
    
    // create file for xml schema
    var xmlSchemaFile = apf.getXml('<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://ajax.org/2005/aml" xmlns:a="http://ajax.org/2005/aml" elementFormDefault="qualified" attributeFormDefault="unqualified" />');
    
    // create file for aptana
    var aptanaFile = apf.getXml('<javascript />');

    // create file for property editor
    var propeditFile = apf.getXml('<props />');
    
    // add startNode
    var startNode = getTemplate("startElement");
    startNode.setAttribute("name", "xml");
    xmlSchemaFile.appendChild(startNode);
        
    // create groups for guielements, actionbinding and nonguielements
    var groupNames = ["guielements", "actionbinding", "nonguielements"];
    
    // create xml for the 3 groups
    for (var groups = {}, i = 0, l = groupNames.length; i < l; i++) {
        var grpXml = getTemplate("elementsGroup");
        grpXml.setAttribute("name", groupNames[i]);
        groups[groupNames[i]] = grpXml;
    }
   
    var lists = ["element", "baseclass"];
    // loop through lists
    for (var type, list, i = 0, l = lists.length; i < l; i++) {
        type = lists[i];
        list = docTree[type];

        for (var name in list) {
            var obj = new xsdNode(list[name], name.replace("apf.", ""), type, xmlSchemaFile, aptanaFile, propeditFile, docTree, groups);
        } 
    }
    
    // add element groups to xml
    for (name in groups) {
        xmlSchemaFile.appendChild(groups[name]);
    }
    
    if (docparser.outputXmlSchema) {
        // save xmlschema file
        if (outputPathObj) {
            outputPathObj.get("xmlschema/apf_xmlschema.xsd").data = output + xmlSchemaFile.xml;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "xmlschema\\apf_xmlschema.xsd"});
        }
        else {
            $o3.fs.get("refguide/xmlschema/apf_xmlschema.xsd").data = output + xmlSchemaFile.xml;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\xmlschema\\apf_xmlschema.xsd"});
        }
        apf.dispatchEvent("docgen_complete", {type: "xmlschema"});
    }

    
    // save aptana file
    /*
    if (outputPathObj)
        outputPathObj.get("aptana/apf_aptana.xml").data = output + aptanaFile.xml;
    else
        $o3.fs.get((outputPath || "documentation/") + "aptana/apf_aptana.xml").data = output + aptanaFile.xml;
    */
    
    if (docparser.outputPropedit) {
        for (var fileoutput, fileXml, element, obj, inherits, ei = 0, el = propeditFile.childNodes.length; ei < el; ei++) {
            element = propeditFile.childNodes[ei].nodeName;

            obj = docTree.element[element];
            if (!obj) continue;

            inherits = getTreeList(docTree.element[element]);

            // start at one to prevent starting element to be added again
            for (var inherit, cloneNodes = [], cloneNode, ii = 1, il = inherits.length; ii < il; ii++) {
                inherit = (inherits[ii].indexOf("apf.") == 0) ? inherits[ii].substr(4) : inherits[ii];
                
                if (propeditFile.selectSingleNode(inherit)) {
                    var nodeToClone = propeditFile.selectSingleNode(inherit + "/group[@caption='General']");
                    if (nodeToClone) {
                        cloneNode = nodeToClone.cloneNode(true);
                        if (nodeToClone.parentNode.getAttribute("caption")) {
                            // if exist append attributes to existing node
                            cloneNode.setAttribute("caption", nodeToClone.parentNode.getAttribute("caption"));
                            //cloneNode.setAttribute("id", nodeToClone.parentNode.getAttribute("id"));
                        }
                        else {
                            cloneNode.setAttribute("caption", inherit);
                        }
                        cloneNodes.push(cloneNode);
                    }
                    if (propeditFile.selectSingleNode(inherit + "/group[@caption='Events']")) {
                        if (!propeditFile.childNodes[ei].selectSingleNode("group[@caption='Events']")) {
                            var groupNode = propeditFile.ownerDocument.createElement("group");
                            groupNode.setAttribute("caption", "Events");
                            propeditFile.childNodes[ei].appendChild(groupNode);
                        }
                        for (var evtNode, eli = 0, ell = propeditFile.selectSingleNode(inherit + "/group[@caption='Events']").childNodes.length; eli < ell; eli++) {
                            evtNode = propeditFile.selectSingleNode(inherit + "/group[@caption='Events']").childNodes[eli].cloneNode(true);
                            
                            if (propeditFile.childNodes[ei].selectSingleNode("group[@caption='Events']"))
                                propeditFile.childNodes[ei].selectSingleNode("group[@caption='Events']").appendChild(evtNode);
                        }
                    }
                }
            }

            // save file for each element
    //        output = "<props>" + propeditFile.childNodes[ei].xml;
    //        
            //output += cloneNodes[cli];
    //        }
    //output += "</props>";
            //fileoutput = propeditFile.childNodes[ei].cloneNode(true);

            for (var cli = 0, cll = cloneNodes.length; cli < cll; cli++) {
                propeditFile.childNodes[ei].appendChild(cloneNodes[cli]);
            }

            if (propeditFile.childNodes[ei].selectSingleNode("group[@caption='Events']")) {
                propeditFile.childNodes[ei].appendChild(propeditFile.childNodes[ei].selectSingleNode("group[@caption='Events']"));
            }

            if (outputPathObj) {
                outputPathObj.get("propedit/" + element + ".xml").data = "<props>" + propeditFile.childNodes[ei].xml + "</props>";
                apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "propedit\\" + element + ".xml"});
            }
            else {
                $o3.fs.get("refguide/propedit/" + element + ".xml").data = "<props>" + propeditFile.childNodes[ei].xml + "</props>";
                apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\propedit\\" + element + ".xml"});   
            }
            
    //        $o3.fs.get((outputPath || "refguide/") + "propedit/" + element + ".xml").data = "<props>" + propeditFile.childNodes[ei].xml + cloneNodes.join("") + "</props>";
        }
       
        // save property editor file
        if (outputPathObj) {
            outputPathObj.get("propedit/propedit.xml").data = output + propeditFile.xml;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "propedit\\propedit.xml"});
        }
        else {
            $o3.fs.get("refguide/propedit/propedit.xml").data = output + propeditFile.xml;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\propedit\\propedit.xml"});
        }
        
        // files created!
        apf.dispatchEvent("docgen_complete", {type: "propedit files"});

    }
}

function xsdNode(obj, name, type, xmlSchemaFile, aptanaFile, propeditFile, docTree, groups) {
    this.obj = obj;
    this.added = false;
    this.groups = groups;
    
    if (name.charAt(0) == '"' && name.charAt(name.length - 1) == '"')
        name = name.substr(1, name.length - 2);

    this.setPropertyEditor = function() {
        var attrList = [];
        if (this.obj.attribute && this.obj.attribute.length)
            attrList = this.obj.attribute;

        // get attributes from defines list
        if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name].attribute && docTree.defines[this.obj.name].attribute.length) {
            var aCopy = attrList.slice(0);
            for (var di = 0, dl = docTree.defines[this.obj.name].attribute.length; di < dl; di++) {
                for (var duplicate = false, ni = 0, nl = aCopy.length; ni < nl; ni++) {
                    if (aCopy[ni].name == docTree.defines[this.obj.name].attribute[di].name) {
                        duplicate  = true;
                        break;
                    }
                }
                
                if (duplicate) {
                    aCopy[ni] = docTree.defines[this.obj.name].attribute[di];
                }
                else {
                    aCopy.push(docTree.defines[this.obj.name].attribute[di]);
                }
            }
            attrList = aCopy;
        }

        var evtList = [];
        if (this.obj.event && this.obj.event.length)
            evtList = this.obj.event;

        // get events from defines list
        if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name].event && docTree.defines[this.obj.name].event.length) {
            var eCopy = evtList.slice(0);
            for (var di = 0, dl = docTree.defines[this.obj.name].event.length; di < dl; di++) {
                for (var duplicate = false, ni = 0, nl = eCopy.length; ni < nl; ni++) {
                    if (eCopy[ni].name == docTree.defines[this.obj.name].event[di].name) {
                        duplicate  = true;
                        break;
                    }
                }
                
                if (duplicate) {
                    eCopy[ni] = docTree.defines[this.obj.name].event[di];
                }
                else {
                    eCopy.push(docTree.defines[this.obj.name].event[di]);
                }
            }
            evtList = eCopy;
        }

            //attrList = attrList.concat(docTree.defines[obj.name].attribute);
        
        // loop through inheritList and their inherits/prototypes and add their attributes to attrList

/*
        var inhDone = [];
        function getAttributes(name) {
            if (inhDone.indexOf(name) > -1) {
                return;
            }
            var obj = docTree.baseclass[name] || docTree.element[name];
            if (!obj) {
                return;
            }
            // add inherit name to array to prevent from duplicate checking
            inhDone.push(name);
            
            // create list of inherits & prototype        
            var inheritList = [];
            if (obj.inherits && obj.inherits.length) {
                for (var inheritObj, h = 0, hl = obj.inherits.length; h < hl; h++) {
                    inheritList.push(obj.inherits[h])
                }
            }

            // has prototype that isn't added to inheritList yet
            if (obj.prototype && inheritList.indexOf(obj.prototype) == -1)
                inheritList.push(obj.prototype);

            if (inheritList.length) {
                for (var inhName, i = 0, l = inheritList.length; i < l; i++) {
                    inhName = inheritList[i];
                    
                    // baseclass exist and has attributes
                    if (docTree.baseclass[inhName] && docTree.baseclass[inhName].attribute && docTree.baseclass[inhName].attribute.length) {
                        inhObj = docTree.baseclass[inhName];
                        // get attributes
                        attrList = attrList.concat(inhObj.attribute);
                    }
                    
                    getAttributes(inhName);
                    // loop up the tree
                        // get attributes
                } 
            }
        }
        
        getAttributes(name);
*/
        

/*
                if (!docTree.baseclass[this.obj.inherits[h]])
                    continue;
                
                inheritObj = docTree.baseclass[this.obj.inherits[h]];
                
                if (inheritObj.attribute && inheritObj.attribute.length)
                    attrList = attrList.concat(inheritObj.attribute);
            attrList = attrList.concat(docTree.baseclass[this.obj.prototype].attribute);
*/

        
        var propeditNode = propeditFile.ownerDocument.createElement(name);
        if (this.obj.group_caption) {
            propeditNode.setAttribute("caption", this.obj.group_caption);
            propeditNode.setAttribute("id", name);
        }

        propeditFile.appendChild(propeditNode);

        if (attrList && attrList.length) {
            if (name.substr(name.length-2, 2) == '"]') { 
                name = name.substr(0, name.length-2);
                name = name.replace('["',".");
            }

            var groupNode = propeditFile.ownerDocument.createElement("group");
            groupNode.setAttribute("caption", "General");
            propeditNode.appendChild(groupNode);
            
            for (var attContext, attEditor, parentNodes, attribute, attNode, type, a = 0, al = attrList.length; a < al; a++) {
                attribute = attrList[a];

                //ignore readonly attributes
                if (attribute.readonly) {
                    apf.console.info("attribute " + attribute.name + " ignored: readonly");
                    continue;
                }

                /*
                 * generate for property editor
                 */
                //if (!attribute.attrinfo)
                    //debugger;

                attContext = attribute.attrinfo["context"];
                attEditor  = (attribute.attrinfo["editor"]) ? attribute.attrinfo["editor"] : "textbox";
                
                if (!parentNodes) parentNodes = {"root": groupNode}
                if (!parentNodes[attContext + "/" + attribute.name])
                    attrNode = propeditFile.ownerDocument.createElement("prop");
                else
                    attrNode = parentNodes[attContext + "/" + attribute.name];
                    
                attrNode.setAttribute("caption", attribute.name);
                attrNode.setAttribute("editor", attEditor);
                attrNode.setAttribute("value", "[@" + attribute.name.toLowerCase() + "]");
                //attrNode.setAttribute("required", "false");
                if (attribute["default"]) attrNode.setAttribute("default", attribute["default"]);

                // if boolean, set editor to checkbox and values to true|false
                if (attribute.dataType && attribute.dataType.toLowerCase() == "boolean") {
                    attEditor = "checkbox"
                    attrNode.setAttribute("editor", attEditor);
                    values = ["true", "false"];
                }
                
                // search for possible values in description    
                if (attribute.description && attribute.description.length) {
                    for (var description, possiblevalues, d = 0, dl = attribute.description.length; d < dl; d++) {
                        description = attribute.description[d];
                        if (d == 0 && description.type == "") {
                            attrNode.setAttribute("description", description.description);
                        }
                        else if (description.type.toLowerCase() == "possible values") {
                            possiblevalues = description.description;
                            break; 
                        }
                    }
                    
                    // if possible values found
                    if (possiblevalues && possiblevalues.length) {
                        // change editor to dropdown if possible values found
                        if (attEditor == "textbox") {
                            attEditor = "dropdown";
                            attrNode.setAttribute("editor", attEditor);
                        }
                        // loop through values
                        for (var values = [], p = 0, pl = possiblevalues.length; p < pl; p++) {
                            if (possiblevalues[p].name) {
                                values.push(possiblevalues[p].name);
                            }
                            else {
                                //debugger;
                            }
                        }
                        possiblevalues = [];
                    }
                }
                
                // values found
                if (values && values.length) {
                    // dropdown
                    if (attEditor == "dropdown") {
                        for (var v = 0, vl = values.length; v < vl; v++) {
                            var valNode = propeditFile.ownerDocument.createElement("item");
                            valNode.setAttribute("value", values[v]);
                            valNode.appendChild(propeditFile.ownerDocument.createTextNode(values[v]));
                            attrNode.appendChild(valNode);
                        }
                    } 
                    // checkbox
                    else if (attEditor == "checkbox") {
                        attrNode.setAttribute("values", values.join("|"));
                    }
                    else {
                        //debugger;
                    }
                    values = [];
                }

                if (!parentNodes[attContext + "/" + attribute.name])
                    parentNodes[attContext + "/" + attribute.name] = attrNode;
                
                if (attContext) {
                    if (!parentNodes[attContext]) {
                        var parents = attContext.split("/");
                        
                        if (parents.length) {
                            var prevNode;
                            if (!parentNodes[parents[0]]) {
                                var parNode = propeditFile.ownerDocument.createElement("prop");
                                parNode.setAttribute("caption", parents[0]);
                                
                                parentNodes[parents[0]] = parNode;
                                parentNodes["root"].appendChild(parNode);
                                
                                prevNode = parNode;
                            }
                            else {
                                prevNode = parentNodes[parent[0]];
                            }
    
                            attContextName = parents[0].toLowerCase();
                            
                            for (var p = 1, pl = parents.length; p < pl; p++) {
                                parents[p] = parents[p].toLowerCase();
                                attContextName += "/" + parents[p];
                                
                                if (!parentNodes[attContextName]) {
                                    parNode = propeditFile.ownerDocument.createElement("prop");
                                    parNode.setAttribute("caption", parents[p]);
                                    
                                    parentNodes[attContextName] = parNode;
                                    prevNode.appendChild(parNode);
                                    
                                    prevNode = parNode;
                                }
                                
                                else {
                                    prevNode = parentNodes[attContextName];
                                }
                            }
                        }
                    }
                }
                else {
                    attContext = "root";
                }
                
                parentNodes[attContext].appendChild(attrNode);
            }
        }

        if (evtList && evtList.length) {
            if (name.substr(name.length-2, 2) == '"]') { 
                name = name.substr(0, name.length-2);
                name = name.replace('["',".");
            }

            var groupNode = propeditFile.ownerDocument.createElement("group");
            groupNode.setAttribute("caption", "Events");
            propeditNode.appendChild(groupNode);
            
            var evtNode = propeditFile.ownerDocument.createElement("Events");
            for (var attEditor, parentNodes, event, attNode, type, a = 0, al = evtList.length; a < al; a++) {
                event = evtList[a];
                /*
                 * generate for property editor
                 */

                attEditor  = "textbox";

                if (!parentNodes) parentNodes = {"root": groupNode}
                if (!parentNodes[attContext + "/" + event.name])
                    attrNode = propeditFile.ownerDocument.createElement("prop");
                else
                    attrNode = parentNodes[attContext + "/" + event.name];
                    
                attrNode.setAttribute("caption", event.name);
                attrNode.setAttribute("editor", attEditor);
                attrNode.setAttribute("value", "[@" + event.name.toLowerCase() + "]");
                attrNode.setAttribute("type", "event");
                //attrNode.setAttribute("required", "false");
                if (event["default"]) attrNode.setAttribute("default", event["default"]);

                // if boolean, set editor to checkbox and values to true|false
                if (event.dataType && event.dataType.toLowerCase() == "boolean") {
                    attEditor = "checkbox"
                    attrNode.setAttribute("editor", attEditor);
                    values = ["true", "false"];
                }
                
                // search for possible values in description    
                else if (event.description && event.description.length) {
                    for (var description, possiblevalues, d = 0, dl = event.description.length; d < dl; d++) {
                        description = event.description[d];
                        if (d == 0 && description.type == "") {
                            attrNode.setAttribute("description", description.description);
                        }
                        else if (description.type.toLowerCase() == "possible values") {
                            possiblevalues = description.description;
                            break; 
                        }
                    }
                    
                    // if possible values found
                    if (possiblevalues && possiblevalues.length) {
                        // change editor to dropdown if possible values found
                        if (attEditor == "textbox") {
                            attEditor = "dropdown";
                            attrNode.setAttribute("editor", attEditor);
                        }
                        // loop through values
                        for (var values = [], p = 0, pl = possiblevalues.length; p < pl; p++) {
                            if (possiblevalues[p].name) {
                                values.push(possiblevalues[p].name);
                            }
                            else {
                                //debugger;
                            }
                        }
                        possiblevalues = [];
                    }
                }
                
                // values found
                if (values && values.length) {
                    // dropdown
                    if (attEditor == "dropdown") {
                        for (var v = 0, vl = values.length; v < vl; v++) {
                            var valNode = propeditFile.ownerDocument.createElement("item");
                            valNode.setAttribute("value", values[v]);
                            valNode.appendChild(propeditFile.ownerDocument.createTextNode(values[v]));
                            attrNode.appendChild(valNode);
                        }
                    } 
                    // checkbox
                    else if (attEditor == "checkbox") {
                        attrNode.setAttribute("values", values.join("|"));
                    }
                    else {
                        //debugger;
                    }
                    values = [];
                }
                
                if (!parentNodes[attContext + "/" + event.name])
                    parentNodes[attContext + "/" + event.name] = attrNode;
                
                if (attContext) {
                    if (!parentNodes[attContext]) {
                        var parents = attContext.split("/");
                        
                        if (parents.length) {
                            var prevNode;
                            if (!parentNodes[parents[0]]) {
                                var parNode = propeditFile.ownerDocument.createElement("prop");
                                parNode.setAttribute("caption", parents[0]);
                                
                                parentNodes[parents[0]] = parNode;
                                parentNodes["root"].appendChild(parNode);
                                
                                prevNode = parNode;
                            }
                            else {
                                prevNode = parentNodes[parent[0]];
                            }
    
                            attContextName = parents[0].toLowerCase();
                            
                            for (var p = 1, pl = parents.length; p < pl; p++) {
                                parents[p] = parents[p].toLowerCase();
                                attContextName += "/" + parents[p];
                                
                                if (!parentNodes[attContextName]) {
                                    parNode = propeditFile.ownerDocument.createElement("prop");
                                    parNode.setAttribute("caption", parents[p]);
                                    
                                    parentNodes[attContextName] = parNode;
                                    prevNode.appendChild(parNode);
                                    
                                    prevNode = parNode;
                                }
                                
                                else {
                                    prevNode = parentNodes[attContextName];
                                }
                            }
                        }
                    }
                }
                else {
                    attContext = "root";
                }

                groupNode.appendChild(attrNode);
            }
        }
    }
    
    this.setAttributes = function(context) {
         var dataTypes = {
            "string"    : "xs:string",
            "boolean"   : "xs:boolean",
            "number"    : "xs:decimal",
            "integer"   : "xs:int",
            "regexp"    : "xs:string",
        };
            
        // set attributes
        var attributeList = [];
        if (this.obj.attribute && this.obj.attribute.length)
            attributeList = this.obj.attribute;
            
        if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name].attribute && docTree.defines[this.obj.name].attribute.length) {
            var aCopy = attributeList.slice(0);
            for (var di = 0, dl = docTree.defines[this.obj.name].attribute.length; di < dl; di++) {
                for (var duplicate = false, ni = 0, nl = aCopy.length; ni < nl; ni++) {
                    if (aCopy[ni].name == docTree.defines[this.obj.name].attribute[di].name) {
                        duplicate  = true;
                        break;
                    }
                }
                
                if (duplicate) {
                    aCopy[ni] = docTree.defines[this.obj.name].attribute[di];
                }
                else {
                    aCopy.push(docTree.defines[this.obj.name].attribute[di]);
                }
            }
            attributeList = aCopy;
        }
            //attributeList = attributeList.concat(docTree.defines[this.obj.name].attribute);

        if (attributeList.length) {                
            for (var attribute, attNode, type, a = 0, al = attributeList.length; a < al; a++) {
                attribute = attributeList[a];
                /*
                 * generate for xml schema
                 */
                attNode = getTemplate("attribute");
                attNode.setAttribute("name", attribute.name);
                
                // dataType
                // multiple dataTypes possible -> xs:string
                
                if (attribute.dataType) {
                    if (attribute.dataType.toLowerCase().indexOf(",") > -1) {
                        type = dataTypes["string"]
                        //apf.console.warn("attribute " + attribute.name + " van " + this.obj.name + "heeft meerdere dataTypes");
                    } else {
                        type = dataTypes[attribute.dataType.toLowerCase()]
                        // if no type set or found, set to string
                        if (!type) type = "xs:string";
                    }
                     
                    attNode.setAttribute("type", type);
                }
                                
                // add documentation
                if (attribute.description && attribute.description.length) {
                    var desc = xmlSchemaFile.ownerDocument.createTextNode(genDesc(attribute.description, attribute.dataType));
                    attNode.selectSingleNode(".//xs:documentation").appendChild(desc);
                }
                
                // save attribute to given context node
                context.appendChild(attNode);
            }
        }
        
        // set event attributes
        var eventList = [];
        if (this.obj.event && this.obj.event.length)
            eventList = this.obj.event;
            
        if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name].event && docTree.defines[this.obj.name].event.length) {
            var eCopy = eventList.slice(0);
            for (var di = 0, dl = docTree.defines[this.obj.name].event.length; di < dl; di++) {
                for (var duplicate = false, ni = 0, nl = eCopy.length; ni < nl; ni++) {
                    if (eCopy[ni].name == docTree.defines[this.obj.name].event[di].name) {
                        duplicate  = true;
                        break;
                    }
                }
                
                if (duplicate) {
                    eCopy[ni] = docTree.defines[this.obj.name].event[di];
                }
                else {
                    eCopy.push(docTree.defines[this.obj.name].event[di]);
                }
            }
            eventList = eCopy;            
        }
            //eventList = eventList.concat(docTree.defines[this.obj.name].event);

        if (eventList.length) {
            for (var attNode, a = 0, al = eventList.length; a < al; a++) {
                attNode = getTemplate("attribute");
                attNode.setAttribute("name", "on" + eventList[a].name);

                // add documentation
                if (eventList[a].description && eventList[a].description.length) {
                    var desc = xmlSchemaFile.ownerDocument.createTextNode(genDesc(eventList[a].description));
                    attNode.selectSingleNode(".//xs:documentation").appendChild(desc);
                }
                
                // save attribute to given context node
                context.appendChild(attNode);
            }
        }
    }
    
    // check if prototype is set and exists
    this.prototype = (this.obj.prototype && docTree.baseclass[this.obj.prototype]) ? true : false;
    if (this.obj.prototype && !docTree.baseclass[this.obj.prototype])
        apf.console.warn(this.obj.fullname + " has non existing prototype " + this.obj.prototype);
    
	// create element
    if (type == "element") {
        var elXml = (this.prototype) ? getTemplate("element") : getTemplate("elementNoPt");
        elXml.setAttribute("name", name.toLowerCase());
        if (this.prototype) elXml.selectSingleNode(".//xs:extension").setAttribute("base", "a:" + this.obj.prototype);
        
        // add documentation\
        var description = [];
        if (this.obj.description && this.obj.description.length)
            description = this.obj.description;
        if (docTree.defines[this.obj.name] && docTree.defines[this.obj.name].description && docTree.defines[this.obj.name].description.length)
            description = description.concat(docTree.defines[this.obj.name].description);

        var desc = xmlSchemaFile.ownerDocument.createTextNode(genDesc(description));
        elXml.selectSingleNode(".//xs:documentation").appendChild(desc);
        
        // ref to attributeGroups via inherits
        if (this.obj.inherits && this.obj.inherits.length) {
            var attGrpRefTemplate = getTemplate("attributeGroupRef");
            for (var attGrpRef, i = 0, l = this.obj.inherits.length; i < l; i++) {
                
                // if inherits item not defined in docTree.baseclass
                if (!docTree.baseclass[this.obj.inherits[i]]) {
                    apf.console.warn(this.obj.fullname + " inherits from non existing baseclass " + this.obj.inherits[i]);
                    continue;
                }
                
                // skip if inherits item is already set as prototype, already set as extension base
                if (this.obj.inherits[i] == this.obj.prototype)
                    continue;
                    
                // skip if prototype already inherits from item from inherits list
                if (this.prototype) {
                    if (inheritFromSame(docTree.baseclass[this.obj.prototype], docTree.baseclass[this.obj.inherits[i]], docTree))
                        continue;
                }
                
                attGrpRef = attGrpRefTemplate;
                attGrpRef.setAttribute("ref", "a:attGrp_" + this.obj.inherits[i]); 
                
                if (this.prototype)
                    elXml.selectSingleNode(".//xs:extension").appendChild(attGrpRef);
                else
                    elXml.selectSingleNode(".//xs:complexType").appendChild(attGrpRef);
            }
        }
        
        // set attributes
        if (this.prototype) 
            this.setAttributes(elXml.selectSingleNode(".//xs:extension"));
        else
            this.setAttributes(elXml.selectSingleNode(".//xs:complexType"));

        // add to correct elements group
        addToGroup(this.obj, groups, docTree);
        
        // set element group reference
        var dataBinding = inheritFrom(this.obj, "apf.DataBinding", docTree);
        var allowChild = memberOfGroup(name, this.groups, "nonguielements") || ["apf.actions", "apf.bindings", "apf.smartbinding"].indexOf(name.toLowerCase()) > -1;
        
        if (dataBinding) {
            var elGroups = ["nonguielements", "actionbinding"];
        }
        
        else if (allowChild) {
            // loop throught all allow-child items
            if (this.obj.allowchild && this.obj.allowchild.length) {
                for (var elRefs = [], i = 0, l = this.obj.allowchild.length; i < l; i++) {
                    if (docTree.element[this.obj.allowchild[i]])
                        elRefs.push(this.obj.allowchild[i]);
                }
            }
        }
        
        else {
            var elGroups = ["guielements", "nonguielements", "actionbinding"];
        }
        
        // save elementGroup refs
        if (elGroups && elGroups.length) {
            for (var i = 0, l = elGroups.length; i < l; i++) {
                var grpRef = getTemplate("groupRef");
                grpRef.setAttribute("ref", "a:" + elGroups[i]);
                elXml.selectSingleNode(".//xs:choice").appendChild(grpRef);
            }
        }
        
        // save element (allowchild) refs
        if (elRefs && elRefs.length) {
            for (var i = 0, l = elRefs.length; i < l; i++) {
                var elRef = getTemplate("elementRef");
                elRef.setAttribute("ref", "a:" + elRefs[i]);
                elXml.selectSingleNode(".//xs:choice").appendChild(elRef);
            }
        }
                
        // save element to XML
        xmlSchemaFile.appendChild(elXml);
    }

	// create complexType if baseclass
    if (type == "baseclass") {
        // create complexType
        var compXml = (this.prototype) ? getTemplate("baseclass") : getTemplate("baseclassNoPt");
        compXml.setAttribute("name", this.obj.fullname);
        if (this.prototype) compXml.selectSingleNode(".//xs:extension").setAttribute("base", "a:" + this.obj.prototype);
        
        // ref to own attributeGroup in complexType
        var attGrpRefXml = getTemplate("attributeGroupRef");
        attGrpRefXml.setAttribute("ref", "a:attGrp_" + this.obj.fullname);
        if (this.prototype) 
            compXml.selectSingleNode(".//xs:extension").appendChild(attGrpRefXml);
        else
            compXml.appendChild(attGrpRefXml);
            
        // save complexType to XML
        xmlSchemaFile.appendChild(compXml);
        
        // create attributeGroup
        var attGrpXml = getTemplate("attributeGroup");
        attGrpXml.setAttribute("name", "attGrp_" + this.obj.fullname);
        this.setAttributes(attGrpXml);
        
        // save attributeGroup to XML
        xmlSchemaFile.appendChild(attGrpXml);
    }
    
    this.added = true;

    /*
     * Property editor generation
     */
    this.setPropertyEditor();

    /*
     * Aptana generation
     */
/*
    // create class
    var aptClassXml = getTemplate("aptClass");
    aptClassXml.setAttribute("type", name.toLowerCase());
    
    // add superclass
    if (this.prototype) aptClassXml.setAttribute("superclass", this.obj.prototype.replace("apf.", "").toLowerCase());

    // add description
    if (this.obj.description && this.obj.description.length) {
        var desc = aptanaFile.ownerDocument.createTextNode(genDesc(this.obj.description));
        aptClassXml.selectSingleNode(".//description").appendChild(desc);
    }

    // add constructor
    var aptConstrXml = getTemplate("aptConstructor");
    var desc = aptanaFile.ownerDocument.createTextNode("Creates a new instance of " + name.toLowerCase());
    aptConstrXml.selectSingleNode(".//description").appendChild(desc);
    aptClassXml.appendChild(aptConstrXml);

    // add properties (attributes)
    if (this.obj.attribute && this.obj.attribute.length) {
        var aptPropsXml = getTemplate("aptProperties");
        
        for (var i = 0, l = this.obj.attribute.length; i < l; i++) {
            var aptPropXml = getTemplate("aptProperty");
            aptPropXml.setAttribute("name", this.obj.attribute[i].name);
            
            // set datatype, must be set or Aptana can't read file correctly
            //if (this.obj.attribute[i].dataType)
            aptPropXml.setAttribute("type", this.obj.attribute[i].dataType);
            
                
            // set description
            if (this.obj.attribute[i].description && this.obj.attribute[i].description.length) {
                var desc = aptanaFile.ownerDocument.createTextNode(genDesc(this.obj.attribute[i].description, this.obj.attribute[i].dataType));
                aptPropXml.selectSingleNode(".//description").appendChild(desc);
            }
                
            // save property to class
            aptPropsXml.appendChild(aptPropXml);
        }
        
        // save properties to class
        aptClassXml.appendChild(aptPropsXml);
    }
    
    /* doesn't seem to work with events
    // add events
    if (this.obj.event && this.obj.event.length) {
        var aptEventsXml = getTemplate("aptEvents");
        
        for (var i = 0, l = this.obj.event.length; i < l; i++) {
            var aptEventXml = getTemplate("aptEvent");
            aptEventXml.setAttribute("name", this.obj.event[i].name);
            
            // set datatype
            if (this.obj.event[i].dataType)
                aptEventXml.setAttribute("type", this.obj.event[i].dataType);
            
            // set description
            if (this.obj.event[i].description && this.obj.event[i].description.length) {
                var desc = aptanaFile.ownerDocument.createTextNode(genDesc(this.obj.event[i].description));
                aptEventXml.selectSingleNode(".//description").appendChild(desc);
            }
                
            // save event to class
            aptEventsXml.appendChild(aptEventXml);
        }
        
        // save events to class
        aptClassXml.appendChild(aptEventsXml);
    }
    // save class to file
    aptanaFile.appendChild(aptClassXml);\
*/
}

/*
 * helper methods
 */

// get xml template for given element type
function getTemplate(type) {
    var docEl = new apf.http().getXml("template.xsd", null, {async: false}) || new apf.http().getXml("docparser/template.xsd", null, {async: false});

    if (apf.isIE)
        docEl.ownerDocument.setProperty("SelectionNamespaces", "xmlns:xs='http://www.w3.org/2001/XMLSchema'");
    
    if (type == "startElement") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:element[@name='startElement']").cloneNode(true);
    }

    else if (type == "element") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:element[@name='element']").cloneNode(true);
    }

    else if (type == "elementNoPt") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:element[@name='elementNoPt']").cloneNode(true);
    }
    
    else if (type == "attribute") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:attribute").cloneNode(true);
    }

    else if (type == "attributeGroup") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:attributeGroup").cloneNode(true);
    }
    
    else if (type == "attributeGroupRef") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:attributeGroup[@ref='']").cloneNode(true);
    }
    
    else if (type == "baseclass") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:complexType[@name='baseclass']").cloneNode(true);
    }

    else if (type == "baseclassNoPt") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:complexType[@name='baseclassNoPt']").cloneNode(true);
    }

    else if (type == "elementsGroup") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:group[@name='elementsGroup']").cloneNode(true);
    }

    else if (type == "elementRef") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:element[@ref='']").cloneNode(true);
    }

    else if (type == "groupRef") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/xs:group[@ref='']").cloneNode(true);
    }

/*
 * APTANA templates
 */
    else if (type == "aptClass") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/class").cloneNode(true);
    }

    else if (type == "aptConstructor") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/constructors").cloneNode(true);
    }

    else if (type == "aptProperties") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/properties").cloneNode(true);
    }

    else if (type == "aptProperty") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/property").cloneNode(true);
    }

    else if (type == "aptEvents") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/events").cloneNode(true);
    }

    else if (type == "aptEvent") {
        return docEl.ownerDocument.selectSingleNode("/xs:schema/event").cloneNode(true);
    }
    
    else {
        throw new Error("No template for " + type + " yet");
    }
    
    return false;
}

// add element to groups guielements, actionbinding or nonguielements
function addToGroup(obj, groups, docTree) {
    if (!docTree.element[obj.name])
        return;
    // default group
    var group = "nonguielements";

    // check up the tree for prototype guielement, actionrule of bindingrule
    if (inheritFrom(obj, "apf.GuiElement", docTree))
        group = "guielements";
    else if (["apf.actions", "apf.bindings", "apf.smartbinding"].indexOf(obj.fullname.toLowerCase()) > -1 || inheritFrom(obj, "apf.ActionRule", docTree) || (inheritFrom(obj, "apf.BindingRule", docTree)))
        group = "actionbinding";

    // create xml node for element when not already added
    var seqXml = groups[group].selectSingleNode(".//xs:sequence");
    if (!seqXml.selectSingleNode(".//xs:element[@ref='a:" + obj.name + "']")) {
        var el = getTemplate("elementRef");
        el.setAttribute("ref", "a:" + obj.name);
        seqXml.appendChild(el);
    }
    
    return group;
}

// get array of all baseclasses the given obj inherits from
function getTreeList(obj, tree) {
    var tree = (tree) ? tree : ["apf." + obj.name];
    
    if (obj.inherits && obj.inherits.length) {
        for (var i = 0, l = obj.inherits.length; i < l; i++) {
            if (tree.indexOf(obj.inherits[i]) == -1)
                tree.push(obj.inherits[i]);
            // don't search up the tree in inherits
            //if (docTree.baseclass[obj.inherits[i]])
                //tree = getTreeList(docTree.baseclass[obj.inherits[i]], tree);
        }
    }
    
    if (obj.prototype) {
        if (tree.indexOf(obj.prototype) == -1)
            tree.push(obj.prototype);
        if (docTree.baseclass[obj.prototype])
            tree = getTreeList(docTree.baseclass[obj.prototype], tree);
    }
       
    return tree    
}
// check if object inherits from a given baseclass
function inheritFrom(obj, from, docTree) {
    var cur = obj;
    
    // check inherits
    if (cur.inherits && cur.inherits.length) {
        for (var i = 0, l = cur.inherits.length; i < l; i++) {
            if (cur.inherits[i] == from)
                return true;
        }
    }
    
    // check prototype
    while (cur && cur.prototype != null) {
        if (cur.prototype == from) {
            return true;
        }
        cur = (docTree.baseclass[cur.prototype]) ? docTree.baseclass[cur.prototype] : null;
    }

    return false;
}

// check if 2 objects inherits from same baseclass somewhere on the tree
function inheritFromSame(obj1, obj2, docTree) {
    var checkList = [];
    var objects = [obj1, obj2];
    
    // collect inherits for each object
    for (var obj, o = 0, ol = objects.length; o < ol; o++) {
        obj = objects[o];
        checkList[o] = [obj.fullname];
        if (obj.inherits && obj.inherits.length) {
            for (var cur, i = 0, l = obj.inherits.length; i < l; i++) {
                if (checkList[o].indexOf(obj.inherits[i]) == -1)
                    checkList[o].push(obj.inherits[i]);
                cur = docTree.baseclass[obj.inherits[i]];                    

                while (cur && cur.prototype != null) {
                    if (checkList[o].indexOf(cur.prototype) == -1)
                        checkList[o].push(cur.prototype);
                    cur = (docTree.baseclass[cur.prototype]) ? docTree.baseclass[cur.prototype] : null;
                }
            }
        }
        
        // add prototype to checkList if not already added via inherits
        if (obj.prototype && checkList[o].indexOf(obj.prototype) == -1) {
            checkList[o].push(obj.prototype);
            cur = docTree.baseclass[obj.prototype];

            while (cur && cur.prototype != null) {
                if (checkList[o].indexOf(cur.prototype) == -1)
                    checkList[o].push(cur.prototype);
                cur = (docTree.baseclass[cur.prototype]) ? docTree.baseclass[cur.prototype] : null;
            }
        }
    }

    if (checkList[0].length && checkList[1]) {
        // check for common baseclass
        for (var i = 0, l = checkList[0].length; i < l; i++) {
            if (checkList[1].indexOf(checkList[0][i]) > -1) {
                return true;
            }
        }
    }
    
    return false;
}

// check if element exist in specific group
function memberOfGroup(name, groups, groupName) {
    var seq = groups[groupName].selectSingleNode(".//xs:sequence");
    if (seq.selectSingleNode(".//xs:element[@ref='" + name.replace("apf.", "") + "']")) {
        return true;
    }
    return false;
}

// generate documentation from description 
function genDesc(desc, dataType) {
    for (var description = [], d = 0, l = desc.length; d < l; d++) {
        var type = desc[d].type;
         
        if (type) {
            if (type.toLowerCase() == "possible values" || type.toLowerCase() == "object") {
                if (desc[d].description.length) {
                    var table = '<table class="syntax" cellpadding="0" cellspacing="0">' + "\n";
                    for (var nDesc = [], i = 0, k = desc[d].description.length; i < k; i++) {
                        if (desc[d].description[i].name && desc[d].description[i].description.length) {
                            table += "<tr>" + "\n";
                        
                            // if first item has type, add type column for all items
                            if (desc[d].description[0].type) 
                                table += "<td>" + desc[d].description[i].type + "</td>" + "\n";
                            table += "<td>" + desc[d].description[i].name + "</td>" + "\n";
                            table += "<td>" + desc[d].description[i].description[0].description + "</td>" + "\n";
                            
                            table += "</tr>" + "\n";
                        }                        
                        //nDesc.push("{" + desc[d].description[i].type + "}" + " " + desc[d].description[i].name + " " + desc[d].description[i].description);
                    }
                    table += "</table>" + "\n";
                }
            }
            
            type = "<h3>" + type + "</h3>" + "\n";
            if (table) {
                description.push(type + table);
            } else
                description.push(type + desc[d].description);
        }
        else {
            description.push(desc[d].description.trim());
        }
    }
    
    if (dataType)
        return "<strong>" + dataType + "</strong> that specifies " + description.join("\n");
        
    return description.join("\n");
}
