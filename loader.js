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
**      Bootloader for Ajax.org Platform
**
**      First include apf.js, then include this file (loader.js)
**      Then just go about it as you would with the packaged version
**      Adapt this file to include your preferred modules
**
****************************************************************/

// #ifndef __PACKAGED

if (!apf.basePath)
    apf.basePath = "./";

apf.Modules = [
    "DataBinding",
    "AmlElement",
    "AmlParser",
    "Presentation",
    "window",
    "XmlDatabase"
];
apf.Elements = [
    "_base/basebutton",
    "_base/baselist",
    "_base/basesimple",
    "_base/basetab",

    "actiontracker",
    "accordion",
    "appsettings",
    "audio",
    "bar",
    "browser",
    "button",
    "calendar",
    "caldropdown",
    "chart",
    //"presenter",
    "checkbox",
    "collection",
    "colorpicker",
    //"container",
    "datagrid",
    //"datastore",
    "divider",
    //"draw",
    "dropdown",
    "editor",
    "errorbox",
    "upload",
    "flashplayer",
    "flowchart",
    "frame",
    "grid",
    "htmlwrapper",
    "hbox",
    "insert",
    "jslt",
    "label",
    //"layoutbuilder",
    "list",
    "menu",
    "modalwindow",
    "model",
    "notifier",
    "palette",
    "img",
    "pager",
    "portal",
    "progressbar",
    "radiobutton",
    "remote",
    "repeat",
    //"richtexteditor",
    "repeat",
    "slider",
    "slideshow",
    "smartbinding",
    "spinner",
    "splitter",
    "state",
    "statusbar",
    "submitform",
    "tab",
    "teleport",
    "template",
    "text",
    "textbox",
    "toc",
    "toolbar",
    "tree",
    "markupedit",
    "video",
    "xslt",

    "appsettings/iepngfix",

    "audio/type_flash",

    "editor/plugins",
    "editor/selection",

    "editor/plugins/anchor",
    "editor/plugins/blockquote",
    "editor/plugins/charmap",
    "editor/plugins/clipboard",
    "editor/plugins/code",
    "editor/plugins/color",
    "editor/plugins/datetime",
    "editor/plugins/directions",
    "editor/plugins/emotions",
    "editor/plugins/fontbase",
    "editor/plugins/fontstyle",
    "editor/plugins/help",
    "editor/plugins/hr",
    "editor/plugins/image",
    "editor/plugins/links",
    "editor/plugins/list",
    "editor/plugins/media",
    "editor/plugins/printing",
    "editor/plugins/search",
    "editor/plugins/subsup",
    "editor/plugins/tables",
    "editor/plugins/visualaid",

    "textbox/masking",
    "textbox/autocomplete",

    "modalwindow/widget",

    "video/type_flv",
    "video/type_qt",
    "video/type_silverlight",
    //"video/type_vlc",
    "video/type_wmp"
];
apf.KernelModules = [
    "class.js",
    "component.js",
    "datainstructions.js",
    "window.js",
    "xmldatabase.js",

    "crypto/base64.js",
    "crypto/md5.js",

    "lib/util/abstractevent.js",
    "lib/util/utilities.js",
    "lib/util/cookie.js",
    "lib/util/css.js",
    "lib/util/dragmode.js",
    "lib/util/ecmaext.js",
    "lib/util/hotkey.js",
    "lib/util/json.js",
    "lib/util/flash.js",
    "lib/util/nameserver.js",
    "lib/util/plane.js",
    "lib/util/popup.js",
    "lib/util/silverlight.js",
    "lib/util/xml.js",

    "lib/tween.js",
    "lib/date.js",
    "lib/flow.js",
    "lib/history.js",
    "lib/layout.js",
    "lib/printer.js",
    "lib/resize.js",
    "lib/scrollbar.js",
    "lib/sort.js",
    "lib/draw.js",
    "lib/draw_canvas.js",
    "lib/draw_vml.js",
    "lib/chart_draw.js",

    //"lib/sql.js",
    //"lib/vector.js",
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
    "parsers/aml.js",

    "debug/debug.js",
    "debug/debugwin.js",
    "debug/profiler.js",

    "node/amlelement.js",
    "node/alignment.js",
    "node/anchoring.js",
    "node/cache.js",
    "node/databinding.js",
    "node/delayedrender.js",
    "node/docking.js",
    "node/dragdrop.js",
    "node/editmode.js",
    "node/amldom.js",
    "node/media.js",
    "node/multicheck.js",
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
apf.TelePortModules = [
    "http.js",         // for simple HTTP transactions
    //"socket.js",     // APF HTTP Socket Implementation
    //"poll.js",         // APF Polling Engine
    "rpc.js",         // RPC Baseclass (needs HTTP class)
    "xmpp.js",        // XMPP class providing the XMPP comm layer
    "webdav.js",

    //RPC Modules (all need rpc.js)
    "rpc/xmlrpc.js",    // XML-RPC
    //"rpc/soap.js",     // SOAP
    "rpc/jsonrpc.js",     // JSON
    //"rpc/jphp.js",     // JPHP
    "rpc/cgi.js"      // CGI
]

apf.Init.addConditional(function(){
    apf.dispatchEvent("domready");
}, null, ["body", "class"]);

/*if(document.body)
    apf.Init.run('body');
else*/
    apf.addDomLoadEvent(function(){apf.Init.run('body');});

//Load depencies & start
apf.startDependencies();

// #endif
