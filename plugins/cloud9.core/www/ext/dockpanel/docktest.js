var testState = {
    bars : [
        {
            expanded : false,
            width : 300,
            sections : [
                {
                    flex : 1,
                    width : 300,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test4",
                            ext    : ""
                        },
                        {
                            caption: "Test3",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 300,
                    buttons : [
                        {
                            caption: "Test2",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        },
        {
            expanded : true,
            width : 200,
            sections : [
                {
                    flex : 1,
                    width : 300,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test4",
                            ext    : ""
                        },
                        {
                            caption: "Test3",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        }
    ]
};

require(["libdock.js"], function(DockableLayout){
    var layout = new DockableLayout(hboxMain, function(){}, function(){}, function(){}, function(){});
    layout.loadState(testState);
    //layout.loadState(layout.getState());
});