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

// #ifndef __PACKAGED
//#ifdef __SUPPORT_O3

apf.$loader
    .setGlobalDefaults({
        AllowDuplicates : true
    })

apf.$loader
    .script(
        "core/class.js",
    
        "core/crypto/base64.js",
        "core/crypto/md5.js",
    
        "core/lib/util/utilities.js",
        "core/lib/util/color.js",
        "core/lib/util/ecmaext.js",
        "core/lib/util/json.js",
        "core/lib/util/nameserver.js",
        "core/lib/util/xml.js",
        "core/lib/util/xmldiff.js",
    
        "core/lib/date.js",
        "core/lib/data.js",
        
        "core/lib/queue.js",
        "core/lib/sort.js",
        "core/lib/language.js",
        "core/lib/xmldb.js",
        
        "core/lib/teleport/http.js", // for simple HTTP transactions
        "core/lib/teleport/socket.js",
        
        /*"core/lib/draw.js",
        "core/lib/draw/canvas.js",
        "core/lib/draw/vml.js",
        "core/lib/draw/chartdraw.js",*/
        
        "core/browsers/o3.js",
        "core/lib/util/async.js",
        "core/lib/util/hook.js"
        
        //"core/browsers/non_ie.js",
    )
    .wait()
    .script(
        "core/window-o3.js",
        "core/lib/config.js",
        
        //"core/lib/offline.js",
        //"core/lib/storage.js",
    
        "core/parsers/xpath.js",
        //"parsers/jslt_2.0.js",
        "core/parsers/livemarkup.js",
        //"core/parsers/js.js",
        "core/parsers/url.js",
        
        "core/markup/domparser.js",
        /*"markup/html5.js",
        "core/markup/xforms.js",*/
        //"core/markup/xslt/xslt.js",
        
        "core/markup/aml.js",
        "core/markup/xhtml.js",
        "core/markup/xsd.js"
    )
    .wait()
    .script(
        /*"core/lib/offline/transactions.js",
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
        "core/lib/storage/memory.js",*/
        //"lib/storage/deskrun.js",
        //"lib/storage/deskrun.file.js",
        //"lib/storage/deskrun.sql.js",
    
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
        "core/markup/aml/processinginstruction.js",
        
        "core/markup/xhtml/element.js",
        "core/markup/xsd/element.js"
    )
    .wait()
    .script(
        "core/markup/xhtml/ignore.js",
        "core/markup/xhtml/option.js",
        "core/markup/xhtml/body.js",
        "core/markup/xhtml/html.js",
        "core/markup/xhtml/skipchildren.js",
        
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
        //"core/debug/debugwin.js",
        //"debug/profiler.js",
    
        "core/baseclasses/childvalue.js",
        "core/baseclasses/databinding.js",
        "core/baseclasses/databinding/standard.js",
        
        "core/baseclasses/dataaction.js",
        "core/baseclasses/teleport.js"
    )
    .wait()
    .script(
        "elements/actions.js",
        "elements/actionrule.js",
        "elements/actiontracker.js",
        "elements/application.js",
        "elements/appsettings.js",
        "elements/bindings.js",
        "elements/bindingrule.js",
        "elements/collection.js",
        "elements/defaults.js",
        "elements/model.js",        
        "elements/remote.js",
        "elements/script.js",
        "elements/smartbinding.js",
        "elements/state.js",
        "elements/state-group.js",
        "elements/teleport.js",
        "elements/template.js",
        
        "elements/rpc.js",             // RPC Baseclass (needs HTTP class)
        "elements/method.js",
        "elements/param.js",
    
        "elements/webdav.js",
    
        "elements/xmpp.js"             // XMPP class providing the XMPP comm layer
        /*
        "elements/repeat.js",
        "elements/submitform.js",
        "elements/markupedit.js",
        "elements/validation"*/
    )
    .wait()
    .script(
        //RPC extensions (all need rpc.js)
        "elements/rpc/xmlrpc.js",      // XML-RPC
        //"rpc/soap.js",      // SOAP
        "elements/rpc/jsonrpc.js",     // JSON
        //"rpc/jphp.js",      // JPHP
        "elements/rpc/cgi.js",         // CGI
        "elements/rpc/rest.js",        // REST
        "elements/rpc/yql.js",         // YQL
        
        "elements/persist.js",
        "elements/xmpp/muc.js",
        "elements/xmpp/rdb.js",
        "elements/xmpp/roster.js",
        
        "elements/bindingdndrule.js",
        "elements/bindingloadrule.js",
        "elements/bindingcolumnrule.js",
        //"bindingcolorrule.js",
        "elements/bindingseriesrule.js",
        "elements/bindingeachrule.js",
        "processinginstructions/livemarkup.js",
        
        "elements/actiontracker/undodata.js",
        "elements/actiontracker/xmlactions.js"
    )
    
    //Let's start APF
    .wait(function(){
        apf.dispatchEvent("domready");
    });

//#endif
//#endif
