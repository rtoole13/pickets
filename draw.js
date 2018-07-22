"use strict";

class SpriteSheet {
	constructor(image, x, y, frameWidth, frameHeight, frameRate, rows, columns, loopAnimation){
		this.image = image;
		this.x = x;
		this.y = y;
		this.frameWidth = frameWidth;
		this.frameHeight = frameHeight;
		this.frameIndex = [[],[]];
		this.rows = rows;
		this.columns = columns;

		this.frameRate = frameRate;
		this.ticksPerFrame = 1 / this.frameRate;
		this.ticks = 0;
		this.loopAnimation = loopAnimation;
		this.animationComplete = false;

		for(var i=0;i<rows;i++){
			this.frameIndex[i] = [];
			for(var j=0;j<columns;j++){
				this.frameIndex[i][j] = {sx:i*frameWidth,sy:j*frameHeight};

			}
		}
		this.XframeIndex = 0;
		this.YframeIndex = 0;
	}
	move(x,y){
		this.x = x;
		this.y = y;
	}
	changeFrame(x,y){
		this.XframeIndex = x;
		this.YframeIndex = y;
	}
	update(dt){
		this.ticks += dt/1000;
		if (this.ticks > this.ticksPerFrame){
			this.ticks = 0;
			if (this.XframeIndex < this.columns - 1){
				this.XframeIndex += 1;
				return;
			}
			if (this.loopAnimation){
				this.XframeIndex = 0;
			}
			else{
				this.animationComplete = true;
			}
		}
	}
	draw(width,height){
		gameContext.drawImage(this.image,this.frameIndex[this.XframeIndex][this.YframeIndex].sx,this.frameIndex[this.XframeIndex][this.YframeIndex].sy,this.frameWidth,this.frameHeight,this.x-(width/2),this.y-(height/2),width,height);
	}
}

class FloatingText {
	constructor(font, velX, velY, duration, color){
		this.font = '20px sans-serif';
		this.velX = velX || -0.5;
		this.velY = velY || -1;
		this.accel = 0.03;
		this.duration = duration || 600;
		this.color = color || damageColor;
		this.baseAlpha = 1;
		this.textList = []; 
	}
	add(text, x, y){
		var textObject = {};
		textObject.text = text;
		textObject.x = x;
		textObject.y = y;
		if (getRandomInt(0, 1) > 0){
			textObject.velX = -1 * this.velX;
		}
		else{
			textObject.velX = this.velX;
		}
		textObject.velY = this.velY;
		textObject.lifeTimer = new Timer(this.duration, false);
		textObject.lifeTimer.start();
		this.textList.unshift(textObject);
	}
	draw(dt){
		for (var i = 0; i < this.textList.length; i++){
			var thisText = this.textList[i];
			if (thisText.lifeTimer.checkTime()){
				this.textList.splice(i,1);
				i -= 1;
				continue;
			}
			thisText.velY += this.accel;
			thisText.x += thisText.velX;
			thisText.y += thisText.velY;

			var newColor = hexToRGB(this.color, this.baseAlpha * (this.duration - thisText.lifeTimer.getElapsedTime()) / this.duration);
			drawText(thisText.text, thisText.x, thisText.y, newColor, this.font);
		}
	}
}
class Animation {
	constructor(id, x, y, frameRate, frameCount, loopAnimation){
		this.id = id;
		this.x = x;
		this.y = y;
		this.frameRate = frameRate;
		this.frameCount = frameCount;
		this.currentFrame = 1;
		this.lastFrame = 0;
		this.loopAnimation = loopAnimation;
		this.ticksPerFrame = 1 / this.frameRate;
		this.ticks = this.ticksPerFrame + 1; //first frame plays immediately
		this.animationComplete = false;

	}
	update(dt){
		this.ticks += dt;
		var newFrame = false;
		if (this.ticks > this.ticksPerFrame){
			newFrame = true;
			this.ticks = 0;
			if (this.currentFrame <= this.frameCount){
				this.currentFrame += 1;

				return newFrame;
			}
			else if (this.loopAnimation){
				this.currentFrame = 0;
			}
			else{
				this.animationComplete = true;
			}
		}
		return newFrame;
	}
	move(x, y){
		this.x = x;
		this.y = y;
	}

	draw(){
		throw 'Animation\s draw() function currently must be overriden by subclass!';
	}
}

class BattleAnimation extends Animation {
	constructor(id, x, y, frameRate, frameCount, unitID, targets){
		super(id, x, y, frameRate, frameCount, false);
	}
}

class SkirmishAnimation extends Animation {
	constructor(id, x, y, frameRate, frameCount, unitID, targets){
		super(id, x, y, frameRate, frameCount, false);
		this.type = animationTypes.skirmish;
		this.unitID = unitID;
		this.targets = targets;
		this.circlesPerUnitPerFrame = 2;
		this.circles = [];
		this.minCircleDist = 20; //hardcoded infantry unit width currently
		this.angleVariance = 30; //plus or minus
		this.circleRadius = 10;
		this.circleLifeTime = 900;
		this.circleDelayMax = 500;
		this.delayIter = this.circleDelayMax / this.circlesPerUnitPerFrame;

		var unit = unitList[this.unitID];
		switch(unit.army){
			default:
				this.color = playerColor;
				break;
			case armies.blue:
				this.color = playerColor;
				break;
			case armies.red:
				this.color = enemyColor;
				break;
		}
	}
	draw(isNewFrame, dt){
		if (this.animationComplete){
			return;
		}
		if (isNewFrame){
			//iterate over targets and create circles at random
			//locations between each target and this unit
			//draw circles
			var unit = unitList[this.unitID];
			for (var i = 0; i < this.targets.length; i++){
				var target = unit.enemyList[this.targets[i]];
				var dist = getDistance(unit.x, unit.y, target.x, target.y);
				var dir = {x: (target.x - unit.x) / dist, y: (target.y - unit.y) / dist};
				var maxDist = dist - 20; 
				for (var j = 0; j < this.circlesPerUnitPerFrame; j++){	
					var circleDist = getRandomFloat(this.minCircleDist, (maxDist>this.minCircleDist)?maxDist:this.minCircleDist); //returns this.minCircleDist if maxDist <min
					var circleDir = rotateVector(dir.x, dir.y, getRandomFloat(-this.angleVariance, this.angleVariance), true);
					var spawnDelay = j * this.delayIter;
					var circle = new SkirmishAnimationCircle(unit.x + circleDist * circleDir.x, unit.y + circleDist * circleDir.y, this.circleRadius, this.color, this.circleLifeTime, spawnDelay)
					this.circles.push(circle);
				}

			}
			
		}

		for (var i = 0; i < this.circles.length; i++){
			//draw circles instantiated previously
			this.circles[i].draw();
		}
	}
}

class SkirmishAnimationCircle {
	constructor(x, y, radius, color, lifetime, delay){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.baseColor = color;
		this.delay = delay;
		this.delayTimer = new Timer(delay, false);
		this.delayTimer.start();
		this.lifetime = lifetime;
		this.lifeTimer = new Timer(lifetime, false);
		this.baseAlpha = 0.75;
		this.begun = false;
	}
	draw(){
		if (!this.begun){
			if (this.delayTimer.checkTime()){
				delete this.delayTimer;
				this.begun = true;
				this.lifeTimer.start();
				drawCircle(this.x, this.y, this.radius, this.baseColor, this.baseColor);
				return false;
			}
			return false;
		}

		if (this.lifeTimer.checkTime()){
			delete this.delayTimer;
			return true;
		}
		var newColor = hexToRGB(this.baseColor, this.baseAlpha * (this.lifetime - this.lifeTimer.getElapsedTime()) / this.lifetime);
		drawCircle(this.x, this.y, this.radius, newColor, newColor);
		return false;
	}
}
function draw(dt){
	drawBackground();
	drawDebug();
	drawTerrain();
	drawPlayerUnits();
	drawEnemyUnits();
	drawAnimations(dt);
	drawSelection();
	drawOrder();
	combatTextList.draw(dt);
}

function drawAnimations(dt){
	for (var id in animationList){
		if (animationList[id] == null){
			continue;
		}
		drawAnimation(animationList[id], dt);
	}
}

function drawAnimation(animation, dt){
	switch(animation.type){
		default:
			return;
		case animationTypes.skirmish:
			drawSkirmish(animation, dt);
			break;
		case animationTypes.battle:
			break;
	}
}
function drawSkirmish(skirmish, dt){
	if (skirmish.animationComplete){
		return terminateSkirmishAnimation(skirmish.id);
	}
	var isNewFrame = skirmish.update(dt);
	skirmish.draw(isNewFrame, dt);
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

function drawText(text, x, y, color, font){
	canvasContext.save();
	canvasContext.fillStyle = color;
	canvasContext.font = font;
	canvasContext.fillText(text, x, y);
	canvasContext.restore();
}

function addCombatText(text, x, y){
	combatTextList.add(text, x, y); //Globally defined
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
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.moveTo(originX, originY);
	canvasContext.lineTo(originX + (length * directionX), originY + (length * directionY));
	canvasContext.strokeStyle = color;
	canvasContext.stroke();
	canvasContext.restore();
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
	canvasContext.fillStyle = fillColor;
	canvasContext.beginPath();
	canvasContext.arc(xLoc, yLoc, radius, 0, 2 * Math.PI);
	canvasContext.fill();
	canvasContext.restore();
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
	canvasContext.save();
	canvasContext.strokeStyle = 'blue';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.combatRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();
	if (unit.inBattle){
		return;
	}
	//draw skirmish radius
	canvasContext.save();
	canvasContext.strokeStyle = 'green';
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.skirmishRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();
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
		canvasContext.save();
		canvasContext.strokeStyle = color;
		canvasContext.beginPath();
		canvasContext.arc(general.x, general.y, general.commandRadius, 0, 2 * Math.PI);
		canvasContext.stroke();
		canvasContext.restore();
	}



}
function drawEndGame(playerVictory, condition){
	
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



