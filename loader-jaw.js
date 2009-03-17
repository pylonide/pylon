/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __SUPPORT_JAW

/* ***************************************************************
**
**      Bootloader for Javeline PlatForm to run on JAW
**
**      First include jpf.js, then include this file (jaw.js)
**      Then just go about it as you would with the packaged version
**      Adapt this file to include your preferred modules
**
****************************************************************/

if (!jpf.basePath)
    jpf.basePath = "./";

jpf.Modules = [
    "JmlParser",
    "XmlDatabase"
];
jpf.Components = [
    
];
jpf.KernelModules = [
    "xmldatabase.js",
    
    "crypto/base64.js",
    "crypto/md5.js",
    
    "lib/util/utilities.js",
    "lib/util/ecmaext.js",
    "lib/util/nameserver.js",
    
    "lib/date.js",
    
    "browsers/is_ie.js",
    "browsers/is_jaw.js",
   
    "parsers/xpath.js",
    "parsers/xslt.js",
    "parsers/jslt.js",
    "parsers/url.js",
    "parsers/js.js",
    
    "class.js",
    "debug/debug.js"
    // "datainstructions.js"
];
jpf.TelePortModules = [
    "http.js"         // for simple HTTP transactions
];

//Load depencies & start
jpf.startDependencies();

// #endif
