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
        "make me a sandwich": "What? Make it yourself!",
        "make love": "I put on my robe and wizard hat.",
        "i read the source code": "<3",
        "lpr": "PC LOAD LETTER",
        "hello joshua": "How about a nice game of Global Thermonuclear War?",
        "xyzzy": "Nothing happens.",
        "date": "March 32nd",
        "hello": "Why hello there!",
        "who": "Doctor Who?",
        "su": "God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.",
        "fuck": "I have a headache.",
        "whoami": "You are Richard Stallman.",
        "nano": "Seriously? Why don't you just use Notepad.exe? Or MS Paint?",
        "top": "It's up there --^",
        "moo":"moo",
        "ping": "There is another submarine three miles ahead, bearing 225, forty fathoms down.",
        "find": "What do you want to find? Kitten would be nice.",
        "more":"Oh, yes! More! More!",
        "your gay": "Keep your hands off it!",
        "hi":"Hi.",
        "echo": "Echo ... echo ... echo ...",
        "bash": "You bash your head against the wall. It's not very effective.",
        "ssh": "ssh, this is a library.",
        "uname": "Illudium Q-36 Explosive Space Modulator",
        "finger": "Mmmmmm...",
        "kill": "Terminator deployed to 1984.",
        "use the force luke": "I believe you mean source.",
        "use the source luke": "I'm not luke, you're luke!",
        "serenity": "You can't take the sky from me.",
        "enable time travel": "TARDIS error: Time Lord missing.",
        "ed": "You are not a diety."
    },
    man: {
        "last": "Man, last night was AWESOME.",
        "help": "Man, help me out here.",
        "next": "Request confirmed; you will be reincarnated as a man next.",
        "cat":  "You are now riding a half-man half-cat.",
        "__default__": "Oh, I'm sure you can figure it out."
    },
    locate: {
        "ninja": "Ninja can not be found!",
        "keys": "Have you checked your coat pocket?",
        "joke": "Joke found on user.",
        "problem": "Problem exists between keyboard and chair.",
        "raptor": "BEHIND YOU!!!",
        "__default__": "Locate what?"
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

