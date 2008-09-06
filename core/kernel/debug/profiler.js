/**
 * $Id$
 * Profiler class
 * @class Profiler
 * @version $Rev$
 * @author Mike de Boer (info AT mikedeboer.nl)
 */
jpf.Profiler = {
    stackTrace     : {},    //object - keepsafe for all profiled function during a cycle
    previousStack  : null,  //object - keeping hold of the stackTrace of the previous cycle
    isRunning      : false, //bool   - TRUE when the Profiler is running a cycle
    pointers       : {},    //object - keepsafe for functions that have been decorated with a Profiler function template (for back reference)
    precision      : 3,     //number - output precision of timers (in Profiler reports)
    runs           : 0,     //number - number of cycles being ran
    sortMethod     : 2,     //number - identifies the sorting method: see Profiler#SORT_BY_* constants

    //the following functions take care of asynchronous nature of ECMAscript function calls, by utilizing queues:
    startBusy      : false, //bool   - TRUE when the Profiler is busy profiling a function call
    startQueue     : [],    //array  - A queue holding Profiling requests from function pointers (START)
    startQueueTimer: null,  //mixed  - Timer that, while running, will try to purge the startQueue
    endBusy        : false, //bool   - TRUE when the Profiler is busy ending a function call (thus calculating the running time for that function)
    endQueue       : [],    //array  - A queue holding Profiling requests from function pointers (END)
    endQueueTimer  : null,  //mixed  - Timer that, while running, will try to purge the endQueue
    
    /**
     * Initialize the Profiler.
     * Usage: pass objects, holding (a) collection(s) of function(s) as arguments
     * to this function and it transforms those functions, so that they may be Profiled.
     * Example: 
     *   Profiler.init(
     *       Object1, 'Object1',
     *       Object2, 'Object2 - Sample',
     *       Object3.prototype, 'Object3 - A prototype',
     *   );
     * Note: there is no limit in how long the arguments list can be. However,
     *       your application may become less response as the list grows larger.
     *
     * @param {Object} Parameter 1 must always be an object
     * @param {String} 2nd parameter must always be a string, describing the object. 
     * @type  {void}
     */
    init: function() {
        var i, j, obj, objName, pName;
        for (i = 0; i < arguments.length; i+=2) {
            if (typeof arguments[i] == "object") {
                obj = arguments[i];
                objName = arguments[(i+1)];
                for (j in obj) {
                    if (typeof obj[j] == "function" && !this.isBlackListed(j)) {
                        pName = objName + "#" + j;
                        obj[j].nameSelf = pName;
                        this.pointers['pointer_to_' + pName] = obj[j];
                        obj[j] = jpf.Profiler_functionTemplate();
                        obj[j].nameSelf = pName;
                    }
                }
            }
        }
    },

    /**
     * Check if a function name has been blacklisted.
     * The blacklist holds function names that serve as function proxies by
     * using 'Function.prototype.apply' or 'Function.prototype.call'
     *
     * @param {String} sName Name of the Function object
     * @type  {Boolean}
     */
    isBlackListed: function(sName) {
        for (var i = 0; i < jpf.Profiler.BLACKLIST.length; i++) {
            if (sName == jpf.Profiler.BLACKLIST[i])
                return true;
        }
        return false;
    },
    
    /**
     * Register the start of a function call (or, at least, of its pointer)
     *
     * @param {String} sName The complete name of the function (ID)
     * @type  {void}
     */
    registerStart: function(sName) {
        if (this.isRunning) {
            if (this.startBusy) {
                if (sName) this.startQueue.push(sName);
                this.startQueueTimer = setTimeout(this.registerStart(), 200);
            } else {
                this.startBusy = true;
                clearTimeout(this.startQueueTimer);
                
                var todo = (this.startQueue.length) ? this.startQueue : [];
                this.startQueue = [];
                if (sName) todo.push(sName);
                
                for (var i = 0; i < todo.length; i++) {
                    if (!this.stackTrace[todo[i]]) {
                        this.stackTrace[todo[i]] = {
                            called: 1,
                            fullName: sName,
                            executions: [[new Date(), null]]
                        };
                    } else {
                        this.stackTrace[todo[i]].called++;
                        this.stackTrace[todo[i]].executions.push([new Date(), null]);
                    }
                }
                this.startBusy = false;
            }
        }
    },
    
    /**
     * Register the end of a function call (or, at least, of its pointer).
     * this means that the Profiling ends and running times will be recorded here.
     *
     * @param {String} sName The complete name of the function (ID)
     * @type  {void}
     */
    registerEnd: function(sName) {
        if (this.isRunning) {
            if (!this.stackTrace[sName]) return;
            if (this.endBusy) {
                if (sName) this.endQueue.push(sName);
                this.endQueueTimer = setTimeout(this.registerEnd(), 200);
            } else {
                this.endBusy = true;
                clearTimeout(this.endQueueTimer);
                
                var todo = (this.endQueue.length) ? this.endQueue : [];
                this.endQueue = [];
                if (sName) todo.push(sName);
                
                for (var i = 0; i < todo.length; i++) {
                    iLength = this.stackTrace[todo[i]].executions.length;
                    if (this.stackTrace[todo[i]].executions[iLength - 1][1] == null)
                        this.stackTrace[todo[i]].executions[iLength - 1][1] = new Date();
                }
                this.endBusy = false;
            }
        }
    },

    /**
     * Start a new cycle of the Profiler.
     *
     * @type {void}
     */
    start: function() {
        this.reset();
        this.isRunning = true;
    },

    /**
     * Stop the current cycle of the Profiler and output the result.
     * 
     * @type {mixed}
     */
    stop: function() {
        if (this.isRunning) this.runs++;
        this.isRunning = false;
        return this.report();
    },

    /**
     * Clear the stackTrace of the previous cycle and clarify that it's not
     * running/ timing stuff anymore.
     * 
     * @type {void}
     */
    reset: function() {
        this.stackTrace = {};
        this.isRunning  = false;
    },
    
    /**
     * Prepare the raw data of a finished Profiler cycle and send it through
     * to the report builder.
     * 
     * @see Profiler#buildReport
     * @type {mixed}
     */
    report: function() {
        var i, j, dur, stack, trace, callsNo, out = [];
        
        this.stackTrace.totalCalls = this.stackTrace.totalAvg = this.stackTrace.totalDur = 0;
        
        for (i in this.stackTrace) {
            if (!this.stackTrace[i].fullName) continue;

            stack = this.stackTrace[i];
            callsNo = stack.executions.length;
            stack.ownTime = stack.max = 0;
            stack.min = Infinity;
            for (j = 0; j < stack.executions.length; j++) {
                trace = stack.executions[j];
                dur = (trace[1] - trace[0]);
                if (isNaN(dur) || !isFinite(dur)) dur = 0;
                
                if (stack.max < dur)
                    stack.max = dur;
                else if (stack.min > dur)
                    stack.min = dur;
                stack.ownTime += dur;
            }
            stack.avg = stack.ownTime / callsNo;
            stack.avg = parseFloat(((isNaN(stack.avg) || !isFinite(stack.avg)) ? 0 : stack.avg).toFixed(this.precision));
            stack.min = parseFloat(((isNaN(stack.min) || !isFinite(stack.min)) ? 0 : stack.min).toFixed(this.precision));
            stack.max = parseFloat(stack.max.toFixed(this.precision));
            
            this.stackTrace.totalCalls += callsNo;
            this.stackTrace.totalDur   += dur;
        }
        this.stackTrace.totalDur = parseFloat(this.stackTrace.totalDur.toFixed(this.precision));
        
        this.stackTrace.totalAvg = parseFloat(this.stackTrace.totalDur / this.stackTrace.totalCalls);
        this.stackTrace.totalAvg = parseFloat(this.stackTrace.totalAvg.toFixed(this.precision));
        
        return this.buildReport(this.stackTrace);
        
    },
    
    /**
     * Tranform the raw Profiler data into a nicely formatted report.
     * Right now, I only implemented an xHTML output, no XML or JSON yet.
     * TODO: add XML and/ or JSON standard output methods.
     *
     * @param {Object}  stackTrace
     * @param {Boolean} withContainer
     * @type  {String}
     */
    buildReport: function(stackTrace, withContainer) {
        if (typeof wihContainer == "undefined") withContainer = true;
        
        var out = withContainer ? ['<div id="profiler_report_' + this.runs + '">'] : [''];
        
        out.push('<table border="0" class="profiler_stacktrace" cellpadding="2" cellspacing="2">\
            <tr>\
                <th>Function</th>\
                <th>Calls</th>\
                <th>Percentage</th>\
                <th>Time</th>\
                <th>Avg</th>\
                <th>Min</th>\
                <th>Max</th>\
            </tr>');
        
        var sortedStack = this.sortStack(stackTrace);
        for (i = 0; i < sortedStack.length; i++) {
            stack = stackTrace[sortedStack[i][0]];
            out.push('<tr>\
                    <td class="functionname">' + stack.fullName + '</td>\
                    <td class="callscount">' + stack.executions.length + '</td>\
                    <td class="duration_percentage">' + stack.perc + '%</td>\
                    <td class="duration_total">' + stack.ownTime + 'ms</td>\
                    <td class="duration_average">' + stack.avg + 'ms</td>\
                    <td class="duration_min">' + stack.min + 'ms</td>\
                    <td class="duration_max">' + stack.max + 'ms</td>\
                </tr>');
        }
        
        out.push('<tr class="profiler_stacktrace_totals">\
                <td>&nbsp;</td>\
                <td class="callscount">' + stackTrace.totalCalls + '</td>\
                <td>&nbsp;</td>\
                <td class="duration_total">' + stackTrace.totalDur + 'ms</td>\
                <td class="duration_average">' + stackTrace.totalAvg + 'ms</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            </table>');
        if (withContainer)
            out.push('</div>');
        
        this.previousStack = stackTrace;
        return out.join('');
    },
    
    /**
     * Apply sorting to a stacktrace of a finished cycle. This function also
     * implements the calculation of percentages for each running stack.
     * The sorting order is configurable (ascending or descending).
     * Sorting methods:
     *   SORT_BY_CALLS        - number of times each function is called
     *   SORT_BY_PERCENTAGE   - relative amount of time each function call consumed, compared to the total cycle running time. DEFAULT.
     *   SORT_BY_FUNCTIONNAME - alphabetical by name of function.
     *   SORT_BY_OWNTIME      - time it took for the function itself to finish a call.
     *   SORT_BY_AVERAGE      - time it took for a function to finish its call - including the waits for child functions - devided by the total number of calls.
     *   SORT_BY_MINIMUM      - lowest recorded time it took for a function to finish its call - including the waits for child functions.
     *   SORT_BY_MAXIMUM      - highest recorded time it took for a function to finish its call - including the waits for child functions.
     *   
     * @param {Object} stackTrace to (re)sort
     * @type  {Array}
     */
    sortStack: function(stackTrace) {
        var i, stack, aSorted = [];
        
        for (i in stackTrace) {
            if (!stackTrace[i].fullName) continue;
            stack = stackTrace[i];
            stack.perc = 100 - Math.round((Math.abs(stack.ownTime - stackTrace.totalDur) / stackTrace.totalDur) * 100);
            
            switch (this.sortMethod) {
                case jpf.Profiler.SORT_BY_CALLS :
                    aSorted.push([i, (stack.executions.length - 1)]);
                    break;
                default:
                case jpf.Profiler.SORT_BY_PERCENTAGE :
                    aSorted.push([i, stack.perc]);
                    break;
                case jpf.Profiler.SORT_BY_FUNCTIONNAME :
                    aSorted.push([i, stack.fullName.toLowerCase()]);
                    break;
                case jpf.Profiler.SORT_BY_OWNTIME :
                    aSorted.push([i, stack.ownTime]);
                    break;
                case jpf.Profiler.SORT_BY_AVERAGE :
                    aSorted.push([i, stack.avg]);
                    break;
                case jpf.Profiler.SORT_BY_MINIMUM :
                    aSorted.push([i, stack.min]);
                    break;
                case jpf.Profiler.SORT_BY_MAXIMUM :
                    aSorted.push([i, stack.max]);
                    break;
            }
        }
        
        return aSorted.sort((this.sortMethod == jpf.Profiler.SORT_BY_FUNCTIONNAME)
            ? this.sortingHelperAsc
            : this.sortingHelperDesc);
    },
    
    /**
     * Sort the last known complete stackTrace again, with a new method
     * 
     * @param {Number} sortMethod to sort the stack with
     * @type  {String}
     */
    resortStack: function(sortMethod) {
        if (this.previousStack) {
            this.sortMethod = parseInt(sortMethod);
            return this.buildReport(this.previousStack, false);
        }
        return "";
    },
    
    /**
     * Provide the ascending sorting order to the report generator
     *
     * @param {mixed} a Variable to be compared
     * @param {mixed} b Variable next in line to be compared
     * @type  {Number}
     */
    sortingHelperAsc: function(a, b) {
        if (a[1] < b[1])
            return -1;
        else if (a[1] > b[1])
            return 1;
        else
            return 0;
    },
    
    /**
     * Provide the descending sorting order to the report generator
     * 
     * @param {mixed} a Variable to be compared
     * @param {mixed} b Variable next in line to be compared
     * @type  {Number}
     */
    sortingHelperDesc: function(a, b) {
        if (a[1] > b[1])
            return -1;
        else if (a[1] < b[1])
            return 1;
        else
            return 0;
    },
    
    /**
     * Try to retrieve the name of a function from the object itself
     * 
     * @param {Function} funcPointer Variable next in line to be compared
     * @type  {String}
     * @deprecated
     */
    getFunctionName: function(funcPointer) {
        var regexpResult = funcPointer.toString().match(/function(\s*)(\w*)/);
        if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
            return regexpResult[2];
        }
        return 'anonymous';
    }
};

jpf.Profiler.SORT_BY_CALLS        = 1;
jpf.Profiler.SORT_BY_PERCENTAGE   = 2;
jpf.Profiler.SORT_BY_FUNCTIONNAME = 3;
jpf.Profiler.SORT_BY_OWNTIME      = 4;
jpf.Profiler.SORT_BY_AVERAGE      = 5;
jpf.Profiler.SORT_BY_MINIMUM      = 6;
jpf.Profiler.SORT_BY_MAXIMUM      = 7;

jpf.Profiler.BLACKLIST = ['initialize', 'component'];

/**
 * Transform a generic function to be Profile-able, independent of its implementation.
 *
 * @type {Function}
 */
jpf.Profiler_functionTemplate = function() {
    return function() {
        jpf.Profiler.registerStart(arguments.callee.nameSelf);
        var ret = jpf.Profiler.pointers['pointer_to_' + arguments.callee.nameSelf].apply(this, arguments);
        jpf.Profiler.registerEnd(arguments.callee.nameSelf);
        return ret;
    };
};