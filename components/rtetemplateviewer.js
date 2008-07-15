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

// #ifdef 0 && (__JRICHTEXTEDITOR || __INC_ALL)

RTETemplateViewer = {
    active : null,
    editors : new Array(),
    
    /* ***************
        API
    ****************/
    
    add : function(o, hideBorder){
        var q = new RTEHelper(o).Init(hideBorder);
        this.editors.push(q);
        return q;
    },
    
    activate : function(o){
        this.active.deActivate(true);
        this.active = o;
        o.activate(true);
    },
    
    deActivate : function(){
        if(!this.active) return;
        this.active.deActivate(true);
        this.active = null;
    },
    
    redoButtons : function(){
        this.host.redoButtons();
    },
    
    protectEnvironment : function(openBody){
        for(var i=0;i<document.all.length;i++) document.all(i).unselectable = "on";
        for(var i=0;i<this.editors.length;i++) this.editors[i].unselectable = "off";
        if(openBody) document.body.unselectable = "off";
    },
    
    getEditor : function(id){},
    getActiveEditor : function(){
        return this.active
    },

    getValue :  function(){
        var ra = new Array();
        for(var i=0;i<this.editors.length;i++) ra.push(this.editors[i].getValue());
    },

    setValue : function(args){
        for(var i=0;i<args.length;i++) this.editors[i].setValue(args[i]);
    },
    
    focus : function(){
        if(this.active) this.active.focus();
    },
    
    /* ***************
        INIT
    ****************/
    
    Init : function(){
        if(this.__loaded){
            //leftbar.deactivate();
            //rightbar.deactivate();
            //content.activate();
        }
        else this.add(document.body, true).activate();
    },
    
    load : function(url){
        this.__loaded = true;
    },
    
    draw : function(){
        
    }
}

function InitAll(){

document.body.scrollTop = 0;
document.body.oncontextmenu = function(){return false;}

if(top.Kernel){
    RTETemplateViewer.host = top.jpf.lookup(HOST);
    RTETemplateViewer.host.register(RTETemplateViewer);
}

document.body.onfocus = function(){
    top.me.__focus(RTETemplateViewer.host);
    RTETemplateViewer.host.focus();
}
document.onkeydown = function(){
    top.document.onkeydown(event);
}

document.onkeyup = function(){
    RTETemplateViewer.host.Change(RTETemplateViewer.getActiveEditor().getValue());
}

}

if(document.all) InitAll();

// #endif