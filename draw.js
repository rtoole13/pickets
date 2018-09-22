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
		this.type = animationTypes.battle;
		this.unitID = unitID;
		this.targets = targets;
		this.circlesPerUnitPerFrame = 3;
		this.circles = [];
		this.distVariance = 3; //hardcoded infantry unit width currently
		this.angleVariance = 45; //plus or minus
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
		this.baseRadius = unit.combatRadius;
	}

	draw(isNewFrame, dt){
		if (this.animationComplete){
			return;
		}
		if (isNewFrame){
			//iterate over targets and create circles at positions on the combat radius +/- a dist of each target within +/- angle variance from each line drawn
			//from this unit to each target.
			var unit = unitList[this.unitID];
			for (var i = 0; i < this.targets.length; i++){
				var target = unit.enemyList[this.targets[i]];
				var dist = getDistance(unit.x, unit.y, target.x, target.y);
				var dir = {x: (unit.x - target.x) / dist, y: (unit.y - target.y) / dist}; //from target to unit
				for (var j = 0; j < this.circlesPerUnitPerFrame; j++){	
					var circleDist = this.baseRadius + getRandomFloat(-this.distVariance, this.distVariance); 
					var circleDir = rotateVector(dir.x, dir.y, getRandomFloat(-this.angleVariance, this.angleVariance), true);
					var spawnDelay = j * this.delayIter;
					var circle = new SkirmishAnimationCircle(target.x + circleDist * circleDir.x, target.y + circleDist * circleDir.y, this.circleRadius, this.color, this.circleLifeTime, spawnDelay);
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
					var circle = new SkirmishAnimationCircle(unit.x + circleDist * circleDir.x, unit.y + circleDist * circleDir.y, this.circleRadius, this.color, this.circleLifeTime, spawnDelay);
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
				drawCircle(this.x, this.y, this.radius, this.baseColor);
				return false;
			}
			return false;
		}

		if (this.lifeTimer.checkTime()){
			delete this.delayTimer;
			return true;
		}
		var newColor = hexToRGB(this.baseColor, this.baseAlpha * (this.lifetime - this.lifeTimer.getElapsedTime()) / this.lifetime);
		drawCircle(this.x, this.y, this.radius, newColor);
		return false;
	}
}

class HoverHealth {
	constructor(width, height, border, color, borderColor){
		this.width = width;
		this.height = height;
		this.border = border;
		this.borderWidth  = this.width + 2 * this.border;
		this.borderHeight = this.height + 2 * this.border;
		this.color = color;
		this.borderColor = borderColor;
	}
	draw(){
		if (!hoverUnit.hovered || !hoverUnit.combat){
			return;
		}

		if ((activeUnit != undefined || null) && activeUnit.id == hoverUnit.id){
			return;
		}

		//Border
		canvasContext.save()
		canvasContext.fillStyle = this.borderColor;
		canvasContext.translate(hoverUnit.x, hoverUnit.y - 20);
		canvasContext.fillRect(-this.borderWidth / 2,  -this.borderHeight / 2, this.borderWidth, this.borderHeight);
		canvasContext.restore();

		//Bar
		var ratio = hoverUnit.strength / hoverUnit.maxStrength;

		switch(hoverUnit.army){
			default:
				this.color = greenAlpha;
				break;
			case armies.blue:
				this.color = greenAlpha;
				break;
			case armies.red:
				this.color = crimsonAlpha;
				break;
		}
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(hoverUnit.x, hoverUnit.y - 20);
		canvasContext.fillRect(-this.width / 2,  -this.height / 2, this.width * ratio, this.height);
		canvasContext.restore();
	}
}

class ActiveHealth extends HoverHealth{
	constructor(width, height, border, color, borderColor){
		super(width, height, border, color, borderColor);
	}
	draw(){
		if ((activeUnit == undefined || null) || (activeUnit.auxiliaryUnit)){
			return;
		}

		//Border
		canvasContext.save()
		canvasContext.fillStyle = this.borderColor;
		canvasContext.translate(activeUnit.x, activeUnit.y - 20);
		canvasContext.fillRect(-this.borderWidth / 2,  -this.borderHeight / 2, this.borderWidth, this.borderHeight);
		canvasContext.restore();

		//Bar
		var ratio = activeUnit.strength / activeUnit.maxStrength;
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(activeUnit.x, activeUnit.y - 20);
		canvasContext.fillRect(-this.width / 2,  -this.height / 2, this.width * ratio, this.height);
		canvasContext.restore();
	}
}

class UnitToolTip {
	constructor(width, height, canvasPadding, color, unit){
		//unit is meant to be hoverUnit or activeUnit
		this.width = width;
		this.height = height;
		this.canvasPadding = canvasPadding;
		this.color = color;
		this.x = canvas.width - (this.width + this.canvasPadding); //TOP LEFT CORNER X
		this.y = canvas.height - (this.height + this.canvasPadding); //TOP LEFT CORNER Y
		this.textPaddingX = 4; //Text padding from edges
		this.textPaddingTopY = 22; //Text padding from edges
		this.textPaddingBotY = 6; //Text padding from edges
		this.font = '20px sans-serif';
		this.italicFont = 'italic 18px sans-serif';
		this.boldFont = 'bold ' + this.font;
		this.boldItalicFont = 'bold ' + this.italicFont;
		this.rowHeight = 22;

		switch (unit){
			default:
				this.hoverUnit = true;
				break;
			case 'hoverUnit':
				this.hoverUnit = true;
				break;
			case 'activeUnit':
				this.hoverUnit = false;
				break;
		}
	}
	draw(){
		if (this.hoverUnit){
			//hoverUnit
			if (!hoverUnit.hovered){
				return;
			}

			this.drawToolTip();
		}
		else{
			//activeUnit
			throw 'toolTip doesn\'t currently support activeUnit! Just hoverUnit';
		}
		
	}
	drawToolTip(){
		var friendly, combatUnit, name;
		switch(hoverUnit.army){
			default:
				break;
			case armies.blue:
				this.color = orderColor;
				friendly = true;
				break;
			case armies.red:
				this.color = enemyOrderColor;
				friendly = false;
				break;
		}

		if (hoverUnit.combat){
			this.drawCombatUnitTooltip(friendly);
		}
		else{
			this.drawAuxiliaryUnitTooltip(friendly);
		}
	}
	drawCombatUnitTooltip(friendly){
		var xLoc, yLoc, name, state, strength, rows;
		
		rows = 3;
		this.height = rows * this.rowHeight + this.textPaddingBotY;
		this.y = canvas.height - (this.height + this.canvasPadding); //TOP LEFT CORNER Y

		//Panel
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(this.x, this.y);
		canvasContext.fillRect(0, 0, this.width, this.height);
		canvasContext.restore();

		if (friendly){
			 //should probably fix this indexing..
			name = 'Friendly ' + capitalizeFirstLetter(unitTypeNames[hoverUnit.unitType - 1]);
		}
		else{
			//should probably fix this indexing..
			name = 'Enemy ' + capitalizeFirstLetter(unitTypeNames[hoverUnit.unitType - 1]);
		}
		state = hoverUnit.element + ', ' + capitalizeFirstLetter(unitStateNames[hoverUnit.state - 1]);

		strength = parseInt(hoverUnit.strength) + ' / ' + hoverUnit.maxStrength;

		//Unit Name
		xLoc = this.x + this.textPaddingX;
		yLoc = this.y + this.textPaddingTopY;
		drawText(name, xLoc, yLoc, 'black', this.boldFont);

		//Unit Type
		yLoc += this.rowHeight;
		drawText(state, xLoc, yLoc, 'black', this.italicFont);

		//Unit Strength
		yLoc += this.rowHeight;
		drawText(strength, xLoc, yLoc, 'black', this.font);
	}

	drawAuxiliaryUnitTooltip(friendly){
		var xLoc, yLoc, name, rows;
		
		rows = 1;
		this.height = rows * this.rowHeight + this.textPaddingBotY;
		this.y = canvas.height - (this.height + this.canvasPadding); //TOP LEFT CORNER Y
		//Panel
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(this.x, this.y);
		canvasContext.fillRect(0, 0, this.width, this.height);
		canvasContext.restore();

		if (friendly){
			 //should probably fix this indexing..
			name = 'Friendly ' + capitalizeFirstLetter(unitTypeNames[hoverUnit.unitType - 1]);
		}
		else{
			//should probably fix this indexing..
			name = 'Enemy ' + capitalizeFirstLetter(unitTypeNames[hoverUnit.unitType - 1]);
		}

		//Unit Name
		xLoc = this.x + this.textPaddingX;
		yLoc = this.y + this.textPaddingTopY;
		drawText(name, xLoc, yLoc, 'black', this.boldFont);
	}
}
function draw(dt){
	drawBackground();
	drawDebug();
	drawTerrain();
	drawFortifications();
	drawPlayerUnits();
	drawEnemyUnits();
	drawAnimations(dt);
	drawSelection();
	drawOrder();
	combatTextList.draw(dt);
	drawHUD();
}

function drawHUD(){
	unitToolTip.draw();
	activeHealth.draw();
	hoverHealth.draw();
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
			drawBattle(animation, dt);
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

function drawBattle(battle, dt){
	if (battle.animationComplete){
		return terminateBattleAnimation(battle.id);
	}
	var isNewFrame = battle.update(dt);
	battle.draw(isNewFrame, dt);
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
	/*
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
	*/
}

function drawGridPoint(gridNode, pathNode, color){
	// i refers to the column, j the row
	
	if (color == null){
		var color;
		switch(gridNode.tileType){
			case tileTypes.plain:
				color = "green";
				break;
			case tileTypes.road:
				color = "black";
				break;
			case tileTypes.mountain:
				color = "brown";
				break;
			default:
				color  = "magenta";
				break;
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

function drawSegment(originX, originY, destinationX, destinationY, color){
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.moveTo(originX, originY);
	canvasContext.lineTo(destinationX, destinationY);
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
	var colors, previousPoint, finalPoint;
	if ((activeUnit.path != null) && (activeUnit.path.length > 0)){
		if (activeUnit.path.length > 1){
			//path has at least 2 points
			colors = getPathColors(activeUnit.command);
			
			//draw intermediate waypoints
			previousPoint = activeUnit.path[0];
			drawSegment(activeUnit.x, activeUnit.y, previousPoint.x, previousPoint.y, colors.last);
			drawCircle(previousPoint.x, previousPoint.y, 5, colors.last);

			for (var i = 1; i < activeUnit.path.length - 1; i++){
				var point = activeUnit.path[i];
				drawSegment(previousPoint.x, previousPoint.y, point.x, point.x, colors.mid);
				drawCircle(point.x, point.y, 5, colors.mid);

				//set new previousPoint
				previousPoint = point;
			}
			finalPoint = activeUnit.path[activeUnit.path.length - 1];
			drawSegment(previousPoint.x, previousPoint.y, finalPoint.x, finalPoint.y, colors.last);
			drawCircle(finalPoint.x, finalPoint.y, 5, colors.last);
		}
		else{
			//path is of length 1
			colors = getPathColors(activeUnit.command);
			finalPoint = activeUnit.path[0];
			drawSegment(activeUnit.x, activeUnit.y, finalPoint.x, finalPoint.y, colors.last);
			drawCircle(finalPoint.x, finalPoint.y, 5, colors.last);
		}
	}
	else if (activeUnit.targetPosition != null){
		//no path, just target pos
		colors = getPathColors(activeUnit.command);
		//draw final location
		finalPoint = activeUnit.targetPosition;
		drawSegment(activeUnit.x, activeUnit.y, finalPoint.x, finalPoint.y, colors.last);
		drawCircle(finalPoint.x, finalPoint.y, 5, colors.last);
	}
	else{
		finalPoint = {x: activeUnit.x, y: activeUnit.y};
	}

	if (activeUnit.commandQueue.length == 0){
		return;
	}

	previousPoint = activeUnit.commandQueue[0];
	colors = getPathColors(previousPoint.type);
	drawSegment(finalPoint.x, finalPoint.y, previousPoint.x, previousPoint.y, colors.last);
	drawCircle(previousPoint.x, previousPoint.y, 5, colors.last);

	for (var i = 1; i < activeUnit.commandQueue.length; i++){
		var command = activeUnit.commandQueue[i];
		colors = getPathColors(command.type);
		drawSegment(previousPoint.x, previousPoint.y, command.x, command.y, colors.last);
		drawCircle(command.x, command.y, 5, colors.last);

		//set new previousPoint
		previousPoint = command;
	}
	
}
function getPathColors(command){

	var colors = {mid: 'magenta', last: 'magenta'}; 
	switch(command){
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

function drawCircle(xLoc, yLoc, radius, fillColor){
	
	canvasContext.save();
	canvasContext.fillStyle = fillColor;
	canvasContext.beginPath();
	canvasContext.arc(xLoc, yLoc, radius, 0, 2 * Math.PI);
	canvasContext.fill();
	canvasContext.restore();
}

function drawInfantryState(xLoc, yLoc, angle, state){
	var baseWidth = 40;
	var baseHeight = 10;
	var border, width, height;

	switch(state){
		default:
			return;
		case unitStates.marching:
			return;
		case unitStates.braced:
			border = 2;
			break;
		case unitStates.entrenched:
			border = 4;
			break;
	}

	width  = baseWidth + (2 * border);
	height = baseHeight + (2 * border);

	canvasContext.save();	
	canvasContext.fillStyle = '#787878';
	canvasContext.translate(xLoc, yLoc);
	canvasContext.rotate((90 - angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
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
	
	//main body
	canvasContext.fillStyle = color;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	canvasContext.fillRect(-width/2, -height/2, width, height);
	
	//arrow
	canvasContext.beginPath();
	canvasContext.moveTo(-5, -10);
	canvasContext.lineTo(0, -15);
	canvasContext.lineTo(5, -10);
	canvasContext.closePath();
	canvasContext.fill();

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
	drawCircle(general.x, general.y, radius, color);
	
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

	canvasContext.save();
	canvasContext.fillStyle = endColor;
	canvasContext.font = '20px sans-serif';
	canvasContext.textAlign = 'center';
	canvasContext.fillText('Press \"R\" to restart.', canvas.width/2 , 60 + canvas.height/2);
	canvasContext.restore();

}

function drawBackground(){
	canvasContext.fillStyle = 'AntiqueWhite';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTerrain(){

}

function drawFortifications(){
	for(var id in playerInfantryList){
		var unit = playerInfantryList[id];
		drawInfantryState(unit.x, unit.y, unit.angle, unit.state);
	}
	for(var id in enemyInfantryList){
		var unit = enemyInfantryList[id];
		drawInfantryState(unit.x, unit.y, unit.angle, unit.state);
	}
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



