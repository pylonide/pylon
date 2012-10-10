var panino = require("../../panino-docs/index.js");
var panda = require("panda-docs");

var buildOptions = {
  title          : "APF API",
  output         : './out',
  skin           : "./resources/templates/layout.jade",
  assets         : "./resources/assets",
  additionalObjs : "./additionalObjs.json",
  parseType      : "jsd",
  globalNS       : "apf",
  index          : "./index.md",
  splitByClass   : true,
  splitFromNS    : true,
  disableTests   : false,
  customTags     : ["baseclass", 
                        // XML stuff for Jade
                        "define", "allowchild", "action",
                        // TOC forms
                        "container", "form", "layout", "selection", "logic", "media", "parser", "additional",
                        // just ignorable rubbish
                        "inheritsElsewhere",  "apfclass"],
  linkFormat     : function (linkHtml, obj) {
                  if (linkHtml.classes && linkHtml.classes[0] == "isXML" && linkHtml.href !== undefined) {
                        linkHtml.href = linkHtml.href.replace(".html", "-element.html");
                        linkHtml.title = linkHtml.title.replace("class", "element");
                        linkHtml.text = "&lt;a:" + linkHtml.text.replace("apf.", "") + ">";
                  }

                  // fixes problem where tab links for apf global object are defined across files; keep them just in apf.html
                  if (obj && obj.name_prefix === "apf." && obj.file !== "../apf.js" 
                          && linkHtml.classes[0] && (linkHtml.classes[0] == "tabLink" || linkHtml.classes[0] == "relatedToLink")) {
                        linkHtml.href = linkHtml.href.substring(linkHtml.href.indexOf("#"));
                  }

                  return linkHtml;
                  }
};

panino.parse(["./apf_release.js"], buildOptions, function (err, ast) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  panino.render('html', ast, buildOptions, function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  buildOptions.keepOutDir = true;
  buildOptions.disableTests = false;

  buildOptions.template = "./resources/glossary/layout.jade";
  buildOptions.assets = "./resources/glossary/skins";
  buildOptions.title = "Glossary";

  /*panda.make("./manifest.json", buildOptions, function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
  });*/
});