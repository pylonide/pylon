/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
/**
 * This module implements the base handler object that other language handlers
 * can override.
 */
define(function(require, exports, module) {

module.exports = {
    
    path: null,
    
    // UTILITIES
    
    isFeatureEnabled: function(name) {
        return !disabledFeatures[name];
    },

    // OVERRIDABLE METHODS

    /**
     * Returns whether this language handler should be enabled for the given file
     * @param path the file path of the file
     */
    handlesLanguage: function(language) {
        return false;
    },

    /**
     * If the language handler implements parsing, this function should take
     * the source code and turn it into an AST (in treehugger format)
     * @param code code to parse
     * @return treehugger AST or null if not implemented
     */
    parse: function(doc) {
        return null;
    },
    
    /**
     * Whether this language handler relies on continuous parsing (on an interval basis).
     * This will result in `onParse` being invoked after every successful parse
     */
    requiresContinuousParsing: function() {
        return false;
    },
    
    /**
     * Invoked on a successful parse
     * @param ast the resulting AST in treehugger format
     */
    onParse: function(ast) {
    },
    
    /**
     * Invoked when the document has been updated (possibly after a certain interval)
     * @param doc the document object
     */
    onUpdate: function(doc) {
    },
    
    /**
     * Invoked when a new document has been opened
     * @param path the path of the newly opened document
     * @param doc the document object
     * @param oldPath the path of the document that was active before
     */
    onDocumentOpen: function(path, doc, oldPath) {
    },
    
    /**
     * Invoked when a document is closed in the IDE
     * @param path the path of the file
     */
    onDocumentClose: function(path) {
    },
    
    /**
     * Invoked when the cursor has been moved inside to a different AST node
     * @return a JSON object with three optional keys: {markers: [...], hint: {message: ...}, enableRefactoring: [...]}
     */
    onCursorMovedNode: function(doc, fullAst, cursorPos, currentNode) {
    },
    
    /**
     * Invoked when an outline is required
     * @return a JSON outline structure or null if not supported
     */
    outline: function(ast) {
        return null;
    },
    
    /**
     * Returns whether the completion engine requires an AST representation of the code
     */
    completionRequiresParsing: function() {
        return false;
    },
    
    /**
     * Performs code completion for the user based on the current cursor position
     * @param doc the entire source code as string
     * @param fullAst the entire AST of the current file
     * @param cursorPos the current cursor position (object with keys 'row' and 'column')
     * @param currentNode the AST node the cursor is currently at
     */
    complete: function(doc, fullAst, cursorPos, currentNode) {
        return null;
    },

    /**
     * Returns whether the analysis engine requires an AST representation of the code
     */
    analysisRequiresParsing: function() {
        return true;
    },
    
    /**
     * Enables the handler to do analysis of the AST and annotate as desired
     */
    analyze: function(doc, fullAst) {
        return null;
    },
    
    /**
     * Invoked when inline variable renaming is activated
     * @return an array of positions of the currently selected variable
     */
    getVariablePositions: function(doc, fullAst, pos, currentNode) {
        return null;
    }
};

});