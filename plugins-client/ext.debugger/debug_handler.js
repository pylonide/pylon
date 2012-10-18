/**
 * Debugger interface to be extended to support different debugger types
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {


var DebugHandler = module.exports = function() {
    // Used from other plugins
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
     * @param pid The running instance process id
     * @param runner The type of the running process
     */
    this.attach = function(pid, runner) {
    };

    /**
     * Detaches the debugger, clears the active frame data
     * and resets the debug UI
     */
    this.detach = function(callback) {
    };

    /**
     * Returns the debug stack trace representing the current state of the
     * debugee instance - mainly including the stack frames and references
     * to the frame source
     */
    this.backtrace = function(callback) {
    };

    /**
     * Loads all the active sources from the debugee instance
     */
    this.loadSources = function(callback) {
    };

    /**
     * Loads a specific source from the active sources in the debugee instance
     * @param source APF node to extract request attributes from
     */
    this.loadSource = function(source, callback) {
    };

    /**
     * Loads an object with its properties using its handle
     * @param item APF node for the object to load to extract the handle from
     */
    this.loadObject = function(item, callback) {
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
    this.resume = function(stepaction, stepcount, callback) {
    };

    /**
     * Suspends execution of the debugee instance
     */
    this.suspend = function() {
    };

    /**
     * Evaluate an expression string in a specific frame
     * @param expression string
     * @param frame the stack frame object
     * @param global boolean
     * @param disableBreak boolean
     */
    this.evaluate = function(expression, frame, global, disableBreak, callback) {
    };

    /**
     * Change a live running source to the latest code state
     * @param sourceId the scriptid attribute of the target source
     * @param newSource string of the new source code
     * @param previewOnly boolean
     */
    this.changeLive = function(sourceId, newSource, previewOnly, callback) {
    };

    /**
     * Lookup multiple generic objects using their handles
     * (can be VM objects or sources)
     * @param handles the array of handles to lookup for
     * @param includeSource boolean whether to include the source
     * when source objects are returned
     */
    this.lookup = function(handles, includeSource, callback) {
    };

    /**
     * Refresh breakpoints to the latest state
     * Gets called with every change in the breakpoints added to the UI
     * Should compare UI breakpoints with the really added breakpoints
     * to the debugger and add/clear to sync breakpoint state
     * UI breakpoints can easily be get calling: this.$getUIBreakpoints()
     */
    this.updateBreakpoints = function() {
        // Call the debugger to actually set/clear breakpoints
        var uiBreakpoints = this.$getUIBreakpoints();
    };

    /////////////////////////////// Utilities \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/

    /**
     * Utility function can be used to easily get the UI breakpoints
     */
    this.$getUIBreakpoints = function (argument) {
        return mdlDbgBreakpoints.queryNodes("breakpoint").map(function(bp) {
            return {
                path: bp.getAttribute("path") || "",
                line: parseInt(bp.getAttribute("line"), 10),
                column: parseInt(bp.getAttribute("column"), 10) || 0,
                enabled: bp.getAttribute("enabled") == "true",
                condition: bp.getAttribute("condition") || "",
                ignoreCount: bp.getAttribute("ignoreCount") || 0
            };
        });
    };

}).call(DebugHandler.prototype);

});