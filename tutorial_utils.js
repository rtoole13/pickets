"use strict";

class TutorialGoal {
    constructor(message, completionCallback, eventOverrides){
        //this class is to serve as an abstract for all goals
        this.objective = null;
        this.message = (message == undefined)? 'EMPTY MESSAGE' : message;
        this.completionCallback = (completionCallback != undefined)? completionCallback : undefined;
        this.eventOverrides = (eventOverrides != undefined)? eventOverrides : undefined;
        this.defaultDisabledEvents = null;
    }

    initiate(){
        this.enableEvents();
    }

    onCompletion(){
        this.disableEvents();
        if (this.completionCallback != undefined){
            this.completionCallback();
        }
        return true;
    }

    disableEvents(){
        eventHandler.removeAllEventListeners();    
    }

    enableEvents(){
        addDefaultListeners();
        if (this.eventOverrides == undefined){
            return;
        }
        for (var eventName in this.eventOverrides.data){
            eventHandler.removeEventListenersByEvent(eventName);
            var eventData = this.eventOverrides.data[eventName];
            eventHandler.addEventListener(eventData.target, eventName, eventData.callback, false);
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

class SelectUnitGoal extends TutorialGoal {
    constructor(message, targetID, completionCallback, eventOverrides){
        super(message, completionCallback, eventOverrides);
        this.targetID = targetID;
    }

    checkObjective(){
        if (activeUnit != undefined && activeUnit.id == this.targetID){
            return this.onCompletion();
        }
        else{
            return false;
        }
    }

    initiate(){
        super.initiate();
    }
}

class ClickGoal extends TutorialGoal {
    constructor(message, completionCallback){
        var tempEventOverrides = new CustomEventListenerSet();
        tempEventOverrides.addListener('window', "mousedown", handleClickToContinue);
        super(message, completionCallback, tempEventOverrides);
        this.clicked = false;
    }
    checkObjective(){
        if (this.clicked){
            return this.onCompletion();
        }
        else{
            return false;
        }
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

        canvasContext.font = '16px sans-serif';
        canvasContext.fillText('(click to continue)', canvas.width/2, y);
        canvasContext.restore();
    }
}
class KeyPressGoal extends TutorialGoal {
    constructor(message, keyCode, completionCallback){
        var tempEventOverrides = new CustomEventListenerSet();
        tempEventOverrides.addListener('window', "keydown", handleGoalSpecificKeyPress);
        super(message, completionCallback, tempEventOverrides);
        this.keyCode = keyCode;
        this.keyPressed = false;
    }

    checkObjective(){
        if (this.keyPressed){
            return this.onCompletion();
        }
        else{
            return false;
        }
    }
}

class MoveTargetToLocationGoal extends TutorialGoal {
    constructor(message, targetID, location, dir, radius, completionCallback, eventOverrides){
        super(message, completionCallback, eventOverrides);
        this.angleTolerance = 15;
        this.targetID = targetID;
        this.targetUnit = null;
        this.location = location;
        this.dir = (dir != null)? normalizeVector(dir.x, dir.y) : null;
        this.angle = (this.dir != null)? getAngleFromDir(this.dir.x, this.dir.y) : null;
        this.radius = radius;
        this.radiusSq = radius * radius;
        this.color = greenAlpha;
    }

    checkObjective(){
        if (getDistanceSq(this.targetUnit.x, this.targetUnit.y, this.location.x, this.location.y) < this.radiusSq) {
            if (this.dir == null){
                return this.onCompletion();
            }
            else{
                if (Math.abs(getAngle(this.targetUnit.dirX, this.targetUnit.dirY, this.dir.x, this.dir.y, true)) < this.angleTolerance) {
                    return this.onCompletion();
                }
            }
        }
        else{
            return false;
        }
    }

    initiate(){
        super.initiate();
        this.targetUnit = playerUnitList[this.targetID];
    }

    draw(){
        super.draw();
        drawCircle(this.location.x, this.location.y, this.radius, this.color);
        if (this.dir != null){
            drawAngledArrow(this.location.x, this.location.y, this.radius + 10, this.color, this.angle);
        }
    }
}

class DurationGoal extends TutorialGoal {
    constructor(message, duration, completionCallback, eventOverrides){
        super(message, completionCallback, eventOverrides);
        this.duration = duration;
        this.goalTimer = new Timer(this.duration, false);
    }

    checkObjective(){
        if (this.goalTimer.checkTime()){
            return this.onCompletion();
        }
        else{
            return false;
        }
    }
    initiate(){
        super.initiate();
        this.goalTimer.start();
    }
    draw(){
        var message, x, y, circleOffsetY;
        message = this.message.split("<br>");
        canvasContext.save();
        canvasContext.fillStyle = playerColor;
        canvasContext.font = '20px sans-serif';
        canvasContext.textAlign = 'left';

        x = canvas.width / 2 - 240;
        y = canvas.height / 2 - 250;
        circleOffsetY = -30 - (12 * (message.length - 1));
        for (var i = 0; i < message.length; i++){
            canvasContext.fillText(message[i], x + 40, y);
            y += 24;
        }
        canvasContext.restore();

        var relativeFill = this.goalTimer.getElapsedTime() / this.duration;
        drawPartialCircle(x, y + circleOffsetY, 25, orderColor, relativeFill,  -Math.PI / 2, true);
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
        case 82:
            //R
            restartTutorialScene();
            break;
        default:
            return;
    }
}

function handleGoalSpecificKeyPress(e){
    var keyCode = e.keyCode;
    commandType = commandTypes.move;
    switch (keyCode){
        case gameBoard.board.currentGoal.keyCode:
            gameBoard.board.currentGoal.keyPressed = true;
            break;
        case 82:
            //R
            restartTutorialScene();
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
        case 82:
            //R
            restartTutorialScene();
            break;
        default:
            return;
    }
}

function handleClickToContinue(){
    var left, right;
    left = tutorialArrowLeft;
    right = tutorialArrowRight;
    if (CollisionEngine.pointInAABB(mouseX, mouseY, left.xMin, left.xMax, left.yMin, left.yMax)){
        left.clicked = true;
        return;
    }
    else if (CollisionEngine.pointInAABB(mouseX, mouseY, right.xMin, right.xMax, right.yMin, right.yMax)){
        right.clicked = true;
        return;
    }
    else{
        left.clicked = right.clicked = false;
    }

    gameBoard.board.currentGoal.clicked = true;
}

function addDefaultListeners(){
    eventHandler.addEventListener('canvas', "contextmenu", handleRightClickUp, false);
    eventHandler.addEventListener('canvas', "mousemove", getMousePosition, false);
    eventHandler.addEventListener('window', "keydown", handleKeyPress, false);
    eventHandler.addEventListener('window', "keyup", handleKeyRelease, false);
    eventHandler.addEventListener('canvas', "mousedown", handleTutorialMouseDown, false);
}