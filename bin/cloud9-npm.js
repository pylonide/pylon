#!/usr/bin/env node
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (process.platform == "darwin")
    process.argv.push("-aopen");
else
    process.argv.push("-ax-www-browser");

require("./cloud9.js");