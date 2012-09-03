var ide = require("core/ide");

define(function(require, exports, module) {

var DebugHandler = module.exports = function() {
    // used from other plugins
    /**
     * state of the debugged process
     *    null:  process doesn't exist
     *   'stopped':  paused on breakpoint
     *   'running':
     */
    this.state = null;
};

(function() {

    /**
     * Attaches the debugger to the started debugee instance
     * when attached, it emits "dbg.attached" ide event with
     * dbgImpl attribute to the debugger object that should be used
     * for further debug calls
     */
    this.attach = function() {
    };

    /**
     * Detaches the debugger, clears the active frame data
     * and resets the debug UI
     */
    this.detach = function(callback) {
    };

    /**
     * Sets the debugger active frame
     * emits "dbg.changeFrame" ide event with data attribute referring
     * to the active frame
     * @param frame to set as the active frame
     */
    this.setFrame = function(frame) {
        this.activeFrame = frame;
        ide.dispatchEvent("dbg.changeFrame", {data: frame});
    };

    /**
     
     */
    this.backtrace = function(callback) {
    };

    /**
     * Loads all the active scripts from the debugee instance
     */
    this.loadScripts = function(callback) {
    };

    /**
     * Loads a specific script from the active scripts in the debugee instance
     * @param script APF node to extract request attributes from
     */
    this.loadScript = function(script, callback) {
    };

    /**
     * Loads an object with its properties using its handle
     * @param item APF node for the object to load to extract the handle from
     */
    this.loadObjects = function(item, callback) {
    };

    /**
     * Loads a stack frame to the UI
     * @param frame the stack frame object to load 
     */
    this.loadFrame = function(frame, callback) {
    };

    /**
     * Continue instance execution after a suspend caused by
     * "break", "exception" events or "suspend" request
     * @param stepaction <"in", "next" or "out">
     * @param stepcount <number of steps (default 1)>
     */
    this.continueScript = function(stepaction, stepcount, callback) {
    };

    /**
     * Suspends execution of the debugee instance
     */
    this.suspend = function() {
    };

    /**
     * Evaluate an exressiom string in a specific frame
     * @param expression string
     * @param frame the stack frame object
     * @param global boolean
     * @param disableBreak boolean
     */
    this.evaluate = function(expression, frame, global, disableBreak, callback) {
    };

    /**
     * Evaluate an exressiom string in a specific frame
     * @param scriptId the scriptid attribute of the target script
     * @param newSource string of the new script source code
     * @param previewOnly boolean
     */
    this.changeLive = function(scriptId, newSource, previewOnly, callback) {
    };

    /**
     * Lookup multiple generic objects using their handles
     * (can be VM objects or scripts)
     * @param handles the array of handles to lookup for
     * @param includeSource boolean whether to include the source
     * when script objects are returned
     */
    this.lookup = function(handles, includeSource, callback) {
    };

    /**
     * Refresh breakpoints to the latest state
     * Gets called with every change in the breakpoints added to the UI
     * Should compare UI breakpoints with the really added breakpoints
     * to the debugger and add/clear to sync breakpoint state
     */
    this.updateBreakpoints = function() { 
    };

}).call(DebugHandler.prototype);

});