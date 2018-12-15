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
                color = 'red';
            }
        }
        canvasContext.save()
        canvasContext.fillStyle = color;
        canvasContext.translate(this.x, this.y);
        //canvasContext.strokeRect(-gridNode.width/4, -gridNode.height/4, gridNode.width/2, gridNode.height/2);
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

function drawTutorialScene(dt){
    draw(dt);
    drawArrows();
}
