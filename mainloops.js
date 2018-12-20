"use strict";

function loopMainTitle(){
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

    if (checkTitleSceneChange()){
        return;
    }

    requestAnimationFrame(loopMainTitle);
}

function loopHowTo(){
    var backHighLighted, tutorialHighlighted;
    backHighLighted = tutorialHighlighted = false;
    
    if (CollisionEngine.pointInAABB(mouseX, mouseY, backHitBox.xMin, backHitBox.xMax, backHitBox.yMin, backHitBox.yMax)){
        backHighLighted = true;
        tutorialHighlighted = false;
    }
    else if (CollisionEngine.pointInAABB(mouseX, mouseY, tutorialHitBox.xMin, tutorialHitBox.xMax, tutorialHitBox.yMin, tutorialHitBox.yMax)){
        backHighLighted = false;
        tutorialHighlighted = true;
    }
    else{
        backHighLighted = false;
        tutorialHighlighted = false;
    }

    drawHowToScene(backHighLighted, tutorialHighlighted);

    if (checkHowToSceneChange()){
        return;
    }

    requestAnimationFrame(loopHowTo);
}

function loopMainGame(){
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
    
    audioHandler.updatePools();
    requestAnimationFrame(loopMainGame);
}

function loopTutorialScene(){
    //Tutorial loop
    //Time calculations
    currentFrame = new Date();
    dt = (currentFrame - lastFrame)/1000.0;
    lastFrame = currentFrame;
    count = 0;
    if (checkTutorialSceneChange()){
        return;
    }
    tutorialArrowLeft.update(dt);
    tutorialArrowRight.update(dt);
    
    checkTutorialGoals();
    gameBoard.board.checkGoals();
    gameBoard.update(dt);
    
    drawTutorialScene(dt);
    
    audioHandler.updatePools();
    requestAnimationFrame(loopTutorialScene);
}

//Loop conditions
function checkTutorialGoals(){

}

function checkTutorialSceneChange(){
    var changed = false;
    if (tutorialArrowLeft.clicked){
        currentTutorial -= 1;
        tutorialArrowLeft.clicked = false;
        changed = true;
    }
    else if (tutorialArrowRight.clicked){
        currentTutorial += 1;
        tutorialArrowRight.clicked = false;
        changed = true;
    }

    if (currentTutorial < 0 || currentTutorial > (tutorialSceneCount - 1)){
        sceneHandler.changeScene(scenes.titleScene);
        return true;
    }

    if (changed){
        changeTutorialScene(currentTutorial);
    }
    return false;
}

function checkTitleSceneChange(){
    if (playClicked){
        sceneHandler.changeScene(scenes.gameScene);
        return true;
    }
    else if (howToClicked){
        sceneHandler.changeScene(scenes.howToScene);
        return true;    
    }
    return false;
}

function checkHowToSceneChange(){
    if (tutorialClicked){
        sceneHandler.changeScene(scenes.tutorialScene);
        return true;
    }
    else if (backClicked){
        sceneHandler.changeScene(scenes.titleScene);
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

function changeTutorialScene(tutorialSceneNumber){
    resetObjects();

    var board = boards[tutorialBoardNames[tutorialSceneNumber]];
    gameBoard = new GameBoard(30, 40, board);
    gameBoard.initializeBoard();
}