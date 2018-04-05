"use strict";

function initBoardEmptyPlain(){
	addPlayerGeneral(100, 500, 45, 10);
	addEnemyGeneral(700, 100, -135, 10);

	addPlayerInfantry(300, 200, 45, "Brigade");
	//addPlayerInfantry(200, 500, 45, "Brigade");

	//addEnemyInfantry(275, 400, -135, "Brigade");
	//addEnemyInfantry(600, 100, -135, "Brigade");
}

//Player Unit Init
function addPlayerGeneral(x, y, angle, courierCount){
	var id = getUniqueID(5, unitList);
	playerGeneral = new General(x, y, angle, courierCount, armies.blue);
	playerGeneral.id = id;
	unitList[id] = playerGeneral;
}

function addPlayerInfantry(x, y, angle, element){
	var id = getUniqueID(5, unitList);
	var unit = new InfantryUnit(x, y, angle, element, armies.blue);
	unit.id = id;
	playerInfantryList[id] = unit;
	unitList[id] = unit;
}

function addPlayerCourier(x, y, angle, general, target, order){
	var id = getUniqueID(5, unitList);
	var unit = new Courier(x, y, angle, general, target, order, armies.blue);
	unit.id = id;
	playerCourierList[id] = unit;
	unitList[id] = unit;
}

//Enemy Unit Init
function addEnemyGeneral(x, y, angle, courierCount){
	var id = getUniqueID(5, unitList);
	enemyGeneral = new General(x, y, angle, courierCount, armies.red);
	enemyGeneral.id = id;
	unitList[id] = enemyGeneral;
}

function addEnemyInfantry(x, y, angle, element){
	var id = getUniqueID(5, unitList);
	var unit = new InfantryUnit(x, y, angle, element, armies.red);
	unit.id = id;
	enemyInfantryList[id] = unit;
	unitList[id] = unit;
}


