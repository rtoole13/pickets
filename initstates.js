"use strict";

class BoardPreset {
	constructor(){

	}
	load(){
		this.addUnits();
		this.initializeGoals();
	}
	addUnits(){

	}
}

class MainBoard extends BoardPreset{
	constructor(){
		super();
	}
	addUnits(){
		addPlayerGeneral(550, 450, 45, 10);
		addEnemyGeneral(450, 200, -135, 10);

		addPlayerInfantry(500, 360, -135, "Brigade");
		//addPlayerInfantry(400, 200, -135, "Brigade");
		addPlayerInfantry(600, 400, 0, "Brigade");
		addPlayerInfantry(400, 400, 0, "Brigade");

		addEnemyInfantry(500, 260, -135, "Brigade");
		//addEnemyInfantry(200, 260, -135, "Brigade");	
		var enemyUnit = addEnemyInfantry(200, 200, -135, "Brigade");
		//enemyUnit.updateCommand({type: commandTypes.move, target: null, x: playerGeneral.x, y: playerGeneral.y, angle: null, date: Date.now()});
		//addEnemyInfantry(600, 100, -135, "Brigade");
	}
}

class TutorialBoard extends BoardPreset{
	constructor(){
		super();
		this.goals = new Queue();
		this.currentGoal = null;
	}
	initializeGoals(){
		throw 'Inheriting classes must override \'initializeGoals\'!';
	}
	checkGoals(){
		//returns true if over
		if (this.currentGoal == null){
			return true;
		}
		if (this.currentGoal.checkObjective()){
			this.currentGoal = this.goals.remove();
			this.currentGoal.initiate();
		}
	}
}

class TutorialOneBoard extends TutorialBoard {
	constructor(){
		super();
	}
	addUnits(){
		//move and attack tutorial
		//move a unit into skirmish range of an enemy unit
		addPlayerGeneral(245, 450, 45, 10);
		addEnemyGeneral(450, 200, -135, 10);
	}
	initializeGoals(){
		this.goals.add(new SelectUnitGoal('Select your general, marked by the blue star, by left clicking the marker.', playerGeneral));
		
		var callback = function(){
			var playerInf = addPlayerInfantry(50, 350, -135, "Brigade");
			playerInf.updateCommand({type: commandTypes.move, target: null, x: 350, y: 350, angle: null, date: Date.now()});

			var enemyInf = addEnemyInfantry(450, 50, -135, "Brigade");
			enemyInf.updateCommand({type: commandTypes.move, target: null, x: 400, y: 375, angle: null, date: Date.now()});
		};
		this.goals.add(new MoveTargetToLocationGoal('While it\s selected, move your general to this location by right clicking in the green circle!', 
													playerGeneral, {x:300, y:300}, 25, callback));
		this.goals.add(new MoveTargetToLocationGoal('Now move your general to this location!', playerGeneral, {x:200, y:300}, 25));
		this.currentGoal = this.goals.remove();
	}
}

class TutorialTwoBoard extends TutorialBoard {
	constructor(){
		super();
	}
	addUnits(){
		//courier capture tutorial
		//your units nearly surround an enemy unit
		//have a unit reroute to intercept a courier being sent by enemy general
		addPlayerGeneral(550, 450, 45, 10);
		addEnemyGeneral(450, 200, -135, 10);
	}
	initializeGoals(){
		this.currentGoal = this.goals.remove();
	}
}

class TutorialThreeBoard extends TutorialBoard {
	constructor(){
		super();
	}
	addUnits(){
		//fallback and artillery tutorial
		//have a unit fallback to friendly lines, then attack enemy with artillery
		addPlayerGeneral(550, 450, 45, 10);
		addEnemyGeneral(450, 200, -135, 10);
	}
	initializeGoals(){
		this.currentGoal = this.goals.remove();
	}
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
	return unit;
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
	enemyGeneral = new EnemyGeneral(x, y, angle, courierCount, armies.red);
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

function addEnemyCourier(x, y, angle, general, target, order){
	var id = getUniqueID(5, unitList);
	var unit = new Courier(x, y, angle, general, target, order, armies.red);
	unit.id = id;
	enemyCourierList[id] = unit;
	enemyUnitList[id] = unit;
	unitList[id] = unit;
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

function createBattleAnimation(unit, combatTargets, animationTime){
	var id = getUniqueID(5, animationList);
	var anim = new BattleAnimation(id, unit.x, unit.y, 1000/animationTime, 1, unit.id, combatTargets);
	animationList[id] = anim;
}

function terminateBattleAnimation(id){
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


