var sys = require("sys");

self = window = global;
self.sys = sys;

global.o3 = require("o3");

require("/var/lib/platform/apf-o3");
require("/var/lib/platform/loader-o3");

apf.start();
