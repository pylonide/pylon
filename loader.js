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
    "JmlParser",
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

    "audio",
    "bar",
    "browser",
    "button",
    //"calendar",
    "chart",
    "checkbox",
    "collection",
    "colorpicker",
    "container",
    "datagrid",
    "datagrid2",
    "datastore",
    "divider",
    //"draw",
    "dropdown",
    "editor",
    "errorbox",
    "fastlist",
    "fileuploadbox",
    "flashplayer",
    "frame",
    "grid",
    "htmlwrapper",
    "hbox",    
    "insert",
    "jslt",
    "label",
    "layoutbuilder",
    "list",
    "menu",
    "modalwindow",
    "notifier",
    "palette",
    "picture",
    "portal",
    "progressbar",
    "radiobutton",
    "repeat",
    //"richtexteditor",
    "repeat",
    "slider",
    "slideshow",
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

    "audio/type_flash",
    
    "editor/plugins",
    
    "textbox/masking",
    "textbox/autocomplete",
    
    "modalwindow/widget",
    
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
    
    "crypto/base64.js",
    "crypto/md5.js",
    
    "lib/util/abstractevent.js",
    "lib/util/utilities.js",
    "lib/util/cookie.js",
    "lib/util/css.js",
    "lib/util/dragmode.js",
    "lib/util/ecmaext.js",
    "lib/util/flash.js",
    "lib/util/nameserver.js",
    "lib/util/plane.js",
    "lib/util/popup.js",
    //"lib/util/silverlight.js",
    
    "lib/animation.js",
    "lib/date.js",
    "lib/flow.js",
    "lib/history.js",
    "lib/layout.js",
    "lib/print.js",
    "lib/resize.js",
    "lib/scrollbar.js",
    "lib/sort.js",
    //"lib/sql.js",
    "lib/vector.js",
    "lib/auth.js",
    
    "lib/offline.js",
    "lib/offline/transactions.js",
    "lib/offline/models.js",
    "lib/offline/state.js",
    "lib/offline/queue.js",
    "lib/offline/detector.js",
    "lib/offline/application.js",
    "lib/offline/gears.js",

    "lib/storage.js",
    "lib/storage/air.js",
    "lib/storage/air.file.js",
    "lib/storage/air.sql.js",
    "lib/storage/flash.js",
    "lib/storage/gears.js",
    "lib/storage/html5.js",
    "lib/storage/memory.js",
    //"lib/storage/deskrun.js",
    //"lib/storage/deskrun.file.js",
    //"lib/storage/deskrun.sql.js",
    
    "browsers/is_gecko.js",
    "browsers/is_ie.js",
    "browsers/is_opera.js",
    "browsers/is_safari.js",
    "browsers/non_ie.js",
    "browsers/is_gears.js",
    
    "parsers/xpath.js",
    "parsers/xslt.js",
    "parsers/jslt.js",
    "parsers/js.js",
    "parsers/url.js",
    "parsers/xsd.js",
    
    "class.js",
    "debug/debug.js",
    "debug/profiler.js",
    "datainstructions.js",
    
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
    "node/xforms.js",
    "node/interactive.js"
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
