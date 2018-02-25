"use strict";

class GameBoard{
	constructor(rows, columns){
		this.grid = new Grid(rows, columns, canvas.width, canvas.height);
	}

	initializeBoard	(){
		initBoardEmptyPlain();
		this.grid.update();
	}

	update(dt){
		this.grid.update();
		CollisionEngine.broadCheck();
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
class Grid{
	constructor(rows, columns, width, height){
		this.rows = rows;
		this.columns = columns;
		this.width = width;
		this.height = height;

		this.gridSpacing = {x:null, y:null};
		this.minDim = null;
		this.elem = [];
		this.initializeNodes();

		this.path = null;
	}

	initializeNodes(){

		this.gridSpacing.x = canvas.width / this.columns;
		this.gridSpacing.y = canvas.height / this.rows;

		if (this.gridSpacing.x < this.gridSpacing.y){
			this.minDim = this.gridSpacing.x;
		}
		else{
			this.minDim = this.gridSpacing.y;
		}

		for (var i = 0; i < this.columns; i++){
			var xLoc = this.gridSpacing.x/2 + this.gridSpacing.x * i;
			var rowArray = [];
			for (var j = 0; j < this.rows; j++){
				var yLoc = this.gridSpacing.y / 2 + this.gridSpacing.y * j;
				rowArray.push(new GridNode(xLoc, yLoc, this.gridSpacing.x, this.gridSpacing.y, i, j, true));
			}
			this.elem.push(rowArray);
		}
	}

	update(){
		this.reset();
		//Doing a basic point in circle collision check temporarily.
		for (var id in unitList){
			var unit = unitList[id];
			if (unit.state != unitStates.braced) continue;
			for (var i = 0; i < this.columns; i++){
				for (var j = 0; j < this.rows; j++){
					var elem = this.elem[i][j];

					if (CollisionEngine.pointInCircle(elem.x, elem.y, unit.x, unit.y, 2 * this.minDim + unit.rerouteDistance)){
						elem.walkable = false;
					}
				}
			}
		}
	}
	reset(){
		for (var i = 0; i < this.columns; i++){
			for (var j = 0; j < this.rows; j++){
				this.elem[i][j].walkable = true;
			}
		}
	}

	getNeighbors(node){
		var neighbors = [];
		for (var i = -1; i <= 1; i++){
			for (var j = -1; j <= 1; j++){
				if (i == 0 && j == 0){
					continue;
				}
				var checkX = node.indX + i;
				var checkY = node.indY + j;

				if (checkX >= 0 && checkY < this.columns && checkY >= 0 && checkY < this.rows){
					neighbors.push(this.elem[checkX][checkY]);
				}
			}	
		}
		return neighbors;
	}

	getNodeFromLocation(x, y){
		var i,j;
		i = Math.floor(x / this.gridSpacing.x);
		j = Math.floor(y / this.gridSpacing.y);
		return this.elem[i][j];
	}
}
class GridNode{
	constructor(x, y, width, height, indX, indY, walkable){
		this.x = x;
		this.y = y;
		this.indX = indX;
		this.indY = indY;

		this.width = width;
		this.height = height;
		this.walkable = walkable;

		this.parent = null;
		this.gcost = 0;
		this.hcost = 0;

		//Might add a bool to distinguish a point occupied by a map feature or unit
	}

	fcost(){
		return gcost + hcost;
	}
}

class Unit{
	constructor(x, y, angle, army){
		this.x = x;
		this.y = y;
		this.currentNode = gameBoard.grid.getNodeFromLocation(this.x, this.y);
		this.baseSpeed = 15;
		this.angle = angle;
		this.rotationRate = 55;
		this.dirX = Math.cos((this.angle) * Math.PI/180);
		this.dirY = - Math.sin((this.angle) * Math.PI/180);
		this.targetPosition = null;
		this.targetDistance = null;
		this.targetRadiusTolerance = 40;
		this.targetSigma = 1;
		this.targetAngleSigma = 0.5; //deg 
		this.orderRange = 5;
		this.command = null;
		this.army = army;
		this.rerouteTargetX = null;
		this.rerouteTargetY = null;
		this.rerouteDistance = 15;
		this.rerouteTime = 1000;
		this.rerouteBegan = null;
		this.state = unitStates.braced;
	}

	update(dt){
		this.updateRoute(this.targetPosition);
		this.rotate(dt);
		this.move(dt);
	}

	move(dt){
		if (this.targetPosition == null || undefined){
			return;
		}
		if (this.targetDistance < this.targetSigma){
			this.x = this.targetPosition.x;
			this.y = this.targetPosition.y;
		}
		else{
			this.x += this.baseSpeed * this.dirX * dt;
			this.y += this.baseSpeed * this.dirY * dt;			
		}
		this.currentNode = gameBoard.grid.getNodeFromLocation(this.x, this.y);
	}

	executeMoveOrder(location){
		Pathfinder.findPath(this.currentNode, gameBoard.grid.getNodeFromLocation(location.x, location.y));
		this.updateRoute(location);
	}

	executeAttackMoveOrder(location){
		this.updateRoute(location);
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
	updateRoute(location){
		if (location == null){
			this.targetPosition = null;
			this.targetDistance = null;
			return;
		}
		this.targetPosition = location;
		this.targetDistance = getDistance(this.x, this.y, this.targetPosition.x, this.targetPosition.y);
		if (this.targetDistance == 0){
			//Don't change direction vector and angle if distance to target is 0;
			this.targetPosition = null;
			this.targetDistance = null;
			return;	
		}
		if (this.rerouteBegan != null && Date.now() - this.rerouteBegan >= this.rerouteTime){
			this.rerouteTargetX  = null;
			this.rerouteTargetY  = null;
			this.rerouteBegan = null;
		}
	}

	rotate(dt){
		var currentTargetDirX, currentTargetDirY, currentTargetAngle;
		if (this.targetPosition == null){
			return;
		}
		if (this.rerouteTargetX != null && this.rerouteTargetY != null){
			var currentDist = getDistance(this.x, this.y, this.rerouteTargetX, this.rerouteTargetY);
			currentTargetDirX = (this.rerouteTargetX - this.x) / currentDist;
			currentTargetDirY = (this.rerouteTargetY - this.y) / currentDist;
		}
		else{
			currentTargetDirX = (this.targetPosition.x - this.x) / this.targetDistance;
			currentTargetDirY = (this.targetPosition.y - this.y) / this.targetDistance;
		}
		currentTargetAngle = getAngleFromDir(currentTargetDirX, currentTargetDirY);
		if (Math.abs(currentTargetAngle - this.angle) < this.targetAngleSigma){
			this.angle = currentTargetAngle;
			this.updateDir();
			return;

		}
		var angleDiff = currentTargetAngle - this.angle;
		if (angleDiff < -180){
			angleDiff += 360;
		}
		else if (angleDiff > 180){
			angleDiff -= 360;
		}
		
		if (angleDiff < 0){
			var temp = rotateVector(this.dirX, this.dirY, this.rotationRate * dt, true);
		}
		else{
			var temp = rotateVector(this.dirX, this.dirY, -this.rotationRate * dt, true);
		}
		
		this.dirX = temp.x;
		this.dirY = temp.y;
		this.updateAngle();
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
		this.updateRoute(this.targetPosition);
		this.rotate(dt);
		if (this.state == unitStates.marching){
			this.move(dt);
		}
		this.halted = false;
	}
	updateRoute(location){
		super.updateRoute(location);
		
		if (this.targetPosition != null && this.halted == false){
			this.state = unitStates.marching;
		}
		else{
			// this very much needs to change, doesn't allow for the third state. Also there's some
			// confusion as to how this will work with the collision calling for a halt and so forth.
			this.state = unitStates.braced;
		}
	}
	handleFriendlyInfantryCollision(unit, distanceSq){
		if (CollisionEngine.pointInCircle(this.targetPosition.x, this.targetPosition.y, unit.x, unit.y, unit.targetRadiusTolerance)){
			//Unit is over target position.
			if (unit.state == unitStates.marching){
				//Unit is marching
				this.rerouteTangentially(unit);
			}
			else{
				//Unit is braced
				if (unit.targetPosition == null){
					//Unit is indefinitely fixed in position
					this.state = unitStates.braced;
					this.targetPosition = null;
					this.targetDistance = null;
				}
				else{
					//Unit is in transit.
				}
			}
		}
		else{
			//Unit's not over target position.
			this.rerouteTangentially(unit);
		}
	}
	handleHit(unit, distanceSq, friendly){
		if (this.state != unitStates.marching){
			this.halted = true;
			return;
		}
		if (friendly){
			// Ally
			switch (unit.unitType){
				case unitTypes.infantry:{
					//Infantry
					this.handleFriendlyInfantryCollision(unit, distanceSq);
					break;
				}
				case unitTypes.cavalry:{
					//Cavalry
					break;
				}
				case unitTypes.general:{
					//General
					break;
				}
				case unitTypes.courier:{
					//Courier
					break;
				}
			}
		}
		else {
			// Enemy
			switch (unit.unitType){
				case unitTypes.infantry:{
					//Infantry
					if (this.command == commandTypes.move){
						if (getAngle(this.dirX, this.dirY, unit.x - this.x, unit.y - this.y, true) <= 90 
							&& distanceSq < Math.pow(this.skirmishRadius,2)){
							this.targetPosition = null;
							this.targetDistance = null;
							this.state = unitStates.braced;
						}
					}
					else if (distanceSq < Math.pow(this.combatRadius,2)){
						this.targetPosition = null;
						this.targetDistance = null;
						this.state = unitStates.braced;
					}
					break;
				}
				case unitTypes.cavalry:{
					//Cavalry
					break;
				}
				case unitTypes.general:{
					//General
					break;
				}
				case unitTypes.courier:{
					//Courier
					break;
				}
			}
		}

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
		this.courierCount = courierCount;
		this.unitType = unitTypes.general;
	}
	issueCommand(target, type, location){
		if (type == commandTypes.move){ 	
			if (getDistanceSq(target.x, target.y, this.x, this.y) <= Math.pow(this.commandRadius,2)){
				target.executeMoveOrder(location);
				target.command = type;
			}
			else{
				var order = {command: type, x: location.x, y: location.y};
				addPlayerCourier(this.x, this.y, this.angle, this, target, order);
			}
		}
		else if(type == commandTypes.attackmove){
			if (getDistanceSq(target.x, target.y, this.x, this.y) <= Math.pow(this.commandRadius,2)){
				target.executeAttackMoveOrder(location);
				target.command = type;
			}
			else{
				var order = {command: type, x: location.x, y: location.y};
				addPlayerCourier(this.x, this.y, this.angle, this, target, order);
			}
		}
		else{
			console.log("Unsupported command: " + type + "!!");
		}
	}
}

class Courier extends Unit{
	constructor(x, y, angle, general, target, order, army){
		super(x, y, angle, army);
		this.baseSpeed = this.baseSpeed * 5;
		this.general = general;
		this.target = target;
		this.order = order;
		this.returning = false;
		this.unitType = unitTypes.courier;
	}
	update(dt){
		if (this.returning){
			this.targetPosition = {x: this.general.x, y: this.general.y};
		}
		else{
			this.targetPosition = {x: this.target.x, y: this.target.y};
		}
		super.update(dt);

		if (this.targetDistance < this.orderRange){
			if (this.returning){
				this.reportToGeneral();
			}
			else{
				this.deliverOrder();
				this.returning = true;
			}
		}
	}
	deliverOrder(){
		switch(this.order.command){
			default:{
				console.log("Unsupported command: " + this.order.command + "!!");
				break;
			}
			case commandTypes.move: {
				//Here I'll want to distinguish whether the move order is to move towards a target or a target location.
				var location = {x: this.order.x, y: this.order.y}
				this.target.executeMoveOrder(location);
				break;
			}
			case commandTypes.attackmove: {
				//Here I'll want to distinguish whether the move order is to move towards a target or a target location.
				var location = {x: this.order.x, y: this.order.y}
				this.target.executeAttackMoveOrder(location);
				break;
			}
		}
		this.target.command = this.order.command;
	}
	reportToGeneral(){
		delete playerCourierList[this.id];
		delete unitList[this.id];
	}
}