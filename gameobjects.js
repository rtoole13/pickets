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

	}
}

class Unit{
	constructor(x, y, angle){
		this.x = x;
		this.y = y;
		this.baseSpeed = 5;
		this.angle = angle;
		this.targetPosition = null;
	}

	update(dt){

	}

	move(dt){

	}
	updateTargetPosition(location){
		this.targetPosition = location;
		var xDiff = Math.abs(this.targetPosition.x - this.x);
		this.angle = Math.acos((xDiff/getDistance(this.x, this.y, this.targetPosition.x, this.targetPosition.y)))*180/Math.PI;
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