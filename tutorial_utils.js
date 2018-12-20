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
    constructor(message, targetUnit){
        super(message);
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

    draw(){
        super.draw();
        drawCircle(this.location.x, this.location.y, this.radius, this.color);
    }
}

function disableKeys(keys){
    for (var i = 0; i < keys.length; i++){
        var key = keys[i];
    }
}