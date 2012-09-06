/**
 * Manage settings for SFDC, like authentication token and instance URL
 * @author Thomas Dvornik
 */
var fs = require('fs');

var _DELIMITER = '&', _FILENAME = '.sfdcSettings';
var _settings = {};

// Must be in the format <id>=<value>&...
var parseSettingString = function(data) {
        var resObj = {};
        
        if (data && typeof data === 'string') { 
            var results = data.split(_DELIMITER);
            
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var id = result.substring(0, result.indexOf('='));
                resObj[id] = result.substring(id.length + 1);
            }
        }
        return resObj;
};

// Try to load the settings when this object is created
try {
    var fileData = fs.readFileSync(_FILENAME).toString();
    _settings = parseSettingString(fileData);
} catch (e) {
    // Error loading the settings. Most likely the file doesn't exist or the format is wrong
    console.log('Waring: Error ' + e + ' loading settingsso we will continue with no settings.');
}

// Add all elements in obj2 to obj1
var join = function(obj1, obj2) {
    for (var key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            obj1[key] = obj2[key];
        }
    }
};

// Converts the _settings object to <id>=<value>&...
var toString = function() {
    var strArr = [];
    for (var key in _settings) {
        if (_settings.hasOwnProperty(key)) {
            strArr.push(key + '=' + _settings[key]);
        }
    }
    return strArr.join(_DELIMITER);
};

module.exports = {
    /**
     * Add some settings. Must be an object or a string in the format <id>=<value>&...
     * @return void
     */
    add : function(/* String | Object */data, /* boolean */ write) {
        if (typeof data === 'string') {
            data = parseSettingString(data);
        }
        join(_settings, data);
        
        if (write) {this.write();}
    },
    /**
     * Get a setting by name
     * @return The setting's value, or undefined if it doesn't exist
     */
    get : function(/* String */ name) {
        return _settings[name];
    },
    /** 
     * Write the settings to .sfdcSettings. This will overwrite 
     * old settings file.
     * @return void
     */
    write : function() {
        fs.writeFile(_FILENAME, toString());
    },
    parse : parseSettingString
};

