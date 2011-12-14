var testUtil = require('../lib/testUtil');
var test = testUtil.test;


if(testUtil.isBrowser) {
  test('install from google', true, function () {
    require("apollo:jquery-binding").install();
    return window.$ == window.jQuery && window.jQuery != null;
  });


  test('.$click', true, function () {
    $("body").append("<div id='test'/>");
    var b = $("#test"); 
    try {
    
      if (b.data("events")) 
        throw "There's an event already";
      waitfor {
        b.$click();
      } or {
        if (!b.data("events").click.length) 
          throw "Event not added";
      }
      if (b.data("events")) {
        console.log(b.data("events").click);
        throw "Event not removed";
      }
    } finally {
      b.remove();
    }
    return true;
  });

  test('.$live', true, function () {
    try {
      var s = $(".testlive");
      waitfor {
      waitfor {
        s.$live("click");
        // XXX test if we actually clean up
      } and {
        $("body").append("<div id='test' class='testlive' style='width:100px;height:100px;background:red'/>");
        $("#test").click();
      }
      } or {
        throw "Event not working";
      }
    } finally {
      $(".testlive").remove();
    }
    return true;
  });
}
