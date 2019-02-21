"use strict";

class SceneHandler {
    constructor(firstScene){
        this.currentScene = firstScene;

        if (!SceneHandler.instance){
            SceneHandler.instance = this;
        }

        return SceneHandler.instance;
    }
    
    changeScene(targetScene, variableArgs){
        switch(this.currentScene){
            default:
                this.endGameScene();
                break;
            case scenes.titleScene:
                this.endTitleScene();
                break;
            case scenes.howToScene:
                this.endHowToScene();
                break;
            case scenes.tutorialScene:
                this.endTutorialScene();
                break;
            case scenes.gameScene:
                this.endGameScene();
                break;
            case scenes.endScene:
                this.endEndScene();
                break;
            case scenes.loadingScene:
                this.endLoadingScene();
        }

        this.currentScene = targetScene;
        switch(targetScene){
            default:
                this.beginGameScene();
                break;
            case scenes.titleScene:
                this.beginTitleScene();
                break;
            case scenes.howToScene:
                this.beginHowToScene();
                break;
            case scenes.tutorialScene:
                this.beginTutorialScene();
                break;
            case scenes.gameScene:
                this.beginGameScene();
                break;
            case scenes.endScene:
                this.beginEndScene(variableArgs);
                break;
            case scenes.loadingScene:
                this.beginLoadingScene();
        }
    }

    loadGameBoardPreset(boardName){
        switch(boardName){
            default: 
                return new MainBoard();
            case boards.main:
                return new MainBoard();
            case boards.tutorialOne:
                return new TutorialOneBoard();
            case boards.tutorialTwo:
                return new TutorialTwoBoard();
            case boards.tutorialThree:
                return new TutorialThreeBoard();
        }
    }

    beginLoadingScene(){
        setBackground('loading_screen');

        eventHandler.addEventListener('window', "mousedown", handleInteract, false);
        eventHandler.addEventListener('canvas', "contextmenu", disableRightClick, false);

        loadingText = new LoadingText(2, 500);

        //Enter loading screen loop
        loopLoadingScreen();
    }

    beginTitleScene(){
        setBackground('main_map-screened');
        howToHitBox = {xMin: canvas.width/2 - 55, xMax: canvas.width/2 + 55, yMin: canvas.height/2 - 30, yMax: canvas.height/2 + 10};
        playHitBox = {xMin: canvas.width/2 - 35, xMax: canvas.width/2 + 35, yMin: canvas.height/2 + 20, yMax: canvas.height/2 + 60};
        playClicked = howToClicked = false;
        
        eventHandler.addEventListener('window', "mousedown", handleInteract, false);
        eventHandler.addEventListener('canvas', "mousemove", getMousePositionTitle, false);
        eventHandler.addEventListener('canvas', "mousedown", handleTitleMouseDown, false);
        eventHandler.addEventListener('canvas', "contextmenu", disableRightClick, false);
        
        //audioHandler.crossFadeLoopAudioGroup('ambient', false, 0, 1, 5000);

        //Enter title screen game loop
        loopMainTitle();
    }

    beginGameScene(){
        audioHandler.killManagedClips();
        audioHandler.crossFadeLoopAudioGroup('ambient', false, 0, .03, 5000);

        setBackground('main_map');
        initializePlayableState(sceneHandler.loadGameBoardPreset(boards.main), true);
        
        //Enter main game loop
        loopMainGame();
    }

    beginHowToScene(){
        setBackground('tutorial_map-screened');
        tutorialHitBox = {xMin: canvas.width/2 - 65, xMax: canvas.width/2 + 65, yMin: canvas.height/2 + 160, yMax: canvas.height/2 + 190};
        backHitBox = {xMin: canvas.width/2 - 35, xMax: canvas.width/2 + 35, yMin: canvas.height/2 + 120, yMax: canvas.height/2 + 150};
        playClicked = howToClicked = false;
        
        eventHandler.addEventListener('canvas', "mousemove", getMousePositionTitle, false);
        eventHandler.addEventListener('canvas', "mousedown", handleHowToMouseDown, false);
        eventHandler.addEventListener('canvas', "contextmenu", disableRightClick, false);
        
        //Enter title screen game loop
        loopHowTo();
    }

    beginTutorialScene(){
        audioHandler.killManagedClips();
        audioHandler.crossFadeLoopAudioGroup('ambient', false, 0, .03, 5000);

        setBackground('tutorial_map');
        tutorialSceneCount = tutorialBoardNames.length;
        currentTutorial = 0;
        
        //tutorial arrows
        tutorialArrowLeft = new TutorialArrow(80, 500, 80, 80, true);
        tutorialArrowRight = new TutorialArrow(720, 500, 80, 80, false);

        //Set tutorial params and gameboard
        initializePlayableState(sceneHandler.loadGameBoardPreset(boards[tutorialBoardNames[currentTutorial]]), false);

        //Enter tutorial loop
        loopTutorialScene();
    }

    beginEndScene(variableArgs){
        setBackground('main_map-screened');
        //Add a restart game key event listener
        eventHandler.addEventListener('window', "keydown", handleEndGameKeyPress, false);
        eventHandler.addEventListener('canvas', "contextmenu", disableRightClick, false);
        
        //Go to end screen.
        drawEndGame(variableArgs.playerVictory, variableArgs.condition);
    }

    endLoadingScene(){
        loadingText = null;
        eventHandler.removeEventListenersByEvent("mousemove");
        eventHandler.removeEventListenersByEvent("contextmenu");
    }
    
    endTitleScene(){
        eventHandler.removeEventListenersByEvent("mousemove");
        eventHandler.removeEventListenersByEvent("mousedown");
        eventHandler.removeEventListenersByEvent("contextmenu");

        howToHitBox = null;
        playHitBox = null;
        howToClicked = null;
        playClicked = null;
    }

    endGameScene(){
        //Game's over, remove event listeners
        eventHandler.removeEventListenersByEvent("mousedown");
        eventHandler.removeEventListenersByEvent("contextmenu");
        eventHandler.removeEventListenersByEvent("mousemove");
        eventHandler.removeEventListenersByEvent("keydown");
        eventHandler.removeEventListenersByEvent("keyup");

        commandHandler = null;
        mouseOrderButtons = null;
        courierCountIcon = null;
    }

    endHowToScene(){
        eventHandler.removeEventListenersByEvent("mousemove");
        eventHandler.removeEventListenersByEvent("mousedown");
        eventHandler.removeEventListenersByEvent("contextmenu");

        backHitBox = null;
        tutorialHitBox = null;
        backClicked = null;
        tutorialClicked = null;
        
    }

    endTutorialScene(){
        eventHandler.removeEventListenersByEvent("mousedown");
        eventHandler.removeEventListenersByEvent("contextmenu");
        eventHandler.removeEventListenersByEvent("mousemove");
        eventHandler.removeEventListenersByEvent("keydown");
        eventHandler.removeEventListenersByEvent("keyup");

        commandHandler = null;
        mouseOrderButtons = null;
        courierCountIcon = null;
        tutorialArrowLeft = null;
        tutorialArrowRight = null;
        tutorialSceneCount = null;
        currentTutorial = null;

    }

    endEndScene(){
        //Remove end game listeners
        eventHandler.removeEventListenersByEvent("keydown");
    }
}

function initializePlayableState(board, mainGame){
    //called by both tutorial and game scene.
    //Zero out dicts
    unitList = {},
    playerCourierList = {},
    playerCavalryList = {},
    playerInfantryList = {},
    playerArtilleryList = {},
    playerUnitList = {},

    enemyCourierList = {},
    enemyCavalryList = {},
    enemyInfantryList = {},
    enemyArtilleryList = {},
    enemyUnitList = {},

    animationList = {},
    combatTextList = {},
    unitToolTip = {},
    hoverHealth = {},
    activeHealth = {},

    //Clear active unit
    activeUnit = undefined,

    //Reset win conditions
    fullRetreatPlayer = false,
    fullRetreatEnemy = false,
    gameOver = false;

    givingOrder = false,
    queuingOrders = false,
    selector = new Selector(25, 2, 2, 1/6);

    //Event listeners
    if (mainGame){
        eventHandler.addEventListener('canvas', "contextmenu", handleRightClickUp, false);
        eventHandler.addEventListener('canvas', "mousemove", getMousePosition, false);
        eventHandler.addEventListener('canvas', "mousedown", handleMouseDown, false);
        eventHandler.addEventListener('window', "keydown", handleKeyPress, false);
        eventHandler.addEventListener('window', "keyup", handleKeyRelease, false);
    }

    //Enums 
    commandTypes     = Object.freeze({move:1, attackmove:2, fallback:3, retreat:4});
    commandColors    = Object.freeze({move: '#008000', attackmove: '#FF0000', fallback: '#FF00FF'});
    waypointColors   = Object.freeze({move: hexToRGB(commandColors.move, 0.15), attackmove: hexToRGB(commandColors.attackmove, 0.15), 
                                    fallback: hexToRGB(commandColors.fallback, 0.15)});
    targetPosColors  = Object.freeze({move: hexToRGB(commandColors.move, 0.35), attackmove: hexToRGB(commandColors.attackmove, 0.35), 
                                    fallback: hexToRGB(commandColors.fallback, 0.35)});
    unitTypes        = Object.freeze({infantry:1, general:2, courier:3, artillery:4, cavalry:5});
    unitSpeeds       = Object.freeze({infantry:15, general:30, courier:75, artillery:12, cavalry:30});
    winConditions    = Object.freeze({generalCaptured:1, unitsRouting:2, unitsCaptured:3})
    unitStates       = Object.freeze({marching:1, braced:2, entrenched:3, exposed: 4});
    fortifyModifiers = Object.freeze({marching:2, braced:1, entrenched:0.8, exposed: 1.5});
    armies           = Object.freeze({blue:1, red:2});
    animationTypes   = Object.freeze({skirmish:1, battle:2, artillery:3});
    tileTypes        = Object.freeze({plain:0, road:1, mountain:2});
    enemyGenStates   = Object.freeze({surviving:0, rallying:1, commanding:2});
    
    unitTypeNames    = Object.keys(unitTypes);
    unitStateNames   = Object.keys(unitStates);


    //Initialize stuff
    commandType = commandTypes.move;
    combatTextList = new FloatingText();
    unitToolTip = new UnitToolTip(canvas.width/4, canvas.height/6, {x:55, y:20}, 'black', 'hoverUnit');
    hoverHealth = new HoverHealth(40, 5, 2, crimsonAlpha, grayAlpha);
    activeHealth = new ActiveHealth(40, 5, 2, greenAlpha, grayAlpha);
    mouseOrderButtons = new MouseOrderButtons(canvas.width / 2, canvas.height - 50, 52, 52, 15);
    courierCountIcon = new CourierCountIcon(canvas.width / 2  - 125, canvas.height - 30);
    commandHandler = new CommandHandler();

    gameBoard = new GameBoard(30,40, board);
    gameBoard.initializeBoard();

    hoverUnit = {};
}

function resetObjects(){
    //Zero out dicts
    unitList = {},
    playerCourierList = {},
    playerCavalryList = {},
    playerInfantryList = {},
    playerArtilleryList = {},
    playerUnitList = {},

    enemyCourierList = {},
    enemyCavalryList = {},
    enemyInfantryList = {},
    enemyArtilleryList = {},
    enemyUnitList = {},

    animationList = {},

    playerGeneral = null,
    enemyGeneral = null,
    
    //Clear active and hover units
    activeUnit = null,
    hoverUnit = {},

    //Reset win conditions
    fullRetreatPlayer = false,
    fullRetreatEnemy = false,
    gameOver = false;

    givingOrder = false,
    queuingOrders = false,
    selector = new Selector(25, 2, 2, 1/6);

    gameBoard = null;
}
function setBackground(target){
    var mainScreen, main, tutScreen, tut;
    mainScreen = document.getElementById('main_map-screened');
    main = document.getElementById('main_map');
    tutScreen = document.getElementById('tutorial_map-screened');
    tut = document.getElementById('tutorial_map');

    switch(target){
        case 'main_map-screened':
            mainScreen.style.visibility = 'visible';
            main.style.visibility = 'hidden';
            tutScreen.style.visibility = 'hidden';
            tut.style.visibility = 'hidden';
            break;
        case 'main_map':
            mainScreen.style.visibility = 'hidden';
            main.style.visibility = 'visible';
            tutScreen.style.visibility = 'hidden';
            tut.style.visibility = 'hidden';
            break;
        case 'tutorial_map-screened':
            mainScreen.style.visibility = 'hidden';
            main.style.visibility = 'hidden';
            tutScreen.style.visibility = 'visible';
            tut.style.visibility = 'hidden';
            break;
        case 'tutorial_map':
            mainScreen.style.visibility = 'hidden';
            main.style.visibility = 'hidden';
            tutScreen.style.visibility = 'hidden';
            tut.style.visibility = 'visible';
            break;
        case 'loading_screen':
            mainScreen.style.visibility = 'visible';
            main.style.visibility = 'hidden';
            tutScreen.style.visibility = 'hidden';
            tut.style.visibility = 'hidden';
            break;
        default:
            mainScreen.style.visibility = 'hidden';
            main.style.visibility = 'visible';
            tutScreen.style.visibility = 'hidden';
            tut.style.visibility = 'hidden';
            break;
    }
}