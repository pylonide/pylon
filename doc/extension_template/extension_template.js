/**
 * Extension Template for the Cloud9 IDE client
 * 
 * Inserts a context menu item under the "Edit" menu, which, upon being
 * clicked displays a simple window with a "Close" button
 * 
 * To see this extension in action, go to File -> Extensions Manager... and 
 * enter in ext/extension_template/extension_template
 * 
 * Use this template as a guideline and reference point. It is documented
 * extensively to aide the developer, however it is not comprehensive. Please
 * see other extensions to grok how they work and how you can achieve similar
 * functionality they offer.
 * 
 * In addition please reference the following article which offers more details
 * on extensions including a list of common cloud9 UI elements:
 * http://cloud9ide.posterous.com/writing-an-extension-for-cloud9-javascript-id
 * 
 * 
 *                        *** EXTENSION FLOW ***
 * An extension typically follows this flow:
 * 1. Load dependencies with requireJS
 * 2. Load the AML markup associated with the extension (if any)
 * 3. Fill out extension properties (name, developer, markup, etc)
 * 4. Define extension variables and methods
 * 5. Pass the extension object to ext.register
 *
 * 
 *                    *** LOADING YOUR EXTENSION ***
 * Your extension is not, by default, automatically loaded into Cloud9 just by 
 * existing in the ext folder. To load your extension you can do so in two ways:
 * 
 * 1. Load manually via the Extension Manager
 *    - Go to File -> Extension Manager...
 *    - Type your extension path into the input area;
 *      *For this template that is: ext/extension_template/extension_template
 *    - Hit enter or click "Add"
 *    - If it worked, your extension details will appear in the extension list
 * 
 * 2. Load on Cloud9 Startup by appending cloud9/server/cloud9/ide.js
 *    - Open ide.js
 *    - Look for the line with "plugins: options.plugins || [" (at the time of
 *      this writing, on line 32)
 *    - Add your extension path to the list that follows
 * 
 * 
 *                      *** TROUBLESHOOTING ***
 * If your extension does not load or perform properly, please open your 
 * browser's developer console (or FireBug on FireFox) to inspect any errors.
 * Consult the Web for information regarding your browser's developer console.
 * 
 * You can run your local cloud9 instance in debug mode to see verbose status 
 * and error messages. Include the -d flag when starting cloud9 from your
 * terminal. These status and error messages are outputted to your browser's
 * developer console.
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

/**
 * Below we load resources with requireJS
 * 
 * A Cloud9 extension only requires you to include the core module "ext".
 * However, if you want to interface with the cloud9 IDE in some way,
 * you will need to require "core/ide"
 * 
 * Depending on your needs, you can load other modules and extensions
 * 
 * For example, to add your extension to the dock panel, you would need
 * to first require("ext/dockpanel/dockpanel")
 * 
 * require() returns an object we can then interface with from within 
 * our extension
 * 
 * To learn more about requireJS, please see the Website for requireJS at:
 * http://requirejs.org/
 */

var ext = require("core/ext");
var ide = require("core/ide");

/**
 * The following require() call with the "text!" prefix tells requireJS 
 * to load the document contents as text
 * 
 * The contents of extension_template.xml are returned and stored in "markup"
 * 
 * The core extension module (core/ext) references this markup and inserts 
 * it into the body of the browser document. You can then reference elements 
 * within your markup by their id attribute or by performing XPATH operations
 * 
 * Note: Your extension does not need to have markup associated with it. You 
 * only need to reference markup if your extension has a primary user 
 * interface component
 * 
 * Please see http://ui.ajax.org/ for getting started with APF, the Ajax.org 
 * PlatForm and AML, the Ajax.org Markup Language used by Cloud9
 */

var markup = require("text!ext/extension_template/extension_template.xml");
        
module.exports = ext.register("ext/extension_template/extension_template", {
    /**
     * Extension Properties
     * 
     * ------------------------------------------------------------------------
     * Prop    | Required  |  Description
     * ------------------------------------------------------------------------
     * name    | required  |  name of extension
     * dev     | optional  |  developer name displayed in extension manager
     * alone   | optional  |  boolean specifying whether this extension can live
     *         |           |  alone or only as a child of another extension
     * type    | optional  |  extension type. currently only ext.GENERAL and
     *         |           |  ext.EDITOR are supported. this property may become
     *         |           |  deprecated in the future.
     * markup  | optional  |  string containing the markup for the UI component
     *         |           |  associated with this extension
     * visible | optional  |  boolean specifying whether this extension is 
     *         |           |  visible at load time. this property is only used
     *         |           |  for Panel extensions
     * ------------------------------------------------------------------------
     */
    name     : "Extension Template",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    
    /**
     * The nodes variable is used to hold references to APF objects
     * created by the extension at runtime. When the extension is destroyed 
     * (the destroy() method, defined below, is called), a loop goes 
     * through all nodes and destroys them as well.
     * 
     * Please reference the destroy() method below to see how this is achieved
     */
     
    nodes : [],

    /**
     * Extension Methods
     * 
     * Methods are detailed above each function definition. The following
     * list denotes whether a method is required or optional
     * 
     * -------------------------
     * | Method   |  Required  |
     * -------------------------
     * | init     |  required  |
     * | hook     |  optional  |
     * | enable   |  required  |
     * | disable  |  required  |
     * | destroy  |  required  |
     * -------------------------
     */
    
    /**
     * init()
     *  _required_
     * 
     * If the optional hook() method is NOT defined, this function is called 
     * during the initialization of the extension, after the markup is parsed.
     * If the hook() method IS defined, this function must be called manually
     * from the hook() method.
     *
     * Because the extension markup is parsed before this function is called, 
     * all elements in the markup are available from within init().
     * 
     * ** Special Cases **
     * 
     * Editor Extensions
     * 
     * If your extension type is of ext.EDITOR, the first argument of the 
     * init function is a reference to the page element of the document tab. 
     * From this reference you can modify the page element (e.g. fill with 
     * UI elements)
     * 
     * Panel Extensions
     * 
     * If you are creating a panel extension, you are required to set
     * this.panel to an element that will operate as a panel in the Cloud9 UI 
     * (usually this is a window element). In addition you will need to require
     * the panels module above with the other require() statements...
     *   var panels = require("ext/panels/panels");
     * and in your hook() method you will need to call:
     *   panels.register(this);
     */
    init : function(amlNode){
        // winExtensionTemplate is a reference to the window in
        // the AML in extension_template.xml. This reference is used 
        // in the menu item created below in the hook() function
        this.winExtensionTemplate = winExtensionTemplate;
    },
    
    /**
     * hook
     *  _optional_
     * 
     * This function is called when the extension is registered. It allows you 
     * to delay initialization of the extension. You would delay initialization
     * if you wanted to perform operations related to your extension before it
     * is offered to the user.
     * 
     * For example, you could add a menu item to the top-level Edit menu that,
     * when clicked, triggers the initialization of the extension. 
     * 
     * When you do specify a hook function you are responsible for 
     * initializing the extension yourself. An extension is initialized by
     * calling ext.initExtension(_self); where _self is a reference 
     * to this extension.
     * 
     * ** Special Cases **
     *
     * Panel Extensions
     * 
     * The hook() method is required for panel extensions. This is where you 
     * will need to register your extension with the panels module by calling:
     *   panels.register(this);
     */
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Extension Template Window",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.winExtensionTemplate.show();
                }
            }))
        );
    },
    
    /**
     * enable
     *  _required_
     * 
     * This function is called when the extension is enabled. This should not 
     * be mistaken with enabling/disabling the extension in the extension 
     * manager, which calls init and destroy. This function is called for 
     * instance when a panel extension is shown via the Windows menu.
     */
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    /**
     * disable
     *  _required_
     * 
     * This function is called when the extension is disabled. This should not 
     * be mistaken with enabling/disabling the extension in the extension 
     * manager, which calls init and destroy. This function is called for 
     * instance when a panel extension is hidden via the Windows menu.
     */
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },
    
    /**
     * destroy
     *  _required_
     * 
     * This function is called during deinitialization of the extension. It 
     * should do proper cleanup of all UI elements created by the extension, 
     * event handlers and other states it brought into Cloud9. This function 
     * is called when disabling the extension in the extension manager.
     */
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    },
    
    /**
     * Custom Functions
     * 
     * Your extension may include additional functionality on top of the
     * standard functionality required of every extension.
     * 
     * For more information regarding custom functions and how to use them,
     * please reference the following article:
     * http://cloud9ide.posterous.com/writing-an-extension-for-cloud9-javascript-id
     * 
     * Below is a basic function called from the onclick handler of an AML
     * button defined in extension_template.xml
     */
     closeExtensionTemplateWindow : function(){
        this.winExtensionTemplate.hide();
     }
});

});