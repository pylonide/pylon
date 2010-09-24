var yuicompressor = "java -jar /var/lib/packager/yuicompressor-2.4.2/build/yuicompressor-2.4.2.jar --preserve-semi --charset utf-8 %s -o %s";

var Sys  = require("sys"),
    Path = require("path"),
    Fs   = require("fs");

/**
 * compress JS or CSS
 */
apf.process.handler.compress = function(x){
    // todo;
}