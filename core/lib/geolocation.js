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
 * 02110-1301 USA, or see the FSF site: socket://www.fsf.org.
 *
 */

// #ifdef __WITH_GEOLOCATION

/**
 * 
 *
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 */
apf.geolocation = (function() {
    var bb_successCallback,
        bb_errorCallback,
        bb_blackberryTimeout_id = -1,
        pub                     = {},
        provider                = null,
        cache                   = null,
        UNDEF                   = "undefined",
        UNAVAILABLE             = "Position unavailable";

    function handleBlackBerryLocationTimeout() {
        if (bb_blackberryTimeout_id!=-1)
            bb_errorCallback({message:"Timeout error", code:3});
    }

    function handleBlackBerryLocation() {
        clearTimeout(bb_blackberryTimeout_id);
        bb_blackberryTimeout_id = -1;
        if (bb_successCallback && bb_errorCallback) {
            if (blackberry.location.latitude == 0 && blackberry.location.longitude == 0) {
                //http://dev.w3.org/geo/api/spec-source.html#position_unavailable_error
                //POSITION_UNAVAILABLE (numeric value 2)
                bb_errorCallback({message: UNAVAILABLE, code: 2});
            }
            else {
                var timestamp = null;
                //only available with 4.6 and later
                //http://na.blackberry.com/eng/deliverables/8861/blackberry_location_568404_11.jsp
                if (blackberry.location.timestamp)
                    timestamp = new Date(blackberry.location.timestamp);
                bb_successCallback({
                    timestamp: timestamp,
                    coords   : {
                        latitude : blackberry.location.latitude,
                        longitude: blackberry.location.longitude
                    }
                });
            }
            //since blackberry.location.removeLocationUpdate();
            //is not working as described
            //http://na.blackberry.com/eng/deliverables/8861/blackberry_location_removeLocationUpdate_568409_11.jsp
            //the callback are set to null to indicate that the job is done
            bb_successCallback = bb_errorCallback = null;
        }
    }

    pub.getCurrentPosition = function(successCallback,errorCallback, options) {
        provider.getCurrentPosition(successCallback, errorCallback, options);
    };

    pub.init = function() {
        if (provider) return true; // already ran 'init' before
        try {
            if (typeof(geo_position_js_simulator) != UNDEF) {
                provider = geo_position_js_simulator;
            }
            else if (typeof bondi != UNDEF && typeof bondi.geolocation != UNDEF) {
                provider = bondi.geolocation;
            }
            else if (!!navigator.geolocation) {
                provider = navigator.geolocation;
                pub.getCurrentPosition = function(successCallback, errorCallback, options) {
                    function _successCallback(p) {
                        //for mozilla geode, it returns the coordinates slightly differently
                        if (typeof p.latitude != UNDEF) {
                            successCallback({
                                timestamp: p.timestamp,
                                coords   : {
                                    latitude : p.latitude,
                                    longitude: p.longitude
                                }
                            });
                        }
                        else {
                            successCallback(p);
                        }
                    }
                    provider.getCurrentPosition(_successCallback, errorCallback, options);
                    if (provider.watchCurrentPosition)
                        provider.watchCurrentPosition(_successCallback, errorCallback, options)
                };
            }
            else if (typeof window.google != UNDEF && typeof google.gears != UNDEF) {
                provider = google.gears.factory.create('beta.geolocation');
            }
            else if (typeof Mojo != UNDEF && typeof Mojo.Service.Request != "Mojo.Service.Request") {
                provider = true;
                pub.getCurrentPosition = function(successCallback, errorCallback, options) {
                    var parameters = {};
                    if (options) {
                         //http://developer.palm.com/index.php?option=com_content&view=article&id=1673#GPS-getCurrentPosition
                         if (options.enableHighAccuracy && options.enableHighAccuracy == true)
                            parameters.accuracy = 1;
                         if (options.maximumAge)
                            parameters.maximumAge = options.maximumAge;
                         if (options.responseTime) {
                            if (options.responseTime < 5)
                                parameters.responseTime = 1;
                            else if (options.responseTime < 20)
                                parameters.responseTime = 2;
                            else
                                parameters.timeout = 3;
                         }
                    }

                    new Mojo.Service.Request('palm://com.palm.location', {
                        method    : "getCurrentPosition",
                        parameters: parameters,
                        onSuccess : function(p){
                            successCallback({
                                timestamp: p.timestamp,
                                coords   : {
                                    latitude : p.latitude,
                                    longitude: p.longitude,
                                    heading  : p.heading
                                }
                            });
                        },
                        onFailure: function(e){
                            if (e.errorCode == 1)
                                errorCallback({code: 3, message: "Timeout"});
                            else if (e.errorCode == 2)
                                errorCallback({code: 2, message: UNAVAILABLE});
                            else
                                errorCallback({code: 0, message: "Unknown Error: webOS-code" + e.errorCode});
                        }
                    });
                };
            }
            else if (typeof device != UNDEF && typeof device.getServiceObject != UNDEF) {
                provider = device.getServiceObject("Service.Location", "ILocation");

                //override default method implementation
                pub.getCurrentPosition = function(successCallback, errorCallback, options) {
                    function callback(transId, eventCode, result) {
                        if (eventCode == 4) {
                            errorCallback({message: UNAVAILABLE, code: 2});
                        }
                        else {
                            //no timestamp of location given?
                            successCallback({
                                timestamp: null,
                                coords   : {
                                    latitude : result.ReturnValue.Latitude,
                                    longitude: result.ReturnValue.Longitude,
                                    altitude : result.ReturnValue.Altitude,
                                    heading  : result.ReturnValue.Heading
                                }
                            });
                        }
                    }
                    //make the call
                    provider.ILocation.GetLocation({
                        LocationInformationClass: "BasicLocationInformation"
                    }, callback);
                };
            }
            else if (typeof window.blackberry != UNDEF && blackberry.location.GPSSupported) {
                // set to autonomous mode
                if (typeof blackberry.location.setAidMode == UNDEF)
                    return false;
                blackberry.location.setAidMode(2);
                //override default method implementation
                pub.getCurrentPosition = function(successCallback, errorCallback, options) {
                    //passing over callbacks as parameter didn't work consistently
                    //in the onLocationUpdate method, thats why they have to be set
                    //outside
                    bb_successCallback = successCallback;
                    bb_errorCallback   = errorCallback;
                    //function needs to be a string according to
                    //http://www.tonybunce.com/2008/05/08/Blackberry-Browser-Amp-GPS.aspx
                    bb_blackberryTimeout_id = setTimeout("handleBlackBerryLocationTimeout()", options['timeout'] || 60000);
                    blackberry.location.onLocationUpdate("handleBlackBerryLocation()");
                    blackberry.location.refreshLocation();
                };
                provider = blackberry.location;
            }
        }
        catch (e){
            //#ifdef __DEBUG
            apf.console.error("GeoLocation error: " + e.toString());
            //#endif

            // fallback to Google API:
            provider = "google";
            pub.getCurrentPosition = function(successCallback, errorCallback, options) {
                if (cache)
                    return successCallback(cache);
                apf.include((document.location.protocol == "https:" ? "https:" : "http:")
                    + "//www.google.com/jsapi", false, null, null, function() {
                        if (typeof google == UNDEF
                          || typeof google.loader == UNDEF
                          || typeof google.loader.ClientLocation == UNDEF)
                            return errorCallback({message: UNAVAILABLE});
                        successCallback(cache = {
                            timestamp: null,
                            coords   : {
                                latitude : google.loader.ClientLocation.latitude,
                                longitude: google.loader.ClientLocation.longitude,
                                address  : google.loader.ClientLocation.address
                            }
                        });
                    });
            };
        }
        return provider != null;
    };

    return pub;
})();
//#endif
