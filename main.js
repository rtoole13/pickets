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
    count = 0,
    scenes,
    boards,
    tutorialBoardNames,
    map_bg,
    sceneHandler,
    audioHandler;

//Title Objects//
var howToHitBox,
	playHitBox,
	howToClicked,
	playClicked;

//HowTo Objects//
var tutorialArrowLeft,
	tutorialArrowRight,
	homeButton,
	tutorialSceneCount,
	currentTutorial;

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
    unitTrails = [],

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
    enemyGenStates,

	unitTypeNames,
	unitStateNames,

	//Initialize some colors
	playerColor = "#30618C",
	enemyColor  = "#8B0000",
	damageColor = "#ff0000",
	crimson     = "#DC143C",
	gray        = "#696969",
	green       = "#90EE90",
    forestGreen = "#336600",

    orderColor,
    enemyOrderColor,
    crimsonAlpha,
    greenAlpha,
    grayAlpha,
    flankAlpha,
    frontAlpha,
    skirmishAlpha,

	activeUnit,
	hoverUnit,
	targetOriginX,
	targetOriginY,
	minDragDrawDistance = 5,
	gameOver = false,
	fullRetreatPlayer = false,
	fullRetreatEnemy = false,

    displayingCommandRadii = false,
	givingOrder = false,
	queuingOrders = false,
	orderStack = [],
	defendingAI = true,
	selector;


window.onload = function(){
	canvasContext = canvas.getContext('2d');
	canvas.style.cursor = "crosshair";
	init();
}

function init(){
	scenes = Object.freeze({titleScene:1, howToScene:2, gameScene:3, endScene:4});
	boards = Object.freeze({main: new MainBoard(), tutorialOne: new TutorialOneBoard(), 
							tutorialTwo: new TutorialTwoBoard(), tutorialThree: new TutorialThreeBoard()});
	tutorialBoardNames = Object.keys(boards).filter(elem => elem.includes('tutorial'));
	
	orderColor = hexToRGB(playerColor, 0.25);
    enemyOrderColor = hexToRGB(enemyColor, 0.25);
    crimsonAlpha = hexToRGB(crimson, 0.85);
    greenAlpha = hexToRGB(green, 0.85);
    grayAlpha = hexToRGB(gray, 0.2);
    flankAlpha = hexToRGB(crimson, 0.25);
    frontAlpha = hexToRGB(forestGreen, 0.25);
    skirmishAlpha = hexToRGB(forestGreen, 0.45);

    //reference external .svgs
    initializeSpriteSheets();

	sceneHandler = new SceneHandler();
	audioHandler = new AudioHandler();

	//Begin game
	sceneHandler.beginTitleScene();
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
	//May end up not displaying hover unit info on tooltip, but rather activeUnit
}

function handleLeftClick(){
	clearOrderStack();
	if (CollisionEngine.pointInCircle(mouseX, mouseY, playerGeneral.x, playerGeneral.y, 13)){
		activeUnit = playerGeneral;
		return;
	}

	for (var id in playerCavalryList){
		var unit = playerCavalryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			return;
		}
	}

	for (var id in playerInfantryList){
		var unit = playerInfantryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			return;
		}
	}

	for (var id in playerArtilleryList){
		var unit = playerArtilleryList[id];
		if (CollisionEngine.pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			return;
		}
	}
	activeUnit = undefined;
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
		}
		else{
			targetOriginX = mouseX;
			targetOriginY = mouseY;

			var target;
			target = selectEnemyUnit(mouseX, mouseY);
			if (target != null){
				var command = {type: commandType, target: target, x: targetOriginX, y: targetOriginY, angle: null, date: Date.now(), queue: queuingOrders};
				if (queuingOrders){
					orderStack.push(command)
				}
				else{
					playerGeneral.issueCommand(activeUnit, command);
				}
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

		var dist, dirX, dirY, targetAngle, command;
		dist = getDistance(targetOriginX, targetOriginY, mouseX, mouseY);
		if (dist >= minDragDrawDistance){
			dirX = (mouseX - targetOriginX) / dist;
			dirY = (mouseY - targetOriginY) / dist;
			targetAngle = getAngleFromDir(dirX, dirY);
		}
		else{
			targetAngle = null;
		}

		command = {type: commandType, target: null, x: targetOriginX, y: targetOriginY, 
				   angle: targetAngle, date: Date.now(), queue: queuingOrders};

		if (queuingOrders){
			orderStack.push(command)
		}
		else{
			playerGeneral.issueCommand(activeUnit, command);
		}
	}
}

function clearOrderStack(){
	if (orderStack.length == 0){
		return;
	}
	if (activeUnit != undefined || null){
		playerGeneral.issueCommand(activeUnit, orderStack);
	}
	orderStack = [];
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
		case 32:
            //Space
            displayingCommandRadii = true;
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

function handleTitleMouseDown(e){
	if (CollisionEngine.pointInAABB(mouseX, mouseY, howToHitBox.xMin, howToHitBox.xMax, howToHitBox.yMin, howToHitBox.yMax)){
	    howToClicked = true;
	    return;
	}
	else if (CollisionEngine.pointInAABB(mouseX, mouseY, playHitBox.xMin, playHitBox.xMax, playHitBox.yMin, playHitBox.yMax)){
	    playClicked = true;
	    return;
	}
	else{
		playClicked = howToClicked = false;
	}
}

function handleHowToMouseDown(e){
	var left, right;
	left = tutorialArrowLeft;
	right = tutorialArrowRight;
	if (CollisionEngine.pointInAABB(mouseX, mouseY, left.xMin, left.xMax, left.yMin, left.yMax)){
		left.clicked = true;
		return;
	}
	else if (CollisionEngine.pointInAABB(mouseX, mouseY, right.xMin, right.xMax, right.yMin, right.yMax)){
		right.clicked = true;
		return;
	}
	else{
		left.clicked = right.clicked = false;
	}
	//Call default handleMouseDown
	handleMouseDown(e);
}

function handleEndGameKeyPress(e){
	var keyCode = e.keyCode;
	switch (keyCode){
		case 82:
			//R
			sceneHandler.changeScene(scenes.gameScene);
		default:
			return;
	}
}
function handleKeyRelease(e){
	var keyCode = e.keyCode;
	switch(keyCode){
		case 16: 
			queuingOrders = false;
			clearOrderStack();
			break;

        case 32:
            //Space
            displayingCommandRadii = false;
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

function getMousePositionTitle(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;
}
