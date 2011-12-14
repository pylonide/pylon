/*
 * Oni Apollo 'ui' module
 * Functions for constructing HTML UIs
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
   @module  ui
   @summary Functions for constructing HTML UIs
   @hostenv   xbrowser
   @desc    Work-in-progress; to be documented
*/
var common = require('apollo:common');
var coll = require('apollo:collection');

/*

ui class:

{ 
  top :     array of top-level elements in this ui,
  elems :   hash of elements indexed by 'name' attrib,
  templates: array of {elem, attrib, template, vars} objects
  supplant(replacements) -> self
  show(opt uiparent) -> { __finally__ }
  hide() -> self
}

*/

function ui_show(dom_parent) {
  if (!dom_parent) dom_parent = document.body;
  coll.each(this.top, function(elem) { dom_parent.appendChild(elem); });
  return { __finally__ : ui_hide.bind(this) };
}

function ui_hide() {
  coll.each(this.top, function(elem) {
    if (elem.parentNode) elem.parentNode.removeChild(elem);
  });
  return this;
}

function ui_supplant(replacements) {
  // we memoize replacements to allow for partial re-substitution:
  // e.g. in a template "{foo} {bar}", we might replace both foo and bar
  // and then at a later stage only bar.
  replacements = this.replacements = 
    common.mergeSettings(this.replacements, replacements);

  coll.each(this.templates, function(t) {    
    if (!coll.any(t.vars, function(x) { return replacements[x]!==undefined; })) return;
    var s = common.supplant(t.template, replacements);
    if (t.attrib) {
      if (t.attrib.charAt(0) == '@') { 
        // a mapped property rather than an attrib
        if (t.template.length == t.vars[0].length+2) {
          // special case; template is of simple type '{foo}'
          // instead of supplanting strings, we allow supplanting of any value here
          // so that we can do things like checkbox.checked=true
          t.elem[t.attrib.substr(1)] = replacements[t.vars[0]];
        }
        else
          t.elem[t.attrib.substr(1)] = s;
      }
      else
        t.elem.setAttribute(t.attrib, s);
    }
    else {
      s = document.createTextNode(s);
      t.elem.parentNode.replaceChild(s, t.elem);
      t.elem = s;
    }
  });
  return this;
};

/**
   @function forEachContentNode
*/
function forEachContentNode(domparent, f) {
  if (document.createNodeIterator) {
    var iter = document.createNodeIterator(domparent, 
                                           NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,
                                           null, false);
    var node;
    while ((node = iter.nextNode()))
      f(node);
  }
  else {
    // IE8 and below
    f(domparent);
    var children = domparent.childNodes;
    for (var i=0; i<children.length; ++i)
      forEachContentNode(children[i], f);
  }
}

/**
   @function makeView
*/
var makeView = exports.makeView = function(html_template) {
  var holder = document.createElement("div");
  holder.innerHTML = html_template;

  // collect all children (holder.childNodes is fragile for some reason):
  var children = [], elem = holder.firstChild;
  while (elem) {
    children.push(elem);
    elem = elem.nextSibling;
  }

  // collect all elements with 'name' attributes and index by name:
  var mapped_elems = holder.querySelectorAll("[name]");
  var elems = {};
  for (var i=0; i<mapped_elems.length; ++i)
    elems[mapped_elems[i].getAttribute('name')] = mapped_elems[i];

  // collect all templates (potentially slow)
  var templates = [];  
  forEachContentNode(holder, function(node) {
    var matches; 
    if (node.attributes) {
      for (var i=0; i<node.attributes.length; ++i) {
        if ((matches = node.attributes[i].value.match(/{[^\}]*}/g))) {
          templates.push({elem:   node, 
                          attrib: node.attributes[i].name,
                          template: node.attributes[i].value,
                          vars: coll.map(matches, stripFirstLast)
                         });
        }
      }
    }
    else if (node.data && 
             ((matches = node.data.match(/{[^\}]*}/g)))) {
      templates.push({elem: node,
                      template: node.data,
                      vars: coll.map(matches, stripFirstLast)
                     });
    }
  });

  return { 
    top      : children,
    elems    : elems,
    templates: templates,
    supplant : ui_supplant,
    show     : ui_show,
    hide     : ui_hide
  };
};


//----------------------------------------------------------------------
// helpers

function stripFirstLast(x) { return x.substr(1,x.length-2) }
