var sys = require("sys");

var User = function (name, permissions) {
    this.name = name;
    this.permissions = permissions;
    this.clients = [];
};

sys.inherits(User, process.EventEmitter);

User.OWNER_PERMISSIONS = {
    "read": 1,
    "write": 1,
    "debugger": 1,
    "shell": 1,
    "git": 1,
    "watcher": 1
};

User.COLLABORATOR_PERMISSIONS = {
    "read": 1,
    "write": 1,
    "debugger": 1,
    "shell": 1,
    "watcher": 1
};

User.VISITOR_PERMISSIONS = {
    "read": 1
};

(function() {
    
    this.setPermissions = function(permissions) {
        this.permissions = permissions;
    };
    
    this.addClientConnection = function(client, message) {
        var id = client.sessionId;
        if (this.clients[id] === client)
            return;
            
        this.clients[id] = client;
        this.onClientCountChange();
        
        var _self = this;
        client.on("message", function(message) {
            _self.onClientMessage(message, client);
        });
        
        client.on("disconnect", function() {
            _self.emit("disconnectClient", {
                user: _self,
                client: client
            });
            delete _self.clients[client.sessionId];
            _self.onClientCountChange();
        });
        
        if (message)
            _self.onClientMessage(message, client);         
    };
    
    this.onClientMessage = function(message, client) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e + "\nmessage: " + message, 8);
        }

        this.emit("message", {
            message: message,
            user: this,
            client: client
        });
    };
    
    this.onClientCountChange = function() {
        var count = Object.keys(this.clients).length;
        this.emit("clientCountChange", count);
        
        if (count === 0)
            this.emit("disconnectUser", this);
    };
    
    this.error = function(description, code, message, client) {
        //console.log("Socket error: " + description, new Error().stack);
        var sid = (message || {}).sid || -1;
        var error = JSON.stringify({
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        });
        if (client)
            client.send(error)
        else
            this.broadcast(error);
    };
    
    this.broadcast = function(msg) {
        for (var id in this.clients) 
            this.clients[id].send(msg);
    };
    
}).call(User.prototype);

module.exports = User;
