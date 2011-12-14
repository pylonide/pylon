var test = require('../lib/testUtil').test;
var cutil = require("apollo:cutil");

test('waitforAll funcs', 3, function() {
  var x = 0;
  function one() { hold(Math.random()*100); ++x; }
  cutil.waitforAll([one, one, one]);
  return x;
});

test('waitforAll funcs + arg', 3, function() {
  var x = 0;
  function one(a) { hold(Math.random()*100); x+=a[1]; }
  cutil.waitforAll([one, one, one], [2,1,3]);
  return x;
});

test('waitforAll args', 6, function() {
  var x = 0;
  function one(a) { hold(Math.random()*100); x+=a; }
  cutil.waitforAll(one, [1,2,3]);
  return x;
});

test('waitforAll args 2nd par', 3, function() {
  var x = 0;
  function one(a,i) { hold(Math.random()*100); x+=i; }
  cutil.waitforAll(one, [5,6,7]);
  return x;
});

test('waitforAll args 2nd+3rd par', 18, function() {
  var x = 0;
  function one(a,i,arr) { hold(Math.random()*100); x+=arr[i]; }
  cutil.waitforAll(one, [5,6,7]);
  return x;
});

test('waitforFirst funcs', 1, function() {
  var x = 0;
  function one() { hold(Math.random()*100); ++x; }
  cutil.waitforFirst([one, one, one]);
  return x;
});

test('waitforFirst funcs + arg', 3, function() {
  var x = 0;
  function one(a) { hold(Math.random()*100); x+=a[1]; }
  cutil.waitforFirst([one, one, one], [3,3,3]);
  return x;
});

test('waitforFirst args', 6, function() {
  var x = 0;
  function one(a) { hold(Math.random()*100); x+=a; }
  cutil.waitforFirst(one, [6,6,6]);
  return x;
});

test('Semaphore: blocking on acquire', 1, function() {
  var S = new (cutil.Semaphore)(1);
  S.acquire();
  waitfor {
    S.acquire();
    return 2;
  }
  or {
    hold(100);
    return 1;
  }
});

test('Semaphore: block/resume on acquire', 1, function() {
  var S = new (cutil.Semaphore)(1);
  S.acquire();
  waitfor {
    S.acquire();
    return 1;
  }
  or {
    S.release();
    hold(100);
    return 2;
  }
});

test('Event: block/resume', 1, function() {
  var e = new cutil.Event();
  waitfor {
    e.wait();
    return 1;
  } or {
    e.emit();
    hold(100);
    return 2;
  }
});

test('Event: retract from wait()', [], function() {
  var e = new cutil.Event();
  waitfor {
    e.wait();
  } or {
    hold(100);
  }
  return e.waiting;
});

test('Event: setting with a value', ["first", "second"], function() {
  var e = new cutil.Event();
  var results = [];
  waitfor {
    results.push(e.wait());
    results.push(e.wait());
  } or {
    e.emit("first");
    hold(100);
    e.emit("second");
    hold();
  }
  return results;
});

test('Condition: not blocking if already set', 1, function() {
  var c = new cutil.Condition();
  c.set();
  waitfor {
    c.wait();
    return 1;
  } or {
    return 2;
  }
});

test('Condition: clearing and re-setting', 1, function() {
  var c = new cutil.Condition();
  waitfor {
    c.wait();
    c.clear();
    c.wait();
    return 1;
  } or {
    c.set();
    hold(100);
    c.set();
    hold(0);
    return 2;
  }
});

test('Condition: setting with a value', ["result!", "result!", "result!"], function() {
  var c = new cutil.Condition();
  var results = [];
  waitfor {
    waitfor {
      results.push(c.wait());
    } and {
      results.push(c.wait());
      c.set("ignored result (already set)");
      results.push(c.wait());
    }
  } or {
    hold(100);
    c.set("result!");
    hold();
  }
  return results;
});


test('makeBoundedFunction 1', 3, function() {
  var x = 0;
  function f() { ++x; hold(100); }
  var g = cutil.makeBoundedFunction(f, 3);
  waitfor { g(); } and { g(); } and { g(); } and { g(); } and { g(); }
  and {
    return x;
  }
});

test('makeBoundedFunction 2', 0, function() {
  var x = 0;
  function f() { ++x; if (x>3) throw new Error(x); hold(10); --x; }
  var g = cutil.makeBoundedFunction(f, 3);
  waitfor { g(); } and { g(); } and { g(); } and { g(); } and { g(); }
  return x;
});

test('Queue: producer/consumer', 1000, function() {
  var rv = 0;
  var q = new (cutil.Queue)(100);
  waitfor {
    for (var i=0; i<1000; ++i)
      q.put(1);
  }
  and {
    for (var j=0; j<1000; ++j)
      rv += q.get();
  }
  return rv;
});

test('Queue: producer/consumer (async get)', 100, function() {
  var rv = 0;
  var q = new (cutil.Queue)(10);
  waitfor {
    for (var i=0; i<100; ++i)
      q.put(1);
  }
  and {
    for (var j=0; j<100; ++j) {
      hold(0);
      rv += q.get();
    }
  }
  return rv;
});

test('Queue: producer/consumer blocking', 100, function() {
  var q = new (cutil.Queue)(100);
  waitfor {
    waitfor {
      for (var i=0; i<1000; ++i)
        q.put(1);
    }
    and {
      // The above loop should block after 100 iterations; then we reach this line:
      return i;
    }
  }
  and {
    for (var j=0; j<1000; ++j)
      rv += q.get();
  }
  return 0;
});

test('Queue: producer/consumer (async put)', 100, function() {
  var rv = 0;
  var q = new (cutil.Queue)(10);
  waitfor {
    for (var i=0; i<100; ++i) {
      hold(0);
      q.put(1);
    }
  }
  and {
    for (var j=0; j<100; ++j) {
      rv += q.get();
    }
  }
  return rv;
});

test('Queue: producer/consumer (async put/get)', 100, function() {
  var rv = 0;
  var q = new (cutil.Queue)(10);
  waitfor {
    for (var i=0; i<100; ++i) {
      hold(0);
      q.put(1);
    }
  }
  and {
    for (var j=0; j<100; ++j) {
      hold(0);
      rv += q.get();
    }
  }
  return rv;
});

test('makeMemoizedFunction 1', 1, function() {
  var c = 0;
  var f = cutil.makeMemoizedFunction(function(x) {
    if (x == 42) ++c;
    return x;
  });
  f(42);
  f(10);
  f(42);
  f(32);
  return c;
});

test('makeMemoizedFunction 2', 3, function() {
  var c = 0;
  var f = cutil.makeMemoizedFunction(function(x) {
    hold(100);
    ++c;
    return x;
  });
  waitfor {
    f(42);
  }
  and {
    f(10);
  }
  and {
    f(42);
  }
  and {
    f(32);
  }
  and {
    f(10);
  }
  f(10);
  f(42);
  return c;
});

test('makeMemoizedFunction with custom key', 2, function() {
  var c = 0;
  var f = cutil.makeMemoizedFunction(function(x) {
    if (x == 42) ++c;
    return x;
  }, function(a, b) {
    return b;
  });
  results = [];
  f(42, 1);
  f(42, 2);
  f(42, 2);
  return c;
});


test('makeMemoizedFunction retraction', 2, function() {
  var c = 0;
  var f = cutil.makeMemoizedFunction(function(x) {
    ++c;
    hold(100);
    return x;
  });
  waitfor {
    f(42);
    f(42);
  }
  or {
    /* */
  }
  f(42);
  return c;
});
