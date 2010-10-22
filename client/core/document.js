/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("core/document",
    function() {

var Document = function(node, docValue){
    this.$init();
    
    this.getNode = function(){
        return node;
    }
    
    this.hasValue = function(){
        return docValue !== undefined;
    }
    
    this.setValue = function(value){
        this.setProperty("value", value);
        docValue = value;
    }

    this.getValue = function(){
        return (this.hasEventListener("retrievevalue") 
            ? this.dispatchEvent("retrievevalue", {value: docValue})
            : docValue);
    }
};
Document.prototype = new apf.Class();

return Document;

});