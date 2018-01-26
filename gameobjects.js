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
	constructor(x, y, angle){
		this.x = x;
		this.y = y;
		this.baseSpeed = 5;
		this.angle = angle;
		this.dirX = Math.cos((this.angle) * Math.PI/180);
		this.dirY = - Math.sin((this.angle) * Math.PI/180);
		this.targetPosition = null;
		this.targetDistance = null;
		this.targetSigma = 1;
	}

	update(dt){
		this.move(dt);
	}

	move(dt){
		this.updateTargetPosition(this.targetPosition);
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

	updateTargetPosition(location){
		if (location == null || undefined){
			this.targetPosition = null;
			this.targetDistance = null;
			return;
		}
		this.targetPosition = location;
		this.targetDistance = getDistance(this.x, this.y, this.targetPosition.x, this.targetPosition.y);
		if (this.targetDistance == 0){
			//Don't change direction vector and angle if distance to target is 0;
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
	constructor(x, y, angle, element){
		super(x, y, angle);
		this.element = element;
		this.strength =	initializeElement(this.element);
	}
}

class CavalryUnit extends Unit{
	constructor(x, y, angle, element){
		super(x, y, angle);
		this.element = element;
		this.strength = initializeElement(this.element);
		this.baseSpeed = this.baseSpeed * 2;
	}
}

class General extends Unit{
	constructor(x, y, angle, courierCount){
		super(x, y, angle);
		this.baseSpeed = this.baseSpeed * 2;
		this.courierCount = courierCount;
	}
	issueCommand(target, type, location){
		if (type == "move"){
			target.updateTargetPosition(location);
			console.log("Moving active unit to " + "(" + target.targetPosition.x + ", " + target.targetPosition.y + ")");
		}
		else{
			console.log("Unsupported command " + type + "!!");
		}
	}
}