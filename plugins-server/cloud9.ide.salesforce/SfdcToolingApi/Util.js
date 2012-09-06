
if (!SfdcToolingApi) {
    var SfdcToolingApi = {};   
}

SfdcToolingApi.Util = function() {
    //Private
    
    // Constructor that is used to setup inheritance properly
    function surrogateCtor() {}

    //Public
    return {
        //Can't be continue because of reserved keyword
        cont : function(continuation, params, scope) {
            if (continuation && continuation.call) { 
                continuation.call(scope ? scope : this, params); 
            }
        },
        extend : function(base, sub) {
            surrogateCtor.prototype = base.prototype;
            sub.prototype = new surrogateCtor();
            // The constructor property was set wrong, let's fix it
            sub.prototype.constructor = sub;
        },
        /**
         * Get the object names from an array. This is useful for getting
         * field names our of a describe or query. First it will try to find
         * "Name," then "name." For example, 
         * [
         *      { name : 'Joe', Name : 'Jane' },
         *      { name : 'Bob' },
         *      { ame : 'Smith' }
         * }
         * 
         * will return ['Jane', 'Bob']
         */
        getNames : function(arr) {
            var retArr = [];
            for (var i = 0; i < arr.length; i++) {
                var a = arr[i];
                if (a.Name || a.name) {
                    retArr.push(a.Name ? a.Name : a.name);
                }
            }
            return retArr;
        },
        /** 
         * Combine 2 objects into a new object
         */
        union : function(/* Object */ obj1, /* Object */ obj2) {
            var ret = {};
            for (var key in obj1) {
                if (obj1.hasOwnProperty(key)) {
                    ret[key] = obj1[key];
                }
            }
            for (key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    ret[key] = obj2[key];
                }
            }
            return ret;
        }
    };
}();

//Only for Node.js
module.exports = SfdcToolingApi.Util;