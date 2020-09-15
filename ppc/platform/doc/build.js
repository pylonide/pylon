var panino = require("../../panino-docs/index.js");
var panda = require("panda-docs");

var buildOptions = {
  title          : "PPC API",
  output         : './out',
  skin           : "./resources/templates/layout.jade",
  assets         : "./resources/assets",
  additionalObjs : "./additionalObjs.json",
  parseType      : "jsd",
  globalNS       : "ppc",
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
                        "inheritsElsewhere",  "ppcclass"],
  linkFormat     : function (linkHtml, obj) {
                  if (linkHtml.classes && linkHtml.classes[0] == "isXML" && linkHtml.href !== undefined) {
                        linkHtml.href = linkHtml.href.replace(".html", "-element.html");
                        linkHtml.title = linkHtml.title.replace("class", "element");
                        linkHtml.text = "&lt;a:" + linkHtml.text.replace("ppc.", "") + ">";
                  }

                  // fixes problem where tab links for ppc global object are defined across files; keep them just in ppc.html
                  if (obj && obj.name_prefix === "ppc." && obj.file !== "../ppc.js" 
                          && linkHtml.classes[0] && (linkHtml.classes[0] == "tabLink" || linkHtml.classes[0] == "relatedToLink")) {
                        linkHtml.href = linkHtml.href.substring(linkHtml.href.indexOf("#"));
                  }

                  return linkHtml;
                  }
};

panino.parse(["./ppc_release.js"], buildOptions, function (err, ast) {
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