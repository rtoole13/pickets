"use strict";

//Base//
var canvas = document.getElementById('gameCanvas'),
	canvasContext,
	lastFrame = new Date(),
	currentFrame,
	dt;

//Game Objects//
var gameBoard,
	playerCourierList = {},
	playerCavalryList = {},
	playerInfantryList = {},
	playerArtilleryList = {},
	//playerUnitList = {},
	playerGeneral,

	enemyCourierList = {},
	playerCavalryList = {},
	playerInfantryList = {},
	playerArtilleryList = {},
	//enemyUnitList{},
	enemyGeneral,


	playerColor = "CadetBlue",
	enemyColor  = "DarkRed";


window.onload = function(){
	canvasContext = canvas.getContext('2d');
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

