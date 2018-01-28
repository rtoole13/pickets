"use strict";

function initBoardEmptyPlain(){
	addPlayerGeneral(100, 500, -135, 10);
	addEnemyGeneral(700, 100, 45, 10);

	addPlayerInfantry(100, 400, -135, "Brigade");
	addPlayerInfantry(200, 500, -135, "Brigade");

	addEnemyInfantry(700, 200, 45, "Brigade");
	addEnemyInfantry(600, 100, 45, "Brigade");
}

//Player Unit Init
function addPlayerGeneral(x, y, angle, courierCount){
	playerGeneral = new General(x, y, angle, courierCount);
}

function addPlayerInfantry(x, y, angle, element){
	var id = getUniqueID(5, playerInfantryList);
	var unit = new InfantryUnit(x, y, angle, element);
	unit.id = id;
	playerInfantryList[id] = unit;
}

function addPlayerCourier(x, y, angle, general, target, order){
	var id = getUniqueID(5, playerCourierList);
	var unit = new Courier(x, y, angle, general, target, order);
	unit.id = id;
	playerCourierList[id] = unit;
}

//Enemy Unit Init
function addEnemyGeneral(x, y, angle, courierCount){
	enemyGeneral = new General(x, y, angle, courierCount);
}

function addEnemyInfantry(x, y, angle, element){
	var id = getUniqueID(5, enemyInfantryList);
	var unit = new InfantryUnit(x, y, angle, element);
	unit.id = id;
	enemyInfantryList[id] = unit;
}


