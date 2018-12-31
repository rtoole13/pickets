"use strict";

class GameBoard{
	constructor(rows, columns, board){
		this.grid = new Grid(rows, columns, canvas.width, canvas.height);
		this.collisionCheckTime = 200;
		this.collisionTimer = Date.now();
		this.board = board;
	}

	initializeBoard(){
		this.board.load();
	}

	update(dt){
		if (debugState){
			var newDate = Date.now();
			if (newDate - this.collisionTimer > this.collisionCheckTime){
				CollisionEngine.broadCheck();
				this.collisionTimer = newDate;  
			}
		}
		else{
			CollisionEngine.broadCheck();
		}

		//reset full retreat win condition bools
		fullRetreatPlayer = true;
		fullRetreatEnemy = true;

		//Player updates first
		playerGeneral.update(dt);
		for (var id in playerCourierList){
			playerCourierList[id].update(dt);
		}
		for (var id in playerCavalryList){
			playerCavalryList[id].update(dt);
		}
		for (var id in playerInfantryList){
			playerInfantryList[id].update(dt);
		}
		for (var id in playerArtilleryList){
			playerArtilleryList[id].update(dt);
		}

		//Enemy updates second
		//enemy general MUST update after player units, as they flag the enemy
		//as having been flanked, for instance.
		enemyGeneral.update(dt);
		for (var id in enemyCourierList){
			enemyCourierList[id].update(dt);
		}
		for (var id in enemyCavalryList){
			enemyCavalryList[id].update(dt);
		}
		for (var id in enemyInfantryList){
			enemyInfantryList[id].update(dt);
		}
		for (var id in enemyArtilleryList){
			enemyCavalryList[id].update(dt);
		}
	}
}

class Unit{
	constructor(x, y, angle, army){
		this.x = x;
		this.y = y;
		this.currentSpeed = 0;
		this.isMoving = false;
		this.isRotating = false;
		this.angle = angle;
		this.rotationRate = 85;
		this.dirX = Math.cos((this.angle) * Math.PI/180);
		this.dirY = - Math.sin((this.angle) * Math.PI/180);
		this.target = null;
		this.updateRouteTimer = new Timer(2000, true);
		this.targetPosition = null;
		this.targetDistance = null;
		this.targetAngle = this.angle;
		this.targetAngleFinal = null;
		this.combatTargetProximityTol = 40;
		this.targetSigma = 30;
		this.targetSigmaFinal = 5;
		this.targetAngleSigma = 3; //deg 
		this.redundantCommandSigma = 25;
		this.turnAngleTol = 70;
		this.command = null;
		this.commandQueue = [];
		this.army = army;
		this.path = [];
		this.rerouteTargetX = null;
		this.rerouteTargetY = null;
		this.rerouteDistance = 15;
		this.rerouting = false;
		this.friendlyCollisionList = [];
		this.enemyCollisionList = []; //Enemies checked against this frame
		this.combatCollisionList = []; //Enemies in combat range this frame 
		this.skirmishCollisionList = []; //Enemies in skirmish range this frame
	}

	update(dt){
		if (this.target != null){
			if (this.updateRouteTimer.checkTime()){
				this.path = Pathfinder.findPath(this.x, this.y, this.target.x, this.target.y, this, this.ignoreList);	
				this.getNextWaypoint();
			}
		}
		this.updateTargetParameters();
		//rotate and move, isRotating and isMoving indicate whether the unit moved this frame.
		this.isRotating = this.rotate(dt);
		this.isMoving = this.move(dt);
		this.updateSpriteSheet(dt);
	}

	getNextWaypoint(){
		if (this.path != null && this.path.length >= 1){
			var node = this.path.shift();
			this.targetPosition = {x:node.x, y:node.y};
		}
		else{
			this.targetPosition = null;
			this.updateCommand(null, false);
		}
		this.updateTargetParameters();
		return this.targetPosition;
	}

	move(dt){

		var moved = false;
		if (this.targetPosition == null){
			this.currentSpeed = 0;
			return moved;
		}
		this.baseSpeed = this.adjustSpeed();
		if (this.rerouting){
			if (this.targetDistance < this.targetSigma){
				this.targetPosition = this.getNextWaypoint();
				this.updateTargetParameters();
			}
			this.currentSpeed = this.baseSpeed;
			this.x += this.currentSpeed * this.dirX * dt;
			this.y += this.currentSpeed * this.dirY * dt;
			moved = true;	
		}
		else{
			var currentTargetSigma;
			if (this.path.length == 0){
				currentTargetSigma = this.targetSigmaFinal;
			}
			else{
				currentTargetSigma = this.targetSigma;
			}
			
			// Here we can add other distances. If > this.targetSigma, but still pretty far away, no need to stop moving entirely.
			if (this.targetDistance < currentTargetSigma){
				this.targetPosition = this.getNextWaypoint();
				this.updateTargetParameters();
			}
			
			if ((this.targetAngle != null) && Math.abs(this.angle - this.targetAngle) < this.turnAngleTol){
				this.currentSpeed = this.baseSpeed;
				this.x += this.currentSpeed * this.dirX * dt;
				this.y += this.currentSpeed * this.dirY * dt;
				moved = true;	
			}
			else{
				this.currentSpeed = 0;
			}
		}
		return moved;
	}

	rotate(dt){
		var rotating = false;
		if (this.targetAngle == null){
			this.isRotating = false;
			return rotating;
		}
		rotating = true;
		var angleDiff = this.targetAngle - this.angle;
		var absAngleDiff = Math.abs(angleDiff);
		if (absAngleDiff < this.targetAngleSigma){
			this.angle = this.targetAngle;
			this.updateDir();
			if (this.targetAngle == this.targetAngleFinal){
				this.targetAngleFinal = null;
				this.targetAngle = null;
			}
			return rotating;
		}

		// Actively rotating
		var maxFrameRot = this.rotationRate * dt;
		var rotation = (maxFrameRot < absAngleDiff)? maxFrameRot : absAngleDiff;
		if (angleDiff < -180){
			angleDiff += 360;
		}
		else if (angleDiff > 180){
			angleDiff -= 360;
		}
		
		if (angleDiff < 0){
			var temp = rotateVector(this.dirX, this.dirY, rotation, true);
		}
		else{
			var temp = rotateVector(this.dirX, this.dirY, -rotation, true);
		}
		this.dirX = temp.x;
		this.dirY = temp.y;
		this.updateAngle();
		return rotating;
	}
	
	updateCommand(order, clearQueue){
		// Called on being given a command, and also on command completion
		if (order == null){
			if (clearQueue){
				this.commandQueue = [];
			}

			if (this.commandQueue.length > 0){
				order = this.commandQueue.shift();
			}
			else{
				this.command = null;
				this.targetPosition = null;
				this.targetAngle = null;
				this.target = null;
				this.path = [];
				return;
			}
			this.initiateCommand(order);
		}
		else if(order.length > 0){
			//given a list of commands
			var firstOrder = order[0];
			if (this.command != null && firstOrder.queue){
				this.commandQueue = this.commandQueue.concat(order);
				return;
			}
			this.initiateCommand(order.shift());
			this.commandQueue = order;
		}
		else if (this.command != null && order.queue){
			//queued command first hits unit here. Add it to command queue
			if (this.commandQueue.length > 0){
				var previousOrder = this.commandQueue[this.commandQueue.length - 1];
				var dist = getDistance(order.x, order.y, previousOrder.x, previousOrder.y)
				if (getDistance(order.x, order.y, previousOrder.x, previousOrder.y) < this.redundantCommandSigma){
					return;
				}
			}
			this.commandQueue.push(order);
			return;
		}
		else{
			this.commandQueue = [];
			this.initiateCommand(order);
		}
	}

	initiateCommand(order){
		this.command = order.type;
		switch(this.command){
			default:
				this.command = null;
				break;
			
			case commandTypes.move:
				this.executeMoveOrder({x: order.x, y: order.y}, order.angle, order.target);
				break;
			
			case commandTypes.attackmove:
				this.executeAttackMoveOrder({x: order.x, y: order.y}, order.angle, order.target);
				break;
			
			case commandTypes.fallback:
				this.executeMoveOrder({x: order.x, y: order.y});
				break;
			
			case commandTypes.retreat:
				this.executeRetreatOrder(order.target);	
				break;
		}
	}

	updateTargetParameters(){
		if (this.targetPosition != null){
			this.targetDistance = getDistance(this.x, this.y, this.targetPosition.x, this.targetPosition.y);
			var currentTargetDirX, currentTargetDirY;
			if (this.rerouting && this.rerouteTargetX != null && this.rerouteTargetY != null){
				var rerouteDist = getDistance(this.x, this.y, this.rerouteTargetX, this.rerouteTargetY);
				currentTargetDirX = (this.rerouteTargetX - this.x) / rerouteDist;
				currentTargetDirY = (this.rerouteTargetY - this.y) / rerouteDist;
			}
			else{
				currentTargetDirX = (this.targetPosition.x - this.x) / this.targetDistance;
				currentTargetDirY = (this.targetPosition.y - this.y) / this.targetDistance;
			}
			this.targetAngle = getAngleFromDir(currentTargetDirX, currentTargetDirY);
			this.targetAngle = this.adjustAngle(this.targetAngle);
		}
		else{
			this.targetAngle = (this.targetAngleFinal != null) ? this.targetAngleFinal : null;
		}

	}

	updateAngle(){
		if (this.dirY >= 0){
			this.angle = - Math.acos(this.dirX) * 180 / Math.PI;	
		}
		else{
			this.angle = Math.acos(this.dirX) * 180 / Math.PI;	
		}
	}
	updateDir(){
		this.dirX = Math.cos((this.angle) * Math.PI/180);
		this.dirY = - Math.sin((this.angle) * Math.PI/180);
	}
	adjustAngle(angle){
		// By default nothing happens here. Classes will override potentially for fallback command
		return angle;
	}
	adjustSpeed(){
		// Any logic for terrain speed modifiers and such will go here. It's likely that classes will override
		return this.derivativeSpeed;
	}
	updateSpriteSheet(dt){
		this.spriteSheet.update(dt);
	}
}

class CombatUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, army);
		this.element = element;
		this.maxStrength =	initializeInfantryElement(this.element);
		this.invMaxStrength = 1 / this.maxStrength;
		this.strength = this.maxStrength;
		this.retreatThreshold = 0.25; //Currently just checking relative strength
		this.retreatChance = 5; //out of 1000, checked each frame if below threshold
		this.rallyChance = 5; //out of 100
		this.rallyTimer = new Timer(3000, true); //Arbitrarily potentially rallying whenever timer is up.
		this.auxiliaryUnit = false;
		this.isRotating = false;
		this.isSkirmishing = false;
		this.retreating = false;
		this.inBattle = false;
		this.combatTargetProximityTol = 40;
		this.command = null;
		this.recentlyFlanked = false;
		this.recentlyFlankedTimer = new Timer(2000, false);
		this.flankAngle = 90; //Angle range to left and right of unit's direction vector, defining unit's flanks
		this.cosFlankAngle = Math.cos(this.flankAngle * Math.PI/180);
		this.friendlyCollisionList = [];
		this.enemyCollisionList = []; //Enemies checked against this frame
		this.combatCollisionList = []; //Enemies in combat range this frame 
		this.skirmishCollisionList = []; //Enemies in skirmish range this frame
		//Reference enemy list
		switch(this.army){
			case armies.blue:
				this.enemyList = enemyUnitList;
				break;
			
			case armies.red:
				this.enemyList = playerUnitList;
				break;

			default:
				console.log('Nonexistent army.');
				break;
		}
	}

	update(dt){
		this.checkMorale();
		this.checkCombatLists();
		this.attack();
		super.update(dt);
		
	}

	attack(){
		throw 'CombatUnit\'s attack() function currently must be overriden by subclass!';
	}
	checkCombatLists(){
		for (var i = 0; i < this.skirmishCollisionList.length; i++){
			if (this.combatCollisionList.includes(this.skirmishCollisionList[i])){
				this.skirmishCollisionList.splice(i,1);
			}
		}
	}
	executeMoveOrder(location, angle, target){
		this.targetAngleFinal = angle;
		this.target = target;
		if (target != null){
			this.path = Pathfinder.findPath(this.x, this.y, target.x, target.y, this);
			this.updateRouteTimer.start();
		}
		else{
			this.path = Pathfinder.findPath(this.x, this.y, location.x, location.y, this);
		}
		this.getNextWaypoint();
	}
	executeAttackMoveOrder(location, angle, target){
		//currently behaves exactly like a move order. The difference is really just that the 
		//unit's command is 'attackmove'
		//Add any additional logic here
		this.executeMoveOrder(location, angle, target);
	}

	executeFallBackOrder(location){
		this.targetAngleFinal = null;
		this.target = null;
		this.path = Pathfinder.findPath(this.x, this.y, location.x, location.y, this);
		this.getNextWaypoint();
	}

	executeRetreatOrder(target){
		this.targetAngleFinal = null;
		this.target = target;
		var ignoreList = [];
		ignoreList.push(this.target);
		this.path = Pathfinder.findPath(this.x, this.y, this.target.x, this.target.y, this, ignoreList);
		this.getNextWaypoint();
	}

	wasRecentlyFlanked(){
		this.recentlyFlankedTimer.start();
		this.recentlyFlanked = true;
	}

	checkCombatState(){
		//this.combatCollisionList = []; //Enemies in combat range this frame
		//this.skirmishCollisionList = []; //Enemies in skirmish range this frame
		if (this.combatCollisionList.length > 0){
			//combat, no skirmish
			this.inBattle = true;
		}
		else{
			//skirmish
			this.inBattle = false;
		}
		if (this.recentlyFlankedTimer.checkTime()){
			this.recentlyFlanked = false;
		}
	}

	checkMorale(){
		//To check:
		//	current strength vs orig
		//	enemy proximity
		//	flanked?
		//	proximity of allies
		//	proximity of general
		
		if (this.retreating){
			if (this.rallyTimer.checkTime()){
				if (getRandomInt(1,100) <= this.rallyChance){
					this.retreating = false;
					//lower the unit's chance for retreat after having rallied once
					//because why not
					this.retreatChance = Math.floor(this.retreatChance / 2);
				}
			}
		}
		else{
			var thisGeneral;
			if (this.army == armies.blue){
				thisGeneral = playerGeneral;
			}
			else{
				//assumed red army
				thisGeneral = enemyGeneral;
			}
			if (this.strength * this.invMaxStrength < this.retreatThreshold){
				//current hacky approach just checks for a retreat when below a strength threshold
				if (getRandomInt(1,1000) <= this.retreatChance){
					this.retreating = true;
					this.rallyTimer.start();
					this.updateCommand({type: commandTypes.retreat, target: thisGeneral, date: Date.now()}, true)
					return;
				}
			}
			//ugly to check this again..
			if (this.army == armies.blue){
				fullRetreatPlayer = false;
			}
			else{
				//assumed red army
				fullRetreatEnemy = false;

			}
		}
	}

	getFlankModifier(inBattle, xLoc, yLoc){
		if (inBattle){
			var dir, cosTheta;
			dir = {x: xLoc - this.x, y: yLoc - this.y};
			cosTheta = dotProduct(this.dirX, this.dirY, dir.x, dir.y) / getVectorMag(dir.x, dir.y); //Dot product relation. No need to get mag of this.dir as it's 1.
			
			if (cosTheta < this.cosFlankAngle){
		  		return true;
			}
		}
		return false;
	}

	getFortificationModifier(){
		var modifier;
		switch(this.state){
			default:
				modifier = fortifyModifiers.braced;
				break;
			case unitStates.marching:
				modifier = fortifyModifiers.marching;
				break;
			case unitStates.braced:
				modifier = fortifyModifiers.braced;
				break;
			case unitStates.entrenched:
				modifier = fortifyModifiers.entrenched;
				break;
		}
		return modifier;
	}
}

class AuxiliaryUnit extends Unit{
	constructor(x, y, angle, army){
		super(x, y, angle, army);
		this.combatRadius = 15;
		this.auxiliaryUnit = true;
	}
}

class InfantryUnit extends CombatUnit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, element, army);
		this.derivativeSpeed = unitSpeeds.infantry;
		this.attackCooldownTime = 2000;
		this.attackCooldown = new Timer(this.attackCooldownTime, false);
        this.reloaded = true;
		this.multiplierCombat = 6/500;
		this.multiplierSkirmish = 6/3000;
		this.flankedModifier = 1.5;
		this.combatRadius = 22;
		this.skirmishRadius = 65;
		this.state = unitStates.braced;
		this.bracedTimer = new Timer(5000, false);
		this.bracedTimer.start();
		this.unitType = unitTypes.infantry;
		this.spriteSheet = initializeSpriteSheet(this);
		this.trail = new Trail({x: this.x, y: this.y}, 4, 5, (this.army==armies.blue)?playerColor:enemyColor, 0.5, 0.75, 8000);
		unitTrails.push(this.trail);
	}
	update(dt){
		this.updateState();
		this.checkCombatState();

		super.update(dt);
		//clean up lists
		this.combatCollisionList = []; //Enemies in combat range this frame 
		this.skirmishCollisionList = []; //Enemies in skirmish range this frame
		this.trail.update({x:this.x, y:this.y});
	}

	updateState(){
		var previousState = this.state;
		if (this.isRotating || this.isMoving){
			this.state = unitStates.marching;
			this.spriteSheet.YframeIndex = 2;
		}
		else{
			if (this.state == unitStates.entrenched){
				this.spriteSheet.YframeIndex = 0;
				return;
			}
			else if (previousState == unitStates.marching){
				this.state = unitStates.braced;
				this.bracedTimer.start();
				this.spriteSheet.YframeIndex = 1;
			}
			else{
				if (this.inBattle){
					this.bracedTimer.start();
					return;
				}
				if (this.bracedTimer.checkTime()){
					this.state = unitStates.entrenched;
					this.spriteSheet.YframeIndex = 0;
				}
				else{
					this.state = unitStates.braced;
					this.spriteSheet.YframeIndex = 1;
				}
			}
		}
	}

	attack(){
		if (!this.reloaded){
			return;
		}
		//The inBattle bool is set elsewhere for drawing purposes. I dont want the skirmish radius drawn if a unit is in combat
		//And this needs to happen always, not just when the attackCooldown is up
		if (this.inBattle){

			if (this.combatCollisionList.length > 0){
				createBattleAnimation(this, this.combatCollisionList, this.attackCooldownTime);
				this.spriteSheet.startRumble();
                this.reload();
			} 

			var damage = Math.floor(this.strength * this.multiplierCombat / this.combatCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.combatCollisionList.length; i++){
				var enemy = this.enemyList[this.combatCollisionList[i]];
				if (~enemy.auxiliaryUnit){
					enemy.takefire(damage, this.inBattle, this.x, this.y);
				}
			}
            this.reload();
		}
		else{
			//isSkirmishing
			
			if (this.skirmishCollisionList.length > 0){
				createSkirmishAnimation(this, this.skirmishCollisionList, this.attackCooldownTime);
                this.reload();
			} 
			
			
			var damage = Math.floor(this.strength * this.multiplierSkirmish / this.skirmishCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.skirmishCollisionList.length; i++){
				var enemy = this.enemyList[this.skirmishCollisionList[i]];
				if (~enemy.auxiliaryUnit){
					enemy.takefire(damage, this.inBattle, this.x, this.y);
				}
			}
		}
        
	}

    reload(){
        this.reloaded = false;
        this.attackCooldown.start();
    }

	takefire(damage, inBattle, xLoc, yLoc){
		if (this.getFlankModifier(inBattle, xLoc, yLoc)){
			damage = Math.floor(damage * this.flankedModifier * this.getFortificationModifier());
			addCombatText("-" + parseFloat(damage).toFixed(0) + ' *Flanked!*', this.x, this.y - 5, damageColor);
			this.wasRecentlyFlanked();
		}
		else{
			damage = Math.floor(damage * this.getFortificationModifier());
        	addCombatText("-" + parseFloat(damage).toFixed(0), this.x, this.y - 5, damageColor);
		}
		this.strength -= damage;
		this.checkVitals();
	}

	checkVitals(){
		if (this.strength < 1){
			switch(this.army){
			case armies.blue:
				delete playerInfantryList[this.id];
				delete playerUnitList[this.id];
				delete unitList[this.id];
				break;
			
			case armies.red:
				delete enemyInfantryList[this.id];
				delete enemyUnitList[this.id];
				delete unitList[this.id];
				break;

			default:
				console.log('Nonexistent army.');
				break;
			}
		}
	}

	checkCombatState(){
		super.checkCombatState();
        if (this.attackCooldown.checkTime()){
            this.reloaded = true;
        }

	}

	adjustAngle(angle){
		if ((this.command == commandTypes.fallback) || (this.command == commandTypes.retreat)){
			angle += 180;
			if (angle < -180){
				angle += 360;
			}
			else if (angle > 180){
				angle -= 360;
			}
		}
		return angle;
	}

	adjustSpeed(){
		if (this.command == commandTypes.fallback){
			return -0.4 * this.derivativeSpeed;
		}
		else if (this.command == commandTypes.retreat){
			return -0.75 * this.derivativeSpeed;
		}
		return this.derivativeSpeed;
	}
	updateSpriteSheet(dt){
		//override unit's function		
		this.spriteSheet.update(dt);
	}
}

class ArtilleryUnit extends CombatUnit {
	constructor(x, y, angle, element, army) {
		super(x, y, angle, element, army);
		this.maxBatteryCount = initializeArtilleryElement(element);
		this.gunsPerBattery = 6;
		this.gunDetachment = 15;
		this.maxGunCount = this.maxBatteryCount * this.gunsPerBattery; //30
		this.gunCount = this.maxGunCount;
		this.guns = [];
		for (var i = 0; i < this.gunCount; i++){
			this.guns.push(new ArtilleryPiece(this.gunDetachment));
		}
		this.derivativeSpeed = unitSpeeds.artillery;
		this.unitType = unitTypes.artillery;
		this.combatRadius = 22; //this will be used primarily for friendly collision
		this.smallArmsRadius = 15;
		this.cannisterRadius = 80;
		this.sphereShotRadius = 180;
		this.smallArmsRadiusSq = this.smallArmsRadius * this.smallArmsRadius;
		this.cannisterRadiusSq = this.cannisterRadius * this.cannisterRadius;
		this.sphereShotRadiusSq = this.sphereShotRadius * this.sphereShotRadius;
		this.firingAngleRange = 45; //angles to left and right of direction that cannons can fire
		this.sphereShotCooldownTime = 2500;
		this.cannisterCooldownTime  = 1500;
		this.sphereShotCooldown = new Timer(this.sphereShotCooldownTime, false);
		this.cannisterCooldown  = new Timer(this.cannisterCooldownTime, false);
		this.attackCooldown = this.sphereShotCooldown;
		this.reloaded = true;
		this.firingTarget = null;
		this.multiplierSphereShot = 1; //all multipliers are * by guns
		this.multiplierCannister  = 2;
		this.multiplierFlank      = 2;
		this.multiplierSmallArms  = 0.1;
		this.targetFlankRange = 65; //angle frome direction perpendicular to target for which flank damage multiplier applies
		this.flankedModifier = 1.5; //this modifies incoming damage.
		this.state = unitStates.braced;
		this.bracedTimer = new Timer(5000, false);
		this.bracedTimer.start();
		//this.spriteSheet = initializeSpriteSheet(this); FIXME need assets
		this.trail = new Trail({x: this.x, y: this.y}, 4, 5, (this.army==armies.blue)?playerColor:enemyColor, 0.5, 0.75, 8000);
		unitTrails.push(this.trail);
		this.cannisterCollisionList  = [];
		this.sphereShotCollisionList = [];
	}

	update(dt){
		this.updateState();
		this.checkCombatState();

		super.update(dt);
		//clean up lists
		this.cannisterCollisionList = []; //Enemies in cannister range this frame 
		this.sphereShotCollisionList = []; //Enemies in sphere shot range this frame
		this.trail.update({x:this.x, y:this.y});
	}

	updateState(){
		var previousState = this.state;
		if (this.isRotating || this.isMoving){
			this.state = unitStates.marching;
			//this.spriteSheet.YframeIndex = 2;
		}
		else{
			if (this.state == unitStates.entrenched){
				//this.spriteSheet.YframeIndex = 0;
				return;
			}
			else if (previousState == unitStates.marching){
				this.state = unitStates.braced;
				this.bracedTimer.start();
				//this.spriteSheet.YframeIndex = 1;
			}
			else{
				if (this.inBattle){
					this.bracedTimer.start();
					return;
				}
				if (this.bracedTimer.checkTime()){
					this.state = unitStates.entrenched;
					//this.spriteSheet.YframeIndex = 0;
				}
				else{
					this.state = unitStates.braced;
					//this.spriteSheet.YframeIndex = 1;
				}
			}
		}
	}

	attack(){
		if (!this.reloaded){
			return;
		}
		/*
		if (this.inBattle){

			if (this.combatCollisionList.length > 0){
				createBattleAnimation(this, this.combatCollisionList, this.attackCooldownTime);
				this.spriteSheet.startRumble();
                this.reload();
			} 

			var damage = Math.floor(this.strength * this.multiplierCombat / this.combatCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.combatCollisionList.length; i++){
				var enemy = this.enemyList[this.combatCollisionList[i]];
				if (~enemy.auxiliaryUnit){
					enemy.takefire(damage, this.inBattle, this.x, this.y);
				}
			}
            this.reload();
		}
		else{
			//isSkirmishing
			
			if (this.skirmishCollisionList.length > 0){
				createSkirmishAnimation(this, this.skirmishCollisionList, this.attackCooldownTime);
                this.reload();
			} 
			
			
			var damage = Math.floor(this.strength * this.multiplierSkirmish / this.skirmishCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.skirmishCollisionList.length; i++){
				var enemy = this.enemyList[this.skirmishCollisionList[i]];
				if (~enemy.auxiliaryUnit){
					enemy.takefire(damage, this.inBattle, this.x, this.y);
				}
			}
		}
		*/
	}

    reload(){
        this.reloaded = false;
        this.attackCooldown.start();
    }



	takefire(damage, inBattle, xLoc, yLoc){
		if (this.getFlankModifier(inBattle, xLoc, yLoc)){
			damage = Math.floor(damage * this.flankedModifier * this.getFortificationModifier());
			addCombatText("-" + parseFloat(damage).toFixed(0) + ' *Flanked!*', this.x, this.y - 5, damageColor);
			this.wasRecentlyFlanked();
		}
		else{
			damage = Math.floor(damage * this.getFortificationModifier());
        	addCombatText("-" + parseFloat(damage).toFixed(0), this.x, this.y - 5, damageColor);
		}
		this.strength -= damage;
		this.checkVitals();
	}

	checkVitals(){
		if (this.gunCount < 1){
			switch(this.army){
			case armies.blue:
				delete playerArtilleryList[this.id];
				delete playerUnitList[this.id];
				delete unitList[this.id];
				break;
			
			case armies.red:
				delete enemyArtilleryList[this.id];
				delete enemyUnitList[this.id];
				delete unitList[this.id];
				break;

			default:
				console.log('Nonexistent army.');
				break;
			}
		}
	}

	checkCombatState(){
		super.checkCombatState();
        if (this.attackCooldown.checkTime()){
            this.reloaded = true;
        }

	}

	adjustAngle(angle){
		if ((this.command == commandTypes.fallback) || (this.command == commandTypes.retreat)){
			angle += 180;
			if (angle < -180){
				angle += 360;
			}
			else if (angle > 180){
				angle -= 360;
			}
		}
		return angle;
	}

	adjustSpeed(){
		if (this.command == commandTypes.fallback){
			return -0.4 * this.derivativeSpeed;
		}
		else if (this.command == commandTypes.retreat){
			return -0.75 * this.derivativeSpeed;
		}
		return this.derivativeSpeed;
	}

	updateSpriteSheet(dt){
		//this.spriteSheet.update(dt); FIXME need spritesheet
	}
}

class ArtilleryPiece{
	constructor(strength){
		this.maxStrength = strength;
		this.strength = strength;
	}
	takeDamage(){

	}
}

class CavalryUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, element, army);
		this.derivativeSpeed = unitSpeeds.cavalry;
		this.unitType = unitTypes.cavalry;
	}
}

class General extends AuxiliaryUnit{
	constructor(x, y, angle, courierCount, army){
		super(x, y, angle, army);
		this.derivativeSpeed = unitSpeeds.general;
		this.commandRadius = 100;
		this.rotationRate = 120;
		this.maxCourierCount = courierCount;
		this.courierCount = this.maxCourierCount;
		this.issuedCourierCount = 0;
		this.courierRecharge = new Timer(10000, true);
		this.courierRecharge.start();
		this.courierCooldown = new Timer(1000, true);
		this.courierCooldown.start();
		this.unitType = unitTypes.general;
		this.captured = false;
		this.spriteSheet = initializeSpriteSheet(this);
		this.AIcontrolled = false;
	}
	issueCommand(target, command){
		if (target.retreating){
			console.log('That unit is retreating!');
			return;
		}
		if (getDistanceSq(target.x, target.y, this.x, this.y) <= Math.pow(this.commandRadius,2)){
			target.updateCommand(command, false);
		}
		else{
			this.sendCourier(target, command);
		}
	}

	moveToLocation(xLoc, yLoc, queuingOrders){
		this.command = commandTypes.move;
		var order = {type: commandTypes.move, target: null, x: xLoc, y: yLoc, angle: null, date: Date.now(), queue: queuingOrders};
		this.updateCommand(order, false);
	}
	
	updateCommand(order, clearQueue){
		// Called on being given a command, and also on command completion
		if (order == null){
			if (clearQueue){
				this.commandQueue = [];
			}

			if (this.commandQueue.length > 0){
				order = this.commandQueue.shift();
			}
			else{
				this.command = null;
				this.targetPosition = null;
				this.targetAngle = null;
				this.target = null;
				this.path = [];
				return;
			}
		}
		else if (this.command != null && order.queue){
			//queued command first hits unit here. Add it to command queue
			this.commandQueue.push(order);
			return;
		}
		else{
			this.commandQueue = [];
		}
		this.path = Pathfinder.findPath(this.x, this.y, order.x, order.y, this);
		this.getNextWaypoint();
	}

	update(dt){
		this.refreshCouriers();
		super.update(dt);
	}

	refreshCouriers(){
		if (this.courierRecharge.checkTime()){
			this.addCourier();

		}
	}

	addCourier(){

		if ((this.courierCount + this.issuedCourierCount) < this.maxCourierCount){
			this.courierCount += 1;
		}
	}

	sendCourier(target, command){
		if (this.courierCount > 0){
			if (this.courierCooldown.checkTime()){
				addPlayerCourier(this.x, this.y, this.angle, this, target, command);
				this.courierCount -= 1;
				this.issuedCourierCount += 1;
			}
			else{
				console.log('Courier sending on cooldown!');
			}	
		}
		else{
			console.log('No couriers available!');
		}
	}
}

class Courier extends AuxiliaryUnit{
	constructor(x, y, angle, general, target, order, army){
		super(x, y, angle, army);
		this.derivativeSpeed = unitSpeeds.courier;
		this.general = general;
		this.target = target;
		this.faceTarget();
		this.order = order;
		this.orderRange = 25;
		this.closingRange = 100;
		this.targetSigma = 15;
		this.turnAngleTol = 60;
		this.rotationRate = 120;
		this.returning = false;
		this.unitType = unitTypes.courier;
		this.spriteSheet = initializeSpriteSheet(this);
		this.updateRouteTimer = new Timer(2000, true);
		this.updateRouteTimer.start();
		this.ignoreList = [];
		this.ignoreList.push(this.general);
		this.ignoreList.push(this.target);
		this.updateRoute();
	}
	update(dt){
		this.deliveryDistance = getDistance(this.x, this.y, this.target.x, this.target.y);
		
		if (this.deliveryDistance < this.orderRange){
			if (this.returning){
				this.reportToGeneral(true);
			}
			else{
				this.deliverOrder();
			}
		}
		else if (this.deliveryDistance < this.closingRange){
			this.path = [];
			this.targetPosition = {x: this.target.x, y: this.target.y};
		}
		super.update(dt);
	}

	faceTarget(){
		this.deliveryDistance = getDistance(this.x, this.y, this.target.x, this.target.y);
		this.dirX = (this.target.x - this.x)/this.deliveryDistance;
		this.dirY = (this.target.y - this.y)/this.deliveryDistance;
		this.updateAngle();
	}
	updateRoute(){
		this.path = Pathfinder.findPath(this.x, this.y, this.target.x, this.target.y, this, this.ignoreList);	
		this.getNextWaypoint();
	}

	deliverOrder(){
		this.target.updateCommand(this.order, false);
		this.returning = true;
		this.target = this.general;
		this.faceTarget();
		this.updateRoute();
	}

	reportToGeneral(success){
		//if success, add back to courier count total
		//need to make general for enemy
		if (this.army == armies.blue){
			delete playerCourierList[this.id];
			delete playerUnitList[this.id];
			delete unitList[this.id];
		}
		else{
			delete enemyCourierList[this.id];
			delete enemyUnitList[this.id];
			delete unitList[this.id];
		}

		if (success){
			this.general.addCourier();
		}
		this.general.issuedCourierCount -= 1;
	}
}
