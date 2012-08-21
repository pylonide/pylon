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

// #ifdef __AMLDEBUGGER || __INC_ALL
if (apf.hasRequireJS) define("apf/elements/debugger",
    ["module"], function(module) {

apf.dbg = module.exports = function(struct, tagName){
    this.$init(tagName || "debugger", apf.NODE_HIDDEN, struct);
};

(function(){

    this.$host = null;
    this.$debugger = null;

    this.autoAttachComingIn = false;

    this.$supportedProperties.push("state-running", "state-attached",
        "model-sources", "model-stacks", "model-breakpoints", "activeframe");

    this.$createModelPropHandler = function(name, xml, callback) {
        return function(value) {
            if (!value) return;
            //#ifdef __WITH_NAMESERVER
            this[name] = apf.setReference(value,
                apf.nameserver.register("model", value, new apf.model()));

            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].load(xml);
            //#endif
        }
    };

    this.$createStatePropHandler = function(name) {
        return function(value) {
            if (!value) return;
            //#ifdef __WITH_NAMESERVER
            this[name] = apf.setReference(value,
                    apf.nameserver.register("state", value, new apf.state()));

            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].deactivate();
            //#endif
        }
    };

    this.$propHandlers["model-sources"] = this.$createModelPropHandler("$mdlSources", "<sources />");
    this.$propHandlers["model-stack"] = this.$createModelPropHandler("$mdlStack", "<frames />");
    this.$propHandlers["model-breakpoints"] = this.$createModelPropHandler("$mdlBreakpoints", "<breakpoints />");

    this.$propHandlers["state-running"] = this.$createStatePropHandler("$stRunning");
    this.$propHandlers["state-attached"] = this.$createStatePropHandler("$stAttached");

    this.$propHandlers["activeframe"] = function(value) {
        if (this.$debugger) {
            this.$ignoreFrameEvent = true;
            this.$debugger.setFrame(value);
            this.$ignoreFrameEvent = false;
        }
        
        // if we have a frame, emit a break event
        if (value) {
            this.dispatchEvent("break", {
                column: Number(value.getAttribute("column")),
                line: Number(value.getAttribute("line")),
                script: value.getAttribute("script")
            });
        }
        
        this.dispatchEvent("changeframe", {data: value});
    };

    /**
     * If you are auto attaching, please announce yourself here
     */
    this.registerAutoAttach = function () {
        this.autoAttachComingIn = true;
    };

    /**
     * Manual click on the run button?
     * Youll get special behavior!
     */
    this.registerManualAttach = function () {
        this.autoAttachComingIn = false;
    };

    /**
     * Attach the debugger to the IDE
     */
    this.attach = function(host, tab) {
        var _self = this;

        host.$attach(this, tab, function(err, dbgImpl) {
            if (err) {
                return console.error("Attaching console failed", err);
            }
            
            _self.$host = host;
            _self.$debugger = dbgImpl;
            
            // do some stuff after attaching and get the currently active frame
            var afterAttachStep = function (callback) {
                // load something?
                _self.$loadSources(function() {
                    // sync the breakpoints that we have in the IDE with the server
                    dbgImpl.setBreakpoints(_self.$mdlBreakpoints, function() {
                        // do a backtrace
                        var backtraceModel = new apf.model();
                        backtraceModel.load("<frames></frames>");
    
                        // and if we find something
                        _self.$debugger.backtrace(backtraceModel, function() {
                            var frame = backtraceModel.queryNode("frame[1]");
                        
                            // send some info about the current frame in the callback
                            callback(frame, backtraceModel);
                        });
                    });
                });
            };
            
            // register regular break and changeRunning events
            var registerEvents = function () {
                dbgImpl.addEventListener("break", _self.$onBreak.bind(_self));
                dbgImpl.addEventListener("changeRunning", _self.$onChangeRunning.bind(_self));
            };
            
            // function called when we're doing an attach to a new process we just started
            var newProcess = function () {
                // the node.js debugger works that we need to wait for the
                // first breakpoint to be hit, this probably works differently
                // for other sources, but we'll see about that
                var onFirstBreak = function (ev) {
                    afterAttachStep(function (frame, stackModel) {
                        var hasBreakpointOnThisFrame = _self.$allowAttaching(frame);
                        if (hasBreakpointOnThisFrame) {
                            // the line we broke on has an actual breakpoint
                            // so let's break on it then
                            _self.$onBreak(ev, stackModel);
                            // and call the changeRunning as well
                            _self.$onChangeRunning();
                        }
                        else {
                            // otherwise step to the next breakpoint
                            _self.continueScript();
                        }

                        // add the actual listeners for changeRunning & break
                        registerEvents();
                    });
                };
                onFirstBreak();
            };
            
            // re-attach to an already running process
            var existingProcess = function () {
                afterAttachStep(function (frame, stackModel) {
                    // send out a break statement for this frame
                    if (frame) {
                        _self.$onBreak({
                            data: {
                                sourceColumn: Number(frame.getAttribute("column")),
                                sourceLine: Number(frame.getAttribute("line")),
                                script: {
                                    name: frame.getAttribute("script")
                                }
                            }
                        }, stackModel);
                        
                        // make sure we register break events and such
                        registerEvents();
                    }
                });
            };
            
            // depending on this flag we'll call either of these functions
            if (_self.autoAttachComingIn) {
                existingProcess();
            }
            else {
                newProcess();
            }
            
            // afterCompile and detach handlers are perfectly fine here
            dbgImpl.addEventListener("afterCompile", _self.$onAfterCompile.bind(_self));                            
            dbgImpl.addEventListener("detach", _self.$onDetach.bind(_self));
        });

    };
    
    this.$attachFreshProcess = function () {
        
    };

    this.$allowAttaching = function (frame) {
        var _self = this;

        if (this.autoAttachComingIn) return true;

        if (frame) {
            var scriptId = frame.getAttribute("scriptid");
            var scriptName = _self.$mdlSources.queryValue("file[@scriptid='" + scriptId + "']/@scriptname");

            if (scriptName) {
                var line = frame.getAttribute("line");
                var bp = _self.$mdlBreakpoints.queryNode("breakpoint[@script='" + scriptName + "' and @line='" + line + "']");
            }
            if (!scriptName || !bp) {
               return false;
            }

            return true;
        }

        return false;
    };

    this.$onChangeRunning = function() {
        var isRunning = this.$debugger && this.$debugger.isRunning();
        this.$stRunning.setProperty("active", isRunning);
    };

    this.$onBreak = function(e, stackModel) {
        var _self = this;
        
        var script = e.data.script.name;
        if (e.currentTarget && e.currentTarget.stripPrefix) {
            script = script.indexOf(e.currentTarget.stripPrefix) === 0 ?
                script.substr(e.currentTarget.stripPrefix) :
                script;
        }
        
        var emit = function () {
            _self.setProperty("activeframe", _self.$mdlStack.queryNode("frame[1]"));
            // the active frame change will call the break itself
        };
        
        // if we've got the model passed in, it's fine
        if (stackModel) {
            _self.$mdlStack.load(stackModel.data.xml);
            emit();
        }
        // otherwise do a backtrace first
        else {
            _self.$debugger.backtrace(_self.$mdlStack, function () {
                emit();
            });
        }
    };

    this.$updateMarkerPrerequisite = function () {
        return this.activeframe;
    };
    
    this.$onAfterCompile = function(e) {
        var id = e.script.getAttribute("id");
        var oldNode = this.$mdlSources.queryNode("//file[@id='" + id + "']");
        if (oldNode)
            this.$mdlSources.removeXml(oldNode);
        this.$mdlSources.appendXml(e.script);
    };

    this.$onDetach = function() {
        var _self = this;

        if (this.$debugger) {
            // destroy doesnt destroy the event listeners
            // so do that by hand
            Object.keys(_self.$debugger.$eventsStack).forEach(function (evname) {
                _self.$debugger.$eventsStack[evname].forEach(function (fn) {
                    _self.$debugger.removeEventListener(evname, fn);
                });
            });

            this.$debugger.destroy();
            this.$debugger = null;
        }

        this.$host = null;

        this.$mdlSources.load("<sources />");
        this.$mdlStack.load("<frames />");
        this.$stAttached.deactivate();
        this.setProperty("activeframe", null);
    };

    this.$onChangeFrame = function() {
        if (!this.$ignoreFrameEvent) {
            this.setProperty("activeframe", this.$debugger.getActiveFrame());
        }
    };

    this.changeFrame = function(frame) {
        this.$debugger.setFrame(frame);
    };

    this.detach = function(callback) {
        var _self = this;

        this.continueScript();
        if (this.$host) {
            this.$host.$detach(this.$debugger, function () {
                if (typeof callback === "function")
                    callback();


                // always detach, so we won't get into limbo state
                _self.$onDetach();
            });
        }
        else {
            this.$onDetach();
        }
    };

    this.$loadSources = function(callback) {
        this.$debugger.scripts(this.$mdlSources, callback);
    };

    this.loadScript = function(script, callback) {
        this.$debugger.loadScript(script, callback);
    };

    this.loadObjects = function(item, callback) {
        this.$debugger.loadObjects(item, callback);
    };

    this.loadFrame = function(frame, callback) {
        this.$debugger.loadFrame(frame, callback);
    };

    this.toggleBreakpoint = function(script, row, content) {
        var model = this.$mdlBreakpoints;
        if (this.$debugger) {
            this.$debugger.toggleBreakpoint(script, row, model, content);
        }
        else {
            var scriptName = script.getAttribute("scriptname");
            var bp = model.queryNode("breakpoint[@script='" + scriptName
                + "' and @line='" + row + "']");
            if (bp) {
                apf.xmldb.removeNode(bp);
            }
            else {
                // filename is something like blah/blah/workspace/realdir/file
                // we are only interested in the part after workspace for display purposes
                var tofind = "/workspace/";
                var path = script.getAttribute("path");
                var displayText = path;
                if (path.indexOf(tofind) > -1) {
                    displayText = path.substring(path.indexOf(tofind) + tofind.length);
                }

                var bp = apf.n("<breakpoint/>")
                    .attr("script", scriptName)
                    .attr("line", row)
                    .attr("text", displayText + ":" + (parseInt(row, 10) + 1))
                    .attr("lineoffset", 0)
                    .attr("content", content)
                    .attr("enabled", "true")
                    .node();
                model.appendXml(bp);
            }
        }
    };

    this.setBreakPointEnabled = function(node, value){
        if (this.$debugger) {
            this.$debugger.setBreakPointEnabled(node, value);
        }
        else {
            node.setAttribute("enabled", value ? true : false);
        }
    },

    this.continueScript = function(callback) {
        this.dispatchEvent("beforecontinue");

        if (this.$debugger)
            this.$debugger.continueScript(callback);
        else
            callback && callback();
    };

    this.stepInto = function() {
        this.dispatchEvent("beforecontinue");

        this.$debugger && this.$debugger.stepInto();
    };

    this.stepNext = function() {
        this.dispatchEvent("beforecontinue");

        this.$debugger && this.$debugger.stepNext();
    };

    this.stepOut = function() {
        this.dispatchEvent("beforecontinue");

        this.$debugger && this.$debugger.stepOut();
    };

    this.suspend = function() {
        this.$debugger && this.$debugger.suspend();
    };

    this.evaluate = function(expression, frame, global, disableBreak, callback){
        this.$debugger && this.$debugger.evaluate(expression, frame, global, disableBreak, callback);
    };

    this.changeLive = function(scriptId, newSource, previewOnly, callback) {
        this.$debugger && this.$debugger.changeLive(scriptId, newSource, previewOnly, callback);
    };

}).call(apf.dbg.prototype = new apf.AmlElement());

apf.aml.setElement("debugger", apf.dbg);


window.adbg = {
    exec : function(method, args, callback, options) {
         if (method == "loadScript") {
             var dbg = args[0];
             var script = args[1];
             dbg.loadScript(script, function(source) {
                 if (options && options.callback) {
                     options.callback(apf.escapeXML(source), apf.SUCCESS);
                 } else {
//                     callback("<file>" + apf.escapeXML(source) + "</file>", apf.SUCCESS);
                     //TODO: ugly text() bug workaround
                     callback("<file><![CDATA[" + source.replace("]]>", "]] >") + "]]></file>", apf.SUCCESS);
                 }
             });
         }
         else if (method == "loadObjects") {
             var dbg = args[0];
             var item = args[1];

             dbg.loadObjects(item, function(xml) {
                 if (options && options.callback) {
                     options.callback(xml, apf.SUCCESS);
                 } else {
                     callback(xml, apf.SUCCESS);
                 }
             });
         }
         else if (method == "loadFrame") {
             var dbg = args[0];
             var frame = args[1];

             dbg.loadFrame(frame, function(xml) {
                 if (options && options.callback) {
                     options.callback(xml, apf.SUCCESS);
                 } else {
                     callback(xml, apf.SUCCESS);
                 }
             });
         }
     }
 };

(apf.$asyncObjects || (apf.$asyncObjects = {}))["adbg"] = 1;

});
// #endif
