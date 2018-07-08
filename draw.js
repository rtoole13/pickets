"use strict";

function draw(dt){
	drawBackground();
	drawDebug();
	drawTerrain();
	drawPlayerUnits();
	drawEnemyUnits();
	drawSelection();
	drawOrder();
}
function drawDebug(){
	drawTextDebug();
	//drawGridDebug();
}
function drawTextDebug(){
	var fps = 1/dt;
	fps = fps.toFixed(1);
	canvasContext.save();
	canvasContext.fillStyle = 'magenta';
	canvasContext.font = '20px sans-serif';
	canvasContext.fillText("fps: " + fps, 10, 50);
	canvasContext.restore();
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
function drawRay(originX, originY, directionX, directionY, length, color){
	canvasContext.beginPath();
	canvasContext.moveTo(originX, originY);
	canvasContext.lineTo(originX + (length * directionX), originY + (length * directionY));
	canvasContext.strokeStyle = color;
	canvasContext.stroke();
}

function drawOrder(){
	if (!givingOrder || activeUnit == playerGeneral){
		return;
	}
	var dist;
	if (activeUnit.inBattle){
			dist = getDistance(activeUnit.x, activeUnit.y, mouseX, mouseY);
			if (dist < minDragDrawDistance){
				return;
			}

			var unit, dirX, dirY;
			unit = {x: activeUnit.x, y: activeUnit.y, angle: activeUnit.angle, skirmishRadius: 0, combatRadius: 0};
			dirX = (mouseX - activeUnit.x) / dist;
			dirY = (mouseY - activeUnit.y) / dist;
	}
	else{
		if (commandType == commandTypes.fallback){
			dist = getDistance(activeUnit.x, activeUnit.y, mouseX, mouseY);
			if (dist < minDragDrawDistance){
				return;
			}

			var unit, dirX, dirY;
			unit = {x: activeUnit.x, y: activeUnit.y, angle: activeUnit.angle, skirmishRadius: 0, combatRadius: 0};
			dirX = (mouseX - activeUnit.x) / dist;
			dirY = (mouseY - activeUnit.y) / dist;
		}
		else{
			dist = getDistance(targetOriginX, targetOriginY, mouseX, mouseY);
			if (dist < minDragDrawDistance){
				return;
			}

			var unit, dirX, dirY;
			unit = {x: targetOriginX, y: targetOriginY, angle: activeUnit.angle, skirmishRadius: 0, combatRadius: 0};
			dirX = (mouseX - targetOriginX) / dist;
			dirY = (mouseY - targetOriginY) / dist;
		}	
	}
	
	unit.angle = getAngleFromDir(dirX, dirY);
	var color = orderColor;

	drawInfantryUnit(unit, false, color);

	switch(commandType){
		default:
			color = 'green';
			break;
		
		case commandTypes.move:
			color = 'green';
			break;
		
		case commandTypes.attackmove:
			color = 'red';
			break;
		
		case commandTypes.fallback:
			color = 'magenta';
			break;
		
	}
	drawRay(unit.x, unit.y, dirX, dirY, 25, color);
}

function drawSelection(){
	if (activeUnit == undefined || null){
		return;
	}
	selector += .035;
	selector = selector % 1;
	var radius = 25;

	var color;
	switch(commandType){
		default:
			color = commandColors.move;
			break;
		
		case commandTypes.move:
			color = commandColors.move;
			break;
		
		case commandTypes.attackmove:
			color = commandColors.attackmove;
			break;
		
		case commandTypes.fallback:
			color = commandColors.fallback;
			break;
		
	}
	canvasContext.save();
	canvasContext.strokeStyle = color;
	canvasContext.lineWidth = 3;
	canvasContext.beginPath();
	canvasContext.arc(activeUnit.x, activeUnit.y, radius, selector * 2 * Math.PI, selector * 2 * Math.PI + Math.PI / 3);
	canvasContext.stroke();
	canvasContext.restore();

	drawActiveUnitPath();
}
function drawActiveUnitPath(){
	if (activeUnit.path != null && activeUnit.path.length > 0){
		var colors = getPathColors(activeUnit);
		//draw intermediate waypoints
		for (var i = 0; i < activeUnit.path.length - 1; i++){
			var point = activeUnit.path[i];
			drawCircle(point.x, point.y, 5, colors.mid, colors.mid);
		}
		var finalPoint = activeUnit.path[activeUnit.path.length - 1];
		drawCircle(finalPoint.x, finalPoint.y, 5, colors.last, colors.last);
	}
	else if (activeUnit.targetPosition != null){
		var colors = getPathColors(activeUnit);
		//draw final location
		drawCircle(activeUnit.targetPosition.x, activeUnit.targetPosition.y, 5, colors.last, colors.last);
	}
	
}
function getPathColors(unit){

	var colors = {mid: 'magenta', last: 'magenta'}; 
	switch(unit.command){
		case commandTypes.move:
			colors.mid = waypointColors.move;
			colors.last = targetPosColors.move;
			break;
		case commandTypes.attackmove:
			colors.mid = waypointColors.attackmove;
			colors.last = targetPosColors.attackmove;
			break;
		case commandTypes.fallback:
			colors.mid = waypointColors.fallback;
			colors.last = targetPosColors.fallback;
			break;
	}
	return colors;
}

function drawCircle(xLoc, yLoc, radius, strokeColor, fillColor){
	canvasContext.save();
	canvasContext.strokeStyle = strokeColor;
	canvasContext.fillStyle = fillColor;
	canvasContext.beginPath();
	canvasContext.arc(xLoc, yLoc, radius, 0, 2 * Math.PI);
	canvasContext.fill();
	canvasContext.stroke();
}

function drawInfantryUnit(unit, drawRadii, color){
	var width  = 40,
		height = 10;

	if (color == undefined){
		if (unit.army == armies.blue){
			color = playerColor;
		}
		else{
			color = enemyColor;
		}
	}

	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	canvasContext.restore();

	if (!drawRadii){
		return;
	}

	//draw 'combat' radius
	canvasContext.strokeStyle = 'blue';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.combatRadius, 0, 2 * Math.PI);
	canvasContext.stroke();

	if (unit.inBattle){
		return;
	}
	//draw skirmish radius
	canvasContext.strokeStyle = 'green';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.skirmishRadius, 0, 2 * Math.PI);
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
	//draw general as a circle..
	drawCircle(general.x, general.y, radius, color, color);
	
	if (showCommandRadius){
		canvasContext.beginPath();
		canvasContext.arc(general.x, general.y, general.commandRadius, 0, 2 * Math.PI);
		canvasContext.stroke();
	}
	canvasContext.restore();



}
function drawEndGame(playerVictory, condition){
	/*switch(commandType){
		var fps = 1/dt;
	fps = fps.toFixed(1);
	canvasContext.save();
	canvasContext.fillStyle = 'magenta';
	canvasContext.font = '20px sans-serif';
	canvasContext.fillText("fps: " + fps, 10, 50);
	canvasContext.restore();
			*/
	drawBackground();
	var endStr, endColor;
	if (playerVictory){
		endStr = 'You won!!';
		endColor = playerColor;
		
		var conditionStr;
		switch(condition){
			default:
				conditionStr = '';
				break;
			case winConditions.generalCaptured:
				conditionStr = 'The enemy general has been captured!';
				break;
			case winConditions.unitsRouting:
				conditionStr = 'The enemy is routing!';
				break;
			case winConditions.unitsCaptured:
				conditionStr = 'The enemy has surrendered!';
				break;
		}
	}
	else{
		endStr = 'You lost.';
		endColor = enemyColor;

		var conditionStr;
		switch(condition){
			default:
				conditionStr = '';
				break;
			case winConditions.generalCaptured:
				conditionStr = 'Your general has been captured.';
				break;
			case winConditions.unitsRouting:
				conditionStr = 'Your soldiers are routing.';
				break;
			case winConditions.unitsCaptured:
				conditionStr = 'Your soldiers have surrendered.';
				break;
		}
	}

	canvasContext.save();
	canvasContext.fillStyle = endColor;
	canvasContext.font = '20px sans-serif';
	canvasContext.textAlign = 'center';
	canvasContext.fillText(endStr, canvas.width/2 , 30 + canvas.height/2);
	canvasContext.restore();

	canvasContext.save();
	canvasContext.fillStyle = endColor;
	canvasContext.font = '20px sans-serif';
	canvasContext.textAlign = 'center';
	canvasContext.fillText(conditionStr, canvas.width/2 , -30 + canvas.height/2);
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
		drawInfantryUnit(units[id], true);
	}
}



