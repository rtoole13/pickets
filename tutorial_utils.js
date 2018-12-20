"use strict";

class TutorialGoal {
    constructor(message, completionCallBack, disabledEvents){
        //this class is to serve as an abstract for all goals
        this.objective = null;
        this.message = (message == undefined)? 'EMPTY MESSAGE' : message;
        this.completionCallback = (completionCallback != undefined)? completionCallback : undefined;
        this.disabledEvents = (disabledEvents != undefined) disabledEvents : undefined;
        this.defaultDisabledEvents = null;
    }
    initiate(){
        if (this.disabledEvents != undefined){
            console.log('disable custom events');
        }
        else{
            console.log('disable default events')
        }
    }
    
    checkObjective(){
        return false;
    } 
    
    draw(){
        canvasContext.save();
        canvasContext.fillStyle = playerColor;
        canvasContext.font = '20px sans-serif';
        canvasContext.textAlign = 'center';
        canvasContext.fillText(this.message, canvas.width/2, canvas.height/2 + -250);
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
    constructor(message, targetUnit, location, radius, completionCallback, disabledEvents){
        super(message);
        this.targetUnit = targetUnit;
        this.location = location;
        this.radius = radius;
        this.radiusSq = radius * radius;
        this.color = greenAlpha;
    }
    initiate(){

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