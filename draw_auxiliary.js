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
    drawGoal();
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

function drawTitleScene(howToMouseOver, playMouseOver){
    drawBackground();
    drawScreen();
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
    drawScreen();
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