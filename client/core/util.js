/**
 * Utilities for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("core/util",
    ["core/ide"],
    function(ide) {
        return {
            alert : function(title, header, msg) {
                winAlert.show();
                winAlert.setAttribute('title', title);
                winAlertHeader.$ext.innerHTML = header;
                winAlertMsg.$ext.innerHTML = msg;
            },
            confirm : function(title, header, msg, onconfirm) {
                winConfirm.show();   
                winConfirm.setAttribute("title", title);
                winConfirmHeader.$ext.innerHTML = header;
                winConfirmMsg.$ext.innerHTML = msg;
                btnConfirmOk.onclick = onconfirm;
            },
            question : function(title, header, msg, onyes, onyestoall, onno, onnotoall) {
                winQuestion.show();   
                winQuestion.setAttribute("title", title);
                winQuestionHeader.$ext.innerHTML = header;
                winQuestionMsg.$ext.innerHTML = msg;
                btnQuestionYes.onclick = onyes;
                btnQuestionYesToAll.onclick = onyestoall;
                btnQuestionNo.onclick = onno;
                btnQuestionNoToAll.onclick = onnotoall;
            }
        };
    }
);