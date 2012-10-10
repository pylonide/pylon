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
    
    language: null,
    project: null,
    path: null,
    workspaceDir: null,
    doc: null,
    
    // UTILITIES
    
    /**
     * Determine whether a certain feature is enabled in the user's preferences.
     */
    isFeatureEnabled: function(name) {
        return !disabledFeatures[name];
    },

    // OVERRIDABLE ACCESORS

    /**
     * Returns whether this language handler should be enabled for the given file
     * @param language to check the handler against
     */
    handlesLanguage: function(language) {
        return false;
    },
    
    /**
     * Determine if the language component supports parsing.
     * Assumed to be true if at least one hander for the language reports true.
     */
    isParsingSupported: function() {
        return false;
    },

    /**
     * Returns a regular expression for identifiers.
     * If not specified, /[A-Za-z0-9\$\_]/ is used.
     */
    getIdentifierRegex: function() {
        return null;
    },
    
    // PARSING AND ABSTRACT SYNTAX CALLBACKS

    /**
     * If the language handler implements parsing, this function should take
     * the source code and turn it into an AST
     * @param doc the Document object repersenting the source
     * @return treehugger AST or null if not implemented
     */
    parse: function(doc, callback) {
        callback();
    },
    
    /**
     * Finds a tree node at a certain row and col,
     * e.g. using the findNode(pos) function of treehugger.
     */
    findNode: function(ast, pos, callback) {
        callback();
    },
    
    /**
     * Returns the  a tree node at a certain row and col,
     * e.g. using the node.getPos() function of treehugger.
     * @returns an object with properties sl, the start line, sc, the start
     *          column, el, the end line, and ec, the end column.
     */
    getPos: function(node, callback) {
        callback();
    },

    // OTHER CALLBACKS
    
    /**
     * Initialize this language handler.
     */
    init: function(callback) {
        callback();
    },
    
    /**
     * Invoked when the document has been updated (possibly after a certain interval)
     * @param doc the Document object repersenting the source
     */
    onUpdate: function(doc, callback) {
        callback();
    },
    
    /**
     * Invoked when a new document has been opened
     * @param path the path of the newly opened document
     * @param doc the Document object repersenting the source
     * @param oldPath the path of the document that was active before
     */
    onDocumentOpen: function(path, doc, oldPath, callback) {
        callback();
    },
    
    /**
     * Invoked when a document is closed in the IDE
     * @param path the path of the file
     */
    onDocumentClose: function(path, callback) {
        callback();
    },
    
    /**
     * Invoked when the cursor has been moved inside to a different AST node
     * @param doc the Document object repersenting the source
     * @param fullAst the entire AST of the current file (if exists)
     * @param cursorPos the current cursor position (object with keys 'row' and 'column')
     * @param currentNode the AST node the cursor is currently at (if exists)
     * @return a JSON object with three optional keys: {markers: [...], hint: {message: ...}, enableRefactoring: [...]}
     */
    onCursorMovedNode: function(doc, fullAst, cursorPos, currentNode, callback) {
        callback();
    },
    
    /**
     * Invoked when an outline is required
     * @param doc the Document object repersenting the source
     * @param fullAst the entire AST of the current file (if exists)
     * @return a JSON outline structure or null if not supported
     */
    outline: function(doc, fullAst, callback) {
        callback();
    },

    /**
     * Invoked when an type hierarchy is required
     * (either for a selected element, or the enclosing element)
     * @param doc the Document object repersenting the source
     * @param cursorPos the current cursor position (object with keys 'row' and 'column')
     * @return a JSON hierarchy structure or null if not supported
     */
    hierarchy: function(doc, cursorPos, callback) {
        callback();
    },
    
    /**
     * Performs code completion for the user based on the current cursor position
     * @param doc the Document object repersenting the source
     * @param fullAst the entire AST of the current file (if exists)
     * @param pos the current cursor position (object with keys 'row' and 'column')
     * @param currentNode the AST node the cursor is currently at (if exists)
     * @return an array of completion matches
     */
    complete: function(doc, fullAst, pos, currentNode, callback) {
        callback();
    },
    
    /**
     * Enables the handler to do analysis of the AST and annotate as desired
     * @param doc the Document object repersenting the source
     * @param fullAst the entire AST of the current file (if exists)
     * @return an array of error and warning markers
     */
    analyze: function(doc, fullAst, callback) {
        callback();
    },
    
    /**
     * Invoked when inline variable renaming is activated
     * @param doc the Document object repersenting the source
     * @param fullAst the entire AST of the current file (if exists)
     * @param pos the current cursor position (object with keys 'row' and 'column')
     * @param currentNode the AST node the cursor is currently at (if exists)
     * @return an object with the main occurence and array of other occurences of the selected element
     */
    getVariablePositions: function(doc, fullAst, pos, currentNode, callback) {
        callback();
    },

    /**
     * Invoked when refactoring is started -> So, for java, saving the file is no more legal to do
     * @param doc the Document object repersenting the source
     * @param oldId the old identifier wanted to be refactored
     */
    onRenameBegin: function(doc, callback) {
        callback();
    },

    /**
     * Invoked when a refactor request is being finalized and waiting for a status
     * @param doc the Document object repersenting the source
     * @param oldId the old identifier wanted to be refactored
     * @param newName the new name of the element after refactoring
     * @return boolean indicating whether to progress or an error message if refactoring failed
     */
    commitRename: function(doc, oldId, newName, callback) {
        callback();
    },

    /**
     * Invoked when a refactor request is cancelled
     */
    onRenameCancel: function(callback) {
        callback();
    },

    /**
     * Invoked when an automatic code formating is wanted
     * @param doc the Document object repersenting the source
     * @return a string value representing the new source code after formatting or null if not supported
     */
    codeFormat: function(doc, callback) {
        callback();
    },

    /**
     * Invoked when jumping to a definition
     * @return the position of the definition of the currently selected node
     */
    jumpToDefinition: function(doc, fullAst, pos, currentNode, callback) {
        callback();
    }
};

});
