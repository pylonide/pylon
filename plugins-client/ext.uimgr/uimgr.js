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
    deps   : [panels],
    requireFailed : false,

    nodes : [],

    hook : function(){
        var _self = this;
    },

    init : function(amlNode){
        // Save the manually-loaded extensions
        var _self = this;
        apf.importCssString(this.css || "");
    },

    show : function(){
        this.loadSkins();
        
        ext.initExtension(this);
//        winUIExt.show(); return ;
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
                            name: "dark-opaque",
                            versions: [
                                { //version
                                    settings: {}
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
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-green",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-green smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-red",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-red smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue2",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue2 smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue3",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-blue3 smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-orange",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-orange smallbtn",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-yellow",
                                        width: "100"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Button",
                                        "class": "ui-btn-yellow smallbtn",
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
                            name: "button-close",
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
                            name: "button-link-dark",
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
                            name: "button-social",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Facebook",
                                        "class": "facebook",
                                        height: "20",
                                        width: "20"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Google Plus",
                                        "class": "google-plus",
                                        height: "20",
                                        width: "20"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Mail",
                                        "class": "mail",
                                        height: "20",
                                        width: "20"
                                    }
                                },
                                { //version
                                    settings: {
                                        caption: "Twitter",
                                        "class": "twitter",
                                        height: "20",
                                        width: "20"
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
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "c9-logo"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "toggle-black-menu-bar"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "spacer"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "rundebug"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "project_files"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "open_files"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "testing"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "visual_editor"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "preferences"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "github_corner"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "deploy"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "the_store"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop1"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop2"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop3"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "shop4"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "toolbarbutton",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "arrow_left.png"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "authskin",
                    skins: [
                        { //skin
                            name: "btn-blue-noise",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Button"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "quicksearch",
                    skins: [
                        { //skin
                            name: "btnsearchicon",
                            versions: [
                                { //version
                                    settings: {
                                        icon: "rounded_close.png"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "btnquicksearchnav",
                            versions: [
                                { //version
                                    settings: {
                                        "class": "btnquicksearchnavLeft"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "btnquicksearchnavLeft withDivider"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "btnquicksearchnavRight"
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "revisions",
                    skins: [
                        { //skin
                            name: "revisionsbutton",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "ui-btn-red"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "searchinfiles",
                    skins: [
                        { //skin
                            name: "btnquicksearchnav",
                            note: "remove",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "searchreplace",
                    note: "duplicate in quicksearch",
                    skins: [
                        { //skin
                            name: "btnquicksearchnav",
                            versions: [
                                { //version
                                    settings: {
                                        "class": "btnquicksearchnavLeft"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "btnquicksearchnavRight"
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "c9statusbar",
                    skins: [
                        { //skin
                            name: "btn-expand-statusbar",
                            note: "not used",
                            versions: [
                                { //version
                                    settings: {
                                        icon: "statusbar-arrow.png"
                                    }
                                },
                                { //version
                                    settings: {
                                        icon: "statusbar-arrow.png"
                                    },
                                    wrapperClass: "dark"
                                },
                                { //version
                                    settings: {
                                        icon: "statusbar-arrow.png"
                                    },
                                    wrapperClass: "expanded"
                                }
                            ]
                        },
                        { //skin
                            name: "btn-statusbar-icon",
                            versions: [
                                { //version
                                    settings: {
                                        icon: "pref-ico.png",
                                        height: "23"
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "uploadfiles",
                    skins: [
                        { //skin
                            name: "btn-expand-statusbar",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "cancel"
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "zen",
                    skins: [
                        { //skin
                            name: "zenbutton",
                            versions: [
                                { //version
                                    settings: {
                                        "class": "notfull",
                                        height: "26",
                                        width: "26"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "full",
                                        height: "26",
                                        width: "26"
                                    }
                                }
                            ]
                        }
                    ]
                    
                }
            ],
            checkbox: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "checkbox",
                            versions: [
                                { //version
                                    settings: {
                                        label: "checkbox"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "cboffline",
                            versions: [
                                { //version
                                    settings: {
                                        width: "55"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "checkbox-menu",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Checkbox"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "checkbox_black",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Checkbox"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "checkbox_grey",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Checkbox"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "db-checkbox",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Checkbox"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "bluecheck",
                                        label: "Checkbox"
                                    }
                                }
                            ]
                        }
                    ]
                    
                },
                { //skinset
                    name: "uploadfiles",
                    skins: [
                        { //skin
                            name: "uploadactivity-switch",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "cancel"
                                    }
                                }
                            ]
                        }
                    ]
                    
                }
            ],/*
            colorpicker: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "colorpicker",
                            versions: [
                                { //version
                                    settings: {
                                        color: "#ff0000",
                                        value: "#0099cc"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],*/
            divider: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "divider",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-divider",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-divider-double",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "c9-divider-hor",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "divider-debugpanel",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "divider_console",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            dropdown: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "dropdown",
                            versions: [
                                { //version
                                    settings: {
                                        width: "200"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "black_dropdown",
                            versions: [
                                { //version
                                    settings: {
                                        width: "200"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "dropdown-dark-glossy",
                            versions: [
                                { //version
                                    settings: {
                                        width: "200"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "light_dropdown",
                            versions: [
                                { //version
                                    settings: {
                                        width: "200"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            errorbox: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "errorbox",
                            innerHTML: "Error",
                            versions: [
                                { //version
                                    settings: {
                                        visible: "true",
                                        width: "200"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            frame: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "frame",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "frame",
                                        visible: "true",
                                        width: "200"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            img: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "img",
                            versions: [
                                { //version
                                    settings: {
                                        value: "http://siliconangle.com/files/2012/04/Cloud9_logo.jpg"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            label: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "label",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Label",
                                        width: "200"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "black_label",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Label",
                                        width: "200"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "tooltipLabel",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Label",
                                        width: "200"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            list: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "list",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "breakpoints",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "lineselect",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "searchresults"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "gotoline",
                    skins: [
                        { //skin
                            name: "gotoline",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "revisions",
                    skins: [
                        { //skin
                            name: "revisions-list",
                            note: "ask Sergi for info on how to display the icons",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "uploadfiles",
                    skins: [
                        { //skin
                            name: "list-uploadactivity",
                            versions: [
                                { //version
                                    settings: {
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            modalwindow: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "bk-win-noisebg",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "bk-window",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "bk-window2",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "change_photo",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "dockwin",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "fm-window",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "panel",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "window",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "authskin",
                    skins: [
                        { //skin
                            name: "win-auth",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "guidedtour",
                    skins: [
                        { //skin
                            name: "win-controls",
                            note: "problem with this one. should investigate further",
                            versions: [
                                { //version
                                    settings: {
                                        height: "400",
                                        modal: "false",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "help",
                    skins: [
                        { //skin
                            name: "win-help-about",
                            versions: [
                                { //version
                                    settings: {
                                        buttons: "min|max|close",
                                        height: "400",
                                        minheight: "290",
                                        minwidth: "300",
                                        modal: "false",
                                        resizable: "true",
                                        title: "Static modal window",
                                        visible: "true",
                                        width: "500"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            progressbar: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "progressbar",
                            versions: [
                                { //version
                                    settings: {
                                        max: "10",
                                        min: "0",
                                        value: "70"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "progressbar-green",
                            versions: [
                                { //version
                                    settings: {
                                        max: "10",
                                        min: "0",
                                        value: "70"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            radiobutton: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "radiobutton",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Option"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "classic",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Option"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "radio_black",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Option"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "radio_grey",
                            versions: [
                                { //version
                                    settings: {
                                        label: "Option"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            spinner: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "spinner",
                            versions: [
                                { //version
                                    settings: {
                                        max: "10",
                                        min: "0",
                                        value: "70",
                                        width: "100"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            splitbutton: [
                { //skinset
                    name: "skinset",
                    skins: [
                        { //skin
                            name: "splitbutton",
                            versions: [
                                { //version
                                    settings: {
                                        caption: "Split Button"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            splitter: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "splitter",
                            versions: [
                                { //version
                                    settings: {
                                        height: "10",
                                        width: "2"
                                    }
                                },
                                { //version
                                    settings: {
                                        height: "10",
                                        width: "2"
                                    },
                                    wrapperClass: "dockcol"
                                },
                                { //version
                                    settings: {
                                        "class": "splitterMoving",
                                        height: "10",
                                        width: "2"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "splitterRealtime",
                                        height: "10",
                                        width: "2"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "vertical",
                                        height: "10",
                                        width: "2"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "splitter-editor-right",
                                        height: "10",
                                        width: "2"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "splitter-editor-right panelsplitter",
                                        height: "10",
                                        width: "2"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "darksplitter",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {
                                    "class": "darksplitterMoving"
                                    }
                                },
                                { //version
                                    settings: {
                                    "class": "darksplitterRealtime"
                                    }
                                },
                                { //version
                                    settings: {
                                    "class": "vertical"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            tab: [
                { //skinset
                    name: "skinset",
                    skins: [
                        { //skin
                            name: "tab",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "dockbar",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "docktab",
                            versions: [
                                { //version
                                    settings: {}
                                },
                                { //version
                                    settings: {},
                                    wrapperClass: "dockcol"
                                }
                            ]
                        },
                        { //skin
                            name: "editor_tab",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "extensions_tab",
                            versions: [
                                { //version
                                    settings: {}
                                }
                            ]
                        },
                        { //skin
                            name: "tab_console",
                            versions: [
                                { //version
                                    settings: {
                                        height: "50"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            text: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "text",
                            versions: [
                                { //version
                                    settings: {
                                        value: "Text"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "language",
                    skins: [
                        { //skin
                            name: "codecomplete_text",
                            versions: [
                                { //version
                                    settings: {
                                        value: "Text"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "codecompletedoc_text",
                            versions: [
                                { //version
                                    settings: {
                                        value: "Text"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            textarea: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "textarea",
                            versions: [
                                { //version
                                    settings: {
                                        value: "Textarea"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "textarea_ide",
                            versions: [
                                { //version
                                    settings: {
                                        value: "Textarea"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            textbox: [
                { //skinset
                    name: "default",
                    skins: [
                        { //skin
                            name: "textbox",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                },
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder",
                                        type: "password"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "black_textbox",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "input",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "searchbox",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "searchbox_textbox",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "small-font",
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "secret",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "tb_console",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "tbsimple",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "textarea",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        },
                        { //skin
                            name: "textbox-modal",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                },
                                { //version
                                    settings: {
                                        "class": "required-tb",
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "authskin",
                    skins: [
                        { //skin
                            name: "auth-tb",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        }
                    ]
                },
                { //skinset
                    name: "gotoline",
                    skins: [
                        { //skin
                            name: "textbox",
                            versions: [
                                { //version
                                    settings: {
                                        "initial-message": "Placeholder"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        
        var menubar = apf.document.firstChild.appendChild( new apf.bar() ); 
        menubar.$ext.setAttribute("id", "menubar");
        menubar.$ext.removeAttribute("style");
        
        var toggleLight = menubar.appendChild( new apf.button({
            "caption":"Toggle Light",
            "class":"fright" }) );
        toggleLight.$ext.setAttribute("id", "toggleLight");
        toggleLight.$ext.removeAttribute("style");
        
        toggleLight.addEventListener("click", function(){
            if( document.body.className.indexOf("lightsOff") < 0 )
                document.body.className = " lightsOff ";
            else
                document.body.className = "";
        });
        // dependent elemnets
        var modelString = '<cars id="mdlCars">\n\t<car modelno="1" name="Model 1"/>\n\t<car modelno="2" name="Model 2"/>\n\t<car modelno="3" name="Model 3"/>\n\t<car modelno="4" name="Model 4"/>\n\t<car modelno="5" name="Model 5"/>\n</cars>\n\n';
        var mdlCars = new apf.model({"id": "mdlCars"});
        mdlCars.load( modelString );
        
        
        //Elements
        for ( var el in elements ) {
            var bar = apf.document.firstChild.appendChild( new apf.bar() );
            bar.$ext.setAttribute("class", "element");
            bar.$ext.setAttribute("id", el); bar.$ext.removeAttribute("style");
            
            bar.$ext.innerHTML = "<a class='anchor' name='" + el + "'></a><h2 class='title'><a href='http://developer.c9.io/api/apf/" + el + ".html' target='_blank'>" + el + "</a></h2>";
            
            var link = document.createElement('a');
            link.innerHTML = el;
            link.setAttribute("class", "link");
            link.setAttribute("href", "#" + el);
            
            menubar.$ext.appendChild( link );
            
            //Skinsets
            for( var skinset = 0; skinset < elements[el].length; skinset++ ) {
                var cskinset = elements[el][skinset];
                var barSkinset = bar.appendChild( new apf.bar() );
                barSkinset.$ext.setAttribute("class", "skinset"); barSkinset.$ext.removeAttribute("style");
                barSkinset.$ext.innerHTML = "<h3 class='title'>Skinset: " + cskinset.name + "</h3>";
                
                //skin
                for( var skin = 0; skin < cskinset.skins.length; skin++ ) {
                    var cskin = cskinset.skins[skin];
                    
                    var barSkin = barSkinset.appendChild( new apf.bar() );
                    barSkin.$ext.setAttribute("class", "skin"); barSkin.$ext.removeAttribute("style");
                    barSkin.$ext.innerHTML = "<h4 class='title'>Skin: " + cskin.name + ( cskin.note ? " - " + cskin.note : "" ) + "</h3>";
                    
                    //version
                    for( var v = 0; v < cskinset.skins[skin].versions.length; v++ ) {
//                      console.log(el, skinset, skin, v);
                        var cv = cskinset.skins[skin].versions[v];
                        var barVersion = barSkin.appendChild( new apf.bar() );
                        barVersion.$ext.setAttribute("class", "version" + (cv.wrapperClass ? " " + cv.wrapperClass : "") );
                        barVersion.$ext.setAttribute("id", el); barVersion.$ext.removeAttribute("style");

                        cv.settings.skin = cskin.name;
                        cv.settings.skinset = cskinset.name;
                        
                        if( el === "dropdown" ) {
                            cv.settings.caption = "[@name]";
                            cv.settings.each = "[car]";
                            cv.settings.eachvalue = "[@value]";
                            cv.settings.model = "mdlCars";
                            cv.settings["initial-message"] = "Choose a model";
                        } else if( el === "list" ) {
                            cv.settings.caption = "[@name]";
                            cv.settings.each = "[car]";
                            cv.settings.model = "mdlCars";
                        } else if( el === "radiobutton" ) {
                            cv.settings.group = "g" + ( skin + 1 );
                        } else if( el === "tab" ) {
                            cskin.innerHTML = '\n\t<a:page caption="Tab1" />\n\t<a:page caption="Tab2" />\n\t<a:page caption="Tab3" />\n'
                        }
                        
                        //console.log("Type: " + el + " Skinset: " + cskinset.name + " Skin: " + cskin.name + " Version: " + JSON.stringify( cv ));
                        
                        var o = barVersion.appendChild( new apf[el]( cv.settings ) );
                        if( el ==="radiobutton" ) {
                            o = barVersion.appendChild( new apf[el]( cv.settings ) );
                            o = barVersion.appendChild( new apf[el]( cv.settings ) );
                            o = barVersion.appendChild( new apf[el]( cv.settings ) );
                            o = barVersion.appendChild( new apf[el]( cv.settings ) );                        
                        } else if( el === "tab" ) {
                            o.appendChild( new apf.page( {caption: "Tab"} ) );
                            o.appendChild( new apf.page( {caption: "Tab"} ) );
                        }
                        
                        //embed code
                        var embed = "<a:" + el + " ";
                        if( cv.settings.model ) {
                            embed = modelString + embed;
                        }
                        if( el === "img") {
                            cv.settings.src = cv.settings.value;
                            delete cv.settings.value;
                        }
                        for( s in cv.settings ) {
                            embed += s + '="' + cv.settings[s] + '" ';
                        }
                        if( cskin.innerHTML ){
                            if( o.setMessage )
                                o.setMessage(cskin.innerHTML);
                            embed += ">"+cskin.innerHTML + "</a:" + el + ">";
                        } else {
                            embed += "/>";
                        }
                        var src = barVersion.appendChild( new apf.textarea({ width: "530" }) );
                        src.$ext.setAttribute("class", "winUIExtCode");
                        src.setValue( embed );
                        src.$ext.style.height = ( src.$ext.scrollHeight - 20 ) + "px"; //20px is the vertical padding
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
        var includeSkins = [
            "gotoline",
            "guidedtour",
            "help",
            "quicksearch",
            "revisions",
            "searchinfiles",
            "searchreplace",
            "statusbar",
            "uploadfiles",
            "zen"
        ];
        
        var requireStatement = includeSkins.map(function (k) {
            return "text!ext/" + k + "/skin.xml";
        });
        
        require(requireStatement, function () {
            var skins = Array.prototype.slice.call(arguments);
            
            skins.forEach(function (skinData, ix) {
                var skinNode = new apf.skin(apf.extend({}, {id: includeSkins[ix], data: skinData, "media-path": ide.staticPrefix + "/ext/" + includeSkins[ix] + "/images/"}, {data: null}));
                skinNode.setProperty("src", skinData);
                apf.document.documentElement.appendChild(skinNode);
            });
            
            // done
        });
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
