"use strict";

class GameBoard{
	constructor(rows, columns){
		this.rows = rows;
		this.columns = columns;

		this.initializeBoard();
	}

	initializeBoard(){
		playerGeneral = new General(100, 500, 30, 10);
		enemyGeneral  = new General(700, 100, 210, 10);
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
	}

	update(dt){

	}

	move(dt){

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
	issueCommand(){

	}
}