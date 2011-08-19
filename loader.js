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

/**
 * Bootloader for Ajax.org Platform
 *
 * Include apf.js, then just go about it as you would with the
 * packaged version. Adapt this file to include your preferred modules
 */

// #ifndef __PACKAGED
apf.$loader
    .setGlobalDefaults({
        BasePath: apf.basePath,
        //AlwaysPreserveOrder: true,
        AllowDuplicates : true
        //UsePreloading : false
    })

apf.$x = apf.$loader
    .script(
        "core/class.js",

        "core/crypto/base64.js",
        "core/crypto/md5.js",

        "core/lib/util/abstractevent.js",
        "core/lib/util/async.js",
        "core/lib/util/utilities.js",
        "core/lib/util/color.js",
        "core/lib/util/cookie.js",
        "core/lib/util/style.js",
        "core/lib/util/ecmaext.js",
        "core/lib/util/flash.js",
        "core/lib/util/hotkey.js",
        "core/lib/util/iepngfix.js",
        "core/lib/util/json.js",
        "core/lib/util/nameserver.js",
        "core/lib/util/plane.js",
        "core/lib/util/popup.js",
        "core/lib/util/silverlight.js",
        "core/lib/util/syntax.js",
        "core/lib/util/xml.js",
        "core/lib/util/xmldiff.js",
        "core/lib/util/zmanager.js",
        "core/lib/util/visibilitymanager.js",

        "core/lib/tween.js",
        "core/lib/date.js",
        "core/lib/data.js",
        "core/lib/flow.js",

        "core/lib/geolocation.js",
        "core/lib/history.js",
        "core/lib/html.js",
        "core/lib/layout.js",
        "core/lib/printer.js",
        "core/lib/queue.js",
        "core/lib/resize.js",
        "core/lib/selection.js",
        "core/lib/sort.js",
        "core/lib/skins.js",
        "core/lib/language.js",
        "core/lib/xmldb.js",

        "core/lib/teleport/http.js", // for simple HTTP transactions
        "core/lib/teleport/iframe.js", // for IE secure environments

        "core/lib/draw.js",

        "core/browsers/gecko.js",
        "core/browsers/ie.js",
        "core/browsers/iphone.js",
        "core/browsers/opera.js",
        "core/browsers/webkit.js",
        "core/browsers/non_ie.js",
        "core/browsers/gears.js",

        "core/markup/domparser.js"
    )
    .wait()
    .script(
        "core/window.js",
        "core/lib/config.js",

        "core/lib/draw/canvas.js",
        "core/lib/draw/vml.js",
        "core/lib/draw/chartdraw.js",

        "core/lib/offline.js",
        "core/lib/storage.js",

        "core/lib/uirecorder.js",

        "core/parsers/xpath.js",
        //"parsers/jslt_2.0.js",
        "core/parsers/livemarkup.js",
        "core/parsers/js.js",
        "core/parsers/url.js",

        /*"markup/html5.js",
        "core/markup/xforms.js",*/
        "core/markup/xslt/xslt.js",

        "core/markup/aml.js",
        "core/markup/xhtml.js",
        "core/markup/xsd.js"
    )
    .wait()
    .script(
        "core/lib/offline/transactions.js",
        "core/lib/offline/models.js",
        "core/lib/offline/state.js",
        "core/lib/offline/queue.js",
        "core/lib/offline/detector.js",
        "core/lib/offline/application.js",
        "core/lib/offline/gears.js",

        "core/lib/storage/air.js",
        "core/lib/storage/air.file.js",
        "core/lib/storage/air.sql.js",
        "core/lib/storage/flash.js",
        "core/lib/storage/gears.js",
        "core/lib/storage/html5.js",
        "core/lib/storage/memory.js",
        "core/lib/storage/cookie.js",

        "core/lib/vector.js",
        "core/markup/aml/node.js"
    )
    .wait()
    .script(
        "core/markup/aml/element.js"
    )
    .wait()
    .script(
        "core/markup/aml/characterdata.js",
        "core/markup/aml/text.js",
        "core/markup/aml/namednodemap.js",
        "core/markup/aml/attr.js",
        "core/markup/aml/cdatasection.js",
        "core/markup/aml/comment.js",
        "core/markup/aml/configuration.js",
        "core/markup/aml/document.js",
        "core/markup/aml/documentfragment.js",
        "core/markup/aml/event.js",
        "core/markup/aml/textrectangle.js",
        "core/markup/aml/range.js",
        "core/markup/aml/selection.js",

        "core/markup/xhtml/element.js",
        "core/markup/xsd/element.js",
        "core/baseclasses/contenteditable.js",
        "core/baseclasses/liveedit.js"
    )
    .wait()
    .script(
        "core/baseclasses/contenteditable/clipboard.js",
        "core/baseclasses/contenteditable/commands.js",
        "core/baseclasses/contenteditable/interactive.js",
        "core/baseclasses/contenteditable/selectrect.js",
        "core/baseclasses/contenteditable/visualselect.js",
        "core/baseclasses/contenteditable/visualconnect.js",

        "core/baseclasses/liveedit/richtext.js",

        "core/markup/xhtml/ignore.js",
        "core/markup/xhtml/option.js",
        "core/markup/xhtml/body.js",
        "core/markup/xhtml/html.js",
        "core/markup/xhtml/skipchildren.js",
        "core/markup/xhtml/input.js",

        "core/markup/xinclude.js",
        "core/markup/xinclude/include.js",
        //"markup/xinclude/fallback.js",

        "core/markup/xsd/enumeration.js",
        "core/markup/xsd/fractiondigits.js",
        "core/markup/xsd/length.js",
        "core/markup/xsd/list.js",
        "core/markup/xsd/maxexclusive.js",
        "core/markup/xsd/maxinclusive.js",
        "core/markup/xsd/maxlength.js",
        "core/markup/xsd/maxscale.js",
        "core/markup/xsd/minexclusive.js",
        "core/markup/xsd/mininclusive.js",
        "core/markup/xsd/minlength.js",
        "core/markup/xsd/minscale.js",
        "core/markup/xsd/pattern.js",
        "core/markup/xsd/restriction.js",
        "core/markup/xsd/schema.js",
        "core/markup/xsd/simpletype.js",
        "core/markup/xsd/totaldigits.js",
        "core/markup/xsd/union.js",

        "core/debug/debug.js",
        "core/debug/debugwin.js",
        //"debug/profiler.js",
        "core/baseclasses/anchoring.js",
        "core/baseclasses/dataaction.js"
    )
    .wait()
    .script(
        "core/markup/aml/processinginstruction.js",

        "core/baseclasses/liveedit/anchor.js",
        "core/baseclasses/liveedit/blockquote.js",
        "core/baseclasses/liveedit/charmap.js",
        "core/baseclasses/liveedit/clipboard.js",
        "core/baseclasses/liveedit/code.js",
        "core/baseclasses/liveedit/color.js",
        "core/baseclasses/liveedit/datetime.js",
        "core/baseclasses/liveedit/directions.js",
        "core/baseclasses/liveedit/emotions.js",
        "core/baseclasses/liveedit/fontbase.js",
        "core/baseclasses/liveedit/fontstyle.js",
        "core/baseclasses/liveedit/help.js",
        "core/baseclasses/liveedit/hr.js",
        "core/baseclasses/liveedit/image.js",
        "core/baseclasses/liveedit/links.js",
        "core/baseclasses/liveedit/list.js",
        "core/baseclasses/liveedit/media.js",
        "core/baseclasses/liveedit/printing.js",
        //"core/baseclasses/liveedit/spell.js",
        "core/baseclasses/liveedit/search.js",
        "core/baseclasses/liveedit/subsup.js",
        "core/baseclasses/liveedit/tables.js",
        "core/baseclasses/liveedit/visualaid.js",

        "core/baseclasses/guielement.js"
    )
    .wait()
    .script(
        "core/baseclasses/interactive.js",
        "core/baseclasses/childvalue.js",
        "core/baseclasses/cache.js",
        "core/baseclasses/presentation.js"
    )
    .wait()
    .script(
        "core/baseclasses/databinding.js",
        "core/baseclasses/databinding/standard.js",
        "core/baseclasses/databinding/multiselect.js",
        "core/baseclasses/validation.js",

        "core/baseclasses/delayedrender.js",
        "core/baseclasses/dragdrop.js",
        "core/baseclasses/focussable.js",
        "core/baseclasses/media.js",
        "core/baseclasses/multicheck.js",
        "core/baseclasses/multiselect.js",
        "core/baseclasses/rename.js",
        "core/baseclasses/teleport.js",
        "core/baseclasses/transaction.js",
        "core/baseclasses/virtualviewport.js",
        //"baseclasses/xforms.js",

        "core/baseclasses/basebutton.js",
        "core/baseclasses/baselist.js",
        "core/baseclasses/basetree.js",
        "core/baseclasses/basesimple.js",
        "core/baseclasses/basetab.js",
        "core/baseclasses/basestatebuttons.js"
    )
    .wait()
    .script(
        "elements/accordion.js",
        "elements/actions.js",
        "elements/actionrule.js",
        "elements/actiontracker.js",

        "elements/application.js",
        "elements/appsettings.js",
        "elements/audio.js",
        "elements/auth.js",
        "elements/axis.js",
        "elements/bar.js",
        "elements/bindings.js",
        "elements/bindingrule.js",
        "elements/body.js",
        "elements/browser.js",
        "elements/button.js",
        "elements/splitbutton.js",
        "elements/calendar.js",
        "elements/calendarlist.js",
        "elements/caldropdown.js",
        "elements/chart.js",
        "elements/checkbox.js",
        "elements/collection.js",
        "elements/comment.js",
        //"colorpicker.js",
        "elements/colorpicker2.js",
        "elements/contextmenu.js",
        "elements/datagrid.js",
        "elements/defaults.js",
        "elements/divider.js",
        "elements/dropdown.js",
        "elements/editor.js",
        "elements/errorbox.js",
        "elements/event.js",
        "elements/filler.js",
        "elements/flashplayer.js",
        "elements/flowchart.js",
        "elements/frame.js",
        "elements/gallery.js",
        "elements/graph.js",
        "elements/hbox.js",
        "elements/iconmap.js",
        "elements/img.js",
        "elements/item.js",
        "elements/junction.js",
        "elements/label.js",
        "elements/list.js",
        "elements/loader.js",
        "elements/loadindicator.js",
        "elements/map.js",
        "elements/menu.js",
        "elements/modalwindow.js",
        "elements/model.js",
        "elements/notifier.js",
        "elements/page.js",
        "elements/pager.js",
        "elements/palette.js",
        "elements/persist.js",
        "elements/portal.js",
        "elements/progressbar.js",
        "elements/propedit.js",
        "elements/radiobutton.js",
        "elements/remote.js",
        "elements/script.js",
        "elements/scrollbar.js",
        "elements/skin.js",
        "elements/slider.js",
        "elements/smartbinding.js",
        "elements/source.js",
        "elements/spinner.js",
        "elements/splitter.js",
        "elements/state.js",
        "elements/state-group.js",
        "elements/statusbar.js",
        "elements/style.js",
        "elements/tab.js",
        "elements/table.js",
        "elements/teleport.js",
        "elements/template.js",
        "elements/text.js",
        "elements/textbox.js",
        "elements/toc.js",
        "elements/toolbar.js",
        "elements/tree.js",
        "elements/upload.js",

        "elements/rpc.js",             // RPC Baseclass (needs HTTP class)
        "elements/method.js",
        "elements/param.js",

        "elements/video.js",
        "elements/vectorflow.js",

        "elements/webdav.js",

        "elements/xmpp.js",             // XMPP class providing the XMPP comm layer
        /*
        "elements/repeat.js",
        "elements/submitform.js",*/
        "elements/markupedit.js"
        /*"elements/validation"*/
    )
    .wait()
    .script(
        "elements/actiontracker/undodata.js",
        "elements/actiontracker/xmlactions.js",

        "elements/modalwindow/widget.js",

        "elements/textbox/masking.js",
        "elements/textbox/autocomplete.js",

        "elements/audio/type_flash.js",
        "elements/audio/type_native.js",

        //RPC extensions (all need rpc.js)
        "elements/rpc/xmlrpc.js",      // XML-RPC
        "elements/rpc/soap.js",        // SOAP
        "elements/rpc/jsonrpc.js",     // JSON
        //"elements/rpc/jphp.js",      // JPHP
        "elements/rpc/cgi.js",         // CGI
        "elements/rpc/rdb.js",         // RDB-RPC
        "elements/rpc/rest.js",        // REST
        "elements/rpc/yql.js",         // YQL

        "elements/upload/html4.js",
        "elements/upload/html5.js",
        "elements/upload/flash.js",

        "elements/video/type_flv.js",
        "elements/video/type_native.js",
        "elements/video/type_qt.js",
        "elements/video/type_silverlight.js",
        "elements/video/type_vlc.js",
        "elements/video/type_wmp.js",

        "elements/xmpp/muc.js",
        "elements/xmpp/rdb.js",
        "elements/xmpp/roster.js",

        "elements/bindingdndrule.js",
        "elements/bindingloadrule.js",
        "elements/bindingcolumnrule.js",
        //"elements/bindingcolorrule.js",
        "elements/bindingseriesrule.js",
        "elements/bindingeachrule.js",
        "processinginstructions/livemarkup.js"
    ).wait(function() {
        if (apf.$required.length)
            apf.$x.script.apply(apf.$x, apf.$required).wait(start);
        else {
            if (typeof requirejs !== "undefined") {
                require([
                    "pilot/fixoldbrowsers",
                    "apf/elements/codeeditor",
                    "apf/elements/debugger",
                    "apf/elements/debughost"
                ], start);
            }
            else
                start();
        }
    });

    //Let's start APF
    function start(){
        if (apf.started)
            return; //@todo ask @getify why this function is called twice
        apf.start();
    }

//Conditional compilation workaround... (can this be improved??)
if (document.all) {
    var oldWinError = window.onerror, z;
    window.onerror = z = function(m){
        apf.console.error("Error caught from early startup. Might be a html parser syntax error (not your fault). " + m);

        if (!arguments.caller)
            return true;
    }
}
apf.Init.addConditional(function(){
    if (document.all && window.onerror == z) //Conditional compilation workaround... (can this be improved??)
        window.onerror = oldWinError;

    apf.dispatchEvent("domready");
}, null, ["body", "class"]);

apf.require = function(){
    var dir = apf.getDirname(location.href), req = [];
    for (var i = 0, l = arguments.length; i < l; i++)
        req.push(apf.getAbsolutePath(dir, arguments[i]))
    apf.$x.script.apply(apf.$loader, req).wait();
};

/*if(document.body)
    apf.Init.run("body");
else*/
    apf.addDomLoadEvent(function(){apf.Init.run('body');});

//A way to prevent parsing body
/*window.onerror = function(){
    window.onerror = null;
    return true;
}

document.documentElement.appendChild(document.createElement("body"));*/
//#endif
