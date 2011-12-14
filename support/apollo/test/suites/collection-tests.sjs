var testUtil = require('../lib/testUtil')
var test = testUtil.test;
var collection = require('apollo:collection');
var par = collection.par;

// return a function that sleeps for a smaller increment
// each time it's called (and then calls the wrapped function),
// to effectively reverse the return order
// when run multiple times in parallel.
var withDecreasingTimeout = function(fn) {
  var amount = 100;
  return function() {
    hold(amount-=20);
    return fn.apply(this, arguments);
  };
};

test('identity(1)', 1, function() { return collection.identity(1); });

test('toArray on an array does nothing', true, function() {
  var a = [1,2,3];
  return a === collection.toArray(a);
});

test('toArray on `arguments`', {wasArray: false, isArray: true, value: [1,2,3]}, function() {
  var args = null;
  (function() {
    args = arguments;
  })(1,2,3);
  var arr = collection.toArray(args);
  return {
    wasArray: args instanceof Array,
    isArray: arr instanceof Array,
    value: arr
  }
});

test('items() on an object', [['a',1], ['b',2], ['c',3]], function() {
  var obj = {a: 1, b:2, c:3};
  var keys = collection.items(obj);
  keys.sort(); // ensure ordering
  return keys;
});

test('items() on an array', [[0,'zero'],[1,'one'],[2,'two']], function() {
  return collection.items(['zero','one','two']);
});

test('keys() on an object', ['a','b','c'], function() {
  var obj = {a: 1, b:2, c:3};
  var keys = collection.keys(obj);
  keys.sort(); // ensure ordering
  return keys;
});

test('keys() on an array', ['0','1','2'], function() {
  return collection.keys(["one", "two", "three"]);
});

test('values() on an object', ['one', 'two'], function() {
  var vals = collection.values({k1: 'one', k2: 'two'});
  vals.sort();
  return vals;
});

test('each is ordered', [1,2,3], function() {
  var res = [];
  collection.each([1,2,3],
    withDecreasingTimeout(function(elem) { res.push(elem); }));
  return res;
});

test('each supports object properties', {key1: 2, key2: 4}, function() {
  items = {};
  collection.each({key1: 1, key2: 2}, function(v, k) {
    items[k] = v * 2;
  });
  return items;
});

test('each ignores prototype properties', {"instance":2}, function() {
  items = {};
  var Obj = function() {
  };
  Obj.prototype.parent = 2;
  var obj = new Obj();
  obj.instance = 1;
  collection.each(obj, function(v, k) {
    items[k] = v * 2;
  });
  return items;
});

test('par each is run in parallel', [3,2,1], function() {
  var res = [];
  par.each([1,2,3],
    withDecreasingTimeout(function(elem) { res.push(elem); }));
  return res;
});

test('each / eachSeq don\'t swallow all exceptions (only stopIteration)', 'expected error', function() {
  try {
    collection.each([1,2,3], function() { throw new Error("expected error"); });
    return "no error thrown!"
  } catch (e) {
    return e.message;
  }
});


test('par map', {order: [3,2,1], result: [2,4,6]}, function() {
  var order = [];
  var result = par.map([1,2,3],
    withDecreasingTimeout(function(elem) {
      order.push(elem);
      return elem * 2;
    }));
  return {order: order, result: result};
});

test('map', {order: [1,2,3], result: [2,4,6]}, function() {
  var order = [];
  var result = collection.map([1,2,3],
    withDecreasingTimeout(function(elem) {
      order.push(elem);
      return elem * 2;
    }));
  return {order: order, result: result};
});

test('map on an object', {one: 2}, function() {
  return collection.map({one:1}, function(n) { return n * 2; });
});

test('find returns early', {checked: [1,2], result: 2}, function() {
  var order = [];
  var result = collection.find([1,2,3],
    withDecreasingTimeout(function(elem) {
      order.push(elem);
      return elem == 2;
    }));
  return {checked: order, result: result};
});

test('par find returns early', {checked: [3,2], result: 2}, function() {
  var order = [];
  var result = par.find([1,2,3],
    withDecreasingTimeout(function(elem) {
      order.push(elem);
      return elem == 2;
    }));
  return {checked: order, result: result};
});

test('find* return undefined if not found',
    [undefined, undefined, undefined, undefined],
    function() {
  var fn = function() { return false; };
  var c = [1,2,3];
  return [
    par.find(c, fn),
    collection.find(c, fn),
    par.findKey(c, fn),
    collection.findKey(c, fn)
  ];
});

test('findKey on an array', 1, function() {
  return collection.findKey(['zero','one','two'],
    function(el) { return el == 'one' });
});
test('findKey on an object', 'foo', function() {
  return collection.findKey({foo:1, bar:2},
    function(el) { return el == 1 });
});

test('filter', {checked: [1,2,3], result: [1,3]}, function() {
  var checked = [];
  var result = collection.filter([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem != 2;
    }));
  return {checked:checked, result:result};
});

test('par filter', {checked: [3,2,1], result: [3,1]}, function() {
  var checked = [];
  var result = par.filter([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem != 2;
    }));
  return {checked:checked, result:result};
});

test('filter on an object', {include:true}, function() {
  return collection.filter({include: true, exclude: false},
    function(v, k) {
      return k == 'include';
    });
});

test('par filter on an object', {include:true}, function() {
  return par.filter({include: true, exclude: false},
    function(v, k) {
      return k == 'include';
    });
});

test('remove on array', ["one", "two"], function() {
  var a = ["one", "two", "three"];
  collection.remove(a, 'three');
  return a;
});

test('remove on array returns value', 'one', function() {
  var a = ["one", "two", "three"];
  return collection.remove(a, 'one');
});

test('remove on array throws when item not found', {message: "Could not find item \"unknown\" to remove", collection: ["one","two","three"], item:'unknown'} , function() {
  var a = ["one", "two", "three"];
  try {
    collection.remove(a, 'unknown');
    return "unexpected success";
  } catch (e) {
    return {message:e.message, collection:e.collection, item:e.item};
  }
});

test('remove on array returns the default when provided', 'not found' , function() {
  var a = [1,2,3];
  return collection.remove(a, 'unknown', 'not found');
});

test('remove on arguments is treated as object, not array', {1:"one", 2:"two"} , function() {
  var a = (function() { return arguments; })("zero", "one","two");
  collection.remove(a, 0);
  try {
    collection.remove(a, "two");
  } catch(e) {
    return JSON.parse(JSON.stringify(a)); // equality doesn't seem to work with `arguments` object
  }
  return "Should have failed!";
});

test('remove on object', {key1: 'val1'}, function() {
  var a = {key1: 'val1', key2: 'val2'};
  collection.remove(a, 'key2');
  return a;
});

test('remove on object returns value', 'val1', function() {
  var a = {key1: 'val1', key2: 'val2'};
  return collection.remove(a, 'key1');
});

test('remove on object throws when key not found', {message: "Could not find item \"unknown\" to remove", collection: {'a':'A'}, item:'unknown'} , function() {
  var a = {'a':'A'};
  try {
    collection.remove(a, 'unknown');
    return "unexpected success";
  } catch (e) {
    return {message:e.message, collection:e.collection, item:e.item};
  }
});

test('remove on object returns default when provided', false , function() {
  var a = {key1: 'val', key2: 'val2'};
  return collection.remove(a, 'unknown', false);
});

test('reduce', 6, function() {
  return collection.reduce([1,2,3], 0, function(accum, el) { return accum + el; });
});
test('reduce1', 6, function() {
  return collection.reduce1([1,2,3], function(accum, el) { return accum + el; });
});

test('reduce on an object', 6, function() {
  return collection.reduce({one: 1, two: 2, three: 3}, 0, function(accum, el) { return accum + el; });
});
test('reduce1 fails on empty array', 'reduce1 on empty collection', function() {
  try {
    return collection.reduce1([], function() { return 'should not be run'; });
  } catch(e) {
    return e.message;
  }
});

test('par any returns early', {checked: [3, 2], result: true}, function() {
  var checked = [];
  var result = par.any([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem == 2;
    }));
  return {checked:checked, result:result};
});
test('any returns early', {checked: [1, 2], result: true}, function() {
  var checked = [];
  var result = collection.any([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem == 2;
    }));
  return {checked:checked, result:result};
});

test('any* returns false when there is no match', [false, false], function() {
  var c = [1,2,3];
  var fn = function() { return false; };
  return [collection.any(c, fn), collection.any(c, fn)];
});

test('par all returns early', {checked: [3, 2], result: false}, function() {
  var checked = [];
  var result = par.all([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem != 2;
    }));
  return {checked:checked, result:result};
});

test('all returns early', {checked: [1, 2], result: false}, function() {
  var checked = [];
  var result = collection.all([1,2,3],
    withDecreasingTimeout(function(elem) {
      checked.push(elem);
      return elem != 2;
    }));
  return {checked:checked, result:result};
});

test('all* returns true when all match', [true, true], function() {
  var c = [1,2,3];
  var fn = function() { return true; };
  return [collection.all(c, fn), par.all(c, fn)];
});


// all the `this` binding tests
var testThis = function(base, fnName /*, otherArgs */) {
  var _arguments = arguments;
  test('`this` binding for ' + fnName, 'this', function() {
    var expectedThis = 'this';
    var actualThis = 'not set';
    var cb = function() {
      // javascript promotion messes with strings as `this`, so we coerce them back to strings
      actualThis = this + '';
      return null;
    };

    var args = Array.prototype.slice.call(_arguments, 2);
    // first arg is always collection
    args.unshift([1,2,3]);

    // after otherArgs, add callacbk and this_obj:
    args.push(cb);
    args.push(expectedThis);
    base[fnName].apply(null, args);
    return actualThis;
  });
};

testThis(collection, 'each');
testThis(par, 'each');
testThis(collection, 'map');
testThis(par, 'map');
testThis(collection, 'find');
testThis(par, 'find');
testThis(collection, 'filter');
testThis(collection, 'any');
testThis(par, 'any');
testThis(collection, 'all');
testThis(par, 'all');
testThis(collection, 'findKey');
testThis(par, 'findKey');

testThis(collection, 'reduce', 0);
testThis(collection, 'reduce1');
