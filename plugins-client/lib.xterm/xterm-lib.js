module.exports = function setup(options, imports, register) {
  var libBase = require.resolve("xterm/package.json").slice(0, -13);
  var fitBase = require.resolve("xterm-addon-fit/package.json").slice(0, -13);
  imports.static.addStatics([{
    path: libBase + "/lib",
    mount: "/xterm"
  },
  {
    path: libBase + "/css/xterm.css",
    mount: "/xterm/xterm.css"
  },
  {
    path: fitBase + "/lib",
    mount: "/xterm-fit"
  }]);

  register(null, {
    "client.xterm": {}
  });
};
