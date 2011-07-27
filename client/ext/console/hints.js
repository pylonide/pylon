/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var winHints, hintNodes, selectedHint, animControl, hintsTimer;

function mouseHandler(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType == 3 && el.tagName != "A" && el != winHints)
        el = el.parentNode;
    if (el.tagName != "A") return;
    hintsTimer = setTimeout(function() {
        exports.select(el);
    }, 5);
}

exports.init = function() {
    if (winHints) return;
    winHints = document.getElementById("barConsoleHints");
    apf.addListener(winHints, "mousemove", mouseHandler.bind(this));
};

var fontSize;
function getFontSize(txtNode) {
    if (fontSize)
        return fontSize;
    var font = apf.getStyle(txtNode, "font");
    var el = document.createElement("span");
    el.style.font = font;
    el.innerHTML = "W";
    document.body.appendChild(el);
    fontSize = {
        width: el.offsetWidth,
        height: el.offsetHeight
    };
    document.body.removeChild(el);
    return fontSize;
}

exports.show = function(textbox, base, hints, cmdsLut, cursorPos) {
    var name = "console_hints";
    if (typeof textbox == "string")
        textbox = self[textbox];
    //console.log("showing hints for ", base, hints && hints[0]);
    //base = base.substr(0, base.length - 1);

    if (animControl && animControl.stop)
        animControl.stop();

    var cmdName, cmd, isCmd,
        content = [],
        i       = 0,
        len     = hints.length;

    for (; i < len; ++i) {
        cmdName = base ? base + hints[i].substr(1) : hints[i];
        //console.log("isn't this OK? ", cmdName, base);
        cmd   = cmdsLut && cmdsLut[cmdName];
        isCmd = !!cmd;
        content.push('<a href="javascript:void(0);" onclick="require(\'ext/console/console\').hintClick(this);" ' 
            + 'data-hint="'+ base + ',' + cmdName + ',' + textbox.id + ',' + cursorPos + ',' + isCmd + '">'
            + cmdName + (cmd
            ? '<span>' + cmd.hint + (cmd.hotkey
                ? '<span class="hints_hotkey">' + (apf.isMac
                    ? apf.hotkeys.toMacNotation(cmd.hotkey)
                    : cmd.hotkey) + '</span>'
                : '') + '</span>'
            : '')
            + '</a>');
    }

    exports.init();
    hintNodes = null;
    selectedHint = null;

    winHints.innerHTML = content.join("");

    if (apf.getStyle(winHints, "display") == "none") {
        //winHints.style.top = "-30px";
        winHints.style.display = "block";
        winHints.visible = true;
        //txtConsoleInput.focus();

        //Animate
        /*apf.tween.single(winHints, {
            type     : "fade",
            anim     : apf.tween.easeInOutCubic,
            from     : 0,
            to       : 100,
            steps    : 8,
            interval : 10,
            control  : (this.control = {})
        });*/
    }

    var pos = apf.getAbsolutePosition(textbox.$ext, winHints.parentNode);
    var size = getFontSize(textbox.$ext);
    winHints.style.left = Math.max(cursorPos * (size.width - 1.6) + 5, 5) + "px";
    //winHints.style.top = (pos[1] - winHints.offsetHeight) + "px";
};

exports.hide = function() {
    exports.init();
    winHints.style.display = "none";
    winHints.visible = false;
    selectedHint = null;
    //@todo: animation
};

exports.click = function(node) {
    var parts       = node.getAttribute("data-hint").split(","),
        base        = parts[0],
        cmdName     = parts[1],
        txtId       = parts[2],
        insertPoint = parseInt(parts[3]),
        isCmd       = (parts[4] == "true");

    if (isCmd)
        cmdName += " "; // for commands we suffix with whitespace
    var textbox = self[txtId],
        input   = textbox.$ext.getElementsByTagName("input")[0],
        val     = textbox.getValue(),
        before  = val.substr(0, (insertPoint + 1 - base.length)) + cmdName;
    textbox.setValue(before + val.substr(insertPoint + 1));
    textbox.focus();
    // set cursor position at the end of the text just inserted:
    var pos = before.length;
    if (apf.hasMsRangeObject) {
        var range = input.createTextRange();
        range.expand("textedit");
        range.select();
        range.collapse();
        range.moveStart("character", pos);
        range.moveEnd("character", 0);
        range.collapse();
    }
    else {
        input.selectionStart = input.selectionEnd = pos;
    }

    exports.hide();
};

exports.selectUp = function() {
    if (!hintNodes)
        hintNodes = winHints.getElementsByTagName("a");
    return exports.select(selectedHint - 1 < 0 ? hintNodes.length - 1 : --selectedHint);
};

exports.selectDown = function() {
    if (!hintNodes)
        hintNodes = winHints.getElementsByTagName("a");
    return exports.select(selectedHint + 1 > hintNodes.length - 1 ? 0 : ++selectedHint);
};

exports.select = function(hint) {
    clearTimeout(hintsTimer);
    if (!hintNodes)
        hintNodes = winHints.getElementsByTagName("a");

    if (typeof hint == "number")
        hint = hintNodes[hint];

    for (var i = 0, l = hintNodes.length; i < l; ++i) {
        if (hintNodes[i] === hint) {
            selectedHint = i;
            continue;
        }
        hintNodes[i].className = "";
    }
    if (hint)
        hint.className = "selected";
};

exports.visible = function() {
    return winHints && !!winHints.visible;
};

exports.selected = function() {
    return selectedHint && hintNodes
        ? hintNodes[selectedHint]
        : false;
};

});