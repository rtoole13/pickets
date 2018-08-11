"use strict";

function initBoardEmptyPlain(){
	addPlayerGeneral(100, 500, 45, 10);
	addEnemyGeneral(700, 100, -135, 10);

	addPlayerInfantry(300, 400, -135, "Brigade");
	//addPlayerInfantry(400, 200, -135, "Brigade");
	addPlayerInfantry(200, 400, 45, "Brigade");

	var enemyUnit = addEnemyInfantry(600, 200, -135, "Brigade");
	//enemyUnit.updateCommand({type: commandTypes.move, target: null, x: playerGeneral.x, y: playerGeneral.y, angle: null, date: Date.now()});
	//addEnemyInfantry(600, 100, -135, "Brigade");
}

//Player Unit Init
function addPlayerGeneral(x, y, angle, courierCount){
	var id = getUniqueID(5, unitList);
	playerGeneral = new General(x, y, angle, courierCount, armies.blue);
	playerGeneral.id = id;
	playerUnitList[id] = playerGeneral;
	unitList[id] = playerGeneral;
}

function addPlayerInfantry(x, y, angle, element){
	var id = getUniqueID(5, unitList);
	var unit = new InfantryUnit(x, y, angle, element, armies.blue);
	unit.id = id;
	playerInfantryList[id] = unit;
	playerUnitList[id] = unit;
	unitList[id] = unit;
}

function addPlayerCourier(x, y, angle, general, target, order){
	var id = getUniqueID(5, unitList);
	var unit = new Courier(x, y, angle, general, target, order, armies.blue);
	unit.id = id;
	playerCourierList[id] = unit;
	playerUnitList[id] = unit;
	unitList[id] = unit;
}

//Enemy Unit Init
function addEnemyGeneral(x, y, angle, courierCount){
	var id = getUniqueID(5, unitList);
	enemyGeneral = new General(x, y, angle, courierCount, armies.red);
	enemyGeneral.id = id;
	enemyUnitList[id] = enemyGeneral;
	unitList[id] = enemyGeneral;
}

function addEnemyInfantry(x, y, angle, element){
	var id = getUniqueID(5, unitList);
	var unit = new InfantryUnit(x, y, angle, element, armies.red);
	unit.id = id;
	enemyInfantryList[id] = unit;
	enemyUnitList[id] = unit;
	unitList[id] = unit;
	return unit;
}

function createSkirmishAnimation(unit, skirmishTargets, animationTime){
	var id = getUniqueID(5, animationList);
	var anim = new SkirmishAnimation(id, unit.x, unit.y, 1000/animationTime, 1, unit.id, skirmishTargets);
	animationList[id] = anim;
}

function terminateSkirmishAnimation(id){
	for (var i = 0; i < animationList[id].circles.length; i++){
		delete animationList[id].circles[i];
	}
	animationList[id].targets = [];
	animationList[id].targets = null;
	animationList[id].circles = [];
	animationList[id].circles = null;
	delete animationList[id];
	return;
}



