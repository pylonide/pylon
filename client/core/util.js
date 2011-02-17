/**
 * Utilities for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
var ide = require("core/ide");

exports.alert = function(title, header, msg, onhide) {
    winAlert.show();
    winAlert.setAttribute('title', title);
    winAlertHeader.$ext.innerHTML = header;
    winAlertMsg.$ext.innerHTML = msg;
    if (onhide)
        winAlert.onhide = function() {
            winAlertMsg.onhide = null;
            onhide();
        };
    else
        winAlert.onhide = null;
};

exports.confirm = function(title, header, msg, onconfirm) {
    winConfirm.show();   
    winConfirm.setAttribute("title", title);
    winConfirmHeader.$ext.innerHTML = header;
    winConfirmMsg.$ext.innerHTML = msg;
    btnConfirmOk.onclick = onconfirm;
};

exports.question = function(title, header, msg, onyes, onyestoall, onno, onnotoall) {
    winQuestion.show();   
    winQuestion.setAttribute("title", title);
    winQuestionHeader.$ext.innerHTML = header;
    winQuestionMsg.$ext.innerHTML = msg;
    btnQuestionYes.onclick = onyes;
    btnQuestionYesToAll.onclick = onyestoall;
    btnQuestionNo.onclick = onno;
    btnQuestionNoToAll.onclick = onnotoall;
};

});