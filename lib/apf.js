var sys = require("sys");

self = window = global;
self.sys = sys;

global.o3 = require("o3");

require("../../www/js2/trunk/apf-o3");
require("../../www/js2/trunk/loader-o3");

apf.start();
