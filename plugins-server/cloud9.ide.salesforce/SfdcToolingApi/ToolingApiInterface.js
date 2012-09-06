/**
 * Perform ajax request on the tooling API
 * @author Thomas Dvornik
 */

if (!SfdcToolingApi) {
    var SfdcToolingApi = {};   
}

SfdcToolingApi.ToolingApiInterface = function() {
    var ToolingApi = function() {};
    
    /**
     * 
     */
    ToolingApi.prototype.GET = function() {
        throw 'The get method is not overridden';
    };
    
    ToolingApi.prototype.POST = function() {
        throw 'The create method is not overridden';
    };
    
    ToolingApi.prototype.PATCH = function() {
        throw 'The patch method is not overridden';
    };
    
    ToolingApi.prototype.DELETE = function() {
        throw 'The delete method is not overridden';
    };
    
    /**
     * @returns Request The request type can very based on the Api implementation
     */
    ToolingApi.prototype.buildRequest = function(/* String */ path, /* String */ method, /* Function */ callback) {
        throw 'The buildRequest method is not overridden';
    };
    
    /**
     * Send a request that was build from buildRequest
     */
    ToolingApi.prototype.sendRequest = function(/* Request */ request) {
        throw 'The sendRequest method is not overridden';
    };
    
    ToolingApi.prototype.getAuthToken = function() {
        throw 'The getAuthToken method is not overridden';
    };
    
    ToolingApi.prototype.getInstanceUrl = function() {
        throw 'The getInstanceUrl method is not overridden';
    };
    
    ToolingApi.prototype.getVersion = function() {
        throw 'The getVersion method is not overridden';
    };
    
    return ToolingApi;
}();

//Only for Node.js
module.exports = SfdcToolingApi.ToolingApiInterface;