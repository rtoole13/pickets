"use strict";

function initBoardEmptyPlain(){
	addPlayerGeneral(100, 500, 45, 10);
	addEnemyGeneral(700, 100, 225, 10);

	addPlayerInfantry(100, 400, 45, "Brigade");
	addPlayerInfantry(200, 500, 45, "Brigade");

	addEnemyInfantry(700, 200, 225, "Brigade");
	addEnemyInfantry(600, 100, 225, "Brigade");
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


