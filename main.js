"use strict";

//Base//
var canvas = document.getElementById('gameCanvas'),
	canvasContext,
	lastFrame = new Date(),
	currentFrame,
	dt,
	mouseX,
	mouseY,
    debugState = false,
    count = 0;

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

	animationList = {},
	combatTextList = {},
	unitToolTip = {},
	hoverHealth = {},
	activeHealth = {},

	//Enums
	commandTypes,
	unitStates,
	fortifyModifiers,
	armies,
	unitTypes,
	unitSpeeds,
    winConditions,
	commandType,
	commandColors,
	waypointColors,
	targetPosColors,
	animationTypes,
	tileTypes,

	unitTypeNames,
	unitStateNames,

	playerColor = "#5F9EA0",
	enemyColor  = "#8B0000",
	damageColor = "#ff0000",
	crimson     = "#DC143C",
	gray        = "#696969",
	green       = "#90EE90",

	orderColor,
	enemyOrderColor,
	crimsonAlpha,
	grayAlpha,
	greenAlpha,

	activeUnit,
	hoverUnit,
	targetOriginX,
	targetOriginY,
	minDragDrawDistance = 5,
	fullRetreatPlayer = false,
	fullRetreatEnemy = false,


	givingOrder = false,
	queuingOrders = false,
	selector = 0;


window.onload = function(){
	canvasContext = canvas.getContext('2d');
	
	canvas.style.cursor = "crosshair";
	canvas.addEventListener("mousedown", handleMouseDown, false);
	canvas.addEventListener("contextmenu", handleRightClickUp, false);
	canvas.addEventListener("mousemove", getMousePosition, false);

	window.addEventListener("keydown", handleKeyPress, false);
	window.addEventListener("keyup", handleKeyRelease, false);
	init();

}

function init(){
	//Enums 
	commandTypes     = Object.freeze({move:1, attackmove:2, fallback:3, retreat:4});
	commandColors    = Object.freeze({move: '#008000', attackmove: '#FF0000', fallback: '#FF00FF'});
	waypointColors   = Object.freeze({move: hexToRGB(commandColors.move, 0.15), attackmove: hexToRGB(commandColors.attackmove, 0.15), 
									fallback: hexToRGB(commandColors.fallback, 0.15)});
	targetPosColors  = Object.freeze({move: hexToRGB(commandColors.move, 0.35), attackmove: hexToRGB(commandColors.attackmove, 0.35), 
									fallback: hexToRGB(commandColors.fallback, 0.35)});
	unitTypes        = Object.freeze({infantry:1, general:2, courier:3, artillery:4, cavalry:5})
	unitSpeeds	     = Object.freeze({infantry:15, general:30, courier:75, artillery:12, cavalry:30})
    winConditions    = Object.freeze({generalCaptured:1, unitsRouting:2, unitsCaptured:3})
	unitStates       = Object.freeze({marching:1, braced:2, entrenched:3});
	fortifyModifiers = Object.freeze({marching:1.5, braced:1, entrenched:0.8})
	armies           = Object.freeze({blue:1, red:2});
	animationTypes   = Object.freeze({skirmish:1, battle:2});
	tileTypes        = Object.freeze({plain:0, road:1, mountain:2});
	
	unitTypeNames    = Object.keys(unitTypes);
	unitStateNames   = Object.keys(unitStates);

	//Initialize some colors
	orderColor = hexToRGB(playerColor, 0.25);
	enemyOrderColor = hexToRGB(enemyColor, 0.25);
	crimsonAlpha = hexToRGB(crimson, 0.85);
	greenAlpha = hexToRGB(green, 0.85);
	grayAlpha = hexToRGB(gray, 0.5);

	//Initialize stuff
	commandType = commandTypes.move;
	combatTextList = new FloatingText();
	unitToolTip = new UnitToolTip(canvas.width/4, canvas.height/6, 20, 'black', 'hoverUnit');
	hoverHealth = new HoverHealth(40, 5, 2, crimsonAlpha, grayAlpha);
	activeHealth = new ActiveHealth(40, 5, 2, greenAlpha, grayAlpha);

	gameBoard = new GameBoard(30,40);
	gameBoard.initializeBoard();
	hoverUnit = {};
	//Enter main game loop
	main();
}

function main(){
	//Main loop
	//Time calculations
	currentFrame = new Date();
	dt = (currentFrame - lastFrame)/1000.0;
	lastFrame = currentFrame;
	count = 0;
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
    else if (fullRetreatPlayer){
    	gameOver = true;
        condition = winConditions.unitsRouting;
    }
    else if (fullRetreatEnemy){
    	gameOver = true;
        condition = winConditions.unitsRouting;
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

function checkMouseOver(){
	var hitRadius = 25;
	//Check Generals
	if (CollisionEngine.pointInCircle(mouseX, mouseY, playerGeneral.x, playerGeneral.y, hitRadius)){
		setHoverUnitAndToolTip(playerGeneral, false);
		return;
	}
	else{
		hoverUnit.hovered = false;
	}

	if (CollisionEngine.pointInCircle(mouseX, mouseY, enemyGeneral.x, enemyGeneral.y, hitRadius)){
		setHoverUnitAndToolTip(enemyGeneral, false);
		return;
	}
	else{
		hoverUnit.hovered = false;
	}

	//Check Infantry
	for (var id in playerInfantryList){
		var unit = playerInfantryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, hitRadius)){
			setHoverUnitAndToolTip(unit, true);
			return;
		}
		else{
			hoverUnit.hovered = false;
			continue;
		}
	}
	for (var id in enemyInfantryList){
		var unit = enemyInfantryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, hitRadius)){
			setHoverUnitAndToolTip(unit, true);
			return;
		}
		else{
			hoverUnit.hovered = false;
			continue;
		}
	}

	//Check Couriers
	for (var id in playerCourierList){
		var unit = playerCourierList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, hitRadius)){
			setHoverUnitAndToolTip(unit, false);
			return;
		}
		else{
			hoverUnit.hovered = false;
			continue;
		}
	}

	for (var id in enemyCourierList){
		var unit = enemyCourierList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, hitRadius)){
			setHoverUnitAndToolTip(unit, false);
			return;
		}
		else{
			hoverUnit.hovered = false;
			continue;
		}
	}
}

function setHoverUnitAndToolTip(unit, combat){
	if (hoverUnit == null || hoverUnit == undefined){
		return;
	}
	
	hoverUnit.hovered = true;
	hoverUnit.army = unit.army;
	hoverUnit.unitType = unit.unitType;
	hoverUnit.combat = combat;
	hoverUnit.id = unit.id;

	if (combat){
		hoverUnit.x = unit.x;
		hoverUnit.y = unit.y;
		hoverUnit.strength = unit.strength;
		hoverUnit.maxStrength = unit.maxStrength;	
		hoverUnit.state = unit.state;
		hoverUnit.element = unit.element;
	}
	
	
	//May end up not displaying hover unit info on tooltip, but rather activeUnit
}

function handleLeftClick(){
	console.log(gameBoard.grid.getNodeFromLocation(mouseX, mouseY));
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
			playerGeneral.moveToLocation(mouseX, mouseY, queuingOrders);
			console.log("Moving general to " + "(" + playerGeneral.targetPosition.x + ", " + playerGeneral.targetPosition.y + ")");
		}
		else{
			targetOriginX = mouseX;
			targetOriginY = mouseY;

			var target;
			target = selectEnemyUnit(mouseX, mouseY);
			if (target != null){
				playerGeneral.issueCommand(activeUnit, {type: commandType, target: target, x: targetOriginX, y: targetOriginY, angle: null, date: Date.now(), queue: queuingOrders});
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
		playerGeneral.issueCommand(activeUnit, {type: commandType, target: null, x: targetOriginX, y: targetOriginY, angle: targetAngle, date: Date.now(), queue: queuingOrders});
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
		
		case 16:
			//Shift
			queuingOrders = true;
			break;
		
		default:
			return;
	}
}

function handleKeyRelease(e){
	var keyCode = e.keyCode;
	switch(keyCode){
		case 16: 
			queuingOrders = false;
			break;
		default:
			return;
	}
}

function getMousePosition(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;

	checkMouseOver();
}
