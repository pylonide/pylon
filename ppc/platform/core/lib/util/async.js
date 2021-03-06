/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */


//#ifdef __WITH_ASYNC


/**
 * Performs an async function in serial on each of the list items.
 * 
 * @param {Array} list A list of elements to iterate over asynchronously
 * @param {Function} async An ssync function of the form `function(item, callback)`
 * @param {Function} callback A function of the form `function(error)`, which is
 *      called after all items have been processed
 */
ppc.asyncForEach = function(list, async, callback) {
    var i = 0;
    var len = list.length;

    if (!len) return callback(null, []);

    async(list[i], function handler(err) {
        if (err) return callback(err);
        i++;

        if (i < len) {
            async(list[i], handler, i);
        } else {
            callback(null);
        }
    }, i);
};

/**
 * Performs an async function in serial, as long as the function 'condition' (first 
 * argument) evaluates to true.
 * 
 * @param {Function} condition A function that returns a [Boolean], which determines
 *                             if the loop should continue
 * @param {Function} async     async A function of the form `function(iteration_no, callback)`
 * @param {Function} callback  A function of the form `function(error)`, which is
 *                             called after all items have been processed
 */
ppc.asyncWhile = function(condition, async, callback) {
    var i = 0;
    async(i, function handler(err) {
        if (err)
            return callback ? callback(err, i) : null;

        ++i;
        if (condition(i))
            async(i, handler);
        else
            callback && callback(null, i);
    });
};

/**
 * Maps each element from the list to the result returned by the async mapper
 * function. 
 *
 * The mapper takes an element from the list and a callback as arguments.
 * After completion, the mapper has to call the callback with an (optional) error
 * object as the first argument, and the result of the map as second argument. After all
 * list elements have been processed, the last callback is called with the mapped
 * array as second argument.
 * 
 * @param {Array} list A list of elements to iterate over asynchronously
 * @param {Function}  mapper A function of the form `function(item, next)`
 * @param {Function} callback A function of the form `function(error, result)`
 */
ppc.asyncMap = function(list, mapper, callback) {
    var i = 0;
    var len = list.length;

    if (!len) return callback(null, []);
    var map = [];

    async(list[i], function handler(err, value) {
        if (err) return callback(err);
        
        map[i] = value;
        i++;

        if (i < len) {
            async(list[i], handler);
        } else {
            callback(null, map);
        }
    });
};


/**
 * Chains an array of functions. 
 *
 * Each of the functions (except the last one) must
 * have exactly one `callback` argument, which must be called after the functions has
 * finished. If the callback fails, it must pass a non-null error object as the
 * first argument to the callback.
 * 
 * @param {Array} funcs An array of functions to chain together.
 */
ppc.asyncChain = function(funcs) {
    var i = 0;
    var len = funcs.length;
    
    function next() {
        var f = funcs[i++];
        if (i == len)
            f()
        else
            f(next)
    }
    
    next();
};

//#endif __WITH_ASYNC