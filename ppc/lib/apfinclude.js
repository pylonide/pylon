var sys = require("sys");

self = window = global;
self.sys = sys;

global.o3 = require("o3");

require("apf-o3");
require("loader-o3");

apf.start();
