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

if (!jpf.basePath)
    jpf.basePath = "./";

jpf.Modules = [
    "ActionTracker",
    "DataBinding",
    "JmlNode",
    "JMLParser",
    "Presentation",
    "WindowImplementation",
    "XmlDatabase"
];
jpf.Components = [
    "_base/component",
    "_base/basebutton",
    "_base/basefastlist",
    "_base/baselist",
    "_base/basesimple",
    "_base/basetab",
    
    "bar",
    "browser",
    "button",
    "calendar",
    "chart",
    "checkbox",
    "collection",
    "colorpicker",    
    "container",
    "datagrid",
    "datagrid2",
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
    "video",
    "xslt",
    
    "textbox/masking",
    "textbox/autocomplete",
    
    "video/type_flv",
    "video/type_qt",
    "video/type_silverlight",
    "video/type_wmp"
];
jpf.KernelModules = [
    "jmlparser.js",
    "teleport.js",
    "window.js",
    "xmldatabase.js",
    
    "jml/actiontracker.js",
    "jml/appsettings.js",
    "jml/deskrun.js",
    "jml/jmlnode.js",
    "jml/model.js",
    "jml/remotesmartbinding.js",
    "jml/smartbinding.js",
    
    "kernel/crypto/base64.js",
    "kernel/crypto/md5.js",
    
    "kernel/lib/util/utilities.js",
    "kernel/lib/util/cookie.js",
    "kernel/lib/util/css.js",
    "kernel/lib/util/dragmode.js",
    "kernel/lib/util/ecmaext.js",
    "kernel/lib/util/flash.js",
    "kernel/lib/util/nameserver.js",
    "kernel/lib/util/plane.js",
    "kernel/lib/util/popup.js",
    //"kernel/lib/util/silverlight.js",
    
    "kernel/lib/animation.js",
    "kernel/lib/date.js",
    "kernel/lib/flow.js",
    "kernel/lib/gridplace.js",
    "kernel/lib/history.js",
    "kernel/lib/layout.js",
    "kernel/lib/print.js",
    "kernel/lib/resize.js",
    "kernel/lib/scrollbar.js",
    "kernel/lib/sort.js",
    //"kernel/lib/sql.js",
    "kernel/lib/vector.js",
    "kernel/lib/auth.js",
    
    "kernel/lib/offline.js",
    "kernel/lib/offline/transactions.js",
    "kernel/lib/offline/models.js",
    "kernel/lib/offline/state.js",
    "kernel/lib/offline/queue.js",
    "kernel/lib/offline/detector.js",
    "kernel/lib/offline/application.js",
    "kernel/lib/offline/gears.js",
    
    "kernel/lib/storage.js",
    "kernel/lib/storage/air.js",
    "kernel/lib/storage/air.file.js",
    "kernel/lib/storage/air.sql.js",
    "kernel/lib/storage/flash.js",
    "kernel/lib/storage/gears.js",
    "kernel/lib/storage/html5.js",
    "kernel/lib/storage/memory.js",
    //"kernel/lib/storage/deskrun.js",
    //"kernel/lib/storage/deskrun.file.js",
    //"kernel/lib/storage/deskrun.sql.js",
    
    "kernel/browsers/is_gecko.js",
    "kernel/browsers/is_ie.js",
    "kernel/browsers/is_opera.js",
    "kernel/browsers/is_safari.js",
    "kernel/browsers/non_ie.js",
    "kernel/browsers/is_gears.js",
    
    "kernel/parsers/xpath.js",
    "kernel/parsers/xslt.js",
    "kernel/parsers/jslt.js",
    "kernel/parsers/js.js",
    "kernel/parsers/url.js",
    "kernel/parsers/xsd.js",
    
    "kernel/class.js",
    "kernel/debug.js",
    //"kernel/debug/debug.js",
    "kernel/debug/profiler.js",
    "kernel/datainstructions.js",
    
    "node/alignment.js",
    "node/anchoring.js",
    "node/cache.js",
    "node/databinding.js",
    "node/delayedrender.js",
    "node/docking.js",
    "node/dragdrop.js",
    "node/editmode.js",
    "node/jmldom.js",
    "node/media.js",
    "node/multilevelbinding.js",
    "node/multiselect.js",
    "node/presentation.js",
    "node/rename.js",
    "node/transaction.js",
    "node/validation.js",
    "node/virtualviewport.js",
    "node/xforms.js"
];
jpf.TelePortModules = [
    "http.js",         // for simple HTTP transactions
    //"socket.js",     // Javeline HTTP Socket Implementation
    //"poll.js",         // Javeline Polling Engine
    "rpc.js",         // RPC Baseclass (needs HTTP class)
    "xmpp.js",        // XMPP class providing the XMPP comm layer

    //RPC Modules (all need rpc.js)
    "rpc/xmlrpc.js",    // XML-RPC
    //"rpc/soap.js",     // SOAP
    "rpc/jsonrpc.js",     // JSON
    //"rpc/jphp.js",     // JPHP
    "rpc/cgi.js"      // CGI
]

if (document.body)
    jpf.Init.run('body');
else
    window.onload = function(){jpf.Init.run('body');}

//Load depencies & start
jpf.startDependencies();
