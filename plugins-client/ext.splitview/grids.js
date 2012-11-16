/**
 * Show a split view; two editors next to each other in one tab
 *
 * @copyright 2010, Ajax.org B.V.
 * @author Mike de Boer <mike AT c9 DOT io>
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var GridLayouts = {
    "3cols": {
        "ascii":
                "+--+--+--+\n" +
                "|  |  |  |\n" +
                "+--+--+--+",
        "struct": {
            "hbox": [
                "splitter",
                "splitter"
            ]
        },
        "insertPoints": [
            "hbox/splitter[1]",
            "hbox/splitter[2]",
            "hbox"
        ]
    },
    "3rows": {
        "ascii":
                "+-----+\n" +
                "|     |\n" +
                "+-----+\n" +
                "|     |\n" +
                "+-----+\n" +
                "|     |\n" +
                "+-----+",
        "struct": {
            "vbox": [
                "splitter",
                "splitter"
            ]
        },
        "insertPoints": [
            "vbox/splitter[1]",
            "vbox/splitter[2]",
            "vbox"
        ]
    },
    "2cols2rows": {
        "ascii":
                "+--+--+\n" +
                "|  |  |\n" +
                "|  +--+\n" +
                "|  |  |\n" +
                "+--+--+",
        "struct": {
            "hbox": {
                "splitter": 1,
                "vbox": {
                    "splitter": 1
                }
            }
        },
        "insertPoints": [
            "hbox/splitter",
            "hbox/vbox/splitter",
            "hbox/vbox"
        ]
    },
    "col2rowscol": {
        "ascii":
                "+--+--+\n" +
                "|  |  |\n" +
                "+--+  |\n" +
                "|  |  |\n" +
                "+--+--+",
        "struct": {
            "hbox": {
                "vbox": {
                    "splitter": 1
                },
                "splitter": 1
            }
        },
        "insertPoints": [
            "hbox/vbox/splitter",
            "hbox/vbox",
            "hbox"
        ]
    },
    "row2colsrow": {
        "ascii":
                "+--+--+\n" +
                "|  |  |\n" +
                "+--+--+\n" +
                "|     |\n" +
                "+-----+",
        "struct": {
            "vbox": {
                "hbox": {
                    "splitter": 1
                },
                "splitter": 1
            }
        },
        "insertPoints": [
            "vbox/hbox/splitter",
            "vbox/hbox",
            "vbox"
        ]
    },
    "2rows2cols": {
        "ascii":
                "+-----+\n" +
                "|     |\n" +
                "+--+--+\n" +
                "|  |  |\n" +
                "+--+--+",
        "struct": {
            "vbox": {
                "splitter": 1,
                "hbox": {
                    "splitter": 1
                }
            }
        },
        "insertPoints": [
            "vbox/splitter",
            "vbox/hbox/splitter",
            "vbox/hbox"
        ]
    }
};

var grids = module.exports = new apf.Class().$init();

var GridNames = Object.keys(GridLayouts);

var defaultGrid = grids.DEFAULT_GRID = "3cols";


/**
 * Create the available grids
 */
grids.init = function(gridLayout) {
    gridLayout = gridLayout || defaultGrid;
    //console.log("init called", gridLayout);
    createGridNodes(gridLayout);
    return gridLayout;
};

grids.get = function(name) {
    return GridLayouts[name];
};

grids.update = function(gridLayout, split) {
    var grid = GridLayouts[gridLayout];

    //console.log("update: ", split.pairs[0].page.$pHtmlNode, grid.node, grid.node.parentNode, grid.node.$pHtmlNode);
    //grid.node.show();
    // attach the grid layout to the first page of the splitview...
    var page = split.pairs[0].page;
    var amlPage = page.fake ? page.relPage : page;
    amlPage.appendChild(grid.node);

    //console.log(split.pairs.map(function(pair){return pair.editor.$ext;}), grid.insertPoints);
    var i = 0;
    var l = split.pairs.length;
    for (; i < l; ++i)
        insertEditorAt(grid.node, split.pairs[i].editor, [].concat(grid.insertPoints[i]));

    // hide splitters that we don't need to see anymore
    var splitters = grid.splitters || grid.node.selectNodes("splitter");
    for (i = splitters.length - 1; i >= l - 1; --i)
        splitters[i].hide();
};

grids.show = function(gridLayout) {
    GridNames.forEach(function(name) {
        var grid = GridLayouts[name];
        if (!grid.node)
            return;

        if (name == gridLayout)
            grid.node.show();
        else
            grid.node.hide();
    });
};

grids.hide = function(gridLayout) {
    gridLayout = gridLayout || defaultGrid;
    var grid = GridLayouts[gridLayout];
    if (!grid || !grid.node)
        return;

    grid.node.hide();
};

function createNodes(struct, splitters, parent) {
    // if struct.node already exists, we already passed this function...
    if (struct.node)
        return;

    parent = parent || apf.document.documentElement;
    (apf.isArray(struct) ? struct : Object.keys(struct)).forEach(function(nodeName) {
        var options = {};
        if ("vbox|hbox".indexOf(nodeName) > -1) {
            if (parent === apf.document.documentElement) {
                options.visible = false;
                options.anchors = "2 0 0 0";
            }
            else {
                options.flex = 1;
                options.padding = "0";
            }
        }
        else if (nodeName == "splitter") {
            options.visible = false;
            options.skin = "darksplitter";
            options.zindex = 8;
        }

        var node = parent.appendChild(new apf[nodeName](options));
        if (nodeName == "splitter")
            splitters.push(node);
        // if we just appended the main node to the document, set it as the grid's
        // main node
        if (parent === apf.document.documentElement)
            struct.node = node;
        // recurse down the structure's tree
        if (struct[nodeName] && struct[nodeName] !== 1)
            createNodes(struct[nodeName], splitters, node);
    });
}

function createGridNodes(name) {
    name = name || defaultGrid;
    var blueprint = GridLayouts[name];
    if (!blueprint)
        throw new Error("Grid layout with name '" + name + "' not found!");
    // check if nodes are already created:
    if (blueprint.node)
        return;
    // preparse paths out of the insertPoints...
    blueprint.insertPoints = blueprint.insertPoints.map(function(insertPoint) {
        if (typeof insertPoint == "string")
            return insertPoint.splitSafe("\\/", null, true);
        return insertPoint;
    });
    //console.log("blueprint.insertPoints: ", blueprint.insertPoints);

    var splitters = [];
    createNodes(blueprint.struct, splitters);
    if (!blueprint.node)
        blueprint.node = blueprint.struct.node;
    if (!blueprint.splitters)
        blueprint.splitters = splitters;

    if (!blueprint.node.$resizeListener) {
        var timeout, lastEvent;
        blueprint.node.addEventListener("resize", blueprint.node.$resizeListener = function(e) {
            lastEvent = e;
            if (timeout)
                return;
            grids.dispatchEvent("resize", lastEvent, this);
            // correct the positioning of the grabber of each splitter.
            // use a setTimeout(..., 0) to make sure the repaint has happened and
            // offset values are correct.
            setTimeout(function() {
                var splitter, grabber;
                for (var i = 0, l = blueprint.splitters.length; i < l; ++i) {
                    splitter = blueprint.splitters[i];
                    grabber = splitter.$ext.getElementsByTagName("span")[0];
                    if (splitter.$ext.className.indexOf("vertical") > -1)
                        grabber.style.marginTop = ((splitter.$ext.offsetHeight / 2) - 20) + "px";
                    else
                        grabber.style.marginLeft = ((splitter.$ext.offsetWidth / 2) - 20) + "px";
                }
            });
            timeout = setTimeout(function(){ timeout = null; }, 100);
        });
    }
}

function insertEditorAt(parent, editor, insertPoint) {
    //console.log("insertEditorAt",parent, editor, insertPoint);
    var nextPoint;
    var inserted = false;
    //var count = 0;
    while (!inserted) {
        //console.log("round", ++count, "tags:",parent.tagName, insertPoint[0]);
        nextPoint = insertPoint.shift();
        if (parent.tagName.indexOf(nextPoint) == -1) {
            throw new Error("No valid insertion point found for editor");
        }

        // do we need to keep searching down the path?
        if (insertPoint.length > 1) {
            for (var i = 0, l = parent.childNodes.length; i < l; ++i) {
                if (parent.childNodes[i].tagName.indexOf(insertPoint[0]) == -1)
                    continue;
                //console.log("setting parent to...",parent.childNodes[i]);
                parent = parent.childNodes[i];
                break;
            }
        }
        // path found, try to insert it!
        else {
            if (!insertPoint.length) {
                parent.appendChild(editor);
                inserted = true;
            }
            // finding a splitter means 'insert before it!'
            else if (insertPoint[0].indexOf("splitter") > -1) {
                var m = insertPoint[0].match(/\[(\d)\]/);
                var splitterIdx = m && m[1] ? parseInt(m[1], 10) - 1 : 0;
                var idx = -1;
                //console.log("trying to find splitter at index", splitterIdx, m, parent.childNodes.map(function(node) {return node.tagName;}));
                for (var i = 0, l = parent.childNodes.length; i < l && !inserted; ++i) {
                    if (parent.childNodes[i].tagName.indexOf("splitter") == -1
                      || splitterIdx !== ++idx) {
                        continue;
                    }
                    parent.insertBefore(editor, parent.childNodes[i]);
                    inserted = true;
                }
                if (!inserted)
                    throw new Error("Could not find the splitter to insert before!");
            }
            // otherwise it needs to be appendChild'ed to a vbox or hbox
            else {
                for (var i = 0, l = parent.childNodes.length; i < l && !inserted; ++i) {
                    if (parent.childNodes[i].tagName.indexOf(insertPoint[0]) == -1)
                        continue;
                    parent.childNodes[i].appendChild(editor);
                    inserted = true;
                }
                if (!inserted)
                    throw new Error("Could not find the vbox or hbox to insert before!");
            }
        }
    }

    editor.show();

    // make sure we make the splitter visible, if needed
    if (editor.previousSibling && editor.previousSibling.tagName == "splitter")
        editor.previousSibling.show();
}

});
