var apf = {
    supportVML : document.all?true:false,
    supportSVG : document.all?false:true,
	SUCCESS:1,
	xmldb:{
		removeNode:function(xmlNode){
			if(xmlNode.nodeType==2)
				(xmlNode.ownerElement || xmlNode.selectSingleNode("..")).removeAttribute(xmlNode.nodeName);
			else xmlNode.parentNode.removeChild(xmlNode);
		},
		removeNodeList:function(list){
			for(var i = 0,j;i<list.length;i++){
				if((j = list[i]).nodeType==2)
					(j.ownerElement || j.selectSingleNode("..")).removeAttribute(j.nodeName);
				else j.parentNode.removeChild(j);
			}
		},
		appendChild:function(pNode,xmlNode,beforeNode){
			if (pNode.ownerDocument && pNode.ownerDocument.importNode && pNode.ownerDocument != xmlNode.ownerDocument)
				xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes		
			
			return pNode.insertBefore(xmlNode, beforeNode);
		},
		replaceNode:function(newNode, oldNode){
			oldNode.parentNode.replaceChild(newNode, oldNode);
			return newNode;
		},
		removeAttribute:function(xmlNode,attribute){
			xmlNode.removeAttribute(attribute);
		},
		setAttribute:function(xmlNode,attribute){
			xmlNode.setAttribute(attribute);
		}
	},
	$profiler : {},
	profile_start:function(id){
		apf.$profiler[id] = (new Date()).getTime();
	},
	profile_end:function(id){
		return (new Date()).getTime() - apf.$profiler[id];
	},
	profile_log : function(id,txt,delta,out){
        var t = "Profiling run "+(txt?txt:"")+" "+((new Date()).getTime() - apf.$profiler[id] - (delta||0))+" ms"
        if(!out) apf.logw(t);
        else document.title = t;
            
	},
	profile_loop : function(times,func,out){
        function test(){};
        var delta = (new Date()).getTime();
        for(var i = 0;i<times;i++) test();
        delta = (new Date()).getTime() - delta;
		apf.profile_start("loop");
		for(var i = 0;i<times;i++)
			func();
		apf.profile_log("loop",null,delta,out);
	},
	logw:function( txt ){
		// lets find our log div
		var e = document.getElementById('_logw');
		if(!e){
			// lets inject it
            var t = "<div id='_logw' style='width:100%;height:500px;overflow-y:scroll;overflow-x:scroll;white-space:break-word;background-color:black;color:gray;font-family:courier;font-size:8pt;'></div>";
            if(!document.body.insertAdjacentHTML)
                document.body.innerHTML += t;
            else
                document.body.insertAdjacentHTML("beforeend",t); 
			e = document.getElementById('_logw');
		}
		if(e){
			var t = (txt+'').replace(/\</g, "&lt;").replace(/\</g, "&gt;").replace(/\n/g, "<br/>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;")+"<br/>";
            if(!e.insertAdjacentHTML)
                e.innerHTML += t;
            else
                e.insertAdjacentHTML("beforeend", t);
			e.scrollTop = e.scrollHeight;
		}
		return txt;
	},
	language:{words:{}},
	console:{},
	getXml:function(str){
			return parseXML(str).documentElement;
	},
	getXmlDom:function(str){
			return parseXML(str);
	},
	formatErrorString:function(a,b,s0,s1){
		return s0+s1;
	},
	setNodeValue : function(xmlNode, value){
		if(xmlNode.nodeType == 1){
			var n;
			if((n = xmlNode.firstChild) && n && n.nodeType!=1)
				n.nodeValue = value;
		}else
			xmlNode.nodeValue = value;
	},
	createNodeFromXpath:function(xmlNode,xpath){
		var n = xmlNode.selectSingleNode(xpath);
		if(n) return n;
		return {};
	},
	importCssString : function(cssString, doc, media){
		doc = doc || document;
		var htmlNode = doc.getElementsByTagName("head")[0];//doc.documentElement.getElementsByTagName("head")[0];

		//#ifdef __WITH_OPACITY_RUNTIME_FIX
		if (!apf.supportOpacity) {
			cssString = cssString.replace(/opacity[ \s]*\:[ \s]*([\d\.]+)/g,
				function(m, m1){
					return "filter:progid:DXImageTransform.Microsoft.Alpha(opacity=" + (m1*100) + ")";
				});
		}
		//#endif

		if (apf.canCreateStyleNode) {
			//var head  = document.getElementsByTagName("head")[0];
			var style = doc.createElement("style");
			style.appendChild(doc.createTextNode(cssString));
			if (media)
				style.setAttribute('media', media);
			htmlNode.appendChild(style);
		}
		else {
			htmlNode.insertAdjacentHTML("beforeend", ".<style media='"
			 + (media || "all") + "'>" + cssString + "</style>");

			/*if(document.body){
				document.body.style.height = "100%";
				setTimeout('document.body.style.height = "auto"');
			}*/
		}
	},
	nameserver:{lookup:{model:{}}},
	dump:function( o, s, d ){
	  if(!s)s = [], d = 0; var k, t, u, l = s.length;
	  switch(typeof(o)){
		  case 'object': if(o!==null){
			  t = Array(d+2).join('   '), u  =Array(d+1).join('   ');
			  if(o.constructor == Array){
				  s[l++]="[\n";
				  for(k = 0;k<o.length;k++)s[l++]=t,apf.dump(o[k],s,d+1),l=s.length,s[l++]=",\n";
				  s[l]="\n", s[l++]=u, s[l++]="]";
			  }else{
				  s[l++]="{\n";
				  for(k in o)s[l++]=t,s[l++]=k.match(/[^a-zA-Z0-9_]/)?'"'+k+'"':k,
					 s[l++]=':',apf.dump(o[k],s,d+1),l=s.length,l=s.length,s[l++]=",\n";
				  s[l]="\n", s[l++]=u, s[l++]="}";
			  }
		  }else s[l++] = 'null';break;
		  case 'string':s[l++]='"',s[l++]=o.replace(/(["\\])/g, '\\$1').replace(/\r?\n/g,"\\n"),s[l++] ='"';break;
		  default:s.push(o);break;
	  }
	  return d?0:s.join('');
	}
};
apf.console.error = apf.logw;
apf.console.warn = apf.logw;

 if (typeof HTMLElement!="undefined") {
    if (!HTMLElement.prototype.insertAdjacentElement) {
        Text.prototype.insertAdjacentElement =
        HTMLElement.prototype.insertAdjacentElement = function(where,parsedNode){
            switch (where.toLowerCase()) {
                case "beforebegin":
                    this.parentNode.insertBefore(parsedNode,this);
                    break;
                case "afterbegin":
                    this.insertBefore(parsedNode,this.firstChild);
                    break;
                case "beforeend":
                    this.appendChild(parsedNode);
                    break;
                case "afterend":
                    if (this.nextSibling)
                        this.parentNode.insertBefore(parsedNode,this.nextSibling);
                    else
                        this.parentNode.appendChild(parsedNode);
                    break;
            }
        };
    }

    if (!HTMLElement.prototype.insertAdjacentHTML) {
        Text.prototype.insertAdjacentHTML =
        HTMLElement.prototype.insertAdjacentHTML = function(where,htmlStr){
            var r = this.ownerDocument.createRange();
            r.setStartBefore(apf.isWebkit
                ? document.body
                : (self.document ? document.body : this));
            var parsedHTML = r.createContextualFragment(htmlStr);
            this.insertAdjacentElement(where, parsedHTML);
        };
    }

    if (!HTMLBodyElement.prototype.insertAdjacentHTML) //apf.isWebkit)
        HTMLBodyElement.prototype.insertAdjacentHTML = HTMLElement.prototype.insertAdjacentHTML;

    if (!HTMLElement.prototype.insertAdjacentText) {
        Text.prototype.insertAdjacentText =
        HTMLElement.prototype.insertAdjacentText = function(where,txtStr){
            var parsedText = document.createTextNode(txtStr);
            this.insertAdjacentElement(where,parsedText);
        };
    }
}
