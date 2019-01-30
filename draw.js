"use strict";
var blue_infantry,
	red_infantry,
	blue_artillery,
	red_artillery,
	blue_general,
	red_general,
	blue_courier,
	red_courier,
	mute_button,
	tutorial_arrow_left,
	tutorial_arrow_right,
	command_move,
	command_attackmove,
	command_fallback;

class SpriteSheet {
	constructor(image, x, y, frameWidth, frameHeight, frameRate, rows, columns, randomFrames, loopAnimation, scale){
		this.image = image;
		this.x = x;
		this.y = y;
		this.frameWidth = frameWidth;
		this.frameHeight = frameHeight;
		this.frameIndex = [[],[]];
		this.rows = rows;
		this.columns = columns;
		this.scale = scale;

		this.frameRate = frameRate;
		this.ticksPerFrame = 1 / this.frameRate;
		this.ticks = 0;
		this.randomFrames = randomFrames;
		this.loopAnimation = loopAnimation;
		this.animationComplete = false;

		for(var i=0;i<rows;i++){
			this.frameIndex[i] = [];
			for(var j=0;j<columns;j++){
				this.frameIndex[i][j] = {sx:j*frameWidth,sy:i*frameHeight};

			}
		}
		this.XframeIndex = 0;
		this.YframeIndex = 0;
	}
	move(x, y){
		this.x = x;
		this.y = y;
	}
	changeFrame(x, y){
		this.XframeIndex = x;
		this.YframeIndex = y;
	}
	update(dt){
		this.ticks += dt;
		if (this.ticks > this.ticksPerFrame){
			this.ticks = 0;
			if (this.randomFrames){
				//Ensure we get a new frame
				var newFrame = this.XframeIndex + getRandomInt(1, this.columns - 2);
				this.XframeIndex = newFrame % (this.columns - 1);
			}else{
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
	}
	draw(width, height){
		var width = this.scale * ((width != undefined) ? width : this.frameWidth);
		var height = this.scale * ((height != undefined) ? height : this.frameHeight);
		canvasContext.drawImage(this.image,this.frameIndex[this.YframeIndex][this.XframeIndex].sx,this.frameIndex[this.YframeIndex][this.XframeIndex].sy,this.frameWidth,this.frameHeight,this.x-(width/2),this.y-(height/2),width,height);
	}
}

class CombatSpriteSheet extends SpriteSheet {
	constructor(image, x, y, frameWidth, frameHeight, frameRate, rows, columns, randomFrames, loopAnimation, rumbleDuration, scale){
		super(image, x, y, frameWidth, frameHeight, frameRate, rows, columns, randomFrames, loopAnimation, scale);
		this.rumbleDuration = rumbleDuration;
		this.rumblingTimer = new Timer(this.rumbleDuration, false);
		this.isRumbling = false;
		this.rumbleRate = 14;
		this.rumbleTicksPerFrame = 1 / this.rumbleRate;
		this.rumbleTicks = 0;
		this.maxRumbleRadius = 10;
		this.currentRumbleRadius = this.maxRumbleRadius;
		this.dx = 0;
		this.dy = 0;
	}

	update(dt){
		super.update(dt);
		this.updateRumblePosition(dt);
	}

	move(x, y){
		this.x = x + this.dx;
		this.y = y + this.dy;
	}

	startRumble(){
		this.isRumbling = true;
		this.rumblingTimer.start();
	}

	updateRumblePosition(dt){
		if (!this.isRumbling){
			return;
		}
		var remainingTime = (this.rumbleDuration - this.rumblingTimer.getElapsedTime()) / 1000;
		if (remainingTime <= 0){
			this.isRumbling = false;
			//reset dx, dy, and the currentRadius
			this.dx = 0;
			this.dy = 0;
			this.currentRumbleRadius = this.maxRumbleRadius;
			return;
		}
		this.rumbleTicks += dt;
		if (this.rumbleTicks > this.rumbleTicksPerFrame){
			this.rumbleTicks = 0;
			var dist, dir;
			this.currentRumbleRadius = this.maxRumbleRadius * remainingTime * remainingTime; //quadratic decline
			dist = getRandomFloat(0, this.currentRumbleRadius);
			dir = getDirFromAngle(getRandomInt(0,359));
			
			this.dx = dist * dir.x;
			this.dy = dist * dir.y;
		}
			
	}
}

class FloatingText {
	constructor(font, velX, velY, duration, color){
		this.font = '20px IM Fell English SC';
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

class ArtilleryAnimation extends Animation {
	constructor(id, x, y, frameRate, frameCount, unitID, target){
		super(id, x, y, frameRate, frameCount, false);
		this.type = animationTypes.artillery;
		this.unitID = unitID;
		this.target = target;
		this.circlesPerTargetPerFrame = 3;
		this.circles = [];
		this.distVariance = 3; //hardcoded infantry unit width currently
		this.angleVariance = 360; //plus or minus
		this.circleRadius = 10;
		this.circleLifeTime = 900;
		this.circleDelayMax = 500;
		this.delayIter = this.circleDelayMax / this.circlesPerTargetPerFrame;

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
			//Draw fading circles in the area around the target.
			for (var j = 0; j < this.circlesPerTargetPerFrame; j++){	
				var circleDist = this.baseRadius + getRandomFloat(-this.distVariance, this.distVariance); 
				var circleDir = rotateVector(1, 0, getRandomFloat(-this.angleVariance, this.angleVariance), true);
				var spawnDelay = j * this.delayIter;
				var circle = new FadingCircle(this.target.x + circleDist * circleDir.x, this.target.y + circleDist * circleDir.y, 
														 this.circleRadius, this.color, this.circleLifeTime, spawnDelay, this.type);
				this.circles.push(circle);
			}
			
		}

		for (var i = 0; i < this.circles.length; i++){
			//draw circles instantiated previously
			this.circles[i].draw();
		}
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
					var circle = new FadingCircle(target.x + circleDist * circleDir.x, target.y + circleDist * circleDir.y, 
															 this.circleRadius, this.color, this.circleLifeTime, spawnDelay, this.type);
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
					var circle = new FadingCircle(unit.x + circleDist * circleDir.x, unit.y + circleDist * circleDir.y,
												  this.circleRadius, this.color, this.circleLifeTime, spawnDelay, this.type);
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

class FadingCircle {
	constructor(x, y, radius, color, lifetime, delay, animationType){
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.baseColor = color;
		this.delay = delay;
		this.animationType = animationType;
		switch (this.animationType){
			case animationTypes.skirmish:
				this.soundType = 'skirmish';
				break;
			case animationTypes.battle:
				this.soundType = 'battle';
				break;
			case animationTypes.artillery:
				this.soundType = 'artillery';
				break;
		}
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
				this.playCorrespondingSound();
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
	playCorrespondingSound(){
		audioHandler.playAudioGroup(this.soundType, true);
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

		var unit = unitList[hoverUnit.id];
		if (unit == undefined){
			//unit deleted before drawing, null pointer
			return;
		}
		//Border
		canvasContext.save()
		canvasContext.fillStyle = this.borderColor;
		canvasContext.translate(unit.x, unit.y - 20);
		canvasContext.fillRect(-this.borderWidth / 2,  -this.borderHeight / 2, this.borderWidth, this.borderHeight);
		canvasContext.restore();

		//Bar
		var ratio = unit.strength / unit.maxStrength;

		switch(unit.army){
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
		canvasContext.translate(unit.x, unit.y - 20);
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
		this.x = canvas.width - (this.width + this.canvasPadding.x); //TOP LEFT CORNER X
		this.y = canvas.height - (this.height + this.canvasPadding.y); //TOP LEFT CORNER Y
		this.textPaddingX = 4; //Text padding from edges
		this.textPaddingTopY = 22; //Text padding from edges
		this.textPaddingBotY = 6; //Text padding from edges
		this.font = '20px IM Fell English SC';
		this.italicFont = 'italic 18px IM Fell English SC';
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
		var xLoc, yLoc, name, state, strength, rows, unit;
		unit = unitList[hoverUnit.id];
		if (unit == undefined){
			//unit deleted before drawing, null pointer
			return;
		}

		rows = 3;
		this.height = rows * this.rowHeight + this.textPaddingBotY;
		this.y = canvas.height - (this.height + this.canvasPadding.y); //TOP LEFT CORNER Y

		//Panel
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(this.x, this.y);
		canvasContext.fillRect(0, 0, this.width, this.height);
		canvasContext.restore();

		if (friendly){
			 //should probably fix this indexing..
			name = 'Friendly ' + capitalizeFirstLetter(unitTypeNames[unit.unitType - 1]);
		}
		else{
			//should probably fix this indexing..
			name = 'Enemy ' + capitalizeFirstLetter(unitTypeNames[unit.unitType - 1]);
		}
		state = unit.element + ', ' + capitalizeFirstLetter(unitStateNames[unit.state - 1]);

		if (unit.unitType == unitTypes.artillery){
			strength = 'Guns: ' + parseInt(unit.gunCount) + ' / ' + unit.maxGunCount;
		}
		else{
			strength = parseInt(unit.strength) + ' / ' + unit.maxStrength;
		}

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
		var xLoc, yLoc, name, rows, unit;
		unit = unitList[hoverUnit.id];
		if (unit == undefined){
			//unit deleted before drawing, null pointer
			return;
		}	
		rows = 1;
		this.height = rows * this.rowHeight + this.textPaddingBotY;
		this.y = canvas.height - (this.height + this.canvasPadding.y); //TOP LEFT CORNER Y
		//Panel
		canvasContext.save()
		canvasContext.fillStyle = this.color;
		canvasContext.translate(this.x, this.y);
		canvasContext.fillRect(0, 0, this.width, this.height);
		canvasContext.restore();

		if (friendly){
			 //should probably fix this indexing..
			name = 'Friendly ' + capitalizeFirstLetter(unitTypeNames[unit.unitType - 1]);
		}
		else{
			//should probably fix this indexing..
			name = 'Enemy ' + capitalizeFirstLetter(unitTypeNames[unit.unitType - 1]);
		}

		//Unit Name
		xLoc = this.x + this.textPaddingX;
		yLoc = this.y + this.textPaddingTopY;
		drawText(name, xLoc, yLoc, 'black', this.boldFont);
	}
}

class Trail{
	constructor(initialPosition, length, lineWidth, color, alphaStart, dashRatio, segmentLifeTime){
		this.curves = [];
		this.tempSet = [];
		this.length = length;
		
		this.tempSet.push(initialPosition);
		this.lineWidth = lineWidth;
		this.alphaStart = alphaStart;
		this.colorPrefix = getColorPrefix(color);
		this.initialColor = this.colorPrefix + this.alphaStart.toString() + ')';
		this.updateTimer = new Timer(500, true);
		this.updateTimer.start();
		this.currentHead = initialPosition;
		this.lastCurveEnd = initialPosition;
		this.minDist = 10; //segment will be minDist * 2 in length
		this.minDistSq = this.minDist * this.minDist;
		this.dashRatio = dashRatio; //1 is a solid line.
		this.dashSpacing = (1 - this.dashRatio) * 2 * this.minDist / this.dashRatio; //space b/w dashes
		this.dashSpacingSq = this.dashSpacing * this.dashSpacing;
		this.segmentLifeTime = segmentLifeTime;
	}

	update(currentPosition){
		this.addCurveSegment(currentPosition);
	}

	addCurveSegment(currentPosition){
		this.currentHead = currentPosition;
		
		if (this.updateTimer.checkTime()){
			if (this.tempSet.length == 0){
				this.beginNewSet();	
			}
			else{
				this.addToSet();
				
			}
		}
	}

	beginNewSet(){
		if (getDistanceSq(this.lastCurveEnd.x, this.lastCurveEnd.y, this.currentHead.x, this.currentHead.y) < this.dashSpacingSq){
			return;
		}
		this.tempSet.unshift(this.currentHead);
	}

	addToSet(){
		if (getDistanceSq(this.tempSet[0].x, this.tempSet[0].y, this.currentHead.x, this.currentHead.y) < this.minDistSq){
			return;
		}
		this.tempSet.unshift(this.currentHead);
		if (this.tempSet.length > 2){
			var curve = new CurveSegment(this.tempSet[0], this.tempSet[1], this.tempSet[1], this.tempSet[2],
				   						 this.segmentLifeTime, this.lineWidth, this.colorPrefix, this.alphaStart);
			this.curves.unshift(curve);
			if (this.curves.length > this.length){
				this.curves.pop();
			}
			this.tempSet = [];
			this.lastCurveEnd = this.currentHead;
			if (this.dashRatio == 1){
				this.tempSet.unshift(this.currentHead);
			}
		}
	}

	draw(){
		for (var i = 0; i < this.curves.length; i++){
			var destroy = this.curves[i].draw();
			if (destroy){
				this.curves.splice(i,1);
				i -= 1;
			}
		}

	}
}

class CurveSegment{
	constructor(startPoint, firstControlPoint, secondControlPoint, endPoint, lifeTime, lineWidth, colorPrefix, alphaStart){
		this.startPoint = startPoint;
		this.firstControlPoint = firstControlPoint;
		this.secondControlPoint = secondControlPoint;
		this.endPoint = endPoint;
		this.lineWidth = lineWidth;
		this.colorPrefix = colorPrefix;
		this.alphaStart = alphaStart;
		this.alpha = this.alphaStart;

		this.initialColor = this.colorPrefix + this.alphaStart.toString() + ')';
		this.previousColor = this.initialColor;
		this.currentColor = this.initialColor;
		this.lifeTime = lifeTime;
		this.lifeTimer = new Timer(this.lifeTime, false);
		this.lifeTimer.start();

	}
	draw(){
		var elapsedTime = this.lifeTimer.getElapsedTime();
		if (elapsedTime > this.lifeTime){
			return true;
		}
		this.alpha = this.alphaStart * (this.lifeTime - elapsedTime) / this.lifeTime;
		this.currentColor = this.colorPrefix + this.alpha.toString() + ')';

		canvasContext.save();
		canvasContext.beginPath();
		canvasContext.lineWidth = this.lineWidth;
		canvasContext.moveTo(this.startPoint.x, this.startPoint.y);

		var gradient = canvasContext.createLinearGradient(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
		gradient.addColorStop(0, this.previousColor); //start color
		gradient.addColorStop(1, this.currentColor); //end color

		canvasContext.strokeStyle = gradient;
		canvasContext.bezierCurveTo(this.firstControlPoint.x, this.firstControlPoint.y, this.secondControlPoint.x, this.secondControlPoint.y,
									this.endPoint.x, this.endPoint.y);
		canvasContext.stroke();

		canvasContext.restore();
		
		this.previousColor = this.currentColor;
		//false if alive, true if dead
		return false;
	}
}

function draw(dt){
	drawBackground();
	drawDebug();
	drawUnitTrails();
	drawPlayerUnits();
	drawEnemyUnits();
	drawAnimations(dt);
	drawSelection(dt);
	combatTextList.draw(dt);
	drawHUD();
}

function initializeSpriteSheets(){
	blue_infantry = new Image(200, 50);
	blue_infantry.src = 'assets/blue_infantry.svg';

	red_infantry = new Image(200, 50);
	red_infantry.src = 'assets/red_infantry.svg';

	blue_artillery = new Image(350, 50);
	blue_artillery.src = 'assets/blue_artillery.svg';

	red_artillery = new Image(350, 50);
	red_artillery.src = 'assets/red_artillery.svg';

	blue_general = new Image(300, 30);
	blue_general.src = 'assets/blue_general.svg';

	red_general = new Image(300, 30);
	red_general.src = 'assets/red_general.svg';

	blue_courier = new Image(200, 25);
	blue_courier.src = 'assets/blue_courier.svg';

	red_courier = new Image(200, 25);
	red_courier.src = 'assets/red_courier.svg';

	mute_button = new Image(328, 60);
	mute_button.src = 'assets/mute.png';

	tutorial_arrow_left = new Image(400, 160);
	tutorial_arrow_left.src = 'assets/tutorial_arrow_left.svg';

	tutorial_arrow_right = new Image(400, 160);
	tutorial_arrow_right.src = 'assets/tutorial_arrow_right.svg';

	command_move = new Image(52, 52);
	command_move.src = 'assets/icon_move.svg';

	command_attackmove = new Image(52, 52);
	command_attackmove.src = 'assets/icon_attack.svg';

	command_fallback = new Image(52, 52);
	command_fallback.src = 'assets/icon_fallback.svg';
}

function initializeSpriteSheet(unit){
	switch(unit.unitType){
		default:
			if(unit.army == armies.blue){
				return new CombatSpriteSheet(blue_infantry, unit.x, unit.y, 40, 50, 6, 3, 10, true, true, unit.attackCooldownTime / 2, 1);
			}
			else{
				return new CombatSpriteSheet(red_infantry, unit.x, unit.y, 40, 50, 6, 3, 10, true, true, unit.attackCooldownTime / 2, 1);
			}
			break;
		case unitTypes.courier:
			if(unit.army == armies.blue){
				return new SpriteSheet(blue_courier, unit.x, unit.y, 20, 25, 6, 1, 10, true, true, 1);
			}
			else{
				return new SpriteSheet(red_courier, unit.x, unit.y, 20, 25, 6, 1, 10, true, true, 1);
			}
			break;
		case unitTypes.general:
			if(unit.army == armies.blue){
				return new SpriteSheet(blue_general, unit.x, unit.y, 30, 30, 6, 1, 10, true, true, 1);
			}
			else{
				return new SpriteSheet(red_general, unit.x, unit.y, 30, 30, 6, 1, 10, true, true, 1);
			}
			break;
		case unitTypes.infantry:
			if(unit.army == armies.blue){
				return new CombatSpriteSheet(blue_infantry, unit.x, unit.y, 40, 50, 6, 3, 10, true, true, unit.attackCooldownTime / 3, 1);
			}
			else{
				return new CombatSpriteSheet(red_infantry, unit.x, unit.y, 40, 50, 6, 3, 10, true, true, unit.attackCooldownTime / 3, 1);
			}
			break;
		case unitTypes.artillery:
			if(unit.army == armies.blue){
				return new CombatSpriteSheet(blue_artillery, unit.x, unit.y, 70, 50, 6, 3, 5, true, true, unit.attackCooldownTime / 3, 0.75);
			}
			else{
				return new CombatSpriteSheet(red_artillery, unit.x, unit.y, 70, 50, 6, 3, 5, true, true, unit.attackCooldownTime / 3, 0.75);
			}
			break;

	}
}

function drawHUD(){
	drawOrder();
	unitToolTip.draw();
	activeHealth.draw();
	hoverHealth.draw();
	muteButton.draw();
	mouseOrderButtons.draw();
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
		case animationTypes.skirmish:
			drawSkirmishAnim(animation, dt);
			break;
		case animationTypes.battle:
			drawBattleAnim(animation, dt);
			break;
		case animationTypes.artillery:
			drawArtilleryAnim(animation, dt);
			break;
		default:
			return;
	}
}
function drawSkirmishAnim(skirmish, dt){
	if (skirmish.animationComplete){
		return terminateSkirmishAnimation(skirmish.id);
	}
	var isNewFrame = skirmish.update(dt);
	skirmish.draw(isNewFrame, dt);
}

function drawBattleAnim(battle, dt){
	if (battle.animationComplete){
		return terminateBattleAnimation(battle.id);
	}
	var isNewFrame = battle.update(dt);
	battle.draw(isNewFrame, dt);
}

function drawArtilleryAnim(artillery, dt){
	if (artillery.animationComplete){
		return terminateArtilleryAnimation(artillery.id);
	}
	var isNewFrame = artillery.update(dt);
	artillery.draw(isNewFrame, dt);
}

function drawDebug(){
	//drawTextDebug();
	//drawGridDebug();
}

function drawTextDebug(){
	var fps = 1/dt;
	fps = fps.toFixed(1);
	canvasContext.save();
	canvasContext.fillStyle = 'magenta';
	canvasContext.font = '20px IM Fell English SC';
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
	/*
	if (gridNode.test){
		color = 'red';
	}
	*/
	canvasContext.save()
	canvasContext.fillStyle = color;
	canvasContext.translate(gridNode.x, gridNode.y);
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
			unit = {x: targetOriginX, y: targetOriginY, angle: activeUnit.angle, skirmishRadius: activeUnit.skirmishRadius, 
				    combatRadius: activeUnit.combatRadius};
			dirX = (mouseX - targetOriginX) / dist;
			dirY = (mouseY - targetOriginY) / dist;
		}	
	}
	
	unit.angle = getAngleFromDir(dirX, dirY);
	var color = orderColor;

	drawfadedUnit(unit, color);

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

class Selector {
	constructor(radius, lineWidth, rotationRate, relArcLength){
		this.radius = radius;
		this.lineWidth = lineWidth;
		this.norm = 0;
		this.rotationRate = rotationRate;
		this.arcLength = relArcLength * 2 * Math.PI;
	}
	draw(dt){
		if (activeUnit == undefined){
			return;
		}
		this.norm += this.rotationRate * dt; 
		this.norm = this.norm % 1;

		var color;
		if (activeUnit == playerGeneral){
			color = commandColors.move;
		}
		else{
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
		}
		canvasContext.save();
		canvasContext.strokeStyle = color;
		canvasContext.lineWidth = this.lineWidth;
		canvasContext.beginPath();
		canvasContext.arc(activeUnit.x, activeUnit.y, this.radius, this.norm * 2 * Math.PI, this.norm * 2 * Math.PI + Math.PI / 3);
		canvasContext.stroke();
		canvasContext.restore();
	}

}

function drawSelection(dt){
	if (activeUnit == undefined || null){
		return;
	}
	selector.draw(dt);
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

function drawPartialCircle(xLoc, yLoc, radius, fillColor, relativeFill, phaseOffset, ccw){
	canvasContext.save();
	canvasContext.fillStyle = fillColor;
	canvasContext.translate(xLoc, yLoc);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, radius, phaseOffset, phaseOffset + relativeFill * 2 * Math.PI, ccw);
	canvasContext.lineTo(0,0);
	canvasContext.closePath();
	canvasContext.fill();
	canvasContext.restore();
}

function drawAngledArrow(xLoc, yLoc, radius, fillColor, angle, extents, offset){	
	canvasContext.save();
	canvasContext.fillStyle = fillColor;
	canvasContext.translate(xLoc, yLoc);
	canvasContext.rotate(-angle * Math.PI/180);
	canvasContext.beginPath();
	canvasContext.moveTo(radius + offset + extents, 0);
	canvasContext.lineTo(radius + offset, -extents);
	canvasContext.lineTo(radius + offset, extents);
	canvasContext.closePath();
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

function drawfadedUnit(unit, color){
	//draw radii
	//combat radius
	canvasContext.save();
	canvasContext.strokeStyle = flankAlpha;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.combatRadius, 0, 2 * Math.PI);
	canvasContext.stroke();

	//skirmish radius
	canvasContext.strokeStyle = skirmishAlpha;
	canvasContext.moveTo(0,0);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.skirmishRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();

	var width = 40,
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
}

function drawInfantryUnit(unit, drawRadii, color){
	if (color == undefined){
	    if (unit.army == armies.blue){
	        color = playerColor;
	    }
	    else{
	        color = enemyColor;
	    }
	}

	if (drawRadii){
		drawInfantryEngagementRadii(unit);
	}

	canvasContext.save();
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(-unit.angle * Math.PI/180);
	unit.spriteSheet.move(0,0);
	unit.spriteSheet.draw();
	canvasContext.restore();

}

function drawInfantryEngagementRadii(unit){
	var frontPadding = 4;
	//draw 'combat' radius
	canvasContext.save();
	
	//front cone
	canvasContext.fillStyle = frontAlpha;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(-unit.angle * Math.PI/180);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.combatRadius + frontPadding, -unit.flankAngle * Math.PI / 180, unit.flankAngle * Math.PI / 180);
	canvasContext.lineTo(0, 0);
	canvasContext.closePath();
	canvasContext.fill();
	
	//flank cone
	canvasContext.fillStyle = flankAlpha;
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.combatRadius, unit.flankAngle * Math.PI / 180, (360 - unit.flankAngle) * Math.PI / 180);
	canvasContext.lineTo(0, 0);
	canvasContext.closePath();
	canvasContext.fill();

	canvasContext.restore();

	if (unit.inBattle){
		return;
	}
	//draw skirmish radius
	canvasContext.save();
	canvasContext.strokeStyle = skirmishAlpha;
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.skirmishRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();
}

function drawArtilleryEngagementRadii(unit){
	var frontPadding = 4;
	//draw 'combat' radius
	canvasContext.save();
	
	//front cone
	canvasContext.fillStyle = frontAlpha;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(-unit.angle * Math.PI/180);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.smallArmsRadius, -unit.flankAngle * Math.PI / 180, unit.flankAngle * Math.PI / 180);
	canvasContext.lineTo(0, 0);
	canvasContext.closePath();
	canvasContext.fill();
	
	//flank cone
	canvasContext.fillStyle = flankAlpha;
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.smallArmsRadius, unit.flankAngle * Math.PI / 180, (360 - unit.flankAngle) * Math.PI / 180);
	canvasContext.lineTo(0, 0);
	canvasContext.closePath();
	canvasContext.fill();

	canvasContext.restore();

	canvasContext.save();
	//sphere shot fill
	canvasContext.fillStyle = sphereShotAlpha;
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(-(unit.angle + unit.firingAngleRange) * Math.PI / 180);
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.sphereShotRadius, 0, 2 * unit.firingAngleRange * Math.PI / 180);
	canvasContext.arc(0, 0, unit.cannisterRadius, 2 * unit.firingAngleRange * Math.PI / 180, 0, true);
	canvasContext.closePath();
	canvasContext.fill();

	//cannister shot fill
	canvasContext.fillStyle = cannisterAlpha;
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.cannisterRadius, 0, 2 * unit.firingAngleRange * Math.PI / 180);
	canvasContext.arc(0, 0, unit.smallArmsRadius, 2 * unit.firingAngleRange * Math.PI / 180, 0, true);
	canvasContext.closePath();
	canvasContext.fill();

	//sphere shot outline
	canvasContext.strokeStyle = skirmishAlpha;
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.sphereShotRadius, 0, 2 * unit.firingAngleRange * Math.PI / 180);
	canvasContext.lineTo(0,0);
	canvasContext.closePath();
	canvasContext.stroke();

	//cannister shot outline
	canvasContext.beginPath();
	canvasContext.arc(0, 0, unit.cannisterRadius, 0, 2 * unit.firingAngleRange * Math.PI / 180);	
	canvasContext.stroke();

	canvasContext.restore();

	if (unit.inBattle){
		return;
	}

	//draw skirmish radius
	/*
	canvasContext.save();
	canvasContext.strokeStyle = skirmishAlpha;
	canvasContext.beginPath();
	canvasContext.arc(unit.x, unit.y, unit.skirmishRadius, 0, 2 * Math.PI);
	canvasContext.stroke();
	canvasContext.restore();
	*/
}

function drawCavalryUnit(){

}

function drawArtilleryUnit(unit, drawRadii, color){
	if (color == undefined){
	    if (unit.army == armies.blue){
	        color = playerColor;
	    }
	    else{
	        color = enemyColor;
	    }
	}

	if (drawRadii){
		drawArtilleryEngagementRadii(unit);
	}

	canvasContext.save();
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate(-unit.angle * Math.PI/180);
	unit.spriteSheet.move(0,0);
	unit.spriteSheet.draw();
	canvasContext.restore();
}

function drawCourier(unit){
	
	canvasContext.save();
	canvasContext.translate(unit.x, unit.y);
	canvasContext.rotate((90 - unit.angle) * Math.PI/180);
	unit.spriteSheet.move(0,0);
	unit.spriteSheet.draw();
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
	canvasContext.translate(general.x, general.y);
	general.spriteSheet.move(0,0);
	general.spriteSheet.draw(40,40);
	canvasContext.restore();
	
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
	canvasContext.font = '20px IM Fell English SC';
	canvasContext.textAlign = 'center';
	canvasContext.fillText(endStr, canvas.width/2 , 30 + canvas.height/2);
	canvasContext.fillText(conditionStr, canvas.width/2 , -30 + canvas.height/2);
	canvasContext.fillText('Press \"R\" to return to the main menu.', canvas.width/2 , 60 + canvas.height/2);
	canvasContext.restore();

}

function drawBackground(){
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
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
	drawGeneral(playerGeneral, displayingCommandRadii);
	drawInfantry(playerInfantryList);
	drawArtillery(playerArtilleryList);
}
function drawEnemyUnits(){
	drawCouriers(enemyCourierList);
	drawGeneral(enemyGeneral, displayingCommandRadii);
	drawInfantry(enemyInfantryList);
	drawArtillery(enemyArtilleryList);
}
function drawUnitTrails(){
	unitTrails.forEach(function(element){
		element.draw()
	});
}
function drawCouriers(units){
	for(var id in units){
		drawCourier(units[id]);
	}	
}
function drawInfantry(units){
	for(var id in units){
		drawInfantryUnit(units[id], displayingCommandRadii);
	}
}
function drawArtillery(units){
	for(var id in units){
		drawArtilleryUnit(units[id], displayingCommandRadii);
	}
}