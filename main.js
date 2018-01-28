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
	playerCourierList = {},
	playerCavalryList = {},
	playerInfantryList = {},
	playerArtilleryList = {},
	//playerUnitList = {},
	playerGeneral,

	enemyCourierList = {},
	enemyCavalryList = {},
	enemyInfantryList = {},
	enemyArtilleryList = {},
	//enemyUnitList{},
	enemyGeneral,


	playerColor = "CadetBlue",
	enemyColor  = "DarkRed",

	activeUnit,
	selector = 0;


window.onload = function(){
	canvasContext = canvas.getContext('2d');
	
	canvas.addEventListener("click", handleLeftClick, false);
	canvas.addEventListener("contextmenu", handleRightClick, false);
	canvas.addEventListener("mousemove", getMousePosition, false);
	init();

}

function init(){
	//Initialize stuff
	gameBoard = new GameBoard(100,100);

	//Enter main game loop
	main();
}

function main(){
	//Main loop

	//Time calculations
	currentFrame = new Date();
	dt = (currentFrame - lastFrame)/1000.0;
	lastFrame = currentFrame;
	
	//Updates
	gameBoard.update(dt);
	draw(dt);

	requestAnimationFrame(main);
}

//Event Handlers
function handleLeftClick(e){
	if (pointInCircle(mouseX, mouseY, playerGeneral.x, playerGeneral.y, 13)){
		activeUnit = playerGeneral;
		console.log("Selected general at " + "(" + playerGeneral.x + ", " + playerGeneral.y + ")");
		return;
	}

	for (var id in playerCavalryList){
		var unit = playerCavalryList[id];
		if (pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected cavalry unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}

	for (var id in playerInfantryList){
		var unit = playerInfantryList[id];
		if (pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected infantry unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}

	for (var id in playerArtilleryList){
		var unit = playerArtilleryList[id];
		if (pointInCircle(mouseX, mouseY, unit.x, unit.y, 23)){
			activeUnit = unit;
			console.log("Selected artillery unit at " + "(" + unit.x + ", " + unit.y + ")");
			return;
		}
	}
	activeUnit = undefined;
	console.log("No unit selected");
	return;
}

function handleRightClick(e){
	e.preventDefault();
	if (activeUnit != undefined || null){
		if (activeUnit == playerGeneral){
			playerGeneral.targetPosition = {x: mouseX, y: mouseY};
			console.log("Moving general to " + "(" + playerGeneral.targetPosition.x + ", " + playerGeneral.targetPosition.y + ")");
		}
		else{
			playerGeneral.issueCommand(activeUnit, "move", {x: mouseX, y: mouseY});
		}
	}
}
function getMousePosition(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;
}
