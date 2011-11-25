define(function(require, exports, module) {

var ide = require("core/ide");
var code = require("ext/code/code");
var inspector = require("ext/debugger/inspector");

module.exports = (function () {
    var worker = null;
    var activeTimeout = null;
    
    var hook = function(ext, worker) {
        this.worker = worker;
        
        worker.on("inspect", function(event) {
            if (!event || !event.data) {
                console.log("why u no data");
                return;
            }
            
            var expression = getExpressionValue(event.data);
            if (expression) {
                liveWatch(expression);
            }
            //console.log("expression", expression, event.data);
        });
        
        ide.addEventListener("afteropenfile", function (e) {
            if (e.editor && e.editor.ceEditor) {
                e.editor.ceEditor.$editor.addEventListener("mousemove", onMouseMove);
            }
        });
    };
    
    /**
     * onMouseMove handler that is being used to show / hide the inline quick watch
     */
    var onMouseMove = function (ev) {
        if (activeTimeout) clearTimeout(activeTimeout);
        
        if (!stRunning.active && stDebugProcessRunning.active) {
            activeTimeout = setTimeout(function () {
                var pos = ev.getDocumentPosition();
                ide.dispatchEvent("liveinspect", { row: pos.row, col: pos.column });
            }, 400);
        }
    };
    
    /**
     * Execute live watching
     */
    var liveWatch = function (expr) {
        inspector.evaluate(expr, function (ev) {
            console.log(ev.getAttribute("name") + ": " + ev.getAttribute("value"));
        });
    };
    
    // variable declaration
    var expVarDeclInit = function (d) {
        return d[0].value;
    };
    
    // variable calling
    var expVar = function (d) {
        return d[0].value;
    };
    
    // property access
    var expPropAccess = function (d) {        
        // find all numeric keys
        // map them thru getValue
        // join em with a little dot
        return getNumericProperties(d)
            .map(function (m) { return getExpressionValue(d[m]); })
            .join(".");
    };
    
    // method call
    var expCall = function (d) {
        var method = getExpressionValue(d[0]);
        var args = getNumericProperties(d[1])
                    .map(function (k) { return getExpressionValue(d[1][k]); })
                    .join(", ");
                    
        return method + "(" + args + ")";
    };
    
    var getNumericProperties = function (obj) {
        return Object.keys(obj).filter(function (k) { return !isNaN(k); });
    };
    
    // get a string value of any expression
    var getExpressionValue = function(d) {
        if (d.value) return d.value;
        
        switch (d.cons) {
            case "VarDeclInit":
                return expVarDeclInit(d);
            case "PropAccess":
                return expPropAccess(d);
            case "Var":
                return expVar(d);
            case "Call":
                return expCall(d);
        }
    };
    
    return {
        hook: hook
    };
} ());

});