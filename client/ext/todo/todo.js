/**
 * TODO Manager extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide    = require("core/ide");
var ext    = require("core/ext");
var util   = require("core/util");
var dock   = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/todo/todo.xml");
        
return ext.register("ext/todo/todo", {
    name            : "TODO Manager",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    buttonClassName : "todo_check",
    commands        : {},
    hotitems        : {},
    
    nodes : [],
    
    expandNewTodo : function(btnAdd){
        btnAdd.disable();
        this.btnAdd = btnAdd;

        // automatically round to the next half hour
        var tDate = new Date();
        tempHours   = tDate.getHours();
        tempMinutes = tDate.getMinutes();
        if(tempMinutes < 30) {
            tempMinutes = 30;   
        }
        
        else if(tempMinutes > 30) {
            tempHours++;
            tempMinutes = "00";
            
            if(tempHours == 24) {
                tempHours = 0;
                
                // We have rounded up into a new day
                // So we need to add a day to the calendar as well
                tempMonth = tDate.getMonth();
                tDate.setDate(tDate.getDate() + 1);
                if(tempMonth != tDate.getMonth()) {
                    calTodoFrom.nextMonth();
                    calTodoTo.nextMonth();
                }

                calTodoFrom.selectDay(tDate.getDate());
                calTodoTo.selectDay(tDate.getDate());
            }
        }

        timeTodoFrom.select(tempHours + ":" + tempMinutes);
        timeTodoTo.select(tempHours + ":" + tempMinutes);

        apf.tween.single(panelAddNewTodo, {
            type : "height",
            anim : apf.tween.easeInOutCubic,
            from : 0,
            to   : 165,
            steps : 16,
            interval : 25,
            control  : (this.control = {})
        });
    },
    
    cancelAddNewTodo : function() {
        this.btnAdd.enable();
        this.closeNewTodo(false);
    },
    
    closeNewTodo : function(clear_data){
        apf.tween.single(panelAddNewTodo, {
            type     : "height",
            anim     : apf.tween.easeInOutCubic,
            from     : 165,
            to       : 0,
            steps    : 16,
            interval : 50,
            control  : (this.control = {}),
            onfinish : function() {
                txtTodoTitle.focus();
            }
        });
    },
    
    addNewTodo : function(btnObj){
        arrDetailsNewTodo = this.getTodoDetails();
        if(typeof arrDetailsNewTodo !== 'object') {
               util.alert("Form Error", 
                    "Please complete all fields",
                    "Missing: " + arrDetailsNewTodo);
        }
        
        else {
            btnObj.disable();
            ide.socket.send(JSON.stringify({
                command    : "todo",
                subcommand : "new",
                data       : arrDetailsNewTodo
            }));
        }
    },
    
    getTodoDetails : function(){
        arrTimeFrom = timeTodoFrom.getSelection();
        if(arrTimeFrom.length == 0) {
            return "Time From";   
        }
        
        timeTimeFrom = arrTimeFrom[0].getAttribute("value");
        
        arrTimeTo = timeTodoTo.getSelection();
        if(arrTimeTo.length == 0) {
            return "Time To";
        }
        
        timeTimeTo = arrTimeTo[0].getAttribute("value");
        
        todoDetails = txtTodoTitle.getValue();
        
        if(todoDetails == "") {
            return "Task Description";   
        }
        
        return {
            time_from    : timeTimeFrom,
            date_from    : calTodoFrom.getValue(),
            time_to      : timeTimeTo,
            date_to      : calTodoTo.getValue(),
            todo_details : todoDetails
        };
    },
    
    setTimeTo : function() {
        if(this.stopAutomaticSetTimeTo == false) {
            this.overrideManualSetTimeTo = true;
            timeTodoTo.select(timeTodoFrom.getSelection()[0].getAttribute("value"));
        }
    },
    
    manualSetTimeTo : function() {
        if(this.overrideManualSetTimeTo == false) {
            this.stopAutomaticSetTimeTo = true;   
        }
        
        else {
            this.overrideManualSetTimeTo = false;   
        }
    },
    
    hook : function(){
        var _self = this;
        ext.initExtension(this);
        //dock.register(this);
    },
    
    init : function(amlNode){
        this.winTodo = winTodo;
        this.panel = winTodo;
        this.overrideManualSetTimeTo = false;
        this.stopAutomaticSetTimeTo = false;
        
        dock.registerWindow(winTodo, {
                dockPosition: "top",
                backgroundImage: "/static/style/images/collaboration_panel_sprite.png",
                defaultState: { x: 0, y: -163 },
                activeState: { x: 0, y: -201 }
        });
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        //dock.unregister(this);
        this.winTodo.destroy(true, true);
    }
});

    }
);