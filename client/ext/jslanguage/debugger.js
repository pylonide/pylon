/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

// contains language specific debugger bindings
define(function(require, exports, module) {

    var baseLanguageHandler = require('ext/language/base_handler');
    
    var expressionBuilder = module.exports = Object.create(baseLanguageHandler);
    
    /*** publics ***/
    
    expressionBuilder.handlesLanguage = function(language) {
        return language === 'javascript';
    };
        
    // builds an expression for the v8 debugger based on a node
    expressionBuilder.buildExpression = function(node) {
        if (!node) return null;
        
        return getExpressionValue(node);
    };
    
    /*** privates ***/
    
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
            .map(function (m) { return getExpressionValue(m); })
            .join(".");
    };
    
    // method call
    var expCall = function (d) {
        var method = getExpressionValue(d[0]);
        var args = getNumericProperties(d[1])
                    .map(function (k) { return getExpressionValue(k); })
                    .join(", ");
                    
        return method + "(" + args + ")";
    };
    
    // numeric f.e. used in index [1]
    var expNum = function (d) {
        return d[0].value;
    };
    
    // index calling
    var expIndex = function (d) {
        return getExpressionValue(d[0]) + "[" + getExpressionValue(d[1]) + "]";
    };
    
    // new X()
    var expNew = function (d) {
        return "new "
                + getExpressionValue(d[0])
                + "("
                + getNumericProperties(d[1]).map(function (arg) { return arg.value; }).join(", ")
                + ")";
    };
    
    // function parameter
    var expFarg = function (d) {
        return d[0].value;
    };
    
    var getNumericProperties = function (obj) {
        return Object.keys(obj).filter(function (k) { return !isNaN(k); }).map(function (k) { return obj[k]; });
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
            case "Num":
                return expNum(d);
            case "Index":
                return expIndex(d);
            case "New":
                return expNew(d);
            case "FArg":
                return expFarg(d);
            default:
                return "";
        }
    };


});