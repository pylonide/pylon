/**
 * UI Manager for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var util = require("core/util");
var markup = require("text!ext/uimgr/uimgr.xml");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");
var css  = require("text!ext/uimgr/style/style.css");

/*global dgExt dgExtUser tbModuleName tabuimgr btnUserExtEnable
  btnDefaultExtEnable winExt btnAdd*/

var LOAD_TIMEOUT_REMOTE = 30 * 1000;
var LOAD_TIMEOUT_LOCAL = 5 * 1000;

module.exports = ext.register("ext/uimgr/uimgr", {
    name   : "UI Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    css    : css,
    desp   : [panels],
    requireFailed : false,

    nodes : [],

    hook : function(){
        var _self = this;
        this.loadSkins();
    },

    init : function(amlNode){
        // Save the manually-loaded extensions
        var _self = this;
        apf.importCssString(this.css || "");
        
    },

    show : function(){
        ext.initExtension(this);
        // winUIExt.show(); return ;
        document.getElementsByTagName("html")[0].setAttribute("style", "overflow: scroll");
        document.body.innerHTML = "";
        document.body.setAttribute("id", "winUIExtContent");
        /* This is the strucuture of the data
        var elements = {
            element: [
                { //skinset
                    name: "skinset",
                    skins: [
                        { //skin
                            name: "skin",
                            versions: [
                                { //version
                                    settings: {},
                                    wrapper: null
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        */
        var elements = {
            bar: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "bar",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "black-menu-bar",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {
                                        "class": "closed minimized"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-header-bar",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "c9-menu-bar",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {
                                        "class": "minimized"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "debug-panel",
                            versions: [
                                { //version
                                    settings: {
                                        height: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "deprecated",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "dock-panel",
                            versions: [
                                { //version
                                    settings: {
                                        height: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "winGoToFile",
                            versions: [
                                { //version
                                    settings: {
                                        "height": "35",
                                        width: "350"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "inlinedg",
                    skins: [
                        { //skin
                            name: "bar-liveinspect",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "quicksearch",
                    skins: [
                        { //skin
                            name: "bar",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "settings",
                    skins: [
                        { //skin
                            name: "bar-preferences",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "statusbar",
                    skins: [
                        { //skin
                            name: "bar-status",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "gotoline",
                    skins: [
                        { //skin
                            name: "bar",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "inlinedg",
                    skins: [
                        { //skin
                            name: "bar-liveinspect",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "language",
                    skins: [
                        { //skin
                            name: "codecomplete",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        }
                    ]
                }
            ],
            button: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "button",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "blackbutton",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "browser-btn",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "browser_arrowleft.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "browser_arrowright.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "browser_refresh.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btn-access_request",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btn-default-css3",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "btn-green",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "btn-red",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btn-default-simple",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btn_console_open",
                            versions: [
                                { //version
                                    settings: {
                                        icon: "switch.png",
                                        height: "27"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "btn_console_open btn_console_openIcon btn_console_openBool btn_console_openEmpty btn_console_openDefault btn_console_openOpen btn_console_openDown",
                                        icon: "switch.png",
                                        height: "27"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btn_icon_only",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {
                                        icon: "console_clear.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "console_max.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "console_settings.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "console_close_btn.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "dim8-8",
                                        icon: "console_close_btn.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "dim14-14",
                                        icon: "console_close_btn.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "dim22-22",
                                        icon: "console_close_btn.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "tabmenubtn",
                                        icon: "console_close_btn.png"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "button-colorless",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button On Dark",
                                        "class": "dark",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "grey",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "light-grey",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "red",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "blue",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "light-blue",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "green",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-menu-btn",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "c9-sidepanelsbutton",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "play.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "pause.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "step.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "stepinto.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "stepback.png"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-simple-btn",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-toolbarbutton",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "with-arrow",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "run.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "stop.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-toolbarbutton-glossy",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "stop.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "save.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "btnSave save",
                                        icon: "save.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "btnSave saving",
                                        icon: "save.png",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "btnSave saved",
                                        icon: "save.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-toolbarbutton-light",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Stop Tests",
                                        icon: "stop.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-toolbarbutton2",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "delete_icon.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-topbar-btn",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "home"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "dashboard"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "dockButton",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "dockheader",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {
                                        "class": "expanded"
                                    }
                                },
                                { //version
                                    settings: {},
                                    wrapperClass: "dockcol"
                                }
                            ]
                        },
                        { //skin
                            name: "github-button",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        icon: "github-kitty.png",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "header-btn",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "panel-settings"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "c9-header-plus"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "c9-header-minus"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "c9-header-divider"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "mnubtn",
                            versions: [
                                { //version
                                    settings: {
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "c9-logo",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "toggle-black-menu-bar",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "spacer",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "rundebug",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "project_files",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "open_files",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "testing",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "visual_editor",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "preferences",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "github_corner",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "deploy",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "the_store",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop1",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop2",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop3",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop4",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button",
                                        width: "100"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        
        var menubar = apf.document.firstChild.appendChild( new apf.bar() ); menubar.$ext.setAttribute("id", "menubar"); menubar.$ext.removeAttribute("style");
        
        var toggleLight = menubar.appendChild( new apf.button({ "caption":"Toggle Light", "class":"fright" }) ); toggleLight.$ext.setAttribute("id", "toggleLight"); toggleLight.$ext.removeAttribute("style");
        toggleLight.addEventListener("click", function(){
            if( document.body.className.indexOf("lightsOff") < 0 )
                document.body.className = " lightsOff ";
            else
                document.body.className = "";
        });
        
        
        //Elements
        for ( var el in elements ) {
            
            var bar = apf.document.firstChild.appendChild( new apf.bar() ); bar.$ext.setAttribute("class", "element"); bar.$ext.setAttribute("id", el); bar.$ext.removeAttribute("style");
            bar.$ext.innerHTML = "<a class='anchor' name='" + el + "'></a><h2 class='title'><a href='http://ui.ajax.org/#docs/element." + el + "' target='_blank'>" + el + "</a></h2>";
            
            var link = document.createElement('a');
            link.innerHTML = el;
            link.setAttribute("class", "link");
            link.setAttribute("href", "#" + el);
            
            menubar.$ext.appendChild( link );
            
            //Skinsets
            for( var skinset = 0; skinset < elements[el].length; skinset++ ) {
                var cskinset = elements[el][skinset];
                var barSkinset = bar.appendChild( new apf.bar() ); barSkinset.$ext.setAttribute("class", "skinset"); barSkinset.$ext.setAttribute("id", el); barSkinset.$ext.removeAttribute("style");
                barSkinset.$ext.innerHTML = "<h3 class='title'>Skinset: " + cskinset.name + "</h3>";
                
                //skin
                for( var skin = 0; skin < cskinset.skins.length; skin++ ) {
                    var cskin = cskinset.skins[skin];
                    
                    var barSkin = barSkinset.appendChild( new apf.bar() ); barSkin.$ext.setAttribute("class", "skin"); barSkin.$ext.setAttribute("id", el); barSkin.$ext.removeAttribute("style");
                    barSkin.$ext.innerHTML = "<h4 class='title'>Skin: " + cskin.name + "</h3>";
                    
                    //version
                    for( var v = 0; v < cskinset.skins[skin].versions.length; v++ ) {
                        console.log(el, skinset, skin, v);
                        var cv = cskinset.skins[skin].versions[v];
                        var barVersion = barSkin.appendChild( new apf.bar() ); barVersion.$ext.setAttribute("class", "version" + (cv.wrapperClass ? " " + cv.wrapperClass : "") ); barVersion.$ext.setAttribute("id", el); barVersion.$ext.removeAttribute("style");

                        cv.settings.skin = cskin.name;
                        cv.settings.skinset = cskinset.name;
                        
                        var o = barVersion.appendChild( new apf[el]( cv.settings ) );
                        
                        //embed code
                        var embed = "<a:" + el + " ";
                        for( s in cv.settings ) {
                            embed += s + '="' + cv.settings[s] + '" ';
                        }
                        embed += "/>";
                        var src = barVersion.appendChild( new apf.textarea({ width: "530" }) ); src.$ext.setAttribute("class", "winUIExtCode");
                        src.setValue( embed );
                    }
                }
            }
        }
    },
    hide : function(){
        ext.initExtension(this);
        winUIExt.hide()
    },
    
    loadSkins: function() {
        var includeSkins = ["searchinfiles", "statusbar", "zen", "quicksearch"];
        
        for(var i = 0; i < includeSkins.length; i++) {
            var includeSkin = includeSkins[i];
            
            var skinData = require("text!ext/" + includeSkin + "/skin.xml");
            var skinNode = new apf.skin(apf.extend({}, {id: includeSkin, data: skinData, "media-path": ide.staticPrefix + "/ext/" + includeSkin + "/images/"}, {data: null}));
            skinNode.setProperty("src", skinData);
            apf.document.documentElement.appendChild(skinNode);
        }
    },
    
    enable : function(){
        if (!this.disabled) return;

        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;

        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        menus.remove("Tools/~", 1000000);
        menus.remove("Tools/Extension Manager...");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
