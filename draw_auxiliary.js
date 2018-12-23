"use strict";

class TutorialArrow {
    constructor(centerX, centerY, width, height, arrowLeft){
        this.x = centerX;
        this.y = centerY;
        this.width = width;
        this.height = height;
        this.arrowLeft = arrowLeft; //true if left, false if right
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
    onClick(){

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
    //drawDebugTitle();
    var titleStr, howToStr, playStr;
    titleStr = 'Pickets';
    howToStr = 'How to play';
    playStr  = 'Begin';

    canvasContext.save();
    canvasContext.fillStyle = playerColor;
    canvasContext.font = '50px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(titleStr, canvas.width/2 , -65 + canvas.height/2);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = (howToMouseOver)? enemyColor : playerColor;
    canvasContext.font = '20px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(howToStr, canvas.width/2 , -5 + canvas.height/2);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = (playMouseOver)? enemyColor : playerColor;
    canvasContext.font = '20px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(playStr, canvas.width/2 , 45 + canvas.height/2);
    canvasContext.restore();

}

function drawHowToScene(backHighLighted, tutorialHighlighted){
    drawBackground();
    drawScreen();
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
    canvasContext.font = '40px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(titleStr, canvas.width/2 , -200 + canvas.height/2);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = playerColor;
    canvasContext.font = '19px sans-serif';
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
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = (backHighLighted)? enemyColor : playerColor;
    canvasContext.font = '20px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(backStr, canvas.width/2 , 150 + canvas.height/2);
    canvasContext.restore();

    canvasContext.save();
    canvasContext.fillStyle = (tutorialHighlighted)? enemyColor : playerColor;
    canvasContext.font = '20px sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(tutorialStr, canvas.width/2 , 190 + canvas.height/2);
    canvasContext.restore();
}