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
	selector += .05;
	selector = selector % 1;
	var radius = 25;

	canvasContext.save();
	canvasContext.strokeStyle = "green";
	canvasContext.beginPath();
	canvasContext.arc(activeUnit.x, activeUnit.y, radius, selector * 2 * Math.PI, selector * 2 * Math.PI + Math.PI / 5);
	canvasContext.stroke();
	canvasContext.restore();
}

function drawInfantryUnit(unit, color){
	var width  = 40,
		height = 10;

	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();
}

function drawCavalryUnit(){

}

function drawArtilleryUnit(){

}

function drawCourier(unit, color){
	var width  = 10,
		height = 15;

	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();
}

function drawGeneral(general, color, showCommandRadius){
	var radius = 10;

	canvasContext.save();
	canvasContext.strokeStyle = color;
	canvasContext.fillStyle = color;
	canvasContext.beginPath();
	canvasContext.arc(general.x, general.y, radius, 0, 2 * Math.PI);
	canvasContext.fill();
	canvasContext.stroke();

	if (showCommandRadius){
		canvasContext.beginPath();
		canvasContext.arc(general.x, general.y, general.commandRadius, 0, 2 * Math.PI);
		canvasContext.stroke();
	}
	canvasContext.restore();



}

function drawBackground(){
	canvasContext.fillStyle = 'AntiqueWhite';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTerrain(){

}

function drawPlayerUnits(){
	drawCouriers(playerCourierList, playerColor);
	drawGeneral(playerGeneral, playerColor, true);
	drawInfantry(playerInfantryList, playerColor);
}

function drawEnemyUnits(){
	drawGeneral(enemyGeneral, enemyColor, false);
	drawInfantry(enemyInfantryList, enemyColor);
}

function drawCouriers(units, color){
	for(var id in units){
		drawCourier(units[id], color);
	}	
}

function drawInfantry(units, color){
	for(var id in units){
		drawInfantryUnit(units[id], color);
	}
}



