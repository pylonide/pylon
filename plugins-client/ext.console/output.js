/**
 * Console output for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {
module.exports = {
    general: {
        "i read the source code": "<3",
        "lpr": "PC LOAD LETTER",
        "hello joshua": "How about a nice game of Global Thermonuclear War?",
        "xyzzy": "Nothing happens.",
        "hello": "Why hello there!",
        "su": "God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.",
        "fuck": "I have a headache.",
        "nano": "Seriously? Why don't you just use Notepad.exe? Or MS Paint?",
        "moo":"moo",
        "hi":"Hi.",
        "bash": "You bash your head against the wall. It's not very effective.",
        "ssh": "ssh, this is a library.",
        "use the force luke": "I believe you mean source.",
        "use the source luke": "I'm not luke, you're luke!",
        "serenity": "You can't take the sky from me.",
        "enable time travel": "TARDIS error: Time Lord missing.",
        "ed": "You are not a diety."
    },
    sudo: {
        "make me a sandwich": "Okay.",
        "apt-get moo": [" ",
            "        (__)",
            "        (oo)",
            "  /------\\/ ",
            " / |    ||  ",
            "*  /\\---/\\  ",
            "   ~~   ~~  ",
            "....\"Have you mooed today?\"...",
            " "],
        "__default__": "E: Invalid operation %s"
    },
    // If there is a predefined (i.e. hardcoded) output for the current
    // command being executed in the CLI, show that.
    getPredefinedOutput: function(argv) {
        var rest;
        var out = this[argv[0]];
        if (out) {
            rest = argv.slice(1).join(" ").trim();
            return out[rest] || out.__default__.replace("%s", argv[0]);
        }
        else {
            rest = argv.join(" ").trim();
            return this.general[rest] || "";
        }
    }
};
});

