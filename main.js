"use strict";

//Base//
var canvas = document.getElementById('gameCanvas'),
	canvasContext,
	lastFrame = new Date(),
	currentFrame,
	dt,
	mouseX,
	mouseY;

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

	commandType,

	playerColor = "#5F9EA0",
	enemyColor  = "#8B0000",
	
	orderColor,

	activeUnit,
	targetOriginX,
	targetOriginY,
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
	commandTypes = Object.freeze({move:1, attackmove:2, fallback:3});
	unitTypes    = Object.freeze({infantry:1, general:2, courier:3, artillery:4, cavalry:5})
	unitStates   = Object.freeze({marching:1, braced:2, entrenched:3});
	armies       = Object.freeze({blue:1, red:2});

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
	checkWinCondition();
	//Updates
	gameBoard.update(dt);
	draw(dt);

	requestAnimationFrame(main);
}

function checkWinCondition(){
	//Check win condition
}



//Event Handlers
function handleMouseDown(e){
	switch(e.button){
		case 0:{
			handleLeftClick();
			break;
		}
		case 2:{
			handleRightClickDown();
			break;
		}
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

function handleRightClickDown(){
	if (activeUnit != undefined || null){
		givingOrder = true;
		
		targetOriginX = mouseX;
		targetOriginY = mouseY;
	}
	else{
		givingOrder = false;
	}
}
function handleRightClickUp(e){
	e.preventDefault();
	if (activeUnit != undefined || null){
		givingOrder = false;
		if (activeUnit == playerGeneral){
			playerGeneral.targetPosition = {x: mouseX, y: mouseY};
			console.log("Moving general to " + "(" + playerGeneral.targetPosition.x + ", " + playerGeneral.targetPosition.y + ")");
		}
		else{
			playerGeneral.issueCommand(activeUnit, {type: commandType, x: mouseX, y: mouseY, date: Date.now()});
		}
	}
}

function handleKeyPress(e){
	var keyCode = e.keyCode;
	switch (keyCode){
		case 27:{
			//Escape
			if (activeUnit != undefined){
				activeUnit = undefined;
			}
			commandType = commandTypes.move;
			break;
		}
		case 65:{
			//A
			if (commandType == commandTypes.attackmove){
				commandType = commandTypes.move;
			}
			else{
				commandType = commandTypes.attackmove;
			}
			break;
		}
		case 70:{
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
}

function getMousePosition(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;
}
