define(function(require, exports, module) {
    // use the apf one, when apf is avaialble. Otherwise use some mocked one
    var namedColors = typeof apf !== "undefined" ? apf.color.colorshex : { "black":0, "white":16777215 };
    var namedPart = Object.keys(namedColors).join("|");
    
    var patterns = {
        rgb: "rgba?\\(\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",
        rgb_alt: "rgba?\\(\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",    
        hsl: "hsla?\\(\\s*\\b([1-2][0-9][0-9]|360|3[0-5][0-9]|[1-9][0-9]|[0-9])\\b\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)"
    };
    
    var isColor = new RegExp("(#([0-9A-Fa-f]{3,6})\\b)"
        + "|\\b(" + namedPart + ")\\b"
        + "|(" + patterns.rgb + ")"
        + "|(" + patterns.rgb_alt + ")"
        + "|(" + patterns.hsl + ")", "gi");
    
    var isRgb = new RegExp("(?:" + patterns.rgb + ")"
        + "|(?:" + patterns.rgb_alt + ")");
    
    var isHsl = new RegExp(patterns.hsl);
    
    exports = module.exports = {
        isColor: isColor,
        isRgb: isRgb,
        isHsl: isHsl
    };
});