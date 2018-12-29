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

// #ifdef __TP_RPC_YQL

/**
 * Implementation of the Yahoo! Query Language as a module for the RPC
 * plugin of apf.teleport.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="query" protocol="yql">
 *      <a:method
 *        name        = "flickr"
 *        query       = "SELECT * FROM flickr WHERE text='{keywords}'">
 *          <a:param name="keywords"/>
 *      </a:method>
 *      <a:method
 *        name        = "weather"
 *        query       = "SELECT * FROM weather.forecast WHERE location={location}">
 *          <a:param name="location"/>
 *      </a:method>
 *  </a:rpc>
 *
 *  <a:model load="comm.flickr('bacon')" />
 * </code>
 * Remarks:
 * For more info on YQL and how to write
 * {@link http://developer.yahoo.com/yql/guide/statement_summary.html YQL statements}
 * that operate on the various, publicly available
 * {@link http://developer.yahoo.com/yql/guide/yql-opentables-chapter.html Open Data Tables},
 * please visit the {@link http://developer.yahoo.com/yql/ YQL Developer Center}.
 *
 * @addenum rpc[@protocol]:yql
 *
 * @constructor
 *
 * @inherits apf.Teleport
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @default_private
 */
apf.yql = function(){
    this.supportMulticall = false;
    this.namedArguments   = true;
    this.nocache          = false;
    this.format           = "xml";
    this.diagnostics      = true;
    this.debug            = false;

    this.$booleanProperties["diagnostics"] = true;
    this.$booleanProperties["debug"]       = true;

    this.$supportedProperties.push("diagnostics", "debug", "format");

    this.$propHandlers["format"] = function(value) {
        if (!apf.yql.FORMATS[value])
            this.format = "xml";
    };

    this.unserialize = function(str){
        return str;
    };

    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    };

    // Create message to send
    this.createMessage = function(functionName, args){
        var options = this.$methods[functionName],
            body    = "POST|PUT".indexOf(options["http-method"]) > -1 ? args.pop() : "";

        this.method = options["http-method"];
        if (options["content-type"])
            this.contentType = options["content-type"];

        this.url    = apf.yql.PUBLIC + "?q=" + encodeURIComponent(this.query)
            + "&format=" + (options.format || this.format)
            + (typeof options.callback == "string"
                ? "&callback=" + encodeURIComponent(options.callback)
                : "")
            + "&diagnostics=" + (options.diagnostics || this.diagnostics)
            + "&debug=" + (options.debug || this.debug);

        return body;
    };
};

apf.yql.PUBLIC  = "http://query.yahooapis.com/v1/public/yql";
apf.yql.PRIVATE = "http://query.yahooapis.com/v1/yql";
apf.yql.FORMATS = {"xml":1, "json":1};

// #endif
