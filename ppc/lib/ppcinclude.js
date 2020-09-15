var sys = require("sys");

self = window = global;
self.sys = sys;

global.o3 = require("o3");

require("ppc-o3");
require("loader-o3");

ppc.start();
