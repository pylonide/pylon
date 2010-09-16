/**
 * Utilities for the Ajax.org Cloud IDE
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