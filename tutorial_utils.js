"use strict";

class TutorialGoal {
    constructor(message, completionCallback, disabledEvents, enabledEvents){
        //this class is to serve as an abstract for all goals
        this.objective = null;
        this.message = (message == undefined)? 'EMPTY MESSAGE' : message;
        this.completionCallback = (completionCallback != undefined)? completionCallback : undefined;
        this.disabledEvents = (disabledEvents != undefined)? disabledEvents : undefined;
        this.enabledEvents = (enabledEvents != undefined)? enabledEvents : undefined;
        this.defaultDisabledEvents = null;
    }
    initiate(){
        this.disableEvents();
        this.enableEvents();
    }
    disableEvents(){
        if (this.disabledEvents != undefined){
            console.log('disable custom events');
        }
        else{
            console.log('disable default events')
        }
    }
    enableEvents(){
        if (this.enabledEvents != undefined){
            console.log('enable custom events');
        }
        else{
            console.log('enable default events')
        }
    }
    checkObjective(){
        return false;
    } 
    
    draw(){
        var message, y;
        message = this.message.split("<br>");
        canvasContext.save();
        canvasContext.fillStyle = playerColor;
        canvasContext.font = '20px sans-serif';
        canvasContext.textAlign = 'center';

        y = canvas.height / 2 - 250;
        for (var i = 0; i < message.length; i++){
            canvasContext.fillText(message[i], canvas.width/2, y);
            y += 24;
        }
        canvasContext.restore();
    } 
}

class SelectUnitGoal extends TutorialGoal{
    constructor(message, targetUnit, completionCallback, disabledEvents, enabledEvents){
        super(message, completionCallback, disabledEvents, enabledEvents);
        this.targetUnit = targetUnit;
    }
    checkObjective(){
        if (activeUnit == this.targetUnit){
            return true;
        }
        else{
            return false;
        }
    }
}

class MoveTargetToLocationGoal extends TutorialGoal {
    constructor(message, targetUnit, location, radius, completionCallback, disabledEvents, enabledEvents){
        super(message, completionCallback, disabledEvents, enabledEvents);
        this.targetUnit = targetUnit;
        this.location = location;
        this.radius = radius;
        this.radiusSq = radius * radius;
        this.color = greenAlpha;
    }
    checkObjective(){
        if (getDistanceSq(this.targetUnit.x, this.targetUnit.y, this.location.x, this.location.y) < this.radiusSq){
            if (this.completionCallback != undefined){
                this.completionCallback();
            }
            return true;
        }
        else{
            return false;
        }
    }

    disableEvents(){
        if (this.disabledEvents != undefined){
            console.log('disable custom events');
        }
        else{
            
        }
    }
    enableEvents(){
        if (this.enabledEvents != undefined){
            console.log('enable custom events');
        }
        else{
            window.addEventListener("keydown", handleKeyPressMoveOnly, false);    
        }
    }

    draw(){
        super.draw();
        drawCircle(this.location.x, this.location.y, this.radius, this.color);
    }
}

function handleKeyPressMoveOnly(e){
    var keyCode = e.keyCode;
    commandType = commandTypes.move;
    switch (keyCode){
        case 27:
            //Escape
            if (activeUnit != undefined){
                activeUnit = undefined;
            }
            commandType = commandTypes.move;
            break;
        case 32:
            //Space
            displayingCommandRadii = true;
            break;
        case 16:
            //Shift
            queuingOrders = true;
            break;
        
        default:
            return;
    }
}

function handleKeyPressAttackMoveOnly(e){
    var keyCode = e.keyCode;
    commandType = commandTypes.attackmove;
    switch (keyCode){
        case 27:
            //Escape
            if (activeUnit != undefined){
                activeUnit = undefined;
            }
            commandType = commandTypes.attackmove;
            break;
        case 32:
            //Space
            displayingCommandRadii = true;
            break;
        case 16:
            //Shift
            queuingOrders = true;
            break;
        
        default:
            return;
    }
}

function addDefaultListeners(){
    eventHandler.addEventListener('canvas', "contextmenu", handleRightClickUp, false);
    eventHandler.addEventListener('canvas', "mousemove", getMousePosition, false);
    eventHandler.addEventListener('window', "keydown", handleKeyPress, false);
    eventHandler.addEventListener('window', "keyup", handleKeyRelease, false);
    eventHandler.addEventListener('canvas', "mousedown", handleTutorialMouseDown, false);
}

function killDefaultListeners(){
    eventHandler.removeEventListenersByEvent("mousedown");
    eventHandler.removeEventListenersByEvent("contextmenu");
    eventHandler.removeEventListenersByEvent("mousemove");
    eventHandler.removeEventListenersByEvent("keydown");
    eventHandler.removeEventListenersByEvent("keyup");
}