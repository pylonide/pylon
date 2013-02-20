define(function(require, exports, module) {
  "use strict";

  var markerResolution = require('ext/language/MarkerResolution').MarkerResolution;

  var JSResolver = function(ast){
    this.addResolutions = function(markers){
      var _self = this;
      markers.forEach(function(curMarker) {
        curMarker.resolutions = _self.getResolutions(curMarker);
      });
    };
    
    this.getResolutions = function(marker){
      var type = this.getType(marker);
      if (type){
        if (typeof this[type] === 'function'){
          return this[type](marker);
        }
      }
      return [];
    };

    this.getType = function(marker){
        var msg = marker.message;
        if (msg.indexOf("Missing semicolon") !== -1){
            return "missingSemicolon";
        }else if (msg.indexOf("Unnecessary semicolon") !== -1){
            return "unnecessarySemicolon";
        }
        return undefined;
    };

    this.unnecessarySemicolon = function(marker){
        var label = "Remove semicolon";var image = "";
        var preview = "<b>Remove unnecessary semicolon</b>";

        var appliedContent = "Not implemented";

        return [markerResolution(label,image,preview,appliedContent)];
    };
    
    this.missingSemicolon = function(marker){
        return [markerResolution("Not implemented", "", "Not implemented", "Not implemented")];
    };

  };

  exports.JSResolver = JSResolver;

});
