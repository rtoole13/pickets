"use strict";

class GameBoard{
	constructor(rows, columns){
		this.grid = new Grid(rows, columns, canvas.width, canvas.height);
		this.collisionCheckTime = 200;
		this.collisionTimer = Date.now();
	}

	initializeBoard	(){
		initBoardEmptyPlain();
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
			playerCavalryList[id].update(dt);
		}

		//Enemy updates second
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
		this.isSkirmishing = false;
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
		this.turnAngleTol = 90;
		this.command = null;
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

		//clean up lists
		this.combatCollisionList = []; //Enemies in combat range this frame 
		this.skirmishCollisionList = []; //Enemies in skirmish range this frame
	}

	getNextWaypoint(){
		if (this.path != null && this.path.length >= 1){
			var node = this.path.shift();
			this.targetPosition = {x:node.x, y:node.y};
		}
		else{
			this.targetPosition = null;
			this.updateCommand();
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
	updateCommand(order){
		// Called on being given a command, and also on command completion
		if (order == null){
			this.command = null;
			this.targetPosition = null;
			this.targetAngle = null;
			this.target = null;
			this.path = [];
			return;
		}
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
		//FIXME need to make the movement behavior reversed, basically. move and rotation.
		this.targetAngleFinal = null;
		this.target = null;
		this.path = Pathfinder.findPath(this.x, this.y, location.x, location.y, this);
		this.getNextWaypoint();
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
}

class InfantryUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, army);
		this.derivativeSpeed = unitSpeeds.infantry;
		this.element = element;
		this.strength =	initializeElement(this.element);
		this.attackCooldown = new Timer(2000, true);
		this.attackCooldown.start();
		this.multiplierCombat = 1/500;
		this.multiplierSkirmish = 1/3000;
		this.combatRadius = 30;
		this.skirmishRadius = 65;
		this.state = unitStates.braced;
		this.bracedTimer = new Timer(5000, false);
		this.bracedTimer.start();
		this.unitType = unitTypes.infantry;
		this.inBattle = false;
	}
	update(dt){
		// below will likely be the means of halting a unit on enemy collision
		/*
		if (this.command == null){
			return;
		}
		*/
		this.updateState();
		this.checkCombatState();
		this.attack();

		super.update(dt);
	}

	updateState(){
		var previousState = this.state;
		if (this.isRotating || this.isMoving){
			this.state = unitStates.marching;
		}
		else{
			if (this.state == unitStates.entrenched){
				return;
			}
			else if (previousState == unitStates.marching){
				this.state = unitStates.braced;
				this.bracedTimer.start();
			}
			else{
				this.state = (this.bracedTimer.checkTime()) ? unitStates.entrenched : unitStates.braced; 
			}
		}
	}

	attack(){
		if (!this.attackCooldown.checkTime()){
			return;
		}

		var enemyList;
		switch(this.army){
			case armies.blue:
				enemyList = enemyUnitList;
				break;
			
			case armies.red:
				enemyList = playerUnitList;
				break;

			default:
				console.log('Nonexistent army.');
				break;
		}
		//The inBattle bool is set elsewhere for drawing purposes. I dont want the skirmish radius drawn if a unit is in combat
		//And this needs to happen always, not just when the attackCooldown is up
		if (this.inBattle){
			var damage = Math.floor(this.strength * this.multiplierCombat / this.combatCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.combatCollisionList.length; i++){
				var enemy = enemyList[this.combatCollisionList[i]];
				enemy.takefire(damage);
			}
		}
		else{
			var damage = Math.floor(this.strength * this.multiplierSkirmish / this.skirmishCollisionList.length);
			damage = Math.max(damage, 1);
			for (var i = 0; i < this.skirmishCollisionList.length; i++){
				var enemy = enemyList[this.skirmishCollisionList[i]];
				enemy.takefire(damage);
			}
		}
	}
	
	takefire(damage){
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
	}

	adjustAngle(angle){
		if (this.command == commandTypes.fallback){
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
		return this.derivativeSpeed;
	}
}

class CavalryUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, army);
		this.element = element;
		this.strength = initializeElement(this.element);
		this.derivativeSpeed = unitSpeeds.cavalry;
		this.unitType = unitTypes.cavalry;
	}
}

class General extends Unit{
	constructor(x, y, angle, courierCount, army){
		super(x, y, angle, army);
		this.derivativeSpeed = unitSpeeds.general;
		this.commandRadius = 500;
		this.combatRadius = 30;
		this.courierCount = courierCount;
		this.unitType = unitTypes.general;
		this.captured = false;
	}
	issueCommand(target, command){
		if (getDistanceSq(target.x, target.y, this.x, this.y) <= Math.pow(this.commandRadius,2)){
			target.updateCommand(command);
		}
		else{

			addPlayerCourier(this.x, this.y, this.angle, this, target, command);
		}
	}
}

class Courier extends Unit{
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
		this.rotationRate = 100;
		this.returning = false;
		this.unitType = unitTypes.courier;
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
				this.reportToGeneral();
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
		this.target.updateCommand(this.order);
		this.returning = true;
		this.target = this.general;
		this.faceTarget();
		this.updateRoute();
	}

	reportToGeneral(){
		delete playerCourierList[this.id];
		delete playerUnitList[this.id];
		delete unitList[this.id];
	}
}
