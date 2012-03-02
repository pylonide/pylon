exports.fill = function(template, replacements) {
    return template
        .replace(/<%(.+?)%>/g, function(str, m) {
            return JSON.stringify(replacements[m] || "");
        })
        .replace(/\[%(.+?)%\]/g, function(str, m) {
            return replacements[m] || "";
        }); 
};