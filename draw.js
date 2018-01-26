"use strict";


function draw(dt){
	drawBackground();
	drawTerrain();
	drawPlayerUnits();
	drawEnemyUnits();
}



function drawInfantryUnit(){

}

function drawCavalryUnit(){

}

function drawArtilleryUnit(){

}

function drawCourier(){

}

function drawGeneral(general, color){
	var width = 40,
		height= 10;

	canvasContext.fillStyle = color;
	canvasContext.save();
	canvasContext.translate(general.x, general.y);
	canvasContext.rotate(general.angle * Math.PI/180);
	canvasContext.fillRect(-width/2,-height/2, width, height);
	canvasContext.restore();
}

function drawBackground(){
	canvasContext.fillStyle = 'AntiqueWhite';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTerrain(){

}

function drawPlayerUnits(){
	drawGeneral(playerGeneral, playerColor);
	
}

function drawEnemyUnits(){
	drawGeneral(enemyGeneral, enemyColor);
}



