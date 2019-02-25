"use strict";
class CanvasButton {
    constructor(centerX, centerY, width, height){
        this.x = centerX;
        this.y = centerY;
        this.width = width;
        this.height = height;
        this.xMin = this.x - this.width / 2;
        this.xMax = this.x + this.width / 2;
        this.yMin = this.y - this.height / 2;
        this.yMax = this.y + this.height / 2;
        this.depressed = false;
        this.clicked = false;
    }
    update(){
        if (CollisionEngine.pointInAABB(mouseX, mouseY, this.xMin, this.xMax, this.yMin, this.yMax)){
            this.depressed = true;
        }
        else{
            this.depressed = false;
        }
        this.clicked = false;
    }

    checkClick(){
        if (CollisionEngine.pointInAABB(mouseX, mouseY, this.xMin, this.xMax, this.yMin, this.yMax)){
            this.clicked = true;
        }
        else{
            this.clicked = false;
        }
        return this.clicked;
    }

    draw(){
        var color;
        if (this.clicked){
            color = 'green';
        }
        else{
            if (this.depressed){
                color = 'yellow';
            }
            else{
                color = 'magenta';
            }
        }
        canvasContext.save()
        canvasContext.fillStyle = color;
        canvasContext.translate(this.x, this.y);
        canvasContext.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        canvasContext.restore();
    }
}

class MouseOrderButtons {
    constructor(centerX, centerY, indWidth, indHeight, spacing){
        this.x = centerX;
        this.y = centerY;
        this.indWidth = indWidth;
        this.indHeight = indHeight;
        this.spacing = spacing;
        this.moveButton       = new MouseOrderButton(this.x - this.indWidth - this.spacing, this.y, 
                                                     this.indWidth, this.indHeight, commandTypes.move, true, true);
        this.attackmoveButton = new MouseOrderButton(this.x, this.y, this.indWidth, this.indHeight, 
                                                     commandTypes.attackmove, true, false);
        this.fallbackButton   = new MouseOrderButton(this.x + this.indWidth + this.spacing, this.y, 
                                                     this.indWidth, this.indHeight, commandTypes.fallback, true, false);
    }
    checkClick(){
        if (this.moveButton.checkClick()){
            commandHandler.setCommand(commandTypes.move);
        }
        else if (this.attackmoveButton.checkClick()){
            commandHandler.setCommand(commandTypes.attackmove);
        }
        else if (this.fallbackButton.checkClick()){
            commandHandler.setCommand(commandTypes.fallback);
        }
    }
    update(){
        this.moveButton.update();
        this.attackmoveButton.update();
        this.fallbackButton.update();
    }
    draw(){
        this.moveButton.draw();
        this.attackmoveButton.draw();
        this.fallbackButton.draw();
    }

    setMoveState(active){
        this.moveButton.setState(active);
    }

    setAttackmoveState(active){
        this.attackmoveButton.setState(active);
    }

    setFallbackState(active){
        this.fallbackButton.setState(active);
    }
}

class MouseOrderButton extends CanvasButton {
    constructor(centerX, centerY, indWidth, indHeight, command, active, currentlySelected){
        super(centerX, centerY, indWidth, indHeight);
        switch (command){
            case commandTypes.move:
                this.spriteSheet = new SpriteSheet(command_move, centerX, centerY, 52, 52, 5, 1, 4, false, true, 1);
                break;
            case commandTypes.attackmove:
                this.spriteSheet = new SpriteSheet(command_attackmove, centerX, centerY, 52, 52, 5, 1, 4, false, true, 1);
                break;
            case commandTypes.fallback:
                this.spriteSheet = new SpriteSheet(command_fallback, centerX, centerY, 52, 52, 5, 1, 4, false, true, 1);
                break;
            default:
                this.spriteSheet = new SpriteSheet(command_move, centerX, centerY, 52, 52, 5, 1, 4, false, true, 1);
                break;
        }
        this.active = active;
        this.currentlySelected = currentlySelected;
    }

    checkClick(){
        if (!this.active){
            return false;
        }
        return super.checkClick();
    }

    setState(active){
        this.active = active;
    }

    setSelected(selected){
        this.currentlySelected = selected;
    }

    draw(){
        var index;

        if (!this.active){
            index = 0;
        }
        else{
            if (this.depressed){
                index = 3;
            }
            else{
                if (this.currentlySelected){
                    index = 2;
                }
                else{
                    index = 1;
                }
            }
        }
        this.spriteSheet.XframeIndex = index;
        canvasContext.save();
        canvasContext.translate(this.x, this.y);
        this.spriteSheet.move(0,0);
        this.spriteSheet.draw();
        canvasContext.restore();
    }
}

class CourierCountIcon {
    constructor(centerX, centerY){
        this.x = centerX;
        this.y = centerY;
        this.spriteSheet = new SpriteSheet(icon_courierCount, centerX, centerY, 52, 52, 5, 1, 1, false, true, 0.55);
    }

    draw(){
        canvasContext.save();
        canvasContext.translate(this.x, this.y);
        this.spriteSheet.move(0,0);
        this.spriteSheet.draw();
        canvasContext.restore();

        canvasContext.save();
        canvasContext.fillStyle = "black";
        canvasContext.font = '24px IM Fell English SC';
        canvasContext.textAlign = 'center';
        canvasContext.fillText(String(playerGeneral.courierCount), this.x, this.y + 5);
        canvasContext.restore();
    }
}

class TutorialArrow extends CanvasButton{
    constructor(centerX, centerY, width, height, arrowLeft){
        super(centerX, centerY, width, height);
        this.arrowLeft = arrowLeft; //true if left, false if right
        if (this.arrowLeft){
            this.spriteSheet = new SpriteSheet(tutorial_arrow_left, centerX, centerY, 80, 80, 5, 2, 5, true, true, 0.85);
        }
        else{
            this.spriteSheet = new SpriteSheet(tutorial_arrow_right, centerX, centerY, 80, 80, 5, 2, 5, true, true, 0.85);   
        }
    }
    draw(){
        var index;
        if (!this.depressed){
            index = 1;
        }
        else{
            index = 0;
        }
        this.spriteSheet.YframeIndex = index;
        canvasContext.save();
        canvasContext.translate(this.x, this.y);
        this.spriteSheet.move(0,0);
        this.spriteSheet.draw();
        canvasContext.restore();
    }
    update(dt){
        super.update();
        this.updateSpriteSheet(dt);
    }
    updateSpriteSheet(dt){
        this.spriteSheet.update(dt);
    }
}
class MuteButton extends CanvasButton {
    constructor(centerX, centerY, width, height){
        super(centerX, centerY, width, height);
        this.state = false;
        this.spriteSheet = new SpriteSheet(mute_button, centerX, centerY, 82, 60, 5, 1, 4, false, true, 0.4);
    }
    draw(){
        var index;
        if (!this.state){
            index = 0;
        }
        else{
            index = 2;
        }
        if (this.depressed){
            index += 1;   
        }
        this.spriteSheet.XframeIndex = index;
        canvasContext.save();
        canvasContext.translate(this.x, this.y);
        this.spriteSheet.move(0,0);
        this.spriteSheet.draw();
        canvasContext.restore();
    }

    checkClick(){
        if (CollisionEngine.pointInAABB(mouseX, mouseY, this.xMin, this.xMax, this.yMin, this.yMax)){
            this.clicked = true;
            this.state = !this.state;   
        }
        else{
            this.clicked = false;
        }
        return this.clicked;
    }

    updateSpriteSheet(dt){
        this.spriteSheet.update(dt);
    }
}

class LoadingText{
    constructor(maxPeriodCount, periodDuration){
        this.maxPeriodCount = maxPeriodCount;
        this.currentPeriodCount = 1;
        this.periodDuration = periodDuration;
        this.periodTimer = new Timer(periodDuration, false);
        this.periodTimer.start();
        this.baseString = 'Loading.';
        this.recentlyLoadedClip = null;
    }
    update(recentlyLoadedClip){
        if (this.periodTimer.checkTime()){
            this.currentPeriodCount += 1;
            this.currentPeriodCount = this.currentPeriodCount % (this.maxPeriodCount + 1);
            this.periodTimer.start();
        }
        this.recentlyLoadedClip = recentlyLoadedClip;
    }
    draw(){
        var loadingStr = this.baseString + '.'.repeat(this.currentPeriodCount);
        canvasContext.save();
        canvasContext.fillStyle = playerColor;
        canvasContext.font = '50px IM Fell English SC';
        canvasContext.textAlign = 'left';
        canvasContext.fillText(loadingStr, canvas.width/2 - 100, -65 + canvas.height/2);
        
        if (this.recentlyLoadedClip != null){
            var assetStr = 'Loaded: ' + this.recentlyLoadedClip;
            canvasContext.font = '20px IM Fell English SC';
            canvasContext.textAlign = 'center';
            canvasContext.fillText(assetStr, canvas.width/2, -35 + canvas.height/2);
        }
        canvasContext.restore();
    }
}
function drawArrows(){
    tutorialArrowLeft.draw();
    tutorialArrowRight.draw();
}

function drawGoal(){
    var goal = gameBoard.board.currentGoal;
    if (goal != null){
        goal.draw();
    }
}

function drawTutorialScene(dt){
    draw(dt);
    drawOrder(); //being called twice.. once in draw, then again here.
    drawArrows();
    muteButton.draw();
}

function drawDebugTitle(){
    canvasContext.save();
    canvasContext.fillStyle = greenAlpha;
    canvasContext.fillRect(howToHitBox.xMin, howToHitBox.yMin, howToHitBox.xMax - howToHitBox.xMin, howToHitBox.yMax - howToHitBox.yMin);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = grayAlpha;
    canvasContext.fillRect(playHitBox.xMin, playHitBox.yMin, playHitBox.xMax - playHitBox.xMin, playHitBox.yMax - playHitBox.yMin);
    canvasContext.restore();

}

function drawDebugHowTo(){
    canvasContext.save();
    canvasContext.fillStyle = greenAlpha;
    canvasContext.fillRect(backHitBox.xMin, backHitBox.yMin, backHitBox.xMax - backHitBox.xMin, backHitBox.yMax - backHitBox.yMin);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = grayAlpha;
    canvasContext.fillRect(tutorialHitBox.xMin, tutorialHitBox.yMin, tutorialHitBox.xMax - tutorialHitBox.xMin, tutorialHitBox.yMax - tutorialHitBox.yMin);
    canvasContext.restore();

}

function drawLoadingScreen(){
    drawBackground();
    loadingText.draw();

}
function drawTitleScene(howToMouseOver, playMouseOver){
    drawBackground();
    muteButton.draw();
    //drawDebugTitle();
    var titleStr, howToStr, playStr;
    titleStr = 'Pickets';
    howToStr = 'How to play';
    playStr  = 'Begin';

    canvasContext.save();
    canvasContext.fillStyle = playerColor;
    canvasContext.font = '50px IM Fell English SC';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(titleStr, canvas.width/2 , -65 + canvas.height/2);

    canvasContext.fillStyle = (howToMouseOver)? enemyColor : playerColor;
    canvasContext.font = '20px IM Fell English SC';
    canvasContext.fillText(howToStr, canvas.width/2 , -5 + canvas.height/2);

    canvasContext.fillStyle = (playMouseOver)? enemyColor : playerColor;
    canvasContext.fillText(playStr, canvas.width/2 , 45 + canvas.height/2);
    canvasContext.restore();

}

function drawHowToScene(backHighLighted, tutorialHighlighted){
    drawBackground();
    muteButton.draw();
    //drawDebugHowTo();
    var titleStr, keysStr, aStr, fStr, spaceStr, shiftStr, escStr, mouseStr, leftClickStr, rightClickStr, backStr, tutorialStr;
    
    titleStr = 'How to play';
    keysStr = 'Keys:'
    aStr = 'A - Toggle between move and attack command.';
    fStr = 'F - Switch to fallback command.';
    spaceStr = 'Spacebar - Hold to display unit combat, skirmish, and command radii.';
    shiftStr = 'Shift - Hold while clicking to queue commands.';
    escStr = 'Esc - Deselect current unit and switch to move command.';
    
    mouseStr = 'Mouse:'
    leftClickStr = 'Left - Select a friendly unit.';
    rightClickStr = 'Right - Issue current command to selected unit.';

    backStr = 'Back';
    tutorialStr  = 'Play tutorial';
    canvasContext.save();
    canvasContext.fillStyle = playerColor;
    canvasContext.font = '40px IM Fell English SC';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(titleStr, canvas.width/2 , -200 + canvas.height/2);

    canvasContext.font = '19px IM Fell English SC';
    canvasContext.textAlign = 'left';
    var horPosition = canvas.width/2 - 250;
    canvasContext.fillText(keysStr, horPosition + 25, -160 + canvas.height/2);
    canvasContext.fillText(aStr, horPosition, -130 + canvas.height/2);
    canvasContext.fillText(fStr, horPosition, -100 + canvas.height/2);
    canvasContext.fillText(spaceStr, horPosition, -70 + canvas.height/2);
    canvasContext.fillText(shiftStr, horPosition, -40 + canvas.height/2);
    canvasContext.fillText(escStr, horPosition, -10 + canvas.height/2);
    canvasContext.fillText(mouseStr, horPosition + 25, 30 + canvas.height/2);
    canvasContext.fillText(leftClickStr, horPosition, 60 + canvas.height/2);
    canvasContext.fillText(rightClickStr, horPosition, 90 + canvas.height/2);

    canvasContext.fillStyle = (backHighLighted)? enemyColor : playerColor;
    canvasContext.font = '20px IM Fell English SC';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(backStr, canvas.width/2 , 150 + canvas.height/2);
    
    canvasContext.fillStyle = (tutorialHighlighted)? enemyColor : playerColor;
    canvasContext.font = '20px IM Fell English SC';
    canvasContext.fillText(tutorialStr, canvas.width/2 , 190 + canvas.height/2);
    canvasContext.restore();
}