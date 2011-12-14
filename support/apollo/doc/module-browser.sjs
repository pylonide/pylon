
waitfor {
  var http = require('apollo:http');
}
and {
  var dom = require('apollo:dom');
}
and {
  var ui = require('apollo:ui');
}
and {
  var cutil = require('apollo:cutil');
}
and {
  var coll = require('apollo:collection');
}
and {
  var docutil = require('apollo:docutil');
}
and {
  var common = require('apollo:common');
}
and {
  // preload:
  spawn require('./showdown');
}

//----------------------------------------------------------------------
// style

dom.addCSS(
"
.mb-index { float: left; }
.mb-type  { float: right; }
");

//----------------------------------------------------------------------
// main program loop

exports.run = function(default_location, dom_parent) {

  // construct our main ui:
  var top_view, index_view, banner_view;
  top_view = ui.makeView(
    "<div name='banner' class='mb-banner mb-top'></div>
     <div class='mb-panes mb-top'>
       <div name='index' class='mb-index'></div>
       <div name='main' class='mb-main'></div>
     </div>");

  using(top_view.show(dom_parent)) {

    // Our ui gets updated everytime the location.hash changes. We
    // recreate the main view each time from scratch. The banner and
    // index views get updated with update() calls.

    (banner_view = makeBannerView()).show(top_view.elems.banner);
    (index_view = makeIndexView()).show(top_view.elems.index);

    // main loop:
    // Note how the update() calls and the construction of the main view
    // will automatically be aborted if the location changes while we're still
    // busy.
    var location = parseLocation(default_location);
    while (1) {
      try {
        try {
          try {
            banner_view.update(location);
          }
          and {
            index_view.update(location);
          }
          and {
            var mainView = makeMainView(location);
          }
        }
        or {
          // display a 'loading...' dialog after 300ms
          hold(300);
          doLoadingDialog(top_view.elems.main);
          // if the loading dialog returns, it means the user wants to 'retry':
          continue;
        }
        catch (e) {
          doInternalErrorDialog(e.toString(), top_view.elems.banner);
        }
        using(mainView.show(top_view.elems.main)) {
          if (mainView.run) 
            mainView.run();
          else
            hold();
        }
      }
      or {
        dom.waitforEvent(window, "hashchange");
        location = parseLocation(default_location);
      }
    }
  }
};

//----------------------------------------------------------------------
// Documentation DB
// 
// We load in documentation as needed and store it in memoized
// functions. 
// Lib docs are extracted from a file 'sjs-lib-index.txt'; module docs
// are extracted from the particular module's source itself. The
// parsing of the docs happens here, client-side:


var getLibDocs = exports.getLibDocs = cutil.makeMemoizedFunction(function(libpath) {
  try {
    var url = http.constructURL(libpath, "sjs-lib-index.txt");
    return docutil.parseSJSLibDocs(http.get(url));
  }
  catch (e) {
    return null;
  }
});

var getModuleDocs = cutil.makeMemoizedFunction(function(modulepath) {
  try { 
    if (modulepath.charAt(modulepath.length-1) == '/') return null;
    var docs = docutil.parseModuleDocs(http.get(modulepath + ".sjs"));
    return docs;
  }
  catch (e) {
    return null;
  }
});

//----------------------------------------------------------------------
// Banner View

function makeBannerView() {
  var view = ui.makeView(
"<a href='#{path}'><h1>{title}</h1>
<div>{path}</div></a>
<div name='details'></div>");
  view.supplant({path: "", title: "Oni Apollo Documentation Browser"});
  var current_location = {}, sub_view;

  view.update = function(location) {
    if ((current_location.path == location.path) &&
        ((current_location.module == location.module) || sub_view)) 
      return; 
    // see if we're looking at a lib with documentation; set the banner accordingly:
    var lib_docs = getLibDocs(location.path);
    current_location = location;
    if (sub_view) sub_view.hide();

    if (lib_docs) {
      view.supplant({
        path: location.path,
        title: (lib_docs.lib || "Unnamed Module Library")
      });
      (sub_view = ui.makeView(makeSummaryHTML(lib_docs, location))).show(view.elems.details);
    }
    else if (location.module) {
      view.supplant({
        path: location.path+location.module,
        title: "Unindexed Module"
      });
    }
    else {
      var path = location.path || 
        (window.location.hash ? window.location.hash.substring(1) : "-")
      view.supplant({path: path, title: "Unknown Library" });
    };
  }
  
  return view;
}

//----------------------------------------------------------------------
// Index View

function makeIndexView() {
  var view = ui.makeView("<ul></ul>");
  var entries = {}, selection, current_location = {};
 
  view.update = function(location) { 
    if (location.path != current_location.path) {
      // we need to update all of our entries.
      var lib_docs = getLibDocs(location.path);

      // remove previous entries:
      coll.each(entries, function(e) { e.hide(); });
      entries = {}; selection = null;

      if (lib_docs) {
        coll.each(lib_docs.modules, function(mdocs, module) {
          (entries[module] = makeIndexEntry(location, module)).show(view.top[0]);
        });
      }
      // else ... we didn't find any lib_docs; so no modules we can list
    }

    if (location.module != selection) {
      if (selection) selection.deselect();
      if (location.module) {
        selection = entries[location.module]; 
        if (!selection) {
          // didn't find the module in our index entries... let's add
          // it, but only if there is documentation for it:
          if (!getModuleDocs(location.path + location.module)) return;
          (selection = entries[location.module] = makeIndexEntry(location, location.module)).show(view.top[0]);
        } 
        selection.select(); 
      }
    }
  };

  return view;
}

function makeIndexEntry(location, module) {
  var view = ui.makeView(
    "<li>
       <h3><a href='#{path}{module}'>{module}</a></h3>
       <ul name='symbols'></ul>
     </li>");
  view.supplant({path: location.path, module: module});

  var symbols_view;

  view.select = function() {
    // we expand our view to include symbols:
    var module_docs = getModuleDocs(location.path + module);
    if (!module_docs) return; // no docs; nothing much we can do
    var symbols_template = 
      coll.map(coll.values(common.mergeSettings(module_docs.symbols, module_docs.classes)), 
               function(symbol) {
                 return common.supplant(
                   "<li><a href='#{path}{module}::{symbolname}'>{symbolname}</a></li>",
                   {path:location.path, module: module, symbolname:symbol.name})
               }).join("");
    (symbols_view = ui.makeView(symbols_template)).show(view.elems.symbols);
  };
  view.deselect = function() { 
    if (symbols_view) symbols_view.hide(); 
    symbols_view = null;
  };

  return view;
}

//----------------------------------------------------------------------
// Internal error:

function doInternalErrorDialog(txt, domparent) {
  var view = ui.makeView("
<div class='mb-error'>
<h1>:-(</h1><b>{txt}</b><br>You shouldn't have seen this error; please report to info@onilabs.com.<br>
Please also hit the 'retry' button and see if this fixes things: 
<button name='ok'>retry</button>
</div>
").supplant({txt:txt});
  using (view.show(domparent)) {
    try {
      dom.waitforEvent(view.elems.ok, 'click');
    }
    or {
      // escape key
      dom.waitforEvent(document, 'keydown', function(e) { return e.keyCode == 27; });
    }
  }
}

//----------------------------------------------------------------------
// Loading dialog:

// Displays a 'Loading...' and then, after 4 seconds, a Retry button.
// Only returns when the Retry button is pressed.

function doLoadingDialog(domparent) {
  using(ui.makeView("<span class='mb-warning'> Loading... </span>").show(domparent)) {
    hold(4000);
  }
  var view = ui.makeView(
    "<span class='mb-warning'> Still Loading... 
     <a name='retry' href='javascript:void(0)'>Retry</a> </span>");
  using(view.show(domparent)) {
    dom.waitforEvent(view.elems.retry, 'click');
  }
}

//----------------------------------------------------------------------
// Main View:

function makeMainView(location) {
  // figure out which view to display: module view, symbol view, lib view or error view
  var view;
  try {
    if (!location.module) {
      // lib view
      view = makeLibView(location);
    }
    else if (!location.symbol) {
      view = makeModuleView(location);
    }
    else {
      view = makeSymbolView(location);
    }
  }
  catch (e) {
    // make an error view
    view  = makeErrorView(location, e);
  }
  return view;
}

//----------------------------------------------------------------------
// (Non-critial) Error View:

function makeErrorView(location, txt) {
  var view = ui.makeView(
"<h2>:-(</h2>
 <h3>{txt}</h3>
 <p>Were you looking for one of these:</p>
 <ul>
   <li><a href='http://code.onilabs.com/apollo/latest/doc/modules.html'>Latest Stable Apollo Standard Library Docs</a></li>
   <li><a href='http://code.onilabs.com/apollo/unstable/doc/modules.html'>Latest Unstable (GitHub trunk) Apollo Standard Library Docs</a></li>
 </ul>
 <p>Otherwise, please enter a URL pointing to a module library (a directory with a file 'sjs-lib-index.txt'), or an SJS module:</p>
<input name='url' type='text' style='width:30em' value='http://'></input><button name='go'>Go</button>
").supplant({txt:txt});

  view.run = function() { 
    if (window.location.hash)
      view.elems.url.value = window.location.hash.substr(1);
    view.elems.url.focus();
    try {
      dom.waitforEvent(view.elems.url, "keypress", function(e) { return e.keyCode == 13; });
    }
    or { 
      dom.waitforEvent(view.elems.go, "click");
    }
    window.location.replace("#"+view.elems.url.value);
  };

  return view;
}

//----------------------------------------------------------------------
// Module View:

function makeModuleView(location) {
  var docs = getModuleDocs(location.path + location.module);
  if (!docs) throw "No module at '"+location.path + location.module+"'";
  var view = ui.makeView(
"<h2>The {name} module</h2>
 <div name='summary' class='mb-summary'></div>
 <div name='symbols'></div>
 <div name='desc'></div>
").supplant({name: docs.module||location.module});

  ui.makeView(makeSummaryHTML(docs, location)).show(view.elems.summary);
  ui.makeView(makeDescriptionHTML(docs, location)).show(view.elems.desc);
 
  // collect symbols (XXX really want classes in symbols hash to start with)
  var symbols = {};
  coll.each(common.mergeSettings(docs.symbols, docs.classes), function(s) {
    if (!symbols[s.type]) symbols[s.type] = [];
    symbols[s.type].push(
      common.supplant(
        "<tr>
           <td class='mb-td-symbol'><a href='#{path}{module}::{symbol}'>{symbol}</a></td>
           <td>{summary}</td>
         </tr>",
        { path: location.path, module: location.module, 
          symbol: s.name, summary: makeSummaryHTML(s, location) }));
  });
  
  if (symbols['function'])
    ui.makeView("<h3>Functions</h3><table>"+symbols['function'].join("")+"</table>").show(view.elems.symbols);
  if (symbols['variable'])
    ui.makeView("<h3>Variables</h3><table>"+symbols['variable'].join("")+"</table>").show(view.elems.symbols);
  if (symbols['class'])
    ui.makeView("<h3>Classes</h3><table>"+symbols['class'].join("")+"</table>").show(view.elems.symbols);

  return view;
}

//----------------------------------------------------------------------
// Symbol View (showing details for a class or symbol):

function makeSymbolView(location) {
  var docs = getModuleDocs(location.path + location.module);
  if (!docs) throw "No module at '"+location.path + location.module+"'";
  
  if (location.classname) {
    if (!docs.classes || !(docs = docs.classes[location.classname])) 
      throw "Class '"+location.classname+"' not found in documentation";
  }

  docs = docs.symbols[location.symbol] || docs.classes[location.symbol];
  if (!docs) 
    throw "Symbol '"+location.symbol+"' not found in documentation";

  var view;
  if (!location.classname) {
      view = ui.makeView(
        "<h2><a href='#{path}{module}'>{module}</a>::{name}</h2>
         <div name='summary' class='mb-summary'></div>
         <div name='details'></div>
         <div name='desc'></div>
        ").supplant({path: location.path, module: location.module, name:location.symbol});
  }
  else {
      view = ui.makeView(
        "<h2><a href='#{path}{module}'>{module}</a>::<a href='#{path}{module}::{class}'>{class}</a>::{name}</h2>
         <div name='summary' class='mb-summary'></div>
         <div name='details'></div>
         <div name='desc'></div>
        ").supplant({path:location.path, module:location.module, name:location.symbol, 'class':location.classname});
  }

  ui.makeView(makeSummaryHTML(docs, location)).show(view.elems.summary);
  ui.makeView(makeDescriptionHTML(docs, location)).show(view.elems.desc);
  
  if (docs.type == "function") {
    // function signature
    var signature = docs.name+"(<span class='mb-arglist'>"+
      coll.map(docs.param || [], function(p) {
        var rv = p.name;
        if (p.valtype && p.valtype.indexOf("optional") != -1)
          rv = "<span class='mb-optarg'>["+rv+"]</span>";
        return rv;
      }).join(", ")+
      "</span>)";
    if (docs['return']) {
      signature += " <span class='mb-rv'>returns "+
        makeTypeHTML(docs['return'].valtype, location)+"</span>";
    }
    ui.makeView("<h3>"+signature+"</h3>").show(view.elems.details);

    // function args details
    var args = coll.map(docs.param || [], function(p) {
      return common.supplant(
        "<tr><td class='mb-td-symbol'>{name}</td><td><span class='mb-type'>{type}</span>{def}{summary}</td></tr>",
        { name:p.name, type:makeTypeHTML(p.valtype, location), 
          def: p.defval? "<span class='mb-defval'>Default: "+p.defval+"</span>" : "",
          summary:makeSummaryHTML(p, location) });
    });
    if (args.length)
      ui.makeView("<table>"+args.join("")+"</table>").show(view.elems.details);

    // settings
    var settings = coll.map(docs.setting || [], function(s) {
      return common.supplant(
        "<tr><td class='mb-td-symbol'>{name}</td><td><span class='mb-type'>{type}</span>{def}{summary}</td></tr>",
        { name: s.name, type: makeTypeHTML(s.valtype, location), 
          def: s.defval? "<span class='mb-defval'>Default: "+s.defval+"</span>" : "",
          summary: makeSummaryHTML(s, location)
        });
    });
    if (settings.length)
      ui.makeView("<h3>Settings</h3><table>"+settings.join("")+"</table>").show(view.elems.details);

    if (docs['return'] && docs['return'].summary) {
      ui.makeView(common.supplant(
        "<h3>Return Value</h3>
         <table><tr>
           <td><span class='mb-type'>{type}</span>{summary}</td>
         </tr></table>",
        { type: makeTypeHTML(docs['return'].valtype, location),
          summary : makeSummaryHTML(docs['return'], location)
        })).show(view.elems.details);
    }
                          
  }
  else if (docs.type == "class") {
    ui.makeView("<h3>Class {name}</h3>").supplant(docs).show(view.elems.details);


    // collect symbols
    var symbols = {};
    coll.each(docs.symbols, function(s) {
      if (!symbols[s.type]) symbols[s.type] = [];
      symbols[s.type].push(
        common.supplant(
          "<tr>
             <td class='mb-td-symbol'><a href='#{path}{module}::{class}::{symbol}'>{symbol}</a></td>
             <td>{summary}</td>
           </tr>",
          { path: location.path, module:location.module, 'class': docs.name, 
            symbol: s.name, summary: makeSummaryHTML(s, location) }));
    });
    
    if (symbols['function'])
      ui.makeView("<h3>Methods</h3><table>"+symbols['function'].join("")+"</table>").show(view.elems.details);
    if (symbols['variable'])
      ui.makeView("<h3>Member Variables</h3><table>"+symbols['variable'].join("")+"</table>").show(view.elems.details);

  }

  return view;
}

function makeLibView(location) {
  var docs = getLibDocs(location.path);
  if (!docs) throw "No module library at '"+location.path+"'";
  return ui.makeView(docs.desc ? markup(docs.desc, location) : "No detailed description found");
}

//----------------------------------------------------------------------
// helpers

// we expect window.location to be of the form:
//
//    # http://foo.bar//modulelib/  [ module  [ [ ::class ] ::symbol ] ]
//
// we parse this into {path, module, classname, symbol}
function parseLocation(default_location) {
  if (!window.location.hash)
    window.location.replace("#"+default_location);
  var matches = /#(.*\/)([^:#]*)(?:\:\:([^:]*)(?:\:\:(.*))?)?/.exec(window.location.hash);
  if (!matches) return { path: "", module: "", classname: "", symbol: "" };
  var loc = { 
    path: http.canonicalizeURL(matches[1], window.location.href), // XXX want resolution like in require here
    module: matches[2],
    classname: matches[4] ? matches[3] : null,
    symbol: matches[4] ? matches[4] : matches[3]
  };
  // we don't want .sjs extensions in module names:
  if (/\.sjs$/.test(loc.module)) loc.module = loc.module.substr(0,loc.module.length-4);
  return loc;
}

function parentPath(path) {
  return http.canonicalizeURL(http.constructURL(path, "../"), 
                              window.location.href);
}

function ensureSlash(path) {
  return http.constructURL(path, "/");
}

function makeSummaryHTML(obj, location) {
  var rv = markup(obj.summary, location);
  if (obj.deprecated)
    rv += "<div class='note'>" + 
    markup("**Deprecated:** "+obj.deprecated, location) + "</div>";
  if (obj.hostenv)
    rv += common.supplant("<div class='note'><b>Note:</b> This {type} only works in the '{hostenv}' version of Apollo.</div>", obj);
  return rv;
}

function makeDescriptionHTML(obj, location) {
  var rv = obj.desc ? "<h3>More information</h3>"+markup(obj.desc, location) : "";
  return rv;
}

function makeTypeHTML(type, location) {
  if (!type) return "";
  var resolved = resolveLink(type, location);
  if (!resolved)
    return type;
  else
    return "<a href='"+resolved[0]+"'>"+resolved[1]+"</a>";
}

function resolveLink(id, location) {
  if (id.indexOf("::") == -1) return null; // ids we care about contain '::' 
  if (id.charAt(id.length-1) == ':') {
    // link to another module
    return ["#"+location.path+id.substring(0, id.length-2), id.substring(0, id.length-2)];
  }
  else if (id.charAt(0) != ':') {
    // 'absolute' link into another module of our lib
    // e.g. "cutil::Semaphore::acquire"
    return ["#"+location.path+id, "<code>"+id+"</code>"];
  }
  else {
    // 'relative' link into our module
    // e.g. "::Semaphore::acquire", or "::foo"
    return ["#"+location.path+location.module+id, "<code>"+id.substring(2)+"</code>"];
  }
}


function markup(text, location) {
  function resolve(id) { return resolveLink(id, location); }
  return require('./showdown').makeHTML(text, resolve);
}