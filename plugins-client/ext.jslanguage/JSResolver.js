define(function(require, exports, module) {
  "use strict";

  var markerResolution = require('ext/language/MarkerResolution').MarkerResolution;

  var JSResolver = function(value, ast){
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
        } else if (msg.indexOf("Unnecessary semicolon") !== -1){
            return "unnecessarySemicolon";
        }
    }; 
    
    this.missingSemicolon = function(marker){
        console.log(marker.pos);
        var label = "Add semicolon";
        var image = "";
        
        var lines = value.split("\n");
        var before = lines[marker.pos.sl].substring(0, marker.pos.sc);
        var after = lines[marker.pos.sl].substring(marker.pos.sc);
        lines[marker.pos.sl] = before + "; " + after;
        var preview = "<b>Add semicolon</b><p>" + before + "<b>; </b>" + after + "</p>";
        var appliedContent = lines.join("\n");
        
        return [markerResolution(label, image, preview, appliedContent)];
    }; 
    
    this.unnecessarySemicolon = function(marker){
        console.log(marker.pos);
        var label = "Remove semicolon";
        var image = "";
        
        var lines = value.split("\n");
        var before = lines[marker.pos.sl].substring(0, marker.pos.sc);
        var after = lines[marker.pos.sl].substring(marker.pos.sc + 1);
        lines[marker.pos.sl] = before + after;
        var preview = "<b>Remove semicolon</b><p>" + before + "<del>;</del>" + after + "</p>";
        var appliedContent = lines.join("\n");
        
        return [markerResolution(label, image, preview, appliedContent)];
    };

  };

  exports.JSResolver = JSResolver;

});
