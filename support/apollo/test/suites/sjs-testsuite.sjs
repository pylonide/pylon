var testUtil = require('../lib/testUtil');
var test = testUtil.test;
var testParity = testUtil.testParity;

testParity("9+6", function() { return 9 + 6; });
testParity("9-6", function() { return 9 - 6; });
testParity("false && true", function() { return false && true; });
testParity("true && false", function() { return true && false; });
testParity("var x = true; false && (x=false); x", function() { var x = true; false && (x=false); return x; });
testParity("var x = true; true || (x=false); x", function() { var x = true; true || (x=false); return x; });
testParity("var x = true; true || function() { x=false; }(); x;", function() { var x = true; true || function() { x=false; }(); return x; });
testParity("var x = true; false && function() { x=false; }(); x;", function() { var x = true; false && function() { x=false; }(); return x; });
testParity("10 >>> 3", function() { return 10 >>> 3; });
testParity("10>=3", function() { return 10>=3; });
testParity("2<10", function() { return 2<10; });
testParity("var i=10, x=0; while(i++<20) x+=i; x;",
     function() { var i=10, x=0; while(i++<20) x+=i; return x; });
testParity("~1", function() { return ~1; });
testParity("+'-1'", function() { return +'-1'; });
testParity("+'foo'", function() { return +'foo'; }).skip("normal JS also fails this test");
testParity("-(1+2)", function() { return -(1+2); });
testParity("(function() { if(1>=2) return 5; else if (1<=2) return 3; else return 2; })()",
           function() { if(1>=2) return 5; else if (1<=2) return 3; else return 2; });
testParity("var i=10, x=0; do { x += --i } while (i); x;",
           function() { var i=10, x=0; do { x += --i } while (i); return x; });
testParity("for (var i=0; i<10; ++i) /* do nothing */; i;",
           function() { for (var i=0; i<10; ++i) /* do nothing */; return i; });
testParity("var i=-10, j=0; for (;;) { if (++i === 10) break; --j; }; j;",
           function() { var i=-10, j=0; for (;;) { if (++i === 10) break; --j; }; return j; });
testParity("var i=0, x=0; while (++i < 10) { if (i==5) continue; x+= i; } x;",
           function() { var i=0, x=0; while (++i < 10) { if (i==5) continue; x+= i; } return x; });
testParity("var x=0; for (var i=0; i<10; ++i) { if (i==5) continue; x+=i } x;",
           function() { var x=0; for (var i=0; i<10; ++i) { if (i==5) continue; x+=i } return x; });

testParity("var x=0, a=2; switch(a) { case 1: x=100; break; case 2: x=1; break; case 3: x=200; break; default: x=400; } x;",
           function() { var x=0, a=2; switch(a) { case 1: x=100; break; case 2: x=1; break; case 3: x=200; break; default: x=400; } return x });
testParity("var x=0, a=2; switch(a) { case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; default: x+=400; } x;",
           function() { var x=0, a=2; switch(a) { case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; default: x+=400; } return x });
testParity("var x=0, a='foo', c='fo'; switch(a) { case 'bar': x+=100; break; case c+'o': x+=1; case 'baz': x+=200; break; default: x+=400; } x;",
           function() { var x=0, a='foo',c='fo'; switch(a) { case 'bar': x+=100; break; case c+'o': x+=1; case 'baz': x+=200; break; default: x+=400; } return x });
testParity("var x=0, a=5; switch(a) { case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; default: x+=400; } x;",
           function() { var x=0, a=5; switch(a) { case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; default: x+=400; } return x });
testParity("var x=0, a=5; switch(a) { default: x+=400; break; case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; } x;",
           function() { var x=0, a=5; switch(a) { default: x+=400; break; case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; } return x });
testParity("var x=0, a=5; switch(a) { default: x+=400; case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; } x;",
           function() { var x=0, a=5; switch(a) { default: x+=400; case 1: x+=100; break; case 2: x+=1; case 3: x+=200; break; } return x });

testParity("var x={a:1, b:2, c:3}.b; x;", function() { var x={a:1, b:2, c:3}.b; return x;});
testParity("var x={a:1, b:2, c:3+10, d:{f:4}}; x.a+x.b+x.c+x.d.f;", function() { var x={a:1, b:2, c:3+10, d:{f:4}}; return x.a+x.b+x.c+x.d.f;});
testParity("var x=[1,{a:2},3][1].a; x;", function() { var x=[1,{a:2},3][1].a; return x;});
testParity("3+2>5-7 ? 1 : 2", function() { return 3+2>5-7 ? 1 : 2; });
testParity("function A(x) { function B() { return x; } return B; } var a=A(10), b=A(20); a();",
           function() { function A(x) { function B() { return x;} return B; } var a=A(10), b=A(20); return a();});
testParity("function A(x) { function B() { return x; } return {f:B}; } var a=A(10), b=A(20); a.f();",
           function() { function A(x) { function B() { return x;} return {f:B}; } var a=A(10), b=A(20); return a.f();});

testParity("function A(x) { function B() { return x; } return {f:function() { return B(); }}; } var a=A(10), b=A(20); a.f();",
           function() { function A(x) { function B() { return x;} return {f:function() { return B();}}; } var a=A(10), b=A(20); return a.f();});

testParity("function A(x) { var G = function G() { return x; }; return {f:function() { return G(); }}; } var a=A(10), b=A(20); a.f();",
           function() { function A(x) { var G = function G() { return x;}; return {f:function() { return G();}}; } var a=A(10), b=A(20); return a.f();});

testParity("function A(x) { return {f:function() { return x; }}; } var a=A(10), b=A(20); a.f();",
           function() { function A(x) { return {f:function() { return x;}}; } var a=A(10), b=A(20); return a.f();});

test("waitfor { return (hold(1000), 2); } or { return (hold(100), 1); } or { return (hold(1000), 3);}", 1,
     function() { waitfor { return (hold(1000), 2); } or { return (hold(100), 1); } or { return (hold(1000), 3);} });

test("function h(i) { return (hold(1000+i), 2+i) @ (hold(100+i), 1+i) @ (hold(1000+i), 3+i); } h(0) @ h(1) @ h(2) @ h(500);", 1,
     function() { function h(i) { waitfor { return (hold(1000+i), 2+i) } or { return (hold(100+i), 1+i) } or { return (hold(1000+i), 3+i); } } waitfor { return h(0) } or { return h(1) } or { return h(2) } or { return h(500); } });

test("Empty function/too much recursion bug: function par() {} par(1,2); 3;", 3,
     function() { function par() {} par(1,2); return 3; });

function par() {}
test("Evaluation order: var x; par((function() { x=1;})(), (function() {x=2;})()); x", 2,  function() { var x; par((function() { x=1;})(), (function() {x=2;})()); return x; });

test("Evaluation order: var x; (function() { x=1;})() @ (function() {x=2;})(); x", 1,  function() { var x; waitfor {(function() { x=1;})()} or {(function() {x=2;})()}; return x; });

test("var x=0; (function() { try { x=2; hold(1000); } finally { x=1; } })() @ 3; x", 1, function() { var x=0; waitfor {(function() { try { x=2; hold(1000); } finally { x=1; } })() } or { 3; } return x; });

test("'\r'== String.fromCharCode(13)", true, function() { return '\r'==String.fromCharCode(13); });

function obj_with_foo_member() { this.foo = 1; }
test("new obj",  1, function() { var obj = new obj_with_foo_member(); return obj.foo;});
function obj_with_proto() {}
obj_with_proto.prototype = { bar:1 };
test("new obj with proto", 1, function() { var obj = new obj_with_proto(); return obj.bar; });
function obj_with_proto_plus_args(x) { this.baz-=x; }
obj_with_proto_plus_args.prototype = { baz: 10, getBaz: function() { return this.baz;} };
test("new obj with proto (args)", 1, function() { var obj = new obj_with_proto_plus_args(9); return obj.getBaz(); });
test("new Array", 1, function() { var obj = new Array; obj.push(1); return obj[0]; });
test("new Array(5)", 1, function() { var obj = new Array(5); return obj.length-4; });

testParity("var a= 2; try { throw 'foo'; }catch(e) { if (e=='foo')a=1; } a;", 
function() { var a = 2; try { 1; throw 'foo'; }catch(e) { if(e=='foo')a=1; } return a; });

test("this pointer in try", 1, function() { var a ={i:2, foo:function() { try { this.i--; throw "foo"; } catch(e) {  } return this.i; }}; return a.foo(); });


test("this pointer in catch", 1, function() { var a ={i:2, foo:function() { try { throw "foo"; } catch(e) { this.i--; } return this.i; }}; return a.foo(); });

test("this pointer in 'if'", 1, function() { var a ={i:2, foo:function() { if(!this.i==2) return 42; else return this.i-1; }}; return a.foo(); });

test("this pointer in for-loop", 1, function() { var i=20; var a = { i:1, foo: function() { for (var x=0; x<this.i; ++x) ; return x; } }; return a.foo(); });

test("this pointer in for-in", 1, function() { var a = { i:1, foo: function(o) { for (var x in o) { return this.i; } } }; return a.foo([2,3,4]) });

test("throw in if-test", 1, function() { try { if((function(){throw "foo"})()) return 2; else return 3; } catch(e) { return 1 }});

test("suspended throw in if-test", 1, function() { try { if((function(){hold(1); throw "foo"})()) return 2; else return 3; } catch(e) { return 1 }});

test("suspended throw in if-conseq", 1, function() { try { if(true) {hold(1); throw 2;} else return 3; } catch(e) { return 1 }});

test("suspended throw in if-altern", 1, function() { try { if(false) return 3; else{hold(1); throw 2;} } catch(e) { return 1 }});

test("empty strings", 0, function() { var a=""; return a.length; });

test("sjs eval scoping 1", 1, function() { var xx = 0; require('sjs:apollo-sys').eval("xx=1"); return xx; }); 

test("sjs eval scoping 2", 1, function() { require('sjs:apollo-sys').eval("var yyy=1;"); return yyy; }); 

testParity("(function() { try { return 1; } catch(e) { return 2; } finally { return 3; }})()", function() { try { return 1; } catch(e) { return 2; } finally { return 3; }});

test("return from catch", 1, function() { try { throw "error not caught!"; } catch(e) { return 1 } });

test("eval scoping 1", 1, function() { var xx = 0; eval("xx=1"); return xx; }); 

test("eval scoping 2", 1, function() { eval("var xyyyy=1"); if (this.xyyyy != undefined) return -1; try { return xyyyy; } catch (e) { return e.toString(); } }); 


// XXX This test fails in normal & optimize modes on IE (but not in
// debug mode), because IE doesn't implement the correct ECMA
// semantics:
// ECMA-262 chapter 13: "NOTE The Identifier in a FunctionExpression
// can be referenced from inside the FunctionExpression's FunctionBody
// to allow the function to call itself recursively. However, unlike
// in a FunctionDeclaration, the Identifier in a FunctionExpression
// cannot be referenced from and does not affect the scope enclosing
// the FunctionExpression."
// In IE the Identifier *can* be referenced from the enclosing scope,
// so the straight JS version of this test returns '1'. In normal &
// optimize modes, the SJS version returns '2' (the ECMA correct
// result)
testParity("try { var x = function e() { return 1; }; e(); } catch(ex) { 2;}",
           function() { try { var x= function e() { return 1; }; return e(); }catch(ex) {return 2;}});


testParity("try { var x = function e(n) { return n==1?1:e(n-1)*n; }; x(5); } catch(ex) { 1;}",
           function() { try { var x = function e(n) { return n==1?1:e(n-1)*n; }; return x(5); } catch(ex) { return 1;}});


testParity("var rv=0; for (var x in [1,2,3]) ++rv; rv;",
           function() { var rv=0; for (var x in [1,2,3]) ++rv; return rv; });
testParity("var rv=0; var obj={a:1,b:2,c:3}; for (var x in obj) rv+=obj[x]; rv;",
           function() { var rv=0; var obj={a:1,b:2,c:3}; for (var x in obj) rv+=obj[x]; return rv; });

testParity("var a={x:1}; delete a.x; a.x === undefined",
           function() { var a={x:1}; delete a.x; return a.x === undefined; });

// IE throws 'Object doesn't support this action' when trying to
// delete on 'window'. That's ok by the standard (window is a 'host
// object'), so to test deletion we create an intermediate object
// "deletetest":
var global = require("sjs:apollo-sys").getGlobal();
test("delete scoping", true, function() {
  global.deletetest = {};
  global.deletetest.x = 3;
  if (!global.deletetest.x) return "global not set!";
  delete deletetest.x;
  try {
    return deletetest.x===undefined ? true:deletetest.x;
  } catch(e) {
    return true
  };
});

/*XXX
test("single line ml strings", true, function() {
  var a = """
The quick brown fox
"""; XXX*/
/*
""" <-- to test that """ are not matched greedy
*/ /*XXX
  return a == "The quick brown fox";
});

test("multiline strings", true, function() {
  var a = """
The quick brown fox.
Test
""";
  return a == "The quick brown fox.\nTest";
});

test("multiline string escaping", true, function() {
  var a = """
""
''' """"""""
 """"
""";
  return a.length == 21;
});

test("multiline string replace", true, function() {
  var a = """
The quick brown fox.
Test
""".replace(/T/g, "t");
  return a == "the quick brown fox.\ntest";
});
*/


test("arguments property", 42, function() {
  return (function() { return arguments[0]; })(42);
});

test("arguments length", 5, function() {
  return (function() { return arguments.length; })(0,1,2,3,4);
});

test("arguments callee", 24, function() {
  return (function(x) { return x<=1 ? 1 : x*arguments.callee(x-1); })(4);
});

test("cancellation 1", 1, function() {
  var x=0; waitfor { x=2; hold(200); x=3; } or { hold(100); } x=1; hold(300); return x; });

test("cancellation 2", 1, function() {
  var x=0; waitfor { hold(0); x=2; hold(200); x=3; } or { hold(100); } x=1; hold(300); return x; });

test("waitfor() reentrancy 1", 1, function() {
  var x=0; waitfor() { hold(0); x=2; resume(); x=3; } x=1; return x; });

test("waitfor() reentrancy 2", 1, function() {
  var x=0; waitfor() {  x=2; resume(); x=3; } x=1; return x; });

test("waitfor() reentrancy 3", 1, function() {
  var x=0; waitfor() {  x=2; resume(); hold(0); x=3; } x=1; return x; });

test("waitfor() reentrancy 4", 1, function() {
  waitfor(var x=0) { resume(1); } return x; });

test("waitfor() reentrancy 5", 1, function() {
  waitfor(var x=0) { waitfor { hold(1000); } or { resume(1);} } return x; });

test("waitfor() reentrancy 6", 1, function() {
  var x=0; waitfor() { hold(0); x=1; resume(); } return x; });

test("waitfor() reentrancy 7", 1, function() {
  var x=0; waitfor() { hold(0); x=1; if(resume()) {hold(0);x=2;} else {hold(0);x=3;} } hold(100);return x; });

test("waitfor() inner abort 1", 1, function() {
  var x=0; waitfor() {  hold(0); x=2; resume(); hold(100); x=3; } x=1; hold(200); return x; });

test("waitfor() inner abort 2", 1, function() {
  var x=0; waitfor() {  hold(0); x=2; setTimeout(resume, 0); hold(100); x=3; } x=1; hold(200); return x; });

test("waitfor() inner abort 3", 1, function() {
  var x=0; waitfor() {  x=2; resume(); hold(10); x=3; } x=1; hold(20); return x; });

test("waitfor() inner abort 4", 1, function() {
  var x=0; waitfor() { try { x=2; resume(); hold(100); x=3; } retract{ x=1;} } return x; });

test("waitfor() inner abort 5", 1, function() {
  var x=0; waitfor() { try { hold(10); x=2; resume(); hold(100); x=3; } retract{ x=1;} } return x; });

test("waitfor() inner abort 6", 1, function() {
  var x=0; waitfor() { try { hold(10); x=2; resume(); hold(10); x=3; } retract{ x=1;} } hold(20); return x; });

test("waitfor{}and{}catch(){}", 1, function() {
  var x=0; waitfor { x=2; hold(1000); x=3; } and { x=4; throw 1; }catch(e) { x=e; } return x; });

test("waitfor{}and{}catch(){}finally{}", 1, function() {
  var x=0; waitfor { x=2; hold(1000); x=3; } and { x=4; throw 5; }catch(e) { x=e; }finally { hold(10); x=1; } return x; });

test("waitfor{}and{}finally{}", 1, function() {
  var x=0; waitfor { x=2; } and { x=4; }finally { x=1; } return x; });

test("waitfor{}or{}catch(){}", 1, function() {
  var x=0; waitfor { x=2; hold(1000); x=3; } or { x=4; throw 1; }catch(e) { x=e; } return x; });

test("waitfor{}or{}catch(){}finally{}", 1, function() {
  var x=0; waitfor { x=2; hold(1000); x=3; } or { x=4; throw 5; }catch(e) { x=e; }finally { x=1; } return x; });

test("waitfor{}or{}finally{}", 1, function() {
  var x=0; waitfor { x=2; } or { x=4; }finally { x=1; } return x; });

test("waitfor{}or{}retract{}", 1, function() {
  var x=0; waitfor { waitfor { x=2; hold(100); x=6 } or { x=3; hold(100); x=4; } retract{x=1} } or { x=5 } return x; });

test("waitfor{}or{}retract{}finally{}", 1, function() {
  var x=0; waitfor { waitfor { x=2; hold(100); x=6 } or { x=3; hold(100); x=4; } retract{x=7}finally{x=1} } or { x=5 } return x; });

test("waitfor(){}finally{}", 1, function() {
  var x=0; waitfor() { x=2;hold(10); x=3; resume(); x=4; } finally{ x=1; } return x; });

test("waitfor(){}catch(){}", 1, function() {
  var x=0; waitfor() { x=2;hold(10); throw 1; x=4; } catch(e) {x=e;} return x; });

test("waitfor(){}finally{} resume scope", true, function() {
  var x = false; waitfor() { var r = resume; resume(); } finally { x = (r===resume); } return x; });

test("waitfor(){}c(){}r{}f{} resume scope 2", true, function() {
  var x = false; waitfor() { resume(); } catch(e){}retract{}finally{} try{ x = (resume == undefined)} catch(e) {x=true} return x; });

test("waitfor(){} resume scope", true, function() {
  var x = false; waitfor() { resume(); } try{ x = (resume == undefined)} catch(e) {x=true} return x; });

test("waitfor(){}catch(){} resume scope", true, function() {
  var x = false; waitfor() { var r = resume; throw "error" } catch(e) { x = (r===resume); } return x; });

test("waitfor(){}retract{}", 1, function() {
  var x=0; waitfor { waitfor() { x=2; } retract {x=1;} } or { x=5; } return x; });

test("waitfor(){}retract{} resume scope", true, function() {
  var x=0; waitfor { waitfor() { var r = resume; x=2; } retract {x=(r===resume);} } or { x=5; } return x; });

test("!amending of non-Error exceptions", true, function() {
  try { throw "foo"; } catch(e) { return e.file === undefined; } });

test("amending of Error exceptions", true, function() {
  try { throw new Error("foo"); } catch(e) { return e.file !== undefined; } });

test("amending of Error exceptions", true, function() {
  try { var e = new Error("foo"); throw e; } catch(e) { return e.file !== undefined; } });

test("amending of Error exceptions 3", true, function() {
  try { asdasdasdasd; } catch(e) { return e.file !== undefined; } });

test("!overwriting of own property 'toString' in Error exceptions", true, function() {
  try { var e = new Error("foo"); e.toString = "xxx"; throw e; } catch(e) { return e.toString == "xxx" } });

test("automatic semicolon insertion bug", 1, function() {
  // this didn't parse because "2" was scanned in an arg position by
  // our double-barrel tokenizer
  a = "1"
  "2";
  return a.length;
});

test("multiline strings", true, function() {
  a = "1
2";
  return a === "1\n2";
});

test("multiline strings; newline escaping", true, function() {
  a = "1\
2";
  return a === "12";
});

test('reentrant resume in waitfor/or', 1, function() {
  waitfor {
    waitfor () {
      var r = resume;
    }
    return 1;
  }
  or {
    r();
    return 2;
  }
});

test('reentrant resume in waitfor/and', 1, function() {
  waitfor {
    waitfor () {
      var r = resume;
    }
    return 1;
  }
  and {
    r();
    return 2;
  }
});

test('reentrant edge case in waitfor/or', 2, function() {
  // We might revisit this behaviour
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  or {
    r();
    // XXX this gets executed, but has no effect on the already returned x:
    ++x;
    return 100;
  }
});

test('reentrant edge case in waitfor/or 2', 3, function() {
  // We might revisit this behaviour
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  or {
    r();
    // XXX this gets executed:
    ++x;
    return 100;
  }
  finally {
    // at this point, x has both ++'s applied to it
    return x;
  }
});

test('reentrant edge case in waitfor/or 3', 2, function() {
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  or {
    r();
    hold(0);
    // this doesn't get executed (because of the hold!)
    ++x;
    return 100;
  }
  finally {
    // at this point, x has one ++ applied to it
    return x;
  }
});

test('reentrant edge case in waitfor/or 4', 3, function() {
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  or {
    r();
    try {
      hold(0);
    }
    finally {
      // this should get executed
      ++x;
    }
    return 100;
  }
  finally {
    // at this point, x has both ++'s applied to it
    return x;
  }
});

test('reentrant edge case in waitfor/and', 2, function() {
  // We might revisit this behaviour
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  and {
    r();
    // XXX this gets executed, but has no effect on the already returned x:
    ++x;
    return 100;
  }
});

test('reentrant edge case in waitfor/and 2', 3, function() {
  // We might revisit this behaviour
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  and {
    r();
    // XXX this gets executed:
    ++x;
    return 100;
  }
  finally {
    // at this point, x has both ++'s applied to it
    return x;
  }
});

test('reentrant edge case in waitfor/and 3', 2, function() {
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  and {
    r();
    hold(0);
    // this doesn't get executed (because of the hold!)
    ++x;
    return 100;
  }
  finally {
    // at this point, x has one ++ applied to it
    return x;
  }
});

test('reentrant edge case in waitfor/and 4', 3, function() {
  var x = 1;
  waitfor {
    waitfor () {
      var r = resume;
    }
    ++x;
    return x;
  }
  and {
    r();
    try {
      hold(0);
    }
    finally {
      // this should get executed
      ++x;
    }
    return 100;
  }
  finally {
    // at this point, x has both ++'s applied to it
    return x;
  }
});

test('spawn', 1, function() {
  var x = 0;
  waitfor {
    waitfor () {
      var r = resume;
    }
    // not reached
    x += 200;
    return 100;
  }
  or {
    spawn (hold(0),r());
    ++x; 
    return 10;
  }
  finally {
    return x;
  }
});

test('spawn 2', 1, function() {
  waitfor {
    waitfor() {
      var r = resume;
    }
    return 1;
  }
  or {
    spawn r();
    hold();
    // not reached
    return 2;
  }
});

test('continue in for-in', 1, function() {
  var a = [1,2,3];
  for (var x in a) {
    continue;
    return 2;
  }
  return 1;
});

test('abortion of hold(.) - IE clearTimeout bug', 1, function() {
  var x = 0;
  waitfor {
    while (true) {
      // this loop didn't used to be aborted correctly on IE
      x += 10;
      hold(10);
    }
  }
  or {
    hold(100);
    x = 1;
  }
  hold(100);
  return x;
});

test("arguments modification (dot)", 6, function() {
  return (function() { arguments.x=5; return arguments.x+arguments[1]; })(0,1,2,3,4);
});

test("arguments modification (idx)", 6, function() {
  return (function() { arguments['x']=5; return arguments['x']+arguments[1]; })(0,1,2,3,4);
});

test("arguments modification (assign)", 6, function() {
  return (function() { arguments=5; return arguments; })(0,1,2,3,4);
});

test("arguments modification (var assign)", 6, function() {
  return (function() { var arguments=5; return arguments; })(0,1,2,3,4);
});

test("regex apply (shouldn't work on IE)", "foo", function() {
  var a = { x: "abcfoobar"}; return /(foo)/(a.x)[1];
}).skip("using regexps as functions is non-standard JS");

test("catch scope in waitfor/resume", 1, function() {
  try {
    waitfor {
      waitfor() { var r = resume; }
      throw new Error("foo");
    } and {
      hold(100);
      try {
        r();
      }
      catch(e) {
        return 2;
      }
    }
  }
  catch(e) {
    return 1;
  }
});

test("regex parser bug", "http://foo", function() {
  function urlhost(uri) {
    return (/^https?:\/\/[^/]*/).exec(uri)[0];
  }
  return urlhost("http://foo/bar");
});

test("incorrectly calling function with 'this' object bug", true, function() {
  if (global !== this) throw "Incorrect this object to begin with";
  var a = { foo : function() { return (function(){return this == global;})()  } };
  return a.foo();
});

test('cancel spawn', 1, function() {
  var x = 0;
  waitfor {
    var stratum = spawn (hold(0),x += 100);
  }
  and {
    stratum.abort();
    hold(100);
    x += 1;
  }
  return x;
});

test('cancel spawn 2', 1, function() {
  var x = 0;
  waitfor {
    var stratum = spawn (function() {
      hold(100);
      x += 100;
    })();
  }
  and {
    hold(10);
    stratum.abort();
    hold(200);
    x += 1;
  }
  return x;
});

test('spawn/waitforValue', 30, function() {
  var x = 0;
  var stratum = spawn (hold(100), 10);
  waitfor {
    hold(200)
    return 1;
  }
  or {
    waitfor {
      x += stratum.waitforValue();
    }
    and {
      x += stratum.waitforValue();
    }
    and {
      waitfor {
        x += stratum.waitforValue();
      }
      or {
        hold(10);
      }
    }
  }
  x += stratum.waitforValue();
  return x;
});

test('spawn/waitforValue/throw', 30, function() {
  var x = 0;
  var stratum = spawn (function() { hold(100); throw 10; })();
  waitfor {
    hold(200)
    return 1;
  }
  or {
    waitfor {
      try {
        stratum.waitforValue();
      } catch (e) { x += e }
    }
    and {
      try {
        stratum.waitforValue();
      } catch (e) { x += e }
    }
    and {
      waitfor {
        try {
          stratum.waitforValue();
        } catch (e) { x += e }
      }
      or {
        hold(10);
      }
    }
  }
  try {
    stratum.waitforValue();
  } catch (e) { x += e }
  return x;
});

// ecma 262-5 13.2.2:9
testParity("var x = function() { return {a:1}}; x.prototype.a=2; (new x()).a;", function() { var x = function() { return {a:1}}; x.prototype.a=2; return (new x()).a; });
testParity("var x = function() { return 1}; x.prototype.a=2; (new x()).a;", function() { var x = function() { return 1}; x.prototype.a=2; return (new x()).a; });
testParity("var x = function() { return function() { return 1}}; x.prototype.a=2; (new x())();", function() { var x = function() { return function() { return 1;}}; x.prototype.a=2; return (new x())(); });

testParity("(function() {try{ throw 1; }finally{ return 2;}})()", function() {
  try { throw 1 }finally { return 2; } return 3; });

testParity("(function() {try{ throw 1; }finally{ throw 2;}})()", function() {
  try { throw 1 }finally { throw 2; } return 3; });

testParity("(function() {try{ throw 1; }finally{ (function(){ return 2 })()}})()", function() {
  try { throw 1 }finally { (function(){return 2})(); } return 3; });

test("destructuring [a,,c] = [1,2,3]", 4, function() {
  var a,c;
  [a,,c] = [1,2,3];
  return a+c;
});

test("destructuring [a,,[,c]] = [1,2,[3,4,5]]", 5, function() {
  var a,c;
  [a,,[,c]] = [1,2,[3,4,5]];
  return a+c;
});

test("destructuring [a,,[,c]] = [1,(hold(0),2),[3,f(),5]]", 5, function() {
  var a,c;
  function f() { hold(10); return 4; }
  [a,,[,c]] = [1,(hold(0),2),[3,f(),5]];
  return a+c;
});

test("destructuring ({a:c, b:d}) = {a:1, b:2, c: 3, d: 4}", 3, function() {
  var c,d;
  ({a:c, b:d}) = {a:1, b:2, c: 3, d: 4}
  return c+d;
});

test("destructuring  [a,,{x:[,c]}] = [1,(hold(0),2),{a:1, b:2, x:[3,f(),5]}]", 5, function() {
  var a,c;
  function f() { hold(10); return 4; }
  [a,,{x:[,c]}] = [1,(hold(0),2),{a:1, b:2, x:[3,f(),5]}];
  return a+c;
});

test("destructuring  [a.x.y,,b,{x:[,c.z]}] = [1,(hold(0),2),10,{a:1, b:2, x:[3,f(),5]}];", 15, function() {
  var a={x:{}},b,c={};
  function f() { hold(10); return 4; }
  [a.x.y,,b,{x:[,c.z]}] = [1,(hold(0),2),10,{a:1, b:2, x:[3,f(),5]}];
  return a.x.y+b+c.z;
});

test("destructuring ({x,y}) = {y:1, z:3, x:5}", 6, function() {
  var x,y;
  ({x,y}) = {y:1, z:3, x:5};
  return x+y;
});

test('reentrant edge case in waitfor/or 5', 3, function() {
  var x = 0;
  waitfor {
    try {
      hold();
    }
    finally {
      // must get executed
      x+=2;
      r();
    }
    // must not get executed
    x+= 100;
  }
  or {
    waitfor () {
      var r = resume;
    }
    // must not get executed
    x+= 10;
  }
  or {
    hold(0);
    x+=1;
  }
  return x;
});

test('reentrant edge case in waitfor/or 6', 3, function() {
  var x = 0;
  waitfor {
    try {
      hold();
    }
    finally {
      // must get executed
      x+=2;
      r();
    }
    // must not get executed
    x+= 100;
  }
  or {
    waitfor () {
      var r = resume;
    }
    // must not get executed
    x+= 10;
  }
  or {
    x+=1;
  }
  return x;
});

test('reentrant edge case in waitfor/and 5', 3, function() {
  var x = 0;
  waitfor {
    try {
      hold();
    }
    finally {
      // must get executed
      x+=2;
      r();
    }
    // must not get executed
    x+= 100;
  }
  and {
    waitfor () {
      var r = resume;
    }
    // must not get executed
    x+= 10;
  }
  and {
    hold(0);
    x+=1;
    return;
  }
  finally {
    return x;
  }
});

test('reentrant edge case in waitfor/and 6', 3, function() {
  var x = 0;
  waitfor {
    try {
      hold();
    }
    finally {
      // must get executed
      x+=2;
      r();
    }
    // must not get executed
    x+= 100;
  }
  and {
    waitfor () {
      var r = resume;
    }
    // must not get executed
    x+= 10;
  }
  and {
    x+=1;
    return;
  }
  finally {
    return x;
  }
});

test("break across funcs (sync)", 1, 
     function() { function foo() { break; }; 
                  try { while (1) { foo(); return 2;} } catch(e) { return 1; } return 3; });

test("break across funcs (async)", 1, 
     function() { function foo() { hold(0); break; }; 
                  try { while (1) { foo(); return 2;} } catch(e) { return 1; } return 3; });

test("with 1", 1, function() {
  var a = 10, b = { a: 1 };
  with (b) 
    return a;
});

test("with 2", 1, function() {
  var a = 10, b = { a: 1 };
  with (hold(0),b) {
    hold(0);
    return a;
  }
});

test("with 3", 1, function() {
  var a = 10, b = { a: 1 };
  var x;
  with (b) { 
    hold(0);
    x=a;
  }
  return x;
});

test("collapse 1", 1, 
     function() { 
       var a = 0;
       waitfor {
         // with delay == 10, this doesn't work on ff (hits timer resolution)
         hold(100);
         a += 10;
       }
       or {
         hold(0);
         collapse;
         ++a;
       }
       return a;
     });

test("collapse 2", 1, 
     function() { 
       var a = 0;
       waitfor {
         hold(0);
         a += 10;
       }
       or {
         collapse;
         ++a;
       }
       return a;
     });

test("collapse 3", 1, 
     function() { 
       var a = 0;
       waitfor {
         hold(0);
         a += 10;
       }
       or {
         if (true) 
           collapse;
         hold(10);
         ++a;
       }
       return a;
     });

test("collapse 4", 3, 
     function() { 
       var a = 0;
       waitfor {
         hold(100);
         a += 10; // should not be executed
       }
       or {
         try {
           hold(100);
           a += 20; // should not be executed
         }
         finally {
           a += 2; // should be executed
         }
       }
       or {
         hold(0);
         if (true) {
           hold(0);
           collapse;
         }
         hold(400);
         ++a; // should be executed
       }
       return a;
     });

test("collapse 5", 3, 
     function() { 
       var a = 0;
       waitfor {
         hold(100);
         a += 10; // should not be executed
       }
       or {
         try {
           hold(100);
           a += 20; // should not be executed
         }
         finally {
           hold(0);
           a += 2; // should be executed
         }
       }
       or {
         hold(0);
         if (true) {
           hold(0);
           collapse;
         }
         hold(400);
         ++a; // should be executed
       }
       return a;
     });

test("collapse abort", 107, 
     function() { 
       var a = 0;
       waitfor {
         waitfor {
           hold(10);
           a += 10;
         }
         or {
           a += 7;
           hold(0);
           collapse;
           ++a;
         }
       }
       or {
         a += 100;
       }
       return a;
     });

test("complex collapse abort", 127, 
     function() { 
       var a = 0;
       waitfor {
         waitfor {
           try {
             hold(200);
             a += 10; // not executed
           }
           finally {
             hold(200);
             a += 20; // executed
           }
         }
         or {
           a += 7; // executed
           hold(0);
           collapse;
           ++a; // not executed
         }
       }
       or {
         hold(100);
         a += 100; // executed
       }
       return a;
     });

test("complex collapse abort 2", 126, 
     function() { 
       var a = 0;
       waitfor {
         waitfor {
           try {
             hold(200);
             a += 10; // not executed
           }
           finally {
             hold(200);
             a += 20; // executed
           }
         }
         or {
           a += 7; // executed
           hold(0);
           try {
             collapse;
             ++a; // not executed
           }
           finally {
             hold(100);
             --a; // executed
           }
         }
       }
       or {
         hold(100);
         a += 100; // executed
       }
       return a;
     });

test('spawn/waitforValue/abort', [
  'first: waiting on stratum',
  'second: aborting stratum',
  'error: stratum aborted'], function() {
  var log = [];
  var s = spawn(hold());
  waitfor {
    log.push("first: waiting on stratum");
    try {
      s.waitforValue();
      log.push("first: wait returned normally");
    } catch(e) {
      log.push("error: " + e.message);
    }
  } or {
    log.push("second: aborting stratum");
    s.abort();
    hold(1000);
    log.push("waitforValue() didn't return");
  }
  return log;
});

test("'this' pointer in async for-in bug", 1212331, function() { 
  var rv;
  var a = { i:1212331, foo: function(o) { for (var x in o) { hold(0); rv = this.i; } } }; 
  a.foo([2,3,4]); 
  return rv;
});
