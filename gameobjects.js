"use strict";

class GameBoard{
	constructor(rows, columns){
		this.rows = rows;
		this.columns = columns;

		this.initializeBoard();
	}

	initializeBoard(){
		initBoardEmptyPlain();
	}

	update(dt){
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

class Unit{
	constructor(x, y, angle, army){
		this.x = x;
		this.y = y;
		this.baseSpeed = 15;
		this.angle = angle;
		this.dirX = Math.cos((this.angle) * Math.PI/180);
		this.dirY = - Math.sin((this.angle) * Math.PI/180);
		this.targetPosition = null;
		this.targetDistance = null;
		this.targetSigma = 1;
		this.orderRange = 5;
		this.command = null;
		this.army = army;
	}

	update(dt){
		this.updateRoute(this.targetPosition);
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
	}

	executeMoveOrder(location){
		this.updateRoute(location);
	}

	executeAttackMoveOrder(location){
		this.updateRoute(location);
	}

	updateRoute(location){
		if (location == null || undefined){
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
		this.dirX = (this.targetPosition.x - this.x) / this.targetDistance;
		this.dirY = (this.targetPosition.y - this.y) / this.targetDistance;
		
		if (this.dirY >= 0){
			this.angle = - Math.acos(this.dirX) * 180 / Math.PI;	
		}
		else{
			this.angle = Math.acos(this.dirX) * 180 / Math.PI;	
		}
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
					if (unit.state == unitStates.marching && unit.halted == false){
						this.halted = true;
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
		else {
			// Enemy
			switch (unit.unitType){
				case unitTypes.infantry:{
					//Infantry
					if (this.command == commandTypes.move){
						console.log();
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
		this.commandRadius = 120;
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