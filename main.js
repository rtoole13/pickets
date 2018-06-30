"use strict";

//Base//
var canvas = document.getElementById('gameCanvas'),
	canvasContext,
	lastFrame = new Date(),
	currentFrame,
	dt,
	mouseX,
	mouseY,
    debugState = false;
    var count = 0;

//Game Objects//
var gameBoard,
	unitList = {},
	playerCourierList = {},
	playerCavalryList = {},
	playerInfantryList = {},
	playerArtilleryList = {},
	playerUnitList = {},
	playerGeneral,

	enemyCourierList = {},
	enemyCavalryList = {},
	enemyInfantryList = {},
	enemyArtilleryList = {},
	enemyUnitList = {},
	enemyGeneral,

	//Enums
	commandTypes,
	unitStates,
	armies,
	unitTypes,
	unitSpeeds,
    winConditions,
	commandType,

	playerColor = "#5F9EA0",
	enemyColor  = "#8B0000",
	
	orderColor,

	activeUnit,
	targetOriginX,
	targetOriginY,
	minDragDrawDistance = 5,

	givingOrder = false,
	selector = 0;


window.onload = function(){
	canvasContext = canvas.getContext('2d');
	
	canvas.style.cursor = "crosshair";
	canvas.addEventListener("mousedown", handleMouseDown, false);
	canvas.addEventListener("contextmenu", handleRightClickUp, false);
	canvas.addEventListener("mousemove", getMousePosition, false);

	window.addEventListener("keydown", handleKeyPress, false);
	init();

}

function init(){

	//Enums 
	commandTypes  = Object.freeze({move:1, attackmove:2, fallback:3});
	unitTypes     = Object.freeze({infantry:1, general:2, courier:3, artillery:4, cavalry:5})
	unitSpeeds	  = Object.freeze({infantry:15, general:30, courier:75, artillery:12, cavalry:30})
    winConditions = Object.freeze({generalCaptured:1, unitsRouting:2, unitsCaptured:3})
	unitStates    = Object.freeze({marching:1, braced:2, entrenched:3});
	armies        = Object.freeze({blue:1, red:2});
	//Initialize colors
	orderColor = hexToRGB(playerColor, 0.25);

	//Initialize stuff
	commandType = commandTypes.move;
	gameBoard = new GameBoard(30,40);
	gameBoard.initializeBoard();
	//Enter main game loop
	main();
}

function main(){
	//Main loop
	//Time calculations
	currentFrame = new Date();
	dt = (currentFrame - lastFrame)/1000.0;
	lastFrame = currentFrame;

	//Game over?
	if(checkWinCondition()){
        return;
    }

	//Updates
	gameBoard.update(dt);
	draw(dt);

	requestAnimationFrame(main);
}

function checkWinCondition(){
	//Check win conditions
    var gameOver = false;
    var playerVictory = false;
    var condition;
    if (playerGeneral.captured){
        gameOver = true;
        condition = winConditions.generalCaptured;
    }
    else if (enemyGeneral.captured){
        gameOver = true;
        condition = winConditions.generalCaptured;
        playerVictory = true;
    }
    else if (Object.keys(playerInfantryList) < 1 && Object.keys(playerCavalryList) < 1 && Object.keys(playerArtilleryList) < 1){
        gameOver = true;
        condition = winConditions.unitsCaptured;
    }
    else if (Object.keys(enemyInfantryList) < 1 && Object.keys(enemyCavalryList) < 1 && Object.keys(enemyArtilleryList) < 1){
        gameOver = true;
        condition = winConditions.unitsCaptured;
        playerVictory = true;
    }


    if (gameOver){
        //Game's over, go to end screen.
        drawEndGame(playerVictory, condition);
    }
    return gameOver;
}

//Event Handlers
function handleMouseDown(e){
	switch(e.button){
		case 0:
			handleLeftClick();
			break;
		
		case 2:
			handleRightClickDown();
			break;
		
	}
}

function handleLeftClick(){
	if (CollisionEngine.pointInCircle(mouseX, mouseY, playerGeneral.x, playerGeneral.y, 13)){
		activeUnit = playerGeneral;
		console.log("Selected general at " + "(" + playerGeneral.x + ", " + playerGeneral.y + ")");
		return;
	}

	for (var id in playerCavalryList){
		var unit = playerCavalryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected cavalry unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}

	for (var id in playerInfantryList){
		var unit = playerInfantryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected infantry unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}

	for (var id in playerArtilleryList){
		var unit = playerArtilleryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected artillery unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}
	activeUnit = undefined;
	console.log("No unit selected");
	return;
}
function selectEnemyUnit(x, y){
	if (CollisionEngine.pointInCircle(x, y, enemyGeneral.x, enemyGeneral.y, 13)){
		return enemyGeneral;
	}

	for (var id in enemyCavalryList){
		var unit = enemyCavalryList[id];
		if (CollisionEngine.pointInCircle(x, y, unit.x, unit.y, 23)){
			return unit;
		}
	}

	for (var id in enemyInfantryList){
		var unit = enemyInfantryList[id];
		if (CollisionEngine.pointInCircle(x, y, unit.x, unit.y, 23)){
			return unit;
		}
	}

	for (var id in enemyArtilleryList){
		var unit = enemyArtilleryList[id];
		if (CollisionEngine.pointInCircle(x, y, unit.x, unit.y, 23)){
			return unit;
		}
	}
	return null;
}

function handleRightClickDown(){
	if (activeUnit != undefined || null){
		if (activeUnit == playerGeneral){
			playerGeneral.moveToLocation(mouseX, mouseY);
			console.log("Moving general to " + "(" + playerGeneral.targetPosition.x + ", " + playerGeneral.targetPosition.y + ")");
		}
		else{
			targetOriginX = mouseX;
			targetOriginY = mouseY;

			var target;
			target = selectEnemyUnit(mouseX, mouseY);
			if (target != null){
				playerGeneral.issueCommand(activeUnit, {type: commandType, target: target, x: targetOriginX, y: targetOriginY, angle: null, date: Date.now()});
			}
			else{
			givingOrder = true;
			}
		}
	}
	else{
		givingOrder = false;
	}
}
function handleRightClickUp(e){
	e.preventDefault();
	if ((activeUnit != undefined || null) && (activeUnit != playerGeneral) && givingOrder){
		givingOrder = false;

		var dist, dirX, dirY, targetAngle;
		dist = getDistance(targetOriginX, targetOriginY, mouseX, mouseY);
		if (dist >= minDragDrawDistance){
			dirX = (mouseX - targetOriginX) / dist;
			dirY = (mouseY - targetOriginY) / dist;
			targetAngle = getAngleFromDir(dirX, dirY);
		}
		else{
			targetAngle = null;
		}
		playerGeneral.issueCommand(activeUnit, {type: commandType, target: null, x: targetOriginX, y: targetOriginY, angle: targetAngle, date: Date.now()});
	}
}

function handleKeyPress(e){
	var keyCode = e.keyCode;
	switch (keyCode){
		case 27:
			//Escape
			if (activeUnit != undefined){
				activeUnit = undefined;
			}
			commandType = commandTypes.move;
			break;
		
		case 65:
			//A
			if (commandType == commandTypes.attackmove){
				commandType = commandTypes.move;
			}
			else{
				commandType = commandTypes.attackmove;
			}
			break;
		
		case 70:
			//F
			if (commandType == commandTypes.fallback){
				commandType = commandTypes.move;
			}
			else{
				commandType = commandTypes.fallback;
			}
			break;
		
	}
}

function getMousePosition(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;
}
