/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/code/code",
    ["core/ide", "core/ext", "text!ext/code/code.xml"],
    function(ide, ext, markup) {

return ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "application/javascript",
        "application/json",
        "text/css",
        "application/xml",
        "text/plain",
        "application/x-httpd-php",
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,

    nodes : [],
    
    hook : function(){
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("Code Editor", "section[@name='Editor']");
            page.insertMarkup(
              '<a:application xmlns:a="' + apf.ns.aml + '">'
                + '<a:frame caption="Code Editor" anchors="0 0 0 0">'
                    + '<a:table columns="100,144" padding="5">'
                        + '<a:label>Font Size</a:label><a:slider value="[@fontsize]" min="8" max="72" mask="#" snap="1" />'
                    + '</a:table>'
                  + '</a:frame>'
              + '</a:application>');
        });
    },

    init : function(amlPage){
        amlPage.appendChild(barEditor);

        //Append the button bar to the main toolbar
        var nodes = barCodeTb.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{ceEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {ceEditor.value.length}"
            })),
            
            mnuView.appendChild(new apf.item({
                caption : "Syntax Highlighting",
                submenu : "mnuSyntax"
            })),
            
            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Column Mode",
                onclick : function(){
                    
                }
            }))
        );
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (self.barEditor) {
            barEditor.destroy(true, true);
            barCodeTb.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }
        
        this.nodes = [];
    }
});

});