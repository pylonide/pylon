/**
 * $Id: plugins.js 12344 2007-07-04 15:35:01Z mike $
 * @version $Rev: 12344 $
 */
Editor.Plugin.Contextualtyping = Editor.Plugin();
Editor.Plugin.Contextualtyping.prototype = {
    register: function() {
        this.name    = 'Contextualtyping';
    	this.type    = Editor.TEXTMACRO;
    	this.subType = null;
    	this.hook    = 'onTyping';
        this.busy	 = false;
    	this.execute = function(editor, args) {
    	    this.busy = true;
    		var i, iLength, srcPrefix, j, content;
    		var key = args[1];
    		if (key == 32) {
        		if (is_ie) {
                    var crt_range = document.selection.createRange().duplicate();
                    crt_range.moveStart("word", -5);
        		    for (i = editor.options.smileyImages.length - 1; i >= 0; i--) {
        		    	iLength = editor.options.smileyImages[i].length;
        	            if (editor.options.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
        	                src_prefix = "" ;
        	            else
        	                src_prefix = editor.options.smileyPath;
        	            for (j = 0; j < iLength - 1; j++)
        				    if (crt_range.findText(editor.options.smileyImages[i][j]))
        					    crt_range.pasteHTML('&nbsp;<img src="' + src_prefix + editor.options.smileyImages[i][iLength - 1] + '" border="0" alt="">');
        	        }
        		} else {
        			var crt_sel = editor.EditorWindow.contentWindow.getSelection();
        	        var crt_range = crt_sel.getRangeAt(0);
        	        var el = crt_range.startContainer;
        	        content = el.nodeValue;
        	        if (content) {
        	            for (i = editor.options.smileyImages.length-1; i >= 0; i--) {
            	        	iLength = editor.options.smileyImages[i].length;
            	            if (editor.options.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
            	                src_prefix = "" ;
            	            else
            	                src_prefix = editor.options.smileyPath;
                            
                            // Refresh content in case it has been changed by previous smiley replacement
                            content = el.nodeValue;
                            
        	            	for (j = 0; j < iLength - 1; j++) {
                                // Find the position of the smiley sequence
                                var smileyPos = content.indexOf(editor.options.smileyImages[i][j]);
        		                if (smileyPos > -1) {
                                    // Create a range for the smiley sequence and remove the contents 
        		                    crt_range.setStart(el, smileyPos);
        		                    crt_range.setEnd(el, smileyPos + editor.options.smileyImages[i][j].length);
        		                    crt_range.deleteContents();
                                    
                                    // Add the smiley image to the range
        		                    smiley_img = new Image;
        		                    smiley_img.src = src_prefix + editor.options.smileyImages[i][iLength - 1];
        		                    smiley_img.border = 0;
        		                    crt_range.insertNode(smiley_img);

                                    // And position the caret at the end of the next textNode
                                    var nextTextNode = crt_range.endContainer.nextSibling;
                                    while(nextTextNode.nodeType != 3) {
                                        nextTextNode = nextTextNode.nextSibling;
                                    }
                                    if(nextTextNode != crt_range.endContainer) { 
                                        crt_range.setEnd(nextTextNode, nextTextNode.length);
                                        crt_range.collapse(false);
                                        crt_sel.removeAllRanges();
                                        crt_sel.addRange(crt_range);
                                    }
                                    
        		                }
        	            	}
            	        }
        	        }
        		}
    		}
    		this.busy = false;
    	};
    }
};

Editor.Plugin.RestrictLength = Editor.Plugin();
Editor.Plugin.RestrictLength.prototype = {
    register: function() {
        this.name    = 'RestrictLength';
    	this.type    = Editor.TEXTMACRO;
    	this.subType = null;
    	this.hook    = 'onTyping';
        this.busy	 = false;
    	this.execute = function(editor, args) {
    	    this.busy = true;
    		var key = args[1];
            
            var oRoot = editor.EditorDocument || editor.EditorDocument.body;
            
            var aTextNodes = getElementsByNodeType(oRoot, 3);
            
            var iLength = 0;
            for(var i = 0; i < aTextNodes.length; i++) {
                iLength += aTextNodes[i].length;
            }
            
            var iMaxLength = editor.options.maxTextLength;
            if(iLength > iMaxLength) {
                var iExcessLength = iLength - iMaxLength;
                for(var i = aTextNodes.length -1 ; i >= 0; i--) {
                    oTextNode = aTextNodes[i];
                    if(oTextNode.length > iExcessLength) {
                        var s = oTextNode.nodeValue;
                        var oRemainder = oTextNode.splitText(oTextNode.length - iExcessLength);
                        oTextNode.parentNode.removeChild(oRemainder);
                        //this.setFocus();
                        break;
                    }
                    else {
                        iExcessLength -= oTextNode.length;
                        oTextNode.parentNode.removeChild(oTextNode);
                    }
                }
            }
            
    		this.busy = false;
    	};
    }
};

Editor.Plugin.Smilies = Editor.Plugin();
Editor.Plugin.Smilies.prototype = {
	register: function() {
	    this.name        = 'Smilies';
    	this.icon        = 'plugin.smilies.gif';
    	this.type        = Editor.TOOLBARITEM;
    	this.subType     = Editor.TOOLBARPANEL;
    	this.hook        = 'onToolbar';
    	this.buttonBuilt = false;
    	this.buttonNode  = null;
    	this.panelBuilt  = false;
    	this.opened      = false;
        this.updatePanelBody = false;
    	this.colspan     = 20;
    	this.execute     = function(editor) {
    		if (!this.panelBuilt) {
    		    this.editor = editor;
    		    this.Panel = new Editor.Panel(this.name, this.editor);
                this.createPanelBody();
                this.panelBuilt = true;
    		} else {
    		    if (this.Panel.opened && !is_ie)
    		      this.Panel.hide();
                else {
                  if(this.updatePanelBody)
                    this.createPanelBody();
                  this.Panel.show(this.buttonNode);
                }
    		}
    		//return button id, icon and action:
    		return {id: this.name, action: null};
    	};
	},
	createPanelBody: function() {
        ;;;startMeter('createPanelBody');
		var oTable = this.Panel._Document.createElement('TABLE');
		oTable.style.tableLayout = 'fixed';
		oTable.cellPadding = 0;
		oTable.cellSpacing = 2;
		oTable.border = 0;
		oTable.width = (27 * this.colspan);
		var oCell = oTable.insertRow(-1).insertCell(-1);
		oCell.colSpan = this.colspan;
		var aImages = this.editor.options.smileyImages;
		var iCounter = 0;
		var iLength = 0;
		var sUrl = "";
		while(iCounter < aImages.length) {
			var oRow = oTable.insertRow(-1);
			for(var i = 0; i < this.colspan && iCounter < aImages.length; i++, iCounter++) {
				iLength = aImages[iCounter].length;
			    sUrl = this.editor.options.smileyPath + aImages[iCounter][iLength - 1];
				oDiv = oRow.insertCell(-1).appendChild(this.createSelectionDiv());
				oDiv.parentNode.width = 23;
				oDiv.innerHTML = "<div style=\"width:20px;height:20px;background:url(" + sUrl + ") no-repeat center center;\"></div>";
				oDiv.SmileyImage = sUrl;
				oDiv.Command = this;
				oDiv.onclick = this.onSmileySelect;
			}
		}
		this.Panel.setContent(oTable);
        this.updatePanelBody = false;
		;;;stopMeter();
	},
	createSelectionDiv: function() {
		var oDiv = this.Panel._Document.createElement("DIV") ;
		oDiv.className		= "itemDeselected";
		oDiv.onmouseover	= function() {this.className = "itemSelected";};
		oDiv.onmouseout		= function() {this.className = "itemDeselected"};
		return oDiv ;
	},
	onSmileySelect: function() {
	    this.Command.editor.insertHTML('<img src="' + this.SmileyImage + '" alt="" border="0">');
	    this.Command.Panel.hide();
	}
};

Editor.Plugin.FontColor = Editor.Plugin();
Editor.Plugin.FontColor.prototype = {
	register: function() {
	    this.name        = 'FontColor';
    	this.icon        = 'plugin.fontcolor.gif';
    	this.type        = Editor.TOOLBARITEM;
    	this.subType     = Editor.TOOLBARPANEL;
    	this.hook        = 'onToolbar';
    	this.buttonBuilt = false;
    	this.buttonNode  = null;
    	this.panelBuilt  = false;
    	this.opened      = false;
    	this.colspan     = 8;
    	this.execute     = function(editor) {
    		if (!this.panelBuilt) {
    		    this.editor = editor;
    		    this.Panel = new Editor.Panel(this.name, this.editor);
    		    this.createPanelBody();
    			this.panelBuilt = true;
    		} else {
    		    if (this.Panel.opened && !is_ie)
    		      this.Panel.hide();
    		    else
    		      this.Panel.show(this.buttonNode);
    		}
    		//return button id, icon and action:
    		return {id: this.name, action: null};
    	};
	},
	createPanelBody: function() {
		var oTable = this.Panel._Document.createElement('TABLE');
		oTable.style.tableLayout = 'fixed';
		oTable.cellPadding = 1;
		oTable.cellSpacing = 2;
		oTable.border = 0;
		oTable.width = (15 * this.colspan);
		var oCell = oTable.insertRow(-1).insertCell(-1);
		oCell.colSpan = this.colspan;
		var aColors = this.editor.options.fontColors;
		var iCounter = 0;
		var iLength = 0;
		var sUrl = "";
		while(iCounter < aColors.length) {
			var oRow = oTable.insertRow(-1);
			for(var i = 0; i < this.colspan && iCounter < aColors.length; i++, iCounter++) {
				oDiv = oRow.insertCell(-1).appendChild(this.createSelectionDiv());
				oDiv.parentNode.width = 13;
				oDiv.parentNode.height = 13;
				oDiv.innerHTML = "<div style=\"width:9px;height:8px;background-color:#" + aColors[iCounter] + ";\"></div>";
				oDiv.FontColor = aColors[iCounter];
				oDiv.Command = this;
				oDiv.onclick = this.onColorSelect;
			}
		}
		this.Panel.setContent(oTable);
	},
	createSelectionDiv: function() {
		var oDiv = this.Panel._Document.createElement("DIV") ;
		oDiv.className		= "itemDeselected";
		oDiv.onmouseover	= function() {this.className = "itemSelected";};
		oDiv.onmouseout		= function() {this.className = "itemDeselected"};
		return oDiv ;
	},
	onColorSelect: function() {
	    this.Command.editor.executeCommand('ForeColor', '#' + this.FontColor);
	    this.Command.Panel.hide();
	    this.Command.editor.setFocus();
	}
};

Editor.Plugin.Fonts = Editor.Plugin();
Editor.Plugin.Fonts.prototype = {
	register: function() {
	    this.name        = 'Fonts';
    	this.icon        = 'plugin.fontname.gif';
    	this.type        = Editor.TOOLBARITEM;
    	this.subType     = Editor.TOOLBARPANEL;
    	this.hook        = 'onToolbar';
    	this.buttonBuilt = false;
    	this.buttonNode  = null;
    	this.panelBuilt  = false;
    	this.bodyBuilt   = false;
    	this.opened      = false;
    	this.colspan     = 1;
    	this.execute     = function(editor) {
    		if (!this.panelBuilt) {
    		    this.editor = editor;
    		    this.Panel = new Editor.Panel(this.name, this.editor);
    		    this.createPanelBody();
    			this.panelBuilt = true;
    		} else {
    		    if (this.Panel.opened && !is_ie)
    		      this.Panel.hide();
    		    else
    		      this.Panel.show(this.buttonNode);
    		}
    		//return button id, icon and action:
    		return {id: this.name, action: null};
    	};
	},
	createPanelBody: function() {
		var oTable = this.Panel._Document.createElement('TABLE');
		oTable.style.tableLayout = 'fixed';
		oTable.cellPadding = 0;
		oTable.cellSpacing = 2;
		oTable.border = 0;
		oTable.width = 150;
		var oCell = oTable.insertRow(-1).insertCell(-1);
		oCell.colSpan = this.colspan;
		var aFonts = this.editor.options.fontNames;
		var iCounter = 0;
		var iLength = 0;
		var sUrl = "";
		while(iCounter < aFonts.length) {
			var oRow = oTable.insertRow(-1);
			for(var i = 0; i < this.colspan && iCounter < aFonts.length; i++, iCounter++) {
				oDiv = oRow.insertCell(-1).appendChild(this.createSelectionDiv());
				oDiv.innerHTML = '<font face="' + aFonts[iCounter] + '" style="font-size: 12px; color: black;">' + aFonts[iCounter] + '</font>';
				oDiv.FontName = aFonts[iCounter];
				oDiv.Command = this;
				oDiv.onclick = this.onFontSelect;
			}
		}
		this.Panel.setContent(oTable);
	},
	createSelectionDiv: function() {
		var oDiv = this.Panel._Document.createElement("DIV") ;
		oDiv.className		= "itemDeselected";
		oDiv.style.backgroundColor = "White";
		oDiv.onmouseover	= function() {this.className = "itemSelected";};
		oDiv.onmouseout		= function() {this.className = "itemDeselected"};
		return oDiv ;
	},
	onFontSelect: function() {
	    this.Command.editor.executeCommand('FontName', this.FontName);
	    this.Command.Panel.hide();
	}
};

Editor.Plugin.Buzz = Editor.Plugin();
Editor.Plugin.Buzz.prototype = {
	register: function() {
	    this.name        = 'Buzz';
    	this.icon        = 'plugin.buzz.gif';
    	this.type        = Editor.TOOLBARITEM;
    	this.subType     = Editor.TOOLBARBUTTON;
    	this.hook        = 'onToolbar';
    	this.buttonBuilt = false;
    	this.panelBuilt  = false;
    	this.execute     = function(editor) {
    		if (typeof editor.options.onBuzz == "function")
		        editor.options.onBuzz(editor);
    		return {id: this.name, action: null};
    	};
	}
};