

// @see https://raw.github.com/Gozala/extendables/v0.2.0/extendables.js

define(function(require, exports, module) {

  function getOwnPropertyDescriptors(object) {
    var descriptors = {};
    Object.getOwnPropertyNames(object).forEach(function(name) {
      descriptors[name] = Object.getOwnPropertyDescriptor(object, name);
    });
    return descriptors;
  }

  function supplement(target, source) {
    var descriptors = {};
    var names = Object.getOwnPropertyNames(target);
    Object.getOwnPropertyNames(source).forEach(function(name) {
      if (!~names.indexOf(name)) {
        descriptors[name] = Object.getOwnPropertyDescriptor(source, name);
      }
    });
    return Object.defineProperties(target, descriptors);
  }

  function Constructor(base) {
    return function Extendable() {
      var value, extendable = this;
      if (!(extendable instanceof Extendable))
          extendable = Object.create(Extendable.prototype);

      value = base.apply(extendable, arguments);
      return value === undefined ? extendable : value;
    };
  }
  function Extendable() {
    return this instanceof Extendable ? this : Object.create(Extendable.prototype);
  }

  Object.defineProperties(Extendable, {
    extend: {
      value: function extend(source) {
        var constructor, descriptors = getOwnPropertyDescriptors(source || {});
        // If `constructor` is not defined by `source` then we generate a default
        // `constructor` that delegates to the `constructor` of the base class.
        if (typeof descriptors.constructor !== "object")
          descriptors.constructor = { value: new Constructor(this) };
        // Copying all the non-existing properties to the decedent.
        constructor = supplement(descriptors.constructor.value, this);
        // Override prototype of the decedent.
        constructor.prototype = Object.create(this.prototype, descriptors);
        return constructor;
      },
      enumerable: true
    }
  });

  exports.Extendable = Extendable;
  exports.version = "0.1.2";

});
