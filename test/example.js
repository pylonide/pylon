//core/lub/util/xml.js
var div1 = document.createElement("div"),
    div2 = document.createElement("div"),
    div3 = document.createElement("div");
div1.appendChild(div3);

var xml1 = apf.getXml("<lang></lang>"),
    xml2 = apf.getXml("<polish></polish>"),
    xml3 = apf.getXml("<english></english>");

/*apf.onload = function() {
  alert("ok");
}*/

test("isChildOf()", function() {
    equals(typeof apf.isChildOf(div1, div2, true), "boolean");
    equals(typeof apf.isChildOf(div1, div3, true), "boolean");
    equals(typeof apf.isChildOf(div1, document.body, true), "boolean");
    equals(typeof apf.isChildOf(document.body, div1, true), "boolean");
    equals(typeof apf.isChildOf(div1, document.body, false), "boolean");
    equals(typeof apf.isChildOf(document.body, div1, false), "boolean");

});

test("isOnlyChild()", function() {
    equals(typeof apf.isOnlyChild(div1, div2), "boolean");
    //equals(typeof apf.isOnlyChild(null, undefined), "boolean");
    //equals(typeof apf.isOnlyChild(undefined, undefined), "boolean");
    equals(typeof apf.isOnlyChild(div1, [1, 2, 3]), "boolean");
    equals(typeof apf.isOnlyChild(div1, []), "boolean");
});

test("mergeXml()", function() {
    equals(typeof apf.mergeXml(xml1, xml2), "object");
});

test("setNodeValue()", function() {
    apf.setNodeValue(xml2, 666);
    equals(666, apf.queryValue(xml2));

    xml1.appendChild(xml3);
    apf.flow.alert_r(xml1);
    apf.setQueryValue(xml1, "lang/english", 668);
    equals(668, apf.queryValue(xml1));
});
