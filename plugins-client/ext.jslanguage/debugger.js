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
    
    // get a string value of any expression
    var getExpressionValue = function(d) {
        if (d.value) return d.value;
        
        var result;
        
        d.rewrite(
            // var someVar = ...
            'VarDeclInit(x, _)', 'ConstDeclInit(x, _)', function(b) {
                result = b.x.value;
            },
            // var someVar;
            'VarDecl(x)', 'ConstDecl(x)', function(b) {
                result = b.x.value;
            },
            // e.x
            'PropAccess(e, x)', function(b) {
                result = getExpressionValue(b.e) + "." + b.x.value;
            },
            // x
            'Var(x)', function(b) {
                result = b.x.value;
            },
            // e(arg, ...)
            'Call(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = method + "(" + args + ")";
            },
            // 10
            'Num(n)', function(b) {
                result = b.n.value;
            },
            // e[idx]
            'Index(e, idx)', function(b) {
                result = getExpressionValue(b.e) + "[" + getExpressionValue(b.idx) + "]";
            },
            // new SomeThing(arg, ...)
            'New(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = "new " + method + "(" + args + ")";
            },
            // x (function argument)
            'FArg(x)', function(b) {
                result = b.x.value;
            },
            // 10 + 4
            'Op(op, e1, e2)', function(b) {
                result = getExpressionValue(b.e1) + " " + b.op.value + " " + getExpressionValue(b.e2);
            },
            // if nuthin' else matches
            function() {
                if(!result)
                    result = "";
            }
        );
        return result;
    };

});
