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

/* ***************************************************************
**
**      Bootloader for Javeline PlatForm
**
**      First include jpf.js, then include this file (loader.js)
**      Then just go about it as you would with the packaged version
**      Adapt this file to include your preferred modules
**
****************************************************************/

if(!jpf.basePath)
    jpf.basePath = "./";

jpf.Modules = ['XMLDatabaseImplementation', 'ActionTracker', 'JMLParser', 'JmlNode', 'WindowImplementation', 'Presentation', 'DataBinding'];
jpf.Components = [
    "_base/basetab",
    "_base/basebutton",
    "_base/basefastlist",
    "_base/baselist",
    "_base/basesimple",
    "_base/component",
    
    "datagrid2/datagrid2",
    "video/video",
    "video/type_flv",
    "video/type_qt",
    "video/type_wmp",

    "bar",
    "browser",
    "button",
    "calendar",
    "checkbox",
    "collection",
    "colorpicker",    
    "container",
    "datagrid",
    "datastore",
    "dropdown",
    "errorbox",
    "fastlist",
    "fileuploadbox",
    "flash",
    "frame",
    "htmlwrapper",
    "hbox",
    "insert",
    "jslt",
    "label",
    "layoutbuilder",
    "list",
    "menu",
    "modalwindow",
    "pages",
    "palette",
    "picture",
    "portal",
    "progressbar",
    "radiobutton",
    "repeat",
    //"richtexteditor",
    "repeat",
    "slider",
    "spinner",
    "splitter",
    "state",
    "statusbar",
    "submitform",
    "tab",
    "text",
    "textbox",
    "tinymce",
    "toc",
    "toolbar",
    "tree",
    "markupedit",
    "workflow",
    "xslt"
];
jpf.KernelModules = [
    "window.js",
    "jmlnode.js",
    "teleport.js",
    "jmlparser.js",
    
    "application/xmldatabase.js",
    "application/actiontracker.js",
    "application/layout.js",
    "application/deskrun.js",
    "application/smartbinding.js",
    "application/remotesmartbinding.js",
    "application/model.js",
    "application/xsdimplementation.js",
    "application/appsettings.js",
    "application/scrollbar.js",
    
    "crypt/base64.js",
    "crypt/md5.js",
    
    "node/presentation.js",
    "node/multiselect.js",
    "node/rename.js",
    "node/cache.js",
    "node/dragdrop.js",
    "node/databinding.js",
    "node/alignment.js",
    "node/anchoring.js",
    "node/transaction.js",
    "node/delayedrender.js",
    "node/validation.js",
    "node/jmldom.js",
    "node/media.js",
    "node/editmode.js",
    "node/multilevelbinding.js",
    "node/docking.js",
    "node/xforms.js",
    "node/virtualviewport.js",
    
    "kernel/animation.js",
    "kernel/patches.js",
    "kernel/debug.js",
    "kernel/ecmaext.js",
    "kernel/class.js",
    "kernel/sort.js",
    "kernel/print.js",
    "kernel/history.js",
    
    "kernel/flow.js",
    "kernel/date.js",
    "kernel/resize.js",
    "kernel/chart.js",
    "kernel/vector.js",
    
    "kernel/browsers/is_safari.js",
    "kernel/browsers/is_opera.js",
    "kernel/browsers/is_gecko.js",
    "kernel/browsers/is_ie.js",
    "kernel/browsers/non_ie.js",
    
    "kernel/browsers/xpath.js",
    "kernel/browsers/xslt.js",
    "kernel/browsers/jslt.js",
    "kernel/browsers/js.js"
];
jpf.TelePortModules = [
    "http.js",         // for simple HTTP transactions
//    "socket.js",     // Javeline HTTP Socket Implementation
//    "poll.js",         // Javeline Polling Engine
    "rpc.js",         // RPC Baseclass (needs HTTP class)
    "xmpp.js",        // XMPP class providing the XMPP comm layer

    //RPC Modules (all need rpc.js)
    "rpc/xmlrpc.js",    // XML-RPC
//    "rpc/soap.js",     // SOAP
    "rpc/jsonrpc.js",     // JSON
//    "rpc/jphp.js",     // JPHP
    "rpc/get.js",      // REST
    "rpc/post.js"      // POST
//    "rpc/header.js"      // HEADER
];

if (document.body)
    jpf.Init.run('BODY');
else
    window.onload = function(){jpf.Init.run('BODY');}

//Load depencies & start
jpf.startDependencies();
