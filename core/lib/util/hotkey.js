//#ifdef __WITH_HOTKEY
//@todo maybe generalize this to pub/sub event system??
/**
 * @private
 */
apf.hotkeys = {};

/**
 * @private
 */
apf.keyMods = {"ctrl": 1, "alt": 2, "shift": 4, "meta": 8};

/**
 * @private
 */
apf.keyNames = {
    "32" : "Spacebar",
    "13" : "Enter",
    "9"  : "Tab",
    "27" : "Esc",
    "46" : "Del",
    "36" : "Home",
    "35" : "End",
    "107": "+",
    "37" : "Left Arrow",
    "38" : "Up Arrow",
    "39" : "Right Arrow",
    "40" : "Down Arrow",
    "33" : "Page Up",
    "34" : "Page Down",
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
    "123": "F12"
};

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
apf.registerHotkey = function(hotkey, handler){
    var hashId = 0, key;

    var keys = hotkey.splitSafe("\\-|\\+| ", null, true),
        bHasCtrl = false,
        bHasMeta = false;
    for (var i = 0; i < keys.length; i++) {
        if (apf.keyMods[keys[i]]) {
            hashId = hashId | apf.keyMods[keys[i]];
            if (apf.isMac) {
                bHasCtrl = (apf.keyMods[keys[i]] === apf.keyMods["ctrl"]);
                bHasMeta = (apf.keyMods[keys[i]] === apf.keyMods["meta"]);
            }
        }
        else
            key = keys[i];
    }

    if (bHasCtrl && !bHasMeta) //for improved Mac hotkey support
        hashId = hashId | apf.keyMods["meta"];

    //#ifdef __DEBUG
    if (!key) {
        throw new Error("missing key for hotkey: " + hotkey);
    }
    //#endif

    (apf.hotkeys[hashId] || (apf.hotkeys[hashId] = {}))[key] = handler;

    if (!apf.initHotkey) {
        apf.initHotkey = true;
        apf.addEventListener("hotkey", function(e){
            // enable meta-hotkey support for macs, like for Apple-Z, Apple-C, etc.
            if (apf.isMac && e.metaKey)
                e.ctrlKey = true;
            var hashId = 0 | (e.ctrlKey ? 1 : 0)
                | (e.shiftKey ? 2 : 0) | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);

            var key = apf.keyNames[e.keyCode];
            if (!hashId && !key) //Hotkeys should always have one of the modifiers
                return;

            var handler = (apf.hotkeys[hashId] || {})[(key
                || String.fromCharCode(e.keyCode)).toLowerCase()];
            if (handler) {
                handler();
                e.returnValue = false;
            }
        });
    }
};

/**
 * Removes a registered hotkey.
 * @param {String} hotkey the hotkey combination.
 */
apf.removeHotkey = function(hotkey){
    apf.registerHotkey(hotkey, null);
};
//#endif