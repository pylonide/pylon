
define(function(require, exports, module) {
"use strict";

/**
* data structure for resolutions, containing 
* a label (short description, to be displayed in the list of resolutions), 
* an image (to be displayed in the list of resolutions), 
* a preview,
* the applied content,
* the position where the cursor should be after applying
*/
var MarkerResolution = function(label, image, preview, appliedContent, cursorTarget){
    return {
        label: label,
        image: image,
        preview: preview,
        appliedContent: appliedContent,
        cursorTarget: cursorTarget
    };
};


exports.MarkerResolution = MarkerResolution;

});