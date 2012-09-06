
//Only for Node.js
var api = require('./ToolingApiNodeJsImpl');
var util = require('./Util');

if (!SfdcToolingAPI) {
    var SfdcToolingAPI = {};   
}

SfdcToolingAPI.Entity = function() {
    var Entity = function(fields) {
        this.fields = {};
        this.fieldsToUpdate = {};
        
        for (var f in fields) {
            if (fields.hasOwnProperty(f)) {
                this.set(f, fields[f]);
            }
        }
        
        this.fieldsToUpdate = {};
    };
    
    Entity.prototype.SOBJECT = 'sobjects';
    Entity.prototype.QUERY = 'query';
    
    Entity.prototype.has = function(name) {
        return this.fields.hasOwnProperty(name);   
    };
    
    Entity.prototype.set = function(name, value) {
        if (name === 'Id' && this.has('Id')) {
            throw 'Entity already has an Id, you can not override it';
        }
        if (typeof name === 'string') {
            this.fields[name] = value;
            this.fieldsToUpdate[name] = value;
        } else if (typeof name === 'object') {
            this.fields = util.union(this.fields, name);
            this.fieldsToUpdate = util.union(this.fieldsToUpdate, name);
        }
    };
    
    Entity.prototype.get = function(name) {
        return this.has(name) ? this.fields[name] : undefined;   
    };
    
    Entity.prototype.create = function(success, failure) {
        if (this.has('Id')) {
            throw 'This entitiy is already created because it has an Id';
        } else {
            var _self = this;
            api.POST(this.SOBJECT + '/' + this.type, this.fields, function(data) {
                //console.log('Created ');
                _self.set('Id', data.id ? data.id : data.Id);
                util.cont(success, data);
            }, failure);
            //create(this.type, this.fields, callback);
            this.fieldsToUpdate = {};
        }
    };
    
    Entity.prototype.refresh = function(success, failure) {
        if (!this.has('Id')) {
            throw 'Can only refresh an entity with Id';
        } else {
            var _self = this;
            api.GET(this.SOBJECT + '/' + this.type + '/' + this.get('Id'), function(data) {
                //console.log('Refreshed ' + JSON.stringify(data, null, 4));
                _self.set(data);
                
                //We just refreshed, so clear the fields to be update
                _self.fieldsToUpdate = {};
                
                util.cont(success, data);
            }, failure);
            //create(this.type, this.fields, callback);  
        }
    };
    
    /**
     * Only update fields that have been modified since this entity instance was created
     */
    Entity.prototype.update = function(success, failure) {
        if (!this.has('Id')) {
            throw 'Can only update an entity with Id';
        } else {
            var _self = this;
            console.log('BEFORE UPDATE ' + JSON.stringify(this.fieldsToUpdate, null, 4));
            api.PATCH(this.SOBJECT + '/' + this.type + '/' + this.get('Id'), this.fieldsToUpdate, function(data) {
                console.log('UPDATED ' + JSON.stringify(data, null, 4));
                _self.set(data);
                
                //We just updated, so clear the fields to be update
                _self.fieldsToUpdate = {};
                
                util.cont(success, data);
            }, failure);
            //create(this.type, this.fields, callback);  
        }
    };
    
    Entity.prototype.DELETE = function(success, failure) {
        if (!this.has('Id')) {
            throw 'Can\'t delete and entity that doesn\'t have an Id';
        } else {
            api.DELETE(this.SOBJECT + '/' + this.type + '/' + this.get('Id'), success, failure); 
        }
    };
    
    Entity.prototype.describe = function(success, failure) {
        if (!this.type) {
            throw 'Can\'t call decribe on Entity. Must be an overridden type';
        }
        api.GET(this.SOBJECT + '/' + this.type + '/describe', success, failure);
    };
    
    Entity.prototype.describeFields = function(success, failure) {
        this.describe(function(results) {
            util.cont(success,  results.fields);
        }, failure);
    };
    
    Entity.prototype.query = function(fields, where, success, failure) {
        if (!this.type) {
            throw 'Can\'t call query on Entity. Must be an overridden type';
        }
        
        var query = 'SELECT '+fields.join(',')+' FROM ' + this.type + (where ? ' WHERE '+where : '');    
        console.log(query);

        api.GET(this.QUERY + '/?q=' + encodeURIComponent(query), function(results) {
            var records = results.records ? results.records : [];

            //Don't need to log right now
            /*
            for(var r = 0; r < records.length; r++) {
                console.log('Record ' + r + ': ');
                for(var f = 0; f < fields.length; f++) {
                    console.log('     ' + fields[f] + ' = ' + records[r][fields[f]])
                }
            }
            */
            util.cont(success,  records);
        }, failure);

    };
    
    //Give access to the underlying api object
    Entity.prototype.api = api;
    
    return Entity;
}();

//Only for Node.js
module.exports = SfdcToolingAPI.Entity;