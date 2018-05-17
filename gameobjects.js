"use strict";

class GameBoard{
	constructor(rows, columns){
		this.grid = new Grid(rows, columns, canvas.width, canvas.height);
		this.debug = false;
		this.collisionCheckTime = 200;
		this.collisionTimer = Date.now();
	}

	initializeBoard	(){
		initBoardEmptyPlain();
	}

	update(dt){
		if (this.debug){
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
		this.baseSpeed = 15;
		this.currentSpeed = 0;
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
		this.turnRadiusTol = 30;
		this.targetRadiusTolerance = 40;
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
		this.state = unitStates.braced;
		this.collisionList = [];
	}

	update(dt){
		if (this.target != null){
			if (this.updateRouteTimer.checkTime()){
				this.path = Pathfinder.findPath(this.x, this.y, this.target.x, this.target.y, this, this.ignoreList);	
				this.getNextWaypoint();
			}
		}
		this.updateTargetParameters();

		this.rotate(dt);
		this.move(dt);
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
		if (this.targetPosition == null){
			this.currentSpeed = 0;
			return;
		}		
		if (this.rerouting){
			if (this.targetDistance < this.targetSigma){
				this.targetPosition = this.getNextWaypoint();
			}
			else{
				this.currentSpeed = this.baseSpeed;
				this.x += this.currentSpeed * this.dirX * dt;
				this.y += this.currentSpeed * this.dirY * dt;	
			}
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
			}
			else if (Math.abs(this.angle - this.targetAngle) < this.turnAngleTol){
				this.currentSpeed = this.baseSpeed;
				this.x += this.currentSpeed * this.dirX * dt;
				this.y += this.currentSpeed * this.dirY * dt;	
			}
			else{
				this.currentSpeed = 0;
			}
		}
	}

	rotate(dt){
		if (this.targetAngle == null){
			return;
		}
		var angleDiff = this.targetAngle - this.angle;
		var absAngleDiff = Math.abs(angleDiff);
		if (absAngleDiff < this.targetAngleSigma){
			this.angle = this.targetAngle;
			if (this.targetAngle == this.targetAngleFinal){
				this.targetAngleFinal = null;
				this.targetAngle = null;
			}
			this.updateDir();
			return;
		}
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
	}
	updateCommand(order){
		// Called on being given a command, and also on command completion
		if (order == null){
			this.command = null;
			return;
		}
		this.command = order.type;
		switch(this.command){
			default:{
				this.command = null;
				break;
			}
			case commandTypes.move:{
				this.executeMoveOrder({x: order.x, y: order.y}, order.angle, order.target);
				break;
			}
			case commandTypes.attackmove:{
				this.executeMoveOrder({x: order.x, y: order.y});
				break;
			}
			case commandTypes.fallback:{
				this.executeMoveOrder({x: order.x, y: order.y});	
				break;
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
	/*
	executeAttackMoveOrder(location){
		//FIXME: behaves exactly like move order
		this.path = Pathfinder.findPath(gameBoard.grid.getNodeFromLocation(this.x, this.y), gameBoard.grid.getNodeFromLocation(location.x, location.y), this);
		this.getNextWaypoint();
		//this.updateRoute();
	}

	executeFallBackOrder(location){
		//FIXME: behaves exactly like move order
		this.path = Pathfinder.findPath(gameBoard.grid.getNodeFromLocation(this.x, this.y), gameBoard.grid.getNodeFromLocation(location.x, location.y), this);
		this.getNextWaypoint();
		//this.updateRoute();
	}
	*/
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

	rerouteTangentially(unit, distanceSq){
		if (this.rerouteBegan != null && Date.now() - this.rerouteBegan <= this.rerouteTime){
			return;
		}
		var dist;
		if (distanceSq != null){
			dist = Math.sqrt(distanceSq);
		}
		else{
			dist = getDistance(this.x, this.y, unit.x, unit.y);
		}

		var normalX, normalY, projLength, rerouteMag;
		normalX = (unit.x - this.x)/dist;
		normalY = (unit.y - this.y)/dist;

		projLength = this.dirX * normalX + this.dirY * normalY;
		this.rerouteTargetX = this.dirX - projLength * normalX;
		this.rerouteTargetY = this.dirY - projLength * normalY;
		rerouteMag = getVectorMag(this.rerouteTargetX, this.rerouteTargetY);
		this.rerouteTargetX = this.x + this.rerouteDistance * this.rerouteTargetX/rerouteMag;
		this.rerouteTargetY = this.y + this.rerouteDistance * this.rerouteTargetY/rerouteMag;

		this.rerouteBegan = Date.now();
	}
}

class InfantryUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, army);
		this.element = element;
		this.strength =	initializeElement(this.element);
		this.combatRadius = 30;
		this.skirmishRadius = 65;
		this.state = unitStates.braced;
		this.unitType = unitTypes.infantry;
		this.halted = false;
	}
	update(dt){
		//this.updateRoute();
		super.update(dt)
		
		this.halted = false;
	}
}

class CavalryUnit extends Unit{
	constructor(x, y, angle, element, army){
		super(x, y, angle, army);
		this.element = element;
		this.strength = initializeElement(this.element);
		this.baseSpeed = this.baseSpeed * 2;
		this.unitType = unitTypes.cavalry;
	}
}

class General extends Unit{
	constructor(x, y, angle, courierCount, army){
		super(x, y, angle, army);
		this.baseSpeed = this.baseSpeed * 2;
		this.commandRadius = 500;
		this.combatRadius = 30;
		this.courierCount = courierCount;
		this.unitType = unitTypes.general;
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
		this.baseSpeed = this.baseSpeed * 5;
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
		else{
			if (this.updateRouteTimer.checkTime()){
				this.updateRoute();
			}	
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