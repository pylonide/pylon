// a literal source loader, e.g:
// require("literal:exports.hello = 'HELLO!'");
require.hubs.push(["literal:", {
  loader: function(path, parent, src_loader) {
    var compile = require.extensions['sjs'];
    var descriptor = {
      id: path,
      exports: {},
      loaded_from: '[literal string]',
      loaded_by: parent,
      required_by: {},
      require: require // XXX don't have access to makeRequire outside apollo-sys
    };
    //TODO: how much of apollo-sys-common#getNativeModule should
    // be rewritten / made available for custom loaders like this?
    // (setting require.exports, resolving async compilation, reentrant concerns etc)
    compile(path.replace(/^literal:/, ''), descriptor);
    return descriptor.exports;
  }
}]);
