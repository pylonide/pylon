var panino = require("doc/panino");

var buildOptions = {
	parseOptions: "./doc/parseOptions.json",
	additionalObjs: "./doc/additionalObjs.json",
  output: "./doc/out",
  title: "APF API Documentation",
  skin: "././doc/resources/templates/layout.jade",
  split: true
}

panino.parse(["./tests/prototype"], buildOptions, function (err, ast) {
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
});