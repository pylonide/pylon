module.exports = function setup(options, imports, register) {
  var base = require.resolve("xterm/package.json").slice(0, -13);
  imports.static.addStatics([{
    path: base + "/dist",
    mount: "/xterm"
  }, {
    path: base + "/lib/xterm.css",
    mount: "/xterm/xterm.css"
  }]);

  register(null, {
    "client.xterm": {}
  });
};