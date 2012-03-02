#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (process.platform == "darwin")
    process.argv.push("-a", "open");
else
    process.argv.push("-a", "x-www-browser");

require("./cloud9.js");