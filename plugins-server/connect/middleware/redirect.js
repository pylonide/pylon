/**
 * The redirect middleware has been built based on Express (MIT Licensed)
 * https://github.com/expressjs/express/blob/3d10279826f59bf68e28995ce423f7bc4d2f11cf/lib/response.js
 */
 
var encodeUrl = require("encodeurl");
var accepts = require("accepts");
var vary = require('vary');
var mime = require('send').mime;
var escapeHtml = require('escape-html');
var statuses = require('statuses');

var charsetRegExp = /;\s*charset\s*=/;

var normalizeType = function(type){
  return ~type.indexOf('/')
    ? acceptParams(type)
    : { value: mime.lookup(type), params: {} };
};

var normalizeTypes = function(types){
  var ret = [];

  for (var i = 0; i < types.length; ++i) {
    ret.push(normalizeType(types[i]));
  }

  return ret;
};

module.exports = function redirect(){
  return function redirect(req, res, next){
    if (!res.redirect) {
      req.accepts = function(){
        var accept = accepts(this);
        return accept.types.apply(accept, arguments);
      };

      res.get = function(field){
        return this.getHeader(field);
      };

      res.set =
      res.header = function header(field, val) {
        if (arguments.length === 2) {
          var value = Array.isArray(val)
            ? val.map(String)
            : String(val);

          // add charset to content-type
          if (field.toLowerCase() === 'content-type') {
            if (Array.isArray(value)) {
              throw new TypeError('Content-Type cannot be set to an Array');
            }
            if (!charsetRegExp.test(value)) {
              var charset = mime.charsets.lookup(value.split(';')[0]);
              if (charset) value += '; charset=' + charset.toLowerCase();
            }
          }

          this.setHeader(field, value);
        } else {
          for (var key in field) {
            this.set(key, field[key]);
          }
        }
        return this;
      };

      res.vary = function(field){
        // checks for back-compat
        if (!field || (Array.isArray(field) && !field.length)) {
          deprecate('res.vary(): Provide a field name');
          return this;
        }
      
        vary(this, field);
      
        return this;
      };

      res.format = function(obj){
        var fn = obj.default;
        if (fn) delete obj.default;
        var keys = Object.keys(obj);
      
        var key = keys.length > 0
          ? req.accepts(keys)
          : false;
      
        this.vary("Accept");
      
        if (key) {
          this.set('Content-Type', normalizeType(key).value);
          obj[key](req, this, next);
        } else if (fn) {
          fn();
        } else {
          var err = new Error('Not Acceptable');
          err.status = err.statusCode = 406;
          err.types = normalizeTypes(keys).map(function(o){ return o.value });
          next(err);
        }
      
        return this;
      };

      res.location = function location(url) {
        var loc = url;
      
        // "back" is an alias for the referrer
        if (url === 'back') {
          loc = this.req.get('Referrer') || '/';
        }
      
        // set location
        return this.set('Location', encodeUrl(loc));
      };

      res.redirect = function redirect(url) {
        var address = url;
        var body;
        var status = 302;
      
        // allow status / url
        if (arguments.length === 2) {
          if (typeof arguments[0] === 'number') {
            status = arguments[0];
            address = arguments[1];
          } else {
            deprecate('res.redirect(url, status): Use res.redirect(status, url) instead');
            status = arguments[1];
          }
        }
      
        // Set location header
        address = this.location(address).get('Location');
      
        // Support text/{plain,html} by default
        this.format({
          text: function(){
            body = statuses[status] + '. Redirecting to ' + address
          },
      
          html: function(){
            var u = escapeHtml(address);
            body = '<p>' + statuses[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>'
          },
      
          default: function(){
            body = '';
          }
        });
      
        // Respond
        this.statusCode = status;
        this.setHeader('Content-Length', Buffer.byteLength(body));
      
        if (req.method === 'HEAD') {
          this.end();
        } else {
          this.end(body);
        }
      };
    }
    next();
  };
};
