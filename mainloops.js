"use strict";

function mainTitle(){
    var howToHighLighted, beginHighlighted;
    howToHighLighted = beginHighlighted = false;
    
    if (CollisionEngine.pointInAABB(mouseX, mouseY, howToHitBox.xMin, howToHitBox.xMax, howToHitBox.yMin, howToHitBox.yMax)){
        howToHighLighted = true;
        beginHighlighted = false;
    }
    else if (CollisionEngine.pointInAABB(mouseX, mouseY, playHitBox.xMin, playHitBox.xMax, playHitBox.yMin, playHitBox.yMax)){
        howToHighLighted = false;
        beginHighlighted = true;
    }
    else{
        howToHighLighted = false;
        beginHighlighted = false;
    }

    drawTitleScene(howToHighLighted, beginHighlighted);

    if (checkSceneChange()){
        return;
    }

    requestAnimationFrame(mainTitle);
}

function mainGame(){
    //Main loop
    //Time calculations
    currentFrame = new Date();
    dt = (currentFrame - lastFrame)/1000.0;
    lastFrame = currentFrame;
    count = 0;
    //Game over?
    if(checkWinCondition()){
        gameOver = true;
        return;
    }

    //Updates
    gameBoard.update(dt);
    draw(dt);

    requestAnimationFrame(mainGame);
}

//Loop conditions

function checkSceneChange(){
    if (playClicked){
        sceneHandler.changeScene(scenes.gameScene);
        return true;
    }
    else if (howToClicked){
        return true;    
    }
    return false;
}

function checkWinCondition(){
    //Check win conditions
    var ending = false;
    var playerVictory = false;
    var condition;
    if (playerGeneral.captured){
        ending = true;
        condition = winConditions.generalCaptured;
    }
    else if (enemyGeneral.captured){
        ending = true;
        condition = winConditions.generalCaptured;
        playerVictory = true;
    }
    else if (Object.keys(playerInfantryList) < 1 && Object.keys(playerCavalryList) < 1 && Object.keys(playerArtilleryList) < 1){
        ending = true;
        condition = winConditions.unitsCaptured;
    }
    else if (Object.keys(enemyInfantryList) < 1 && Object.keys(enemyCavalryList) < 1 && Object.keys(enemyArtilleryList) < 1){
        ending = true;
        condition = winConditions.unitsCaptured;
        playerVictory = true;
    }
    else if (fullRetreatPlayer){
        ending = true;
        condition = winConditions.unitsRouting;
    }
    else if (fullRetreatEnemy){
        ending = true;
        condition = winConditions.unitsRouting;
        playerVictory = true;
    }

    if (ending){
        sceneHandler.changeScene(scenes.endScene, {playerVictory: playerVictory, condition: condition});
    }
    return ending;
}