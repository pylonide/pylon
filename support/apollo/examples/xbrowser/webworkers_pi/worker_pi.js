// long-running calculation of pi:

function calcPi(digits) {
  var d = Math.floor(digits/4+4)*14;
  var rv = "";
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
    var s = "" + Math.floor(carry + sum/10000);
    while (s.length < 4) s = "0" + s;
    rv += s;
    carry = sum % 10000;
  }
  if (rv.length > digits)
    rv = rv.substr(0,digits);
  // pass message with result to caller: 
  self.postMessage(rv);
}

self.addEventListener('message', function(e) { calcPi(e.data); }, false);
