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
        //scenes = Object.freeze({titleScene:1, howToScene:2, gameScene:3, endScene:4});
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
            case scenes.gameScene:
                this.endGameScene();
                break;
            case scenes.endScene:
                this.endEndScene();
                break;
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
            case scenes.gameScene:
                this.beginGameScene();
                break;
            case scenes.endScene:
                this.beginEndScene(variableArgs);
                break;
        }
    }

    beginTitleScene(){

    }

    beginGameScene(){
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

        //Clear active and hover units
        activeUnit = undefined,
        hoverUnit = undefined,

        //Reset win conditions
        fullRetreatPlayer = false,
        fullRetreatEnemy = false,
        gameOver = false;

        givingOrder = false,
        queuingOrders = false,
        selector = 0;

        //Event listeners
        canvas.addEventListener("mousedown", handleMouseDown, false);
        canvas.addEventListener("contextmenu", handleRightClickUp, false);
        canvas.addEventListener("mousemove", getMousePosition, false);

        window.addEventListener("keydown", handleKeyPress, false);
        window.addEventListener("keyup", handleKeyRelease, false);

        //Enums 
        commandTypes     = Object.freeze({move:1, attackmove:2, fallback:3, retreat:4});
        commandColors    = Object.freeze({move: '#008000', attackmove: '#FF0000', fallback: '#FF00FF'});
        waypointColors   = Object.freeze({move: hexToRGB(commandColors.move, 0.15), attackmove: hexToRGB(commandColors.attackmove, 0.15), 
                                        fallback: hexToRGB(commandColors.fallback, 0.15)});
        targetPosColors  = Object.freeze({move: hexToRGB(commandColors.move, 0.35), attackmove: hexToRGB(commandColors.attackmove, 0.35), 
                                        fallback: hexToRGB(commandColors.fallback, 0.35)});
        unitTypes        = Object.freeze({infantry:1, general:2, courier:3, artillery:4, cavalry:5})
        unitSpeeds       = Object.freeze({infantry:15, general:30, courier:75, artillery:12, cavalry:30})
        winConditions    = Object.freeze({generalCaptured:1, unitsRouting:2, unitsCaptured:3})
        unitStates       = Object.freeze({marching:1, braced:2, entrenched:3});
        fortifyModifiers = Object.freeze({marching:1.5, braced:1, entrenched:0.8})
        armies           = Object.freeze({blue:1, red:2});
        animationTypes   = Object.freeze({skirmish:1, battle:2});
        tileTypes        = Object.freeze({plain:0, road:1, mountain:2});
        enemyGenStates   = Object.freeze({surviving:0, rallying:1, commanding:2});
        
        unitTypeNames    = Object.keys(unitTypes);
        unitStateNames   = Object.keys(unitStates);

        //Initialize some colors
        orderColor = hexToRGB(playerColor, 0.25);
        enemyOrderColor = hexToRGB(enemyColor, 0.25);
        crimsonAlpha = hexToRGB(crimson, 0.85);
        greenAlpha = hexToRGB(green, 0.85);
        grayAlpha = hexToRGB(gray, 0.5);
        flankAlpha = hexToRGB(crimson, 0.25);
        frontAlpha = hexToRGB(forestGreen, 0.25);
        skirmishAlpha = hexToRGB(forestGreen, 0.45);

        //Initialize stuff
        commandType = commandTypes.move;
        combatTextList = new FloatingText();
        unitToolTip = new UnitToolTip(canvas.width/4, canvas.height/6, 20, 'black', 'hoverUnit');
        hoverHealth = new HoverHealth(40, 5, 2, crimsonAlpha, grayAlpha);
        activeHealth = new ActiveHealth(40, 5, 2, greenAlpha, grayAlpha);

        //reference external .svgs
        initializeSpriteSheets();

        gameBoard = new GameBoard(30,40);
        gameBoard.initializeBoard();
        hoverUnit = {};


        //Enter main game loop
        main();
    }

    beginHowToScene(){
        
    }

    beginEndScene(variableArgs){
        //Add a restart game key event listener
        window.addEventListener("keydown", handleEndGameKeyPress, false);
        //Go to end screen.
        drawEndGame(variableArgs.playerVictory, variableArgs.condition);
    }

    endTitleScene(){

    }

    endGameScene(){
        //Game's over, remove event listeners
        canvas.removeEventListener("mousedown", handleMouseDown, false);
        canvas.removeEventListener("contextmenu", handleRightClickUp, false);
        canvas.removeEventListener("mousemove", getMousePosition, false);

        window.removeEventListener("keydown", handleKeyPress, false);
        window.removeEventListener("keyup", handleKeyRelease, false);
    }

    endHowToScene(){
        
    }

    endEndScene(){
        //Remove end game listeners
        window.removeEventListener("keydown", handleEndGameKeyPress, false);
    }
}
