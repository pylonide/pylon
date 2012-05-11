return;

var fs = require('fs');
var xml = require("../../support/jsdav/support/node-o3-xml/lib/o3-xml");

var xmlNode = xml.parseFromString(fs.readFileSync(__dirname + "/skins.xml", "utf8")).documentElement;
var list = {};
var nodes = xmlNode.childNodes;

for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeType != 1) continue;
    (list[nodes[i].tagName] || (list[nodes[i].tagName] = [])).push(nodes[i].xml);
}

var str = [];
for (var prop in list) {
    fs.writeFileSync(__dirname + "/skins/" + prop + ".xml", 
        "<a:skin xmlns:a=\"http://ajax.org/2005/aml\">" + list[prop].join("\n") + "</a:skin>");
}