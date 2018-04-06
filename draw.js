"use strict";

function draw(dt){
	drawBackground();
	//drawGridDebug();
	drawTerrain();
	drawPlayerUnits();
	drawEnemyUnits();
	drawSelection();
}

function drawGridDebug(){
	for (var i = 0; i < gameBoard.grid.columns; i++){
		for (var j = 0; j < gameBoard.grid.rows; j++){
			drawGridPoint(gameBoard.grid.elem[i][j], false);
		}
	}

	if (gameBoard.grid.pathOrig != null){
		for (var i = 0; i < gameBoard.grid.pathOrig.length; i++){
			drawGridPoint(gameBoard.grid.pathOrig[i], true, 'yellow');
		}
	}

	if (gameBoard.grid.path != null){
		for (var i = 0; i < gameBoard.grid.path.length; i++){
			drawGridPoint(gameBoard.grid.path[i], true);
		}
	}
}

function drawGridPoint(gridNode, pathNode, color){
	// i refers to the column, j the row
	
	if (color == null){
		var color;
		if (pathNode){
			color = 'cyan';
		}
		else{
			if (gridNode.walkable){
				color = 'green';
			}
			else{
				color = 'red';
			}
		}
	}
	
	canvasContext.save()
	//canvasContext.strokeStyle = 'black';
	canvasContext.fillStyle = color;
	canvasContext.translate(gridNode.x, gridNode.y);
	//canvasContext.strokeRect(-gridNode.width/4, -gridNode.height/4, gridNode.width/2, gridNode.height/2);
	canvasContext.fillRect(-gridNode.width/4, -gridNode.height/4, gridNode.width/2, gridNode.height/2);
	canvasContext.restore();

}
function drawSelection(){
	if (activeUnit == undefined || null){
		return;
	}
	selector += .05;
	selector = selector % 1;
	var radius = 25;

	var color;
	switch(commandType){
		default:{
			color = 'green';
			break;
		}
		case commandTypes.move:{
			color = 'green';
			break;
		}
		case commandTypes.attackmove:{
			color = 'red';
			break;
		}
		case commandTypes.fallback:{
			color = 'magenta';
			break;
		}
	}
	canvasContext.save();
	canvasContext.strokeStyle = color;
	canvasContext.beginPath();
	canvasContext.arc(activeUnit.x, activeUnit.y, radius, selector * 2 * Math.PI, selector * 2 * Math.PI + Math.PI / 5);
	canvasContext.stroke();
	canvasContext.restore();
}

function drawInfantryUnit(unit){
	var width  = 40,
		height = 10,
		color;

	if (unit.army == armies.blue){
		color = playerColor;
	}
	else{
		color = enemyColor;
	}
	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();

	//draw skirmish radius
	canvasContext.strokeStyle = 'green';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.skirmishRadius, 0, 2 * Math.PI);
	canvasContext.stroke();

	//draw 'combat' radius
	canvasContext.strokeStyle = 'blue';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.combatRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
}

function drawCavalryUnit(){

}

function drawArtilleryUnit(){

}

function drawCourier(unit){
	var width  = 10,
		height = 15,
		color;

	if (unit.army == armies.blue){
		color = playerColor;
	}
	else{
		color = enemyColor;
	}
	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();
}

function drawGeneral(general, showCommandRadius){
	var radius = 10,
		color;

	if (general.army == armies.blue){
		color = playerColor;
	}
	else{
		color = enemyColor;
	}
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
	drawCouriers(playerCourierList);
	drawGeneral(playerGeneral, true);
	drawInfantry(playerInfantryList);
}

function drawEnemyUnits(){
	drawGeneral(enemyGeneral, false);
	drawInfantry(enemyInfantryList);
}

function drawCouriers(units){
	for(var id in units){
		drawCourier(units[id]);
	}	
}

function drawInfantry(units){
	for(var id in units){
		drawInfantryUnit(units[id]);
	}
}



