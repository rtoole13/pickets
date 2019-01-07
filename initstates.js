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

		addPlayerArtillery(600, 400, 0, "Brigade");
		addPlayerInfantry(500, 360, -135, "Brigade");
		//addPlayerInfantry(600, 400, 0, "Brigade");
		//addPlayerInfantry(400, 400, 0, "Brigade");

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
													generalID, {x:175, y:375}, null, 25, {xMin: 0, xMax: 300, yMin: 0, yMax: canvas.height}, undefined, eventOverrides));

		var spawnUnitCallback = function(){
			var playerInf = addPlayerInfantry(-20, 350, 0, "Brigade", infantryID);
			playerInf.updateCommand({type: commandTypes.move, target: null, x: 100, y: 350, angle: 45, date: Date.now()});

			var enemyInf = addEnemyInfantry(520, -20, -90, "Brigade", enemyInfantryID);
			enemyInf.updateCommand({type: commandTypes.move, target: null, x: 520, y: 190, angle: -135, date: Date.now()});
			playerGeneral.updateCommand(null, true);
			activeUnit = undefined;
		};
		this.goals.add(new MoveTargetToLocationGoal('Now move your general to this location!', generalID, {x:205, y:460}, null, 25, {xMin: 0, xMax: 300, yMin: 0, yMax: canvas.height}, spawnUnitCallback, eventOverrides));
		
		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		eventOverrides.addListener('window', "mousedown", null);

		this.goals.add(new DurationGoal('Enemy infantry are arriving from the north, <br>and friendly infantry from the west.', 5000, undefined, eventOverrides));
		this.goals.add(new KeyPressGoal('Hold <Space> a bit to continue.', 32, undefined));
		this.goals.add(new ClickGoal('Pressing <Space> at any point to reveal your general\'s command radius<br>\
			and your infantry\'s battle and skirmish radii. Your units\' flanks and<br>\
			front are also indicated in red and green, respectively.', undefined));
		this.goals.add(new ClickGoal('Combat units will automatically skirmish with enemies within their skirmish radius.<br>\
			Units will fortify themselves while skirmishing or disengaged, as indicated by the<br>triangles at each stationary unit\'s front.', undefined));
		this.goals.add(new ClickGoal('Combat units will lock into battle with enemies within their battle radius.<br>\
			Only ordering the unit to fallback will allow it to disengage.', undefined));

		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);

		this.goals.add(new MoveTargetToLocationGoal('Select your infanty unit and move it into position.', infantryID, {x:250, y:390}, null, 25, {xMin: 0, xMax: 350, yMin: 0, yMax: canvas.height}, undefined, eventOverrides));
		this.goals.add(new ClickGoal('Notice that your general had to issue the order by courier, as your<br>infantry unit was outside of your general\'s command radius.', undefined));
		this.goals.add(new ClickGoal('You can specify a unit\'s angle while issuing an order<br> by holding right click and dragging.', undefined));
		this.goals.add(new MoveTargetToLocationGoal('Move your infantry here and rotate to the angle indicated by the arrow.', infantryID, {x:300, y:350}, {x:0, y:1}, 25, {xMin: 0, xMax: 350, yMin: 0, yMax: canvas.height}, undefined, eventOverrides));
		this.goals.add(new MoveTargetToLocationGoal('Now rotate to face the enemy!', infantryID, {x:300, y:350}, {x:0.79, y:-0.6}, 25, null, undefined, eventOverrides));
		
		var enemyFallBackCallback = function(){
			var enemyInf = enemyInfantryList[enemyInfantryID];
			enemyInf.updateCommand({type: commandTypes.fallback, target: null, x: 560, y: 150, angle: null, date: Date.now()});
		};
		this.goals.add(new SkirmishTargetGoal('Skirmish with the enemy infantry!', infantryID, enemyInfantryID, enemyFallBackCallback, eventOverrides));
		this.goals.add(new BattleTargetGoal('The enemy is falling back! Select your attack move command by pressing<br>\
			<A> and order your infantry to engage the enemy in full-fledged battle!', infantryID, enemyInfantryID, undefined, undefined));
		this.goals.add(new ClickGoal('Congratulations! You completed the first tutorial.', undefined));
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
		addPlayerGeneral(205, 460, 45, 10);
		addEnemyGeneral(650, 150, -135, 10, false);
		addPlayerArtillery(200, 380, 0, "Brigade");
		addEnemyInfantry(520, 190, -135, "Brigade", enemyInfantryID);
	}

	initializeGoals(){
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		this.goals.add(new ClickGoal('Tutorial Two: Courier interception.', undefined));
		this.beginGoals();
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
		addEnemyGeneral(650, 150, -135, 10, false);
	}

	initializeGoals(){
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		this.goals.add(new ClickGoal('Tutorial Three: Artillery and falling back.', undefined));
		this.beginGoals();
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
	copy(otherListenerSet){
		if (otherListenerSet == undefined){
        	return;
    	}
		for (var eventName in otherListenerSet.data){
			this.data[eventName] = otherListenerSet.data[eventName];
		}
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
	playerCombatUnitList[id] = unit;
	playerUnitList[id] = unit;
	unitList[id] = unit;
	return unit;
}

function addPlayerArtillery(x, y, angle, element, overrideID){
	var id = overrideID || getUniqueID(5, unitList);
	var unit = new ArtilleryUnit(x, y, angle, element, armies.blue);
	unit.id = id;
	playerArtilleryList[id] = unit;
	playerCombatUnitList[id] = unit;
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

function addEnemyInfantry(x, y, angle, element, overrideID){
	var id = overrideID || getUniqueID(5, unitList);
	var unit = new InfantryUnit(x, y, angle, element, armies.red);
	unit.id = id;
	enemyInfantryList[id] = unit;
	enemyCombatUnitList[id] = unit;
	enemyUnitList[id] = unit;
	unitList[id] = unit;
	return unit;
}

function addEnemyArtillery(x, y, angle, element, overrideID){
	var id = overrideID || getUniqueID(5, unitList);
	var unit = new ArtilleryUnit(x, y, angle, element, armies.red);
	unit.id = id;
	enemyArtilleryList[id] = unit;
	enemyCombatUnitList[id] = unit;
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

function terminateUnit(id, unitType, army){
	if (army == armies.blue){
		switch (unitType){
			case unitTypes.infantry:
				delete playerInfantryList[id];
				delete playerCombatUnitList[id];
				break;
			case unitTypes.artillery:
				delete playerArtilleryList[id];
				delete playerCombatUnitList[id];
				break;
			case unitTypes.courier:
				delete playerCourierList[id];
				break;
			default:
				throw "Unexpected unit type"
				break;
		}
		delete playerUnitList[id];
	}
	else{
		switch (unitType){
			case unitTypes.infantry:
				delete enemyInfantryList[id];
				delete enemyCombatUnitList[id];
				break;
			case unitTypes.artillery:
				delete enemyArtilleryList[id];
				delete enemyCombatUnitList[id];
				break;
			case unitTypes.courier:
				delete enemyCourierList[id];
				break;
			default:
				throw "Unexpected unit type"
				break;
		}
		delete enemyUnitList[id];
	}
	delete unitList[id];
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

function createArtilleryAnimation(unit, combatTarget, animationTime){
	var id = getUniqueID(5, animationList);
	var anim = new ArtilleryAnimation(id, unit.x, unit.y, 1000/animationTime, 1, unit.id, combatTarget);
	animationList[id] = anim;
}

function createBattleAnimation(unit, combatTargets, animationTime){
	var id = getUniqueID(5, animationList);
	var anim = new BattleAnimation(id, unit.x, unit.y, 1000/animationTime, 1, unit.id, combatTargets);
	animationList[id] = anim;
}

function terminateArtilleryAnimation(id){
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


