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
            }
        };
    }
);