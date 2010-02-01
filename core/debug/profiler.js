//#ifdef __PROFILER
/**
 * $Id$
 * Profiler class
 * @class Profiler
 * @version $Rev$
 * @author Mike de Boer (mike AT javeline DOT com)
 * @private
 */
apf.profiler = {
    stackTrace     : {},    //object - keepsafe for all profiled function during a cycle
    previousStack  : null,  //object - keeping hold of the stackTrace of the previous cycle
    isRunning      : false, //bool   - TRUE when the Profiler is running a cycle
    pointers       : {},    //object - keepsafe for functions that have been decorated with a Profiler function template (for back reference)
    hasPointers    : false, //bool   - TRUE when the profiler has one or more function pointers in storage to profile
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
        var i, j, obj, objName, pName, canProbe;
        for (i = 0; i < arguments.length; i += 2) {
            if (typeof arguments[i] == "object") {
                obj = arguments[i];
                if (obj == this) //don't profile meself!
                    continue;
                if (!obj || (typeof obj['__profilerId'] != "undefined" && (!obj.prototype
                  || obj.prototype.$profilerId != obj.$profilerId))) //infinite loop detection
                    continue;
                if (obj.nodeType) //don't allow DOM interface pointers to be profiled.
                    continue;
                obj.$profilerId = this.recurDetect.push(obj) - 1;
                objName = arguments[(i + 1)];
                for (j in obj) {
                    pName = objName + "." + j;
                    canProbe = false;
                    try {
                        var tmp  = typeof obj[j];
                        canProbe = true;
                    }
                    catch(e) {}
                    if (canProbe === false)
                        continue;
                    if (typeof obj[j] == "function" && typeof obj[j]['nameSelf'] == "undefined") {
                        obj[j].nameSelf = pName;
                        this.pointers['pointer_to_' + pName] = obj[j];
                        var k, props = {};
                        for (k in obj[j]) props[k] = obj[j][k];
                        var _proto = obj[j].prototype ? obj[j].prototype : null;
                        obj[j] = Profiler_functionTemplate();
                        for (k in props) obj[j][k] = props[k];
                        if (_proto) {
                            obj[j].prototype = _proto;
                            this.init(_proto, pName + '.prototype');
                        }
                        obj[j].nameSelf = pName;
                        if (!this.hasPointers)
                            this.hasPointers = true;
                    }
                    else if (typeof obj[j] == "object") {
                        this.init(obj[j], pName);
                    }
                }
            }
        }
    },

    recurDetect : [],
    
    uniqueNumber: 0,
    /**
     * API: Wrap a function with the profiler template function to make sure
     * it is also profiled.
     *
     * @param {Function} func
     * @type {void}
     */
    wrapFunction: function(func){
        var pName = "anonymous" + this.uniqueNumber++;
        func.nameSelf = pName;
        this.pointers['pointer_to_' + pName] = func;
        
        func = Profiler_functionTemplate();
        func.nameSelf = pName;
    },

    /**
     * Do as if apf.profiler is loaded all over again with its default values,
     * except for rounding precision, the total number of runs (still valid
     * count) and the active sorting method.
     * After - memory safe - deinit, the call is passed to {@link core.profiler.method.init} with
     * the original arguments. Therefore, you should call this function exactly
     * like you call init().
     * Note : if you notice memory leakage after execution of this function,
     *        please contact us!
     * Note2: we cannot clear our collection of pointers, simply because they
     *        have been decorated with {@link Profiler_functionTemplate}.
     *        Therefore each call to reinit may yield different result, because
     *        the old stack of pointers is still active.
     *
     * @type {void}
     */
    reinit: function() {
        this.stackTrace     = {}
        this.previousStack  = null;
        this.isRunning      = false;

        this.startBusy      = this.endBusy = false;
        this.startQueue     = [];
        this.endQueue       = [];
        this.endQueueTimer  = this.startQueueTimer = null;

        this.init.apply(this, arguments);
    },

    /**
     * Returns whether the profiler is ready to run. A simple way of telling the
     * callee that one or more pointers are in memory by now.
     */
    isInitialized: function() {
        return (this.hasPointers === true);
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
                this.startQueueTimer = $setTimeout("apf.profiler.registerStart()", 200);
            }
            else {
                this.startBusy = true;
                clearTimeout(this.startQueueTimer);
                
                var todo = (this.startQueue.length) ? this.startQueue : [];
                this.startQueue = [];
                if (sName) todo.push(sName);
                
                for (var i = 0; i < todo.length; i++) {
                    if (!this.stackTrace[todo[i]]) {
                        this.stackTrace[todo[i]] = {
                            called      : 1,
                            fullName    : sName,
                            internalExec: 0,
                            executions  : [[new Date(), null]]
                        };
                    }
                    else {
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
                if (sName)
                    this.endQueue.push([sName, arguments.callee.caller.caller
                        ? arguments.callee.caller.caller.nameSelf
                        : null]);
                this.endQueueTimer = $setTimeout("apf.profiler.registerEnd()", 200);
            }
            else {
                this.endBusy = true;
                clearTimeout(this.endQueueTimer);
                
                var todo = (this.endQueue.length) ? this.endQueue : [];
                this.endQueue = [];
                
                if (sName)
                    todo.push([sName, arguments.callee.caller.caller
                        ? arguments.callee.caller.caller.nameSelf
                        : null]);

                for (var iLength, i = 0; i < todo.length; i++) {
                    iLength = this.stackTrace[todo[i][0]].executions.length - 1;
                    if (this.stackTrace[todo[i][0]].executions[iLength][1] == null) {
                        this.stackTrace[todo[i][0]].executions[iLength][1] = new Date();
                        if (todo[i][1] && this.stackTrace[todo[i][1]]) {
                            this.stackTrace[todo[i][1]].internalExec += 
                                this.stackTrace[todo[i][0]].executions[iLength][1]
                                - this.stackTrace[todo[i][0]].executions[iLength][0];
                        }
                    }
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
        delete this.stackTrace;
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
        var i, j, dur, stack, trace, callsNo;
        
        this.stackTrace.totalCalls = this.stackTrace.totalAvg = this.stackTrace.totalDur = 0;
        
        for (i in this.stackTrace) {
            if (!this.stackTrace[i].fullName) continue;

            stack = this.stackTrace[i];
            callsNo = stack.executions.length;
            stack.time = stack.max = 0;
            stack.min = Infinity;
            for (j = 0; j < stack.executions.length; j++) {
                trace = stack.executions[j];
                dur   = (trace[1] - trace[0]);
                //@fixme: is [dur < 0] --> [dur = 0] a valid assumption?
                if (isNaN(dur) || !isFinite(dur) || dur < 0) dur = 0;
                
                if (stack.max < dur)
                    stack.max = dur;
                if (stack.min > dur)
                    stack.min = dur;
                else if (stack.min == Infinity && stack.max > 0)
                    stack.min = stack.max;

                stack.time += dur;
            }
            stack.avg = stack.time / callsNo;
            stack.avg = parseFloat(((isNaN(stack.avg) || !isFinite(stack.avg)) ? 0 : stack.avg).toFixed(this.precision));
            stack.min = parseFloat(((isNaN(stack.min) || !isFinite(stack.min)) ? 0 : stack.min).toFixed(this.precision));
            stack.max = parseFloat(stack.max.toFixed(this.precision));
            
            this.stackTrace.totalCalls += callsNo;
            this.stackTrace.totalDur   += stack.time;
        }
        this.stackTrace.totalDur = parseFloat(this.stackTrace.totalDur.toFixed(this.precision));
        
        this.stackTrace.totalAvg = parseFloat(this.stackTrace.totalDur / this.stackTrace.totalCalls);
        this.stackTrace.totalAvg = parseFloat(this.stackTrace.totalAvg.toFixed(this.precision));
        
        return this.buildReport(this.stackTrace);
    },
    
    /**
     * Tranform the raw Profiler data into a nicely formatted report.
     * Right now, I only implemented an xHTML output, no XML or JSON yet.
     * @todo: add XML and/ or JSON standard output methods.
     *
     * @param {Object}  stackTrace
     * @param {Boolean} withContainer
     * @type  {String}
     */
    buildReport: function(stackTrace, withContainer) {
        if (typeof wihContainer == "undefined") withContainer = true;
        
        var out = withContainer ? ['<div id="profiler_report_' + this.runs + '">'] : [''];
        
        var row0      = '#fff';
        var row1      = '#f5f5f5';
        var funcColor = '#006400';
        var active    = "background: url(./core/debug/resources/tableHeaderSorted.gif) repeat-x top left;";

        out.push('<table border="0" style="border: 1px solid #d7d7d7; width: 100%; margin: 0 4px 0 0; padding: 0;" cellpadding="2" cellspacing="0">\
            <tr style="\
              background:#d9d9d9 url(./core/debug/resources/tableHeader.gif) repeat-x top left;\
              height: 16px;\
              cursor: hand;\
              cursor: pointer;\
            ">\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_FUNCTIONNAME ? active : ""),
                  '" rel="3" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="" width="110">Function</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_CALLS ? active : ""),
                  '" rel="1" \
                  onclick="apf.debugwin.resortResult(this);"\
                  title="Number of times function was called.">Calls</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_PERCENTAGE ? active : ""),
                  '" rel="2" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Percentage of time spent on this function.">Percentage</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_OWNTIME ? active : ""),
                  '" rel="8" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Time spent in function, excluding nested calls.">Own Time</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_TIME ? active : ""),
                  '" rel="4" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Time spent in function, including nested calls.">Time</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_AVERAGE ? active : ""),
                  '" rel="5" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Average time, including function calls.">Avg</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_MINIMUM ? active : ""),
                  '" rel="6" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Minimum time, including function calls.">Min</th>\
                <th style="\
                  border-right: 1px solid #9c9c9c;\
                  border-left: 1px solid #d9d9d9;\
                  border-bottom: 1px solid #9c9c9c;\
                  padding: 0; margin: 0;',
                  (this.sortMethod == apf.profiler.SORT_BY_MAXIMUM ? active : ""),
                  '" rel="7" \
                  onclick="apf.debugwin.resortResult(this);" \
                  title="Maximum time, including function calls.">Max</th>\
            </tr>');
        
        var rowColor, sortedStack = this.sortStack(stackTrace);
        for (var stack, i = 0; i < sortedStack.length; i++) {
            stack = stackTrace[sortedStack[i][0]];
            rowColor = (i % 2 == 0) ? row0 : row1;
            out.push('<tr style="background-color: ', rowColor, '; padding: 0; margin: 0; ">\
                    <td class="functionname" style="\
                      color: ', funcColor, ';\
                      font-family: Monaco, Courier New;\
                      font-size: 10px;\
                    ">' + stack.fullName + '</td>\
                    <td class="callscount">' + stack.executions.length + '</td>\
                    <td class="duration_percentage">' + stack.perc + '%</td>\
                    <td class="duration_owntime">' + (stack.time - stack.internalExec) + 'ms</td>\
                    <td class="duration_time">' + stack.time + 'ms</td>\
                    <td class="duration_average">' + stack.avg + 'ms</td>\
                    <td class="duration_min">' + stack.min + 'ms</td>\
                    <td class="duration_max">' + stack.max + 'ms</td>\
                </tr>');
        }
        
        out.push('</table>');
        if (withContainer)
            out.push('</div>');
        
        this.previousStack = stackTrace;
        return {
            html    : out.join(''),
            total   : stackTrace.totalCalls,
            duration: stackTrace.totalDur
        };
    },
    
    /**
     * Apply sorting to a stacktrace of a finished cycle. This function also
     * implements the calculation of percentages for each running stack.
     * The sorting order is configurable (ascending or descending).
     * Sorting methods:
     *   SORT_BY_CALLS        - number of times each function is called
     *   SORT_BY_PERCENTAGE   - relative amount of time each function call consumed, compared to the total cycle running time. DEFAULT.
     *   SORT_BY_FUNCTIONNAME - alphabetical by name of function.
     *   SORT_BY_TIME         - time it took for the function itself to finish a call, including the waits for child functions
     *   SORT_BY_AVERAGE      - time it took for a function to finish its call - including the waits for child functions - devided by the total number of calls.
     *   SORT_BY_MINIMUM      - lowest recorded time it took for a function to finish its call - including the waits for child functions.
     *   SORT_BY_MAXIMUM      - highest recorded time it took for a function to finish its call - including the waits for child functions.
     *   SORT_BY_OWNTIME      - time it took for the function itself to finish a call, excluding the waits for child functions
     *   
     * @param {Object} stackTrace to (re)sort
     * @type  {Array}
     */
    sortStack: function(stackTrace) {
        var i, stack, aSorted = [];
        
        for (i in stackTrace) {
            if (!stackTrace[i].fullName) continue;
            stack = stackTrace[i];
            stack.perc = 100 - Math.round((Math.abs(stack.time - stackTrace.totalDur) / stackTrace.totalDur) * 100);
            
            switch (this.sortMethod) {
                case apf.profiler.SORT_BY_CALLS :
                    aSorted.push([i, (stack.executions.length - 1)]);
                    break;
                default:
                case apf.profiler.SORT_BY_PERCENTAGE :
                    aSorted.push([i, stack.perc]);
                    break;
                case apf.profiler.SORT_BY_FUNCTIONNAME :
                    aSorted.push([i, stack.fullName.toLowerCase()]);
                    break;
                case apf.profiler.SORT_BY_TIME :
                    aSorted.push([i, stack.time]);
                    break;
                case apf.profiler.SORT_BY_AVERAGE :
                    aSorted.push([i, stack.avg]);
                    break;
                case apf.profiler.SORT_BY_MINIMUM :
                    aSorted.push([i, stack.min]);
                    break;
                case apf.profiler.SORT_BY_MAXIMUM :
                    aSorted.push([i, stack.max]);
                    break;
                case apf.profiler.SORT_BY_OWNTIME :
                    aSorted.push([i, (stack.time - stack.internalExec)]);
                    break;
            }
        }
        
        return aSorted.sort((this.sortMethod == apf.profiler.SORT_BY_FUNCTIONNAME)
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

apf.profiler.SORT_BY_CALLS        = 1;
apf.profiler.SORT_BY_PERCENTAGE   = 2;
apf.profiler.SORT_BY_FUNCTIONNAME = 3;
apf.profiler.SORT_BY_TIME         = 4;
apf.profiler.SORT_BY_AVERAGE      = 5;
apf.profiler.SORT_BY_MINIMUM      = 6;
apf.profiler.SORT_BY_MAXIMUM      = 7;
apf.profiler.SORT_BY_OWNTIME      = 8;

apf.profiler.BLACKLIST = {
    'apf.profiler' : 1
};

/**
 * Transform a generic function to be Profile-able, independent of its implementation.
 *
 * @type {Function}
 */
var Profiler_functionTemplate = function() {
    return function() {
        apf.profiler.registerStart(arguments.callee.nameSelf);
        var ret = apf.profiler.pointers['pointer_to_' + arguments.callee.nameSelf].apply(this, arguments);
        apf.profiler.registerEnd(arguments.callee.nameSelf);
        return ret;
    };
};
//#endif
