//#ifdef __WITH_HOTKEY
//@todo maybe generalize this to pub/sub event system??
/**
 * @private
 */
apf.hotkeys = {};
(function() {
    /**
     * @private
     */
    var keyMods = {"ctrl": 1, "alt": 2, "option" : 2, "shift": 4, "meta": 8, "command": 8};

    /**
     * @private
     */
    this.keyNames = {
        "8"  : "Backspace",
        "9"  : "Tab",
        "13" : "Enter",
        "27" : "Esc",
        "32" : "Space",
        "33" : "PageUp",
        "34" : "PageDown",
        "35" : "End",
        "36" : "Home",
        "37" : "Left",
        "38" : "Up",
        "39" : "Right",
        "40" : "Down",
        "45" : "Insert",
        "46" : "Del",
        "107": "+",
        "112": "F1",
        "113": "F2",
        "114": "F3",
        "115": "F4",
        "116": "F5",
        "117": "F6",
        "118": "F7",
        "119": "F8",
        "120": "F9",
        "121": "F10",
        "122": "F11",
        "123": "F12",
        "188": ",",
        "219": "[",
        "221": "]"
    };

    var macUnicode = {
        "meta"     : "\u2318", // ⌘
        "command"  : "\u2318",
        "alt"      : "\u2325", // ⌥
        "option"   : "\u2325",
        "shift"    : "\u21E7", // ⇧
        "esc"      : "\u238B", // ⎋
        "control"  : "\u2303", // ⌃
        "backspace": "\u232B", // ⌫
        "del"      : "\u2326", // ⌦
        "enter"    : "\u21A9"  // ↩
    };
    
    var macUnicodeHtml = {
        "meta"     : "&#8984;", // ⌘
        "command"  : "&#8984;",
        "alt"      : "&#8997;", // ⌥
        "option"   : "&#8997;",
        "shift"    : "&#8679;", // ⇧
        "esc"      : "&#9099;", // ⎋
        "control"  : "&#2303;", // ⌃ TODO
        "backspace": "&#232B;", // ⌫ TODO
        "del"      : "&#2326;", // ⌦ TODO
        "enter"    : "&#21A9;"  // ↩ TODO
    };

    // hash to store the hotkeys in
    this.$keys = {};

    var _self = this, trace = 0;
    
    function register(hotkey, handler) {
        var key,
            hashId = 0,
            keys   = hotkey.splitSafe("\\-", null, true),
            i      = 0,
            l      = keys.length;

        for (; i < l; ++i) {
            if (keyMods[keys[i]])
                hashId = hashId | keyMods[keys[i]];
            else
                key = keys[i] || "-"; //when empty, the splitSafe removed a '-'
        }

        //#ifdef __DEBUG
        if (!hashId)
            console.warn("missing modifier keys for hotkey: " + hotkey);
        if (!key)
            throw new Error("missing key for hotkey: " + hotkey);
        /*#else
        if (!key) return;
        #endif*/

        if (!_self.$keys[hashId])
            _self.$keys[hashId] = {};
        _self.$keys[hashId][key] = handler;
    }

    /**
     * Registers a hotkey handler to a key combination.
     * Example:
     * <code>
     *   apf.registerHotkey('Ctrl-Z', undoHandler);
     * </code>
     * @param {String}   hotkey  the key combination to user. This is a
     * combination of Ctrl, Alt, Shift and a normal key to press. Use + to
     * seperate the keys.
     * @param {Function} handler the code to be executed when the key
     * combination is pressed.
     */
    apf.registerHotkey = this.register = function(hotkey, handler){
        var parts = hotkey.split("|"),
            i     = 0,
            l     = parts.length;
        for (; i < l; ++i)
            register(parts[i], handler);
    };

    this.$exec = function(eInfo) {
        var hashId = 0 | (eInfo.ctrlKey ? 1 : 0) | (eInfo.altKey ? 2 : 0)
            | (eInfo.shiftKey ? 4 : 0) | (eInfo.metaKey ? 8 : 0),
            code   = eInfo.keyCode;

        var key = _self.keyNames[code] 
            || (code && code > 46 && code != 91 ? String.fromCharCode(code) : null);
        if (!hashId || !key) //Hotkeys should always have one of the modifiers
            return;

        if (_self.$keys[hashId] && (handler = _self.$keys[hashId][key.toLowerCase()])) {
            handler(eInfo.htmlEvent);
            eInfo.returnValue = false;
            // #ifdef __WITH_QUEUE
            apf.queue.empty();
            // #endif
        }

        return eInfo.returnValue;
    };

    /**
     * Removes a registered hotkey.
     * @param {String} hotkey the hotkey combination.
     */
    apf.removeHotkey = this.remove = this.unregister = function(hotkey) {
        var parts = hotkey.split("|"),
            i     = 0,
            l     = parts.length;
        for (; i < l; ++i)
            register(parts[i], null);
    };
    
    function toMacNotation(hotkey, bHtml) {
        var t,
            keys = hotkey.splitSafe("\\-"),
            i    = 0,
            l    = keys.length;

        for (; i < l; ++i) {
            if (!keys[i]) continue;
            if (t = (bHtml ? macUnicodeHtml : macUnicode)[keys[i].toLowerCase()])
                keys[i] = t;
        }
        return keys.join(" ");
    }

    this.toMacNotation = function(hotkey, bHtml) {
        var parts = hotkey.split("|"),
            i     = 0,
            l     = parts.length,
            res   = [];
        for (; i < l; ++i)
            res.push(toMacNotation(parts[i], bHtml));
        return res.join(" | ");
    };

    apf.addEventListener("keydown", function(eInfo) {
        var e = eInfo.htmlEvent;
        //Hotkey
        if (/*!eInfo.isTextInput && */_self.$exec(eInfo) === false
          || eInfo.returnValue === false) {
            apf.stopEvent(e);
            if (apf.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            return false;
        }

        //#ifdef __WITH_HOTKEY_PROPERTY
        var keys = [];
        if (e.altKey)
            keys.push("Alt");
        if (e.ctrlKey)
            keys.push("Ctrl");
        if (e.shiftKey)
            keys.push("Shift");
        if (e.metaKey)
            keys.push("Meta");

        if (_self.keyNames[e.keyCode])
            keys.push(_self.keyNames[e.keyCode]);

        if (keys.length) {
            if (e.keyCode > 46 && !_self.keyNames[e.keyCode])
                keys.push(String.fromCharCode(e.keyCode));
            apf.setProperty("hotkey", keys.join("-"));
        }
        //#endif
    });
}).call(apf.hotkeys);

//#endif
