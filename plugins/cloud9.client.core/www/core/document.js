/**
 * Document object for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var Document = function(node, docValue){
    this.$init();
    
    this.getNode = function(){
        return node;
    };
    
    this.setNode = function(newNode) {
        this.dispatchEvent("setnode", {node: newNode});
        return (node = newNode);
    };
    
    this.hasValue = function(){
        return this.getValue() !== undefined;
    };
    
    this.setValue = function(value){
        this.setProperty("value", value);
        docValue = value;
    };

    this.getValue = function(){
        return (this.hasEventListener("retrievevalue") 
            ? this.dispatchEvent("retrievevalue", {value: docValue})
            : docValue);
    };
};
Document.prototype = new apf.Class();

module.exports = Document;

});