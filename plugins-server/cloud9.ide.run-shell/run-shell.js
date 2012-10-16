/**
 * Run methods through a shell
 */
module.exports = function (pm, fs, eventbus) {
    var _self = this;
    
    this.$counter = 0;
    this.processCount = 0;
    
    /**
     * Execute a command
     * @param {String} workspaceId ID from the workspace, can be obtained via workspace.workspaceId
     * @param {String} line Line of code to execute
     * @param {String} cwd Current working directory
     * @param {Function} callback Callback function with args 'err', 'channel'. Channel can be used to listen to eventbus events.
     */
    this.spawn = function (workspaceId, line, cwd, callback) {
        var channel = workspaceId + "::run-shell" + this.$counter++;
        
        pm.spawn("shell", {
            command: "sh",
            args: ["-c", line],
            cwd: cwd,
            encoding: "ascii"
        }, channel, function(err) {
            callback(err, channel);
        });
        
        // listen on the eventbus so we know how much active processes we have
        var listener = function (msg) {
            if (msg.type === "shell-start") {
                _self.processCount++;
            }
            else if (msg.type === "shell-exit") {
                eventbus.removeListener(channel, listener);
                
                _self.processCount--;
            }
        };
        eventbus.on(channel, listener);
    };
    
};