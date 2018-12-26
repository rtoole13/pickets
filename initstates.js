"use strict";

class BoardPreset {
	constructor(){

	}
	load(){
		this.addUnits();
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
		addEnemyGeneral(450, 200, -135, 10, true);

		addPlayerInfantry(500, 360, -135, "Brigade");
		addPlayerInfantry(600, 400, 0, "Brigade");
		addPlayerInfantry(400, 400, 0, "Brigade");

		addEnemyInfantry(500, 260, -135, "Brigade");
		addEnemyInfantry(200, 200, -135, "Brigade");
	}
}

class TutorialBoard extends BoardPreset{
	constructor(){
		super();
		this.goals = new Queue();
		this.currentGoal = null;
	}

	load(){
		super.load();
		this.initializeGoals();
	}

	initializeGoals(){
		throw 'Inheriting classes must override \'initializeGoals\'!';
	}

	beginGoals(){
		this.currentGoal = this.goals.remove();
		if (this.currentGoal != null){
			this.currentGoal.initiate();
		}
	}
	checkGoals(){
		//returns true if over
		if (this.currentGoal == null){
			return true;
		}
		if (this.currentGoal.checkObjective()){
			this.currentGoal = this.goals.remove();
			if (this.currentGoal != null){
				this.currentGoal.initiate();
			}
		}
	}

	clearGoals(){
		this.goals.clearData();
		this.goals = new Queue();
	}

	resetGoals(){
		this.clearGoals();
		this.initializeGoals();
	}
}

class TutorialOneBoard extends TutorialBoard {
	constructor(){
		super();
	}

	addUnits(){
		//move and attack tutorial
		//move a unit into skirmish range of an enemy unit
		addPlayerGeneral(50, 350, 45, 10);
		addEnemyGeneral(650, 150, -135, 10, false);
	}

	initializeGoals(){
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		var generalID, infantryID, enemyInfantryID;
		generalID = playerGeneral.id;
		infantryID = 'INFA';
		enemyInfantryID = 'INFB';
		this.goals.add(new ClickGoal('Press <R> at any point to restart the current tutorial,<br> or use the arrows to navigate between tutorials.', undefined));
		this.goals.add(new ClickGoal('Tutorial One: Basics.', undefined));
		this.goals.add(new SelectUnitGoal('Select your general, marked by the blue star, by left clicking the marker.', generalID, undefined, eventOverrides));
		this.goals.add(new MoveTargetToLocationGoal('While it\s selected, move your general to the <br>location marked by the green circle by right clicking!', 
													generalID, {x:175, y:375}, null, 25, undefined, eventOverrides));

		var spawnUnitCallback = function(){
			var playerInf = addPlayerInfantry(-20, 350, 0, "Brigade", infantryID);
			playerInf.updateCommand({type: commandTypes.move, target: null, x: 100, y: 350, angle: 45, date: Date.now()});

			var enemyInf = addEnemyInfantry(520, -20, -90, "Brigade");
			enemyInf.updateCommand({type: commandTypes.move, target: null, x: 520, y: 190, angle: -135, date: Date.now()});
		};
		this.goals.add(new MoveTargetToLocationGoal('Now move your general to this location!', generalID, {x:205, y:440}, null, 25, spawnUnitCallback, eventOverrides));
		this.goals.add(new DurationGoal('Enemy infantry are arriving from the north, <br>and friendly infantry from the west.', 5000, undefined, eventOverrides));
		this.goals.add(new KeyPressGoal('Press <Space> to continue.', 32, undefined));
		this.goals.add(new ClickGoal('Pressing <Space> at any point to reveal your general\'s command radius<br>\
			and your infantry\'s battle and skirmish radii. Your units\' flanks and<br>\
			front are also indicated in red and green, respectively.', undefined));
		this.goals.add(new ClickGoal('Combat units will automatically skirmish with enemies within their skirmish radius.<br>\
			Units will fortify themselves while skirmishing or disengaged, as indicated by the<br>triangles at each stationary unit\'s front.', undefined));
		this.goals.add(new ClickGoal('Combat units will lock into battle with enemies within their battle radius.<br>\
			Only ordering the unit to fallback will allow it to disengage.', undefined));
		this.goals.add(new MoveTargetToLocationGoal('Select your infanty unit and move it into position.', infantryID, {x:250, y:390}, null, 25, undefined, eventOverrides));
		this.goals.add(new DurationGoal('You can specify a unit\'s angle while issuing an order<br> by holding right click and dragging.', 3000, undefined, eventOverrides));
		this.goals.add(new MoveTargetToLocationGoal('Move your infantry here and rotate to the angle indicated by the arrow.', infantryID, {x:300, y:350}, {x:0, y:1}, 25, undefined, eventOverrides));
		this.goals.add(new MoveTargetToLocationGoal('Now rotate to face the enemy!', infantryID, {x:300, y:350}, {x:0.79, y:-0.6}, 25, undefined, eventOverrides));
		this.beginGoals();
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
		addEnemyGeneral(450, 200, -135, 10, false);
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
		addEnemyGeneral(450, 200, -135, 10, false);
	}

	initializeGoals(){
		this.currentGoal = this.goals.remove();
	}
}

//Class to hopefully clean up passing event listeners to be enabled/disabled to the goals.
class CustomEventListenerSet {
	constructor(){
		this.data = {};
	}
	addListener(target, eventName, callback){
		this.data[eventName] = {target: target, callback: callback};
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

function addPlayerInfantry(x, y, angle, element, overrideID){
	var id = overrideID || getUniqueID(5, unitList);
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
function addEnemyGeneral(x, y, angle, courierCount, smart){
	var id = getUniqueID(5, unitList);
	enemyGeneral = new EnemyGeneral(x, y, angle, courierCount, armies.red, smart);
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


