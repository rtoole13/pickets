"use strict";


function draw(dt){
	drawBackground();
	drawTerrain();
	drawPlayerUnits();
	drawEnemyUnits();
	drawSelection();
}

function drawSelection(){
	if (activeUnit == undefined || null){
		return;
	}

	var radius = 25;

	canvasContext.save();
	canvasContext.strokeStyle = "green";
	canvasContext.beginPath();
	canvasContext.arc(activeUnit.x, activeUnit.y, radius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();
}

function drawInfantryUnit(unit, color){
	var width  = 40,
		height = 10;

	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(unit.angle * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();
}

function drawCavalryUnit(){

}

function drawArtilleryUnit(){

}

function drawCourier(){

}

function drawGeneral(general, color){
	var radius = 10;

	canvasContext.save();
	canvasContext.strokeStyle = color;
	canvasContext.beginPath();
	canvasContext.arc(general.x, general.y, radius, 0, 2 * Math.PI);
	canvasContext.stroke();
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
	drawInfantry(playerInfantryList, playerColor);
}

function drawEnemyUnits(){
	drawGeneral(enemyGeneral, enemyColor);
	drawInfantry(enemyInfantryList, enemyColor);
}

function drawInfantry(units, color){
	for(var id in units){
		drawInfantryUnit(units[id], color);
	}
}



