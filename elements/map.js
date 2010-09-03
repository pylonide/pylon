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

// #ifdef __AMLMAP || __INC_ALL

/**
 * Element displaying a Google Map with all option customizable through attributes
 *
 * @constructor
 * @define map
 * @addnode elements
 *
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 * @inherits apf.XForms
 *
 * @attribute {Number}  latitude          geographical coordinate
 * @attribute {Number}  longitude         geographical coordinate
 * @attribute {mixed}   maptypecontrol    defines the if a MapType control should
 *                                        be visible and what its position and style should be.
 *                                        The value may be either 'false' (no control)
 *                                        or of the following form:
 *                                        'position:bottom-left,style:dropdown'
 *                                        Style options: 'dropdown', 'bar'
 * @attribute {mixed}   navigationcontrol defines the if a Navigation control should
 *                                        be visible and what its position and style should be.
 *                                        The value may be either 'false' (no control)
 *                                        or of the following form:
 *                                        'position:bottom-left,style:zoompan'
 *                                        Style options: 'android', 'small' or 'zoompan'
 * @attribute {mixed}   scalecontrol      defines the if a Navigation control should
 *                                        be visible and what its position and style should be.
 *                                        The value may be either 'false' (no control)
 *                                        or of the following form:
 *                                        'position:bottom-left,style:default'
 *                                        Style options: 'default' only.
 * @attribute {String}  type              the type of map that should be rendered.
 *                                        Possible values: 'hybrid', 'roadmap', 'satellite', 'terrain'
 * @attribute {Number}  zoom              The zoomlevel of the map.
 *                                        Value may vary between 1..100
 * @attribute {String}  marker            if set, a marker will be placed on the map
 *                                        at the current location (or once a location
 *                                        is specified) with the value as its title.
 * @attribute {Boolean} loaded            if the javascript libraries from Google
 *                                        have been loaded and the map is drawn, this
 *                                        attribute has the value 'true'
 *
 * @event loaded Fires after the the javascript libraries from Google have been loaded and the map is drawn
 */
apf.map = function(struct, tagName){
    this.$init(tagName || "map", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        // #ifdef __WITH_DATABINDING
        apf.StandardBinding
        // #endif
        //#ifdef __WITH_DATAACTION
        ,apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
       // ,apf.XForms
        //#endif
    );
    //Options
    this.$focussable           = true; // This object can get the focus
    this.$hasMaptypeControl    = true;
    this.$hasNavigationControl = true;
    this.$hasScaleControl      = true;
    this.$mapTypeControl       = {};
    this.$navigationControl    = {};
    this.$scaleControl         = {};
    this.$markers              = {};
    this.$map                  = null;

    // for property specs, see: http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions
    this.$booleanProperties["draggable"] = true;
    this.$booleanProperties["loaded"]    = true;
    this.$supportedProperties.push("latitude", "longitude", "bgcolor", "draggable",
        "maptypecontrol", "navigationcontrol", "scalecontrol", "type", "zoom", 
        "marker", "marker-icon", "loaded");
    // default values:
    this.latitude              = 0;
    this.longitude             = 0;
    this.bgcolor               = null;
    this.draggable             = true;
    this.maptypecontrol        = true;
    this.navigationcontrol     = true;
    this.scalecontrol          = true;
    this.type                  = null;
    this.zoom                  = 9;
    this.loaded                = false;

    var timer, deltimer, lastpos,
        delegates = [],
        _slice    = Array.prototype.slice,
        loaddone  = false;

    this.$propHandlers["latitude"]  =
    this.$propHandlers["longitude"] = function(value, prop) {
        if (!value) return;
        clearTimeout(timer);
        this[prop] = parseFloat(value);
        var _self = this;
        timer = setTimeout(function() {
            _self.setValue(_self.latitude, _self.longitude);
        });
    };

    function delegate2(func, args) {
        var _self = this;
        $setTimeout(function() {
            delegate.call(_self, func, args);
        });
    }

    function delegate(func, args) {
        clearTimeout(deltimer);
        args = _slice.call(args);
        var i = delegates.indexOf(func),
            l = args.length;
        if (i > -1) {
            if (l && args[0])
                delegates[i].$__args = args;
            return;
        }
        if (!l || !args[0]) return;
        func.$__args = args;
        if (i === -1)
            delegates.push(func);
    }

    function callDelegates() {
        clearTimeout(deltimer);
        if (!loaddone) {
            var _self = this;
            deltimer = $setTimeout(function() {callDelegates.call(_self)}, 1000);
            return;
        }
        var d,
            i = 0,
            l = delegates.length;
        if (!l) return;
        for (; i < l; ++i) {
            if (typeof (d = delegates[i]) != "function") continue;
            d.apply(this, d.$__args);
            delete d.$__args;
        }
        delegates = [];
    }

    function parseOptions(sOpts) {
        sOpts = sOpts || "";
        var t,
            aOpts = sOpts.splitSafe(",|;"),
            oOpts = {},
            i     = 0,
            l     = aOpts.length;
        for (; i < l; ++i) {
            if (!aOpts[i]) continue;
            t = aOpts[i].splitSafe(":|=");
            if (t.length != 2) continue;
            oOpts[t[0]] = typeof t[1] == "string" ? t[1].toLowerCase() : t[1];
        }
        return oOpts;
    }

    this.$propHandlers["maptypecontrol"] = function(value) {
        this.maptypecontrol  = !apf.isFalse(value);
        this.$mapTypeControl = {};
        if (!this.maptypecontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.MapTypeControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "TOP_RIGHT";
            this.$mapTypeControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                case "dropdown":
                    this.$mapTypeControl.style = oStyle.DROPDOWN_MENU;
                    break;
                case "bar":
                    this.$mapTypeControl.style = oStyle.HORIZONTAL_BAR;
                    break;
                default:
                case "default":
                    this.$mapTypeControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            mapTypeControl       : this.maptypecontrol,
            mapTypeControlOptions: this.$mapTypeControl
        });
    };

    this.$propHandlers["navigationcontrol"] = function(value) {
        this.navigationcontrol  = !apf.isFalse(value);
        this.$navigationControl = {};
        if (!this.navigationcontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.NavigationControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "TOP_LEFT";
            this.$navigationControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                case "android":
                    this.$navigationControl.style = oStyle.ANDROID;
                    break;
                case "small":
                    this.$navigationControl.style = oStyle.SMALL;
                    break;
                case "zoompan":
                    this.$navigationControl.style = oStyle.ZOOM_PAN;
                    break;
                default:
                case "default":
                    this.$navigationControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            navigationControl       : this.navigationcontrol,
            navigationControlOptions: this.$navigationControl
        });
    };

    this.$propHandlers["scalecontrol"] = function(value) {
        this.scalecontrol  = !apf.isFalse(value);
        this.$scaleControl = {};
        if (!this.scalecontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.ScaleControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "BOTTOM_LEFT";
            this.$scaleControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                default:
                case "default":
                    this.$scaleControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            scaleControl       : this.scalecontrol,
            scaleControlOptions: this.$scaleControl
        });
    };

    this.$propHandlers["type"] = function(value) {
        if (!value) return;
        if (loaddone)
            this.type = google.maps.MapTypeId[value.toUpperCase()];
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        this.$map.setMapTypeId(this.type);
    };

    this.$propHandlers["zoom"] = function(value) {
        this.zoom = parseInt(value);
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setZoom(this.zoom);
    };

    this.$propHandlers["marker"] = function(value) {
        this.addMarker(value);
    };

    // PUBLIC METHODS
    /**
     * Sets the geographical coordinates and centers the map on it.
     * If no coordinates are passed as arguments, the current values of the
     * latitude and longitude attributes are used.
     *
     * @param {Number} lat geographical coordinate latitude
     * @param {Number} lon geographical coordinate longitude
     * @type  {void}
     */
    this.setValue = function(lat, lon){
        if (!lat || !lon) return;
        if (!loaddone)
            return delegate.call(this, arguments.callee, arguments);
        if (lat)
            this.latitude  = parseFloat(lat);
        if (lon)
            this.longitude = parseFloat(lon);
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        lastpos = new google.maps.LatLng(this.latitude, this.longitude);
        this.$map.setCenter(lastpos);
        var _self = this;
        $setTimeout(function() {
            callDelegates.call(_self);
        });
    };

    /**
     * Retrieves the current geographical coordinates as displayed by the map.
     * The returned object has the following structure: 
     * <code>
     * {
     *     latitude:  [number between -90 and 90 degrees],
     *     longitude: [number between -180 and 180 degrees]
     * }
     * </code>
     * 
     * @type {Object}
     */
    this.getValue = function(){
        return {
            latitude : this.latitude,
            longitude: this.longitude
        };
    };

    var addressParts = {
        "street_number": 1,
        "route": 1,
        "sublocality": 1,
        "locality": 1,
        "administrative_area_level_1": 1,
        "country": 1,
        "postal_code": 1
    };

    function parseAddress(addr) {
        var o, k, m,
            i   = 0,
            l   = addr.address_components.length,
            res = {};
        for (; i < l; ++i) {
            o = addr.address_components[i];
            for (k = 0, m = o.types.length; k < m; ++k) {
                if (!addressParts[o.types[k]]) continue;
                res[o.types[k]] = {
                    long_name  : o.long_name,
                    short_name : o.short_name
                };
            }
        }
        return res;
    }

    /**
     * Retrieves the current location by reverse geocoding the geographical
     * coordinates as displayed by the map. You may also pass in a different set
     * of coordinates.
     * Since the reverse geocoding process is asynchronous, a callback is required
     * to pass the result, because it cannot be returned directly.
     * The object that is passed to the callback has the following structure:
     * <code>
     * {
     *     "street_number":{"long_name":"241","short_name":"241"},
     *     "route":{"long_name":"Keizersgracht","short_name":"Keizersgracht"},
     *     "sublocality":{"long_name":"Amsterdam","short_name":"Amsterdam"},
     *     "locality":{"long_name":"Amsterdam","short_name":"Amsterdam"},
     *     "administrative_area_level_1":{"long_name":"North Holland","short_name":"North Holland"},
     *     "country":{"long_name":"The Netherlands","short_name":"NL"},
     *     "postal_code":{"long_name":"1016","short_name":"1016"}
     * }
     * </code>
     * 
     * @type {void}
     */
    this.getLocation = function(cb, coords) {
        if (!loaddone)
            return delegate.call(this, arguments.callee, arguments);
        if (!this.$geo)
            this.$geo = new google.maps.Geocoder();
        var pos = lastpos;
        if (coords && coords.latitude && coords.longitude)
            pos = new google.maps.LatLng(coords.latitude, coords.longitude);
        if (!pos)
            return cb(null);
        this.$geo.geocode({location: pos}, function(res, st) {
            if (st != google.maps.GeocoderStatus.OK)
                return cb(null);
            cb(parseAddress(res[0]));
        });
    };

    function getFunctionPointer(name) {
        var i,
            p     = self,
            aName = name.splitSafe("\."),
            sFunc = aName.pop();
        while (p[i = aName.shift()])
            p = p[i];
        return p[sFunc] || apf.K;
    }

    function markerExists(lat, lon) {
        for (var loc in this.$markers) {
            if (loc[0] == lat && loc[1] == lon)
                return this.$markers[loc];
        }
        return false;
    }

    /**
     * Adds a marker on a specific geographical location, optionally with an 
     * information window attached to it with arbitrary HTML as its content.
     * 
     * @param {String} [title]   title of the marker. Defaults to 'Marker'
     * @param {String} [content] content of the information window. If not set, 
     *                           no information window is created and attached to 
     *                           the marker.
     * @param {Object} [coords]  geographical coordinates to drop the marker at.
     *                           Format: {latitude: x, longitude: y}
     */
    this.addMarker = function(title, content, coords) {
        if (!this.$map) {
            delegate2.call(this, arguments.callee, arguments);
            return false;
        }
        var pos = lastpos;
        if (coords && coords.latitude && coords.longitude)
            pos = new google.maps.LatLng(coords.latitude, coords.longitude);
        if (!pos) {
            delegate2.call(this, arguments.callee, arguments);
            return false;
        }

        if (this["marker-icon"] && !this.$markerIcon)
            this.$markerIcon = new apf.url(this["marker-icon"]).uri;

        var lat    = pos.lat(),
            lon    = pos.lng(),
            marker = markerExists(lat, lon);
        if (!marker) {
            marker = this.$markers[[lat, lon]] = new google.maps.Marker({
                position: pos,
                map     : this.$map,
                title   : title || "Marker",
                icon    : this.$markerIcon || null
            });
        }

        if (!content)
            return marker;

        if (marker.infowindow) {
            marker.infowindow.setContent(content);
        }
        else {
            var _self = this;
            marker.infowindow = new google.maps.InfoWindow({
                content: content
            });
            google.maps.event.addListener(marker, "click", function() {
                marker.infowindow.open(_self.$map, marker);
            });
        }
        
        return marker;
    };

    this.removeMarker = function(coords) {
        if (!this.$map)
            return delegate2.call(this, arguments.callee, arguments);
        var pos = lastpos;
        if (coords && coords.latitude && coords.longitude)
            pos = new google.maps.LatLng(coords.latitude, coords.longitude);
        if (!pos)
            return delegate2.call(this, arguments.callee, arguments);

        var lat = pos.lat(),
            lon = pos.lng();
        for (var i in this.$markers) {
            if (i[0] !== lat || i[1] !== lon) continue;
            this.$markers[i].setMap(null); //this removes the marker from the map
            if (this.$markers[i].infowindow) {
                // remove the infowindow from the DOM
                this.$markers[i].infowindow.close();
                delete this.$markers[i].infowindow;
            }
            delete this.$markers[i];
            break;
        }
    };

    this.$draw = function(){
        if (!this.$ext) {
            var doc = this.$pHtmlNode.ownerDocument;
            this.$ext = this.$pHtmlNode.appendChild(doc.createElement("div"));
            this.$ext.className = this.localName;
        }

        if (!loaddone) return;

        callDelegates.call(this);

        this.$map = new google.maps.Map(this.$ext, {
            zoom                    : this.zoom,
            mapTypeControl          : this.maptypecontrol,
            mapTypeControlOptions   : this.$mapTypeControl,
            navigationControl       : this.navigationcontrol,
            navigationControlOptions: this.$navigationControl,
            scaleControl            : this.scalecontrol,
            scaleControlOptions     : this.$scaleControl,
            mapTypeId               : this.type || google.maps.MapTypeId.HYBRID
        });

        var _self = this;
        $setTimeout(function() {
            callDelegates.call(_self);

            _self.setProperty("loaded", true);
            _self.dispatchEvent("loaded");
        });
    };

    this.$destroy = function(){
        if (this.$map) {
            var div = this.$map.getDiv();
            div.parentNode.removeChild(div);
            delete this.$map;
        }
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        // include Map scripts:
        //<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=true"></script>
        //<script src="http://code.google.com/apis/gears/gears_init.js" type="text/javascript" charset="utf-8"></script>
        var _self   = this;
        function loaded() {
            loaddone = true;

            if (apf.window.vManager.check(_self, "map", _self.$draw))
                _self.$draw();
            
            try{
                delete self.google_maps_initialize;
            }
            catch(e){}
        }
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            self.google_maps_initialize = function() {
                loaded();
            };
            var head   = document.getElementsByTagName("head")[0],
                script = document.createElement("script");
            script.type = "text/javascript";
            script.src  = "http://maps.google.com/maps/api/js?sensor=true&callback=google_maps_initialize";

            document.body.appendChild(script);
            //apf.include("http://code.google.com/apis/gears/gears_init.js", false, null, null, loaded);
        }
        else {
            loaded();
        }
    });
}).call(apf.map.prototype = new apf.GuiElement());

apf.aml.setElement("map", apf.map);

// #endif
