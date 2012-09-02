
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

    this.attach = function() {
        
    };

    this.detach = function(callback) {
        
    };

    this.setFrame = function(frame) {
        this.activeFrame = frame;
        ide.dispatchEvent("dbg.changeFrame", {data: frame});
    };

    this.backtrace = function(callback) {
        
    };

    this.loadScripts = function(callback) {
        
    };

    this.loadScript = function(script, callback) {
    };

    this.loadObjects = function(item, callback) {
        
    };

    this.loadFrame = function(frame, callback) {
    };

    this.continueScript = function(stepaction, stepcount, callback) {
        
    };

    this.suspend = function() {
        
    };

    this.evaluate = function(expression, frame, global, disableBreak, callback) {
        
    };

    this.changeLive = function(scriptId, newSource, previewOnly, callback) {
    };

    this.lookup = function(handles, includeSource, callback) {
        
    };

    this.updateBreakpoints = function() {
        
    };

}).call(DebugHandler.prototype);

});