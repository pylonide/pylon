
//Only for Node.js
var Entity = require('./Entity');
var util = require('./Util');

var Entities = {};

function setupEntityInfo(typeName, pluralName) {
    var EntityClass = function(fields) {
        Entity.call(this, fields);
    };
    util.extend(Entity, EntityClass);
    EntityClass.prototype.type = typeName;
    var blankEntity = new EntityClass();
    
    //Set up the static methods on the plural name. i.e. ApexClasses.query...
    Entities[pluralName] = {
        describe : function(callback) {
            blankEntity.describe(callback);
        },
        describeFields : function(callback) {
            blankEntity.describeFields(callback);
        },
        query : function(fields, where, callback) {
            blankEntity.query(fields, where, callback);
        }
    };
    //Set up the class so we can create instance. i.e. new ApexClass();
    Entities[typeName] = EntityClass;
}

var entityTypes = [
    { name : 'ApexClass', plural : 'ApexClasses', fileBodyField : 'Body', fileExtension : 'apex' },
    //{ name : 'ApexPage', plural : 'ApexPages' },
    { name : 'ApexTrigger', plural : 'ApexTriggers' },
    { name : 'ApexLog', plural : 'ApexLogs' },
    { name : 'TraceFlag', plural : 'TraceFlags' },
    { name : 'ContainerAsyncRequest', plural : 'ContainerAsyncRequests' },
    { name : 'MetadataContainer', plural : 'MetadataContainers' },
    { name : 'MetadataContainerMember', plural : 'MetadataContainerMembers' }
    
];

for (var i = 0; i < entityTypes.length; i++) {
    setupEntityInfo(entityTypes[i].name, entityTypes[i].plural);
}

Entities.types = entityTypes;
Entities.api = Entity.api;

//Chain the api back to the user
Entities.api = Entity.prototype.api;
// Apply any special methods here

//TODO I need get to return the entity instances so I can get the Id from the object
Entities.ApexLogs.downloadLog = function(id, success) {
    //console.log(id);
    var req = Entity.prototype.api.buildRequest('/servlet/servlet.FileDownload?file=' + id, 'GET',
        success,
        function(error) {
            console.log('Error downloading log ' + id + ': ' + error);
        }, true, true);
    console.log(req);
    Entity.prototype.api.sendRequest(req);
};

//Start with ApexClass and add more when it works
/*
var ApexClass = function(fields) {
    Entity.call(this, fields);    
};
util.extend(Entity, ApexClass);
ApexClass.prototype.type = typeName;
var blankApexClass = new ApexClass();
*/

module.exports = Entities;


/*
///tooling/sobjects/SObjectName/describe/
function describe(entity, callback) {
    console.log('\n----- Describe for entitiy ------');
    //var _self = this;
    
}

function query(entity, fields, where, callback) {
    console.log('\n----- Query for entitiy ------');
    var query = 'SELECT '+fields.join(',')+' FROM ' + entity + (where ? ' WHERE '+where : '');
    console.log(query);
    //console.log(encodeURIComponent(query));
    getRequest('/services/data/v26.0/tooling/query/?q='+encodeURIComponent(query), function(results) {
        var records = results.records ? results.records : [];
        //console.log(results);

        for(var r = 0; r < records.length; r++) {
            console.log('Record ' + r + ': ');
            for(var f = 0; f < fields.length; f++) {
                console.log('     ' + fields[f] + ' = ' + records[r][fields[f]])
            }
            //records[r].name);
        }

        if (callback && callback.call) {
            callback(records);
        }
    });
}

function create(entity, fields, callback) {
    console.log('\n----- Create entitiy ------');

    postRequest('/services/data/v26.0/tooling/sobjects/' + entity, fields, function(results) {
        //var records = results.records;
        //console.log(results);
        
        if (results.success) {
            if (callback && callback.call) {
                callback(results.Id);
            }
        } else {
            console.out(results.errors);
        }   
    });
}
*/
