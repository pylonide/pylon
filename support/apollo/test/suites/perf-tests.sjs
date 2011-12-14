var testUtil = require('../lib/testUtil');
var test = testUtil.test;
var time = testUtil.time;
var getHttpURL = require("../lib/testContext").getHttpURL;

function testJsonpRequest(opts) {
    return require("apollo:http").jsonp(getHttpURL("data/returnJsonp.template"), [{query: {data:"bananas"}},opts]);
}

time("10 sequential jsonp in-doc requests",
     function() {  for (var i=0;i<10;++i) { testJsonpRequest({iframe:false,query:{cb:Math.random()}}) } }).skip("machinery for this test is not in place atm");

time("10 sequential jsonp iframe requests",
     function() {  for (var i=0;i<10;++i) { testJsonpRequest({iframe:true,query:{cb:Math.random()}}) } }).skip("machinery for this test is not in place atm");

var iter;
eval("iter = function(f,reps) { for (var i=0; i<reps; ++i) f(); }");

var bl_1;
eval("function foo() { var a = 1; return ++a;} bl_1 = function() { iter(foo,1000000);}");


var bl_2;
eval("function bar() { var a = 1; return ++a; a=Math.sin(a)*10; if (a>100)a = 10; else a+=100; try{a/=0}catch(e) {a=1;}finally{if(a) {dump(a);}}} bl_2 = function() { iter(bar,1000000);}");


function small() {
  var a = 1;
  return ++a;
}

function small_addendum() {
  var a = 1;
  return ++a;
  // this code is never reached, but it still adds to the time
  a = Math.sin(a) * 10;
  if (a > 100) a = 10; else a+=100;
  try { a/=0 }catch(e) { a=1; }finally{ if(a) { dump(a); } }
}

time("baseline small * 1000000", function() { bl_1(); });
time("small function *   10000", function() { iter(small, 10000); });
time("baseline small+addendum * 1000000", function() { bl_2(); });
time("small+addendum function *   10000", function() { iter(small_addendum,10000); });

function calculatePi(d) {
  d = Math.floor(d/4)*14;
  var carry = 0;
  var arr = [];
  var sum;
  var i, j;
  for (i = d; i > 0; i -= 14) {
    sum = 0;
    for (j = i; j > 0; --j) {
      sum = sum * j + 10000 * (arr[j] === undefined ? 2000 : arr[j]);
      arr[j] = sum % (j * 2 - 1);
      sum = Math.floor(sum/(j * 2 - 1));
    }
    hold(0);
    carry = sum % 10000;
  }
}

time("pi to 500 digits", function() { calculatePi(500); });

time("coll.each(arr*100)*100)", function() { 
  var coll = require('apollo:collection');
  var arr = [];
  for (var i=0; i<100; ++i) arr.push(i);
  var accu = 0;
  coll.each(arr, function() { coll.each(arr, function(v) { accu += v; }) });
});
