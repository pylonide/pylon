define(function(require, exports, module) {

require("treehugger/traverse"); // add traversal functions to trees

var baseLanguageHandler = require('ext/language/base_handler');

var outlineHandler = module.exports = Object.create(baseLanguageHandler);

var ID_REGEX = /[a-zA-Z_0-9\$\_]/;
var EVENT_REGEX = /[a-zA-Z_0-9\$\_\ \(\)\[\]\/@]/;

var NOT_EVENT_HANDLERS = {
    addMarker: true,
    traverseUp : true,
    traverse : true,
    topdown : true,
    traverseTopDown : true,
    rewrite : true,
    traverseAll : true
};

outlineHandler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
outlineHandler.outline = function(doc, ast, callback) {
    if (!ast)
        return callback();
    callback({ body : outlineSync(doc, ast) });
};
    
function fargsToString(fargs) {
    var str = '(';
    for (var i = 0; i < fargs.length; i++) {
        str += fargs[i][0].value + ', ';
    }
    if(fargs.length > 0)
        str = str.substring(0, str.length - 2);
    str += ')';
    return str;
}

function expressionToName(node) {
    var name;
    node.rewrite(
        'Var(x)', function(b) { name = b.x.value; },
        'PropAccess(e, x)', function(b) { name = b.x.value; }
    );
    return name;
}

function getIdentifierPosBefore(doc, pos) {
    if (!pos)
        return null;
    for (var sl = pos.sl; sl >= 0; sl--) {
        var line = doc.getLine(sl);
        var foundId = false;
        for (var sc = pos.sc; sc > 1; sc--) {
            if (ID_REGEX.test(line[sc - 1]))
                foundId = true;
            else if (foundId)
                break;
        }
        if (foundId)
            break;
        pos.sc = sl > 0 && doc.getLine(sl - 1).length - 1;
    }
    for (var ec = sc; ec < line.length; ec++) {
        if (!ID_REGEX.test(line[ec]))
            break;
    }
    var result = { sl: sl, el: sl, sc: sc, ec: ec};
    if (line.substring(sc, ec) === 'function')
        return getIdentifierPosBefore(doc, result);
    return result;
}

// HACK: fix incorrect pos info for string literals
function fixStringPos(doc, node) { 
    var pos = node.getPos();
    var line = doc.getLine(pos.el);
    if (line[pos.ec] !== '"')
        pos.ec += 2;
    pos.sc++;
    pos.ec--;
    return pos;
}

// This is where the fun stuff happens
var outlineSync = outlineHandler.outlineSync = function(doc, node, includeProps) {
    var results = [];
    node.traverseTopDown(
        // e.x = function(...) { ... }  -> name is x
        'Assign(e, Function(name, fargs, body))', function(b) {
            var name = expressionToName(b.e);
            if(!name) return false;
            results.push({
                icon: 'method',
                name: name + fargsToString(b.fargs),
                pos: this[1].getPos(),
                displayPos: b.e.cons === 'PropAccess' && getIdentifierPosBefore(doc, this[1].getPos()) || b.e.getPos(),
                items: outlineSync(doc, b.body, includeProps)
            });
            return this;
        },
        'VarDeclInit(x, Function(name, fargs, body))', 'ConstDeclInit(x, Function(name, fargs, body))',
        function(b) {
            results.push({
                icon: 'method',
                name: b.x.value + fargsToString(b.fargs),
                pos: this[1].getPos(),
                displayPos: b.x.getPos(),
                items: outlineSync(doc, b.body, includeProps)
            });
            return this;
        },
        // x : function(...) { ... } -> name is x
        'PropertyInit(x, Function(name, fargs, body))', function(b) {
            results.push({
                icon: 'method',
                name: b.x.value + fargsToString(b.fargs),
                pos: this[1].getPos(),
                displayPos: getIdentifierPosBefore(doc, this.getPos()),
                items: outlineSync(doc, b.body, includeProps)
            });
            return this;
        },
        'PropertyInit(x, e)', function(b) {
            if (!includeProps)
                return;
            
            results.push({
                icon: 'property',
                name: b.x.value,
                pos: this.getPos(),
                displayPos: getIdentifierPosBefore(doc, this.getPos())
            });
            return this;
        },
        'VarDeclInit(x, e)', 'ConstDeclInit(x, e)', function(b) {
            var items = outlineSync(doc, b.e, includeProps);
            if (items.length === 0)
                return this;
            results.push({
                icon: 'property',
                name: b.x.value,
                pos: this[1].getPos(),
                displayPos: b.x.getPos(),
                items: items
            });
            return this;
        },
        'PropertyInit(x, e)', function(b) {
            var items = outlineSync(doc, b.e, includeProps);
            if (items.length === 0)
                return this;
            results.push({
                icon: 'property',
                name: b.x.value,
                pos: this[1].getPos(),
                displayPos: getIdentifierPosBefore(doc, this.getPos()),
                items: items
            });
            return this;
        },
        'Assign(x, e)', function(b) {
            var name = expressionToName(b.x);
            if (!name)
                return false;
            var items = outlineSync(doc, b.e, includeProps);
            if (items.length === 0)
                return this;
            results.push({
                icon: 'property',
                name: name,
                pos: this[1].getPos(),
                displayPos: getIdentifierPosBefore(doc, this.getPos()),
                items: items
            });
            return this;
        },
        // e.on("listen", function(...) { ... }) -> name is listen
        'Call(e, args)', function(b) {
            var eventHandler = tryExtractEventHandler(this);
            if (!eventHandler)
                return false;
            results.push({
                icon: 'event',
                name: eventHandler.s[0].value,
                pos: this.getPos(),
                displayPos: fixStringPos(doc, eventHandler.s),
                items: eventHandler.body && outlineSync(doc, eventHandler.body, includeProps)
            });
            return this;
        },
        /* UNDONE: callbacks in outline
        // intelligently name callback functions for method calls
        // setTimeout(function() { ... }, 200) -> name is setTimeout [callback]
        'Call(e, args)', function(b) {
            var name = expressionToName(b.e);
            if(!name) return false;
            var foundFunction = false;
            b.args.each(
                'Function(name, fargs, body)', function(b) {
                    if (b.name.value)
                        return;
                    results.push({
                        icon: 'method',
                        name: name + '[callback]' + fargsToString(b.fargs),
                        pos: this.getPos(),
                        items: outlineSync(doc, b.body, includeProps)
                    });
                    foundFunction = true;
                }
            );
            return foundFunction ? this : false;
        },
        */
        'Function(name, fargs, body)', function(b) {
            if (!b.name.value)
                return false;
            results.push({
                icon: 'method',
                name: b.name.value + fargsToString(b.fargs),
                pos: this.getPos(),
                displayPos: b.name.getPos(),
                items: outlineSync(doc, b.body, includeProps)
            });
            return this;
        }
    );
    return results;
};

var tryExtractEventHandler = outlineHandler.tryExtractEventHandler = function(node, ignoreBind) {
    var result;
    node.rewrite('Call(e, args)', function(b) {
        var name = expressionToName(b.e);
        if (!name || b.args.length < 2 || NOT_EVENT_HANDLERS[name])
            return false;
        // Require handler at first or second position
        var s;
        var fun;
        if (b.args[0] && b.args[0].cons === 'String' && isCallbackArg(b.args[1], ignoreBind)) {
            s = b.args[0];
            fun = b.args[1];
        }
        else if (b.args[1] && b.args[1].cons === 'String' && isCallbackArg(b.args[2], ignoreBind)) {
            s = b.args[1];
            fun = b.args[2];
        }
        else {
            return false;
        }
        if (!s[0].value.match(EVENT_REGEX))
            return false;
        // Ignore if more handler-like arguments exist
        if (b.args.length >= 4 && b.args[2].cons === 'String' && b.args[3].cons === 'Function')
            return false;
        result = {
            s: s,
            fargs: fun[1],
            body: fun[2]
        };
    });
    return result;
};

var isCallbackArg = function(node, ignoreBind) {
    if (!node)
        return false;
    var result;
    node.rewrite(
        'Function(_, _, _)', function() { result = true; },
        'Call(PropAccess(_, "bind"), [_])', function() { result = !ignoreBind; }
    );
    return result;
};

});
