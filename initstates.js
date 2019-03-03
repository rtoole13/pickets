"use strict";

class BoardPreset {
	constructor(){
		this.externalMap = false;
		this.goals = new Queue();
		this.currentGoal = null;
	}
	load(){
		this.addUnits();
	}
	addUnits(){

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

	beginGoals(){
		this.currentGoal = this.goals.remove();
		if (this.currentGoal != null){
			this.currentGoal.initiate();
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

class MainBoard extends BoardPreset{
	constructor(){
		super();
		this.externalMap = true;
		this.initializeGoals();
	}

	addUnits(){
		addPlayerGeneral(100, 350, 0, 5);
		addEnemyGeneral(630, 230, 0, 5, true);
		/*
		addPlayerInfantry(140, 130, 0, "Brigade");
		//addPlayerArtillery(170, 200, 30, "Brigade");
		addEnemyArtillery(255, 110, -180, "Brigade");
		addEnemyInfantry(300, 300, -165, "Brigade");
		*/
		
		//addPlayerInfantry(140, 130, 0, "Brigade");
		addPlayerInfantry(140, 310, 30, "Brigade");
		addPlayerInfantry(200, 310, 30, "Brigade");
		addPlayerInfantry(230, 370, 30, "Brigade");
		
		addPlayerArtillery(90, 280, 30, "Brigade");
		addPlayerArtillery(170, 410, 30, "Brigade");

		addEnemyInfantry(523, 345, -180, "Brigade");
		addEnemyInfantry(500, 175, -165, "Brigade");
		addEnemyInfantry(525, 280, 175, "Brigade");
		//addEnemyInfantry(610, 430, -100, "Brigade");

		addEnemyArtillery(465, 115, -155, "Brigade");
		addEnemyArtillery(600, 395, 178, "Brigade");
		
	}
	initializeGoals(){
		var durationCallback = function(){
			var enemyInfOne, enemyInfTwo, positions, angle;
			positions = getTwoPositionsOffLeftOrTopSide();
			angle = (positions.top)? -90 : 0;

			var enemyInfOne = addEnemyInfantry(positions.x1, positions.y1, angle, "Brigade");
			enemyInfOne.updateCommand({type: commandTypes.attackmove, target: playerGeneral, x: playerGeneral.x, y: playerGeneral.y, angle: null, date: Date.now()});

			var enemyInfTwo = addEnemyInfantry(positions.x2, positions.y2, angle, "Brigade");
			enemyInfTwo.updateCommand({type: commandTypes.attackmove, target: playerGeneral, x: playerGeneral.x, y: playerGeneral.y, angle: null, date: Date.now()});
		}
		this.goals.add(new DurationGoal('Defeat the enemy before reinforcements arrive!', 180000, durationCallback, undefined, true));
		this.goals.add(new DurationGoal('Defeat the enemy before reinforcements arrive!', 180000, durationCallback, undefined, true));
		this.beginGoals();
	}
}

class TutorialBoard extends BoardPreset{
	constructor(){
		super();
		this.undeadUnits = {};
		this.undeadCount = 0;
	}

	load(){
		super.load();
		this.initializeGoals();
	}

	initializeGoals(){
		throw 'Inheriting classes must override \'initializeGoals\'!';
	}

	addToUndead(unitID, isPlayer, healTime, healAmount){
		var entry = {id: unitID, isPlayer : isPlayer, healTimer : new Timer(healTime, true), healAmount: healAmount};
		entry.healTimer.start();
		this.undeadUnits[unitID] = entry;
		this.undeadCount += 1;
	}

	healUnits(){
		for (var id in this.undeadUnits){
			var entry = this.undeadUnits[id];
			if (entry.healTimer.checkTime()){
				var unit = (entry.isPlayer)? playerCombatUnitList[id] : enemyCombatUnitList[id];
				unit.strength += entry.healAmount;
				unit.strength = (unit.strength > unit.maxStrength)? unit.maxStrength : unit.strength;
			}
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
		if (this.undeadCount > 0){
			this.healUnits();
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
			gameBoard.board.addToUndead(infantryID, true, 5000, 100);

			var enemyInf = addEnemyInfantry(520, -20, -90, "Brigade", enemyInfantryID);
			enemyInf.updateCommand({type: commandTypes.move, target: null, x: 520, y: 190, angle: -135, date: Date.now()});
			gameBoard.board.addToUndead(enemyInfantryID, false, 5000, 100);

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
		this.goals.add(new MoveTargetToLocationGoal('Now rotate to face the enemy!', infantryID, {x:300, y:350}, {x:0.79, y:-0.6}, 25, {xMin: 0, xMax: 350, yMin: 0, yMax: canvas.height}, undefined, eventOverrides));
		
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
		var infA, infB, infC, infD, unitB, unitD;
		infA = 'INFA';
		infB = 'INFB';
		infC = 'INFC';
		infD = 'INFD';
		addPlayerGeneral(205, 460, 45, 10);
		addEnemyGeneral(650, 150, -135, 10, false);
		addPlayerInfantry(375, 250, 0, "Brigade", infA);
		unitB = addPlayerInfantry(410, 430, 90, "Brigade", infB);
		addPlayerInfantry(410, 170, 0, "Brigade", infC);
		unitD = addEnemyInfantry(415, 365, -135, "Brigade", infD);
		
		unitB.updateCommand({type: commandTypes.attackmove, target: unitD, x: unitD.x, y: unitD.y, angle: null, date: Date.now()});

		this.addToUndead(infA, true, 3000, 100);
		this.addToUndead(infB, true, 3000, 100);
		this.addToUndead(infC, true, 3000, 100);
		this.addToUndead(infD, false, 3000, 300);
	}

	initializeGoals(){
		var playerInfA, playerInfB, playerInfC, enemyInf, eventOverrides;
		playerInfA = 'INFA';
		playerInfB = 'INFB';
		playerInfC = 'INFC';
		enemyInf = 'INFD';
		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		var enemyFallBackCallback = function(){
			var command = {type: commandTypes.fallback, target: null, x: 455, y: 325, angle: null, date: Date.now()};
			enemyGeneral.canIssueCommand = true;
			enemyGeneral.issueCommand(enemyInf, command);
		};
		this.goals.add(new ClickGoal('Press <R> at any point to restart the current tutorial,<br> or use the arrows to navigate between tutorials.', undefined));
		this.goals.add(new ClickGoal('Tutorial Two: Courier interception.', enemyFallBackCallback));
		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		eventOverrides.addListener('window', "mousedown", null);

		var friendlyInterceptCallback = function(){
			var friendly, command, commandStack, enemy;
			friendly = playerInfantryList[playerInfA];
			command = {type: commandTypes.attackmove, target: null, x: 500, y: 350, angle: null, date: Date.now()};
			playerGeneral.canIssueCommand = true;
			playerGeneral.issueCommand(friendly, command);
			
			friendly = playerInfantryList[playerInfB];
			enemy = enemyInfantryList[enemyInf];
			commandStack = [];
			commandStack.push({type: commandTypes.move, target: null, x: 480, y: 395, angle: null, date: Date.now()});
			commandStack.push({type: commandTypes.move, target: null, x: 500, y: 365, angle: null, date: Date.now()});
			commandStack.push({type: commandTypes.attackmove, target: enemy, x: enemy.x, y: enemy.y, angle: null, date: Date.now()});
			playerGeneral.canIssueCommand = true;
			playerGeneral.issueCommand(friendly, commandStack);

		}
		this.goals.add(new DurationGoal('Seeing your troops to the north, the <br>enemy general is ordering his infantry back.', 5000, friendlyInterceptCallback, eventOverrides));
		this.goals.add(new DurationGoal('Your infantry move to intercept!', 8000, undefined, eventOverrides));
		this.goals.add(new ClickGoal('You can prevent units from receiving orders by capturing couriers.', undefined));
		this.goals.add(new ClickGoal('You can also make a courier\'s job more difficult by blocking its path.', undefined));

		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);

		this.goals.add(new MoveTargetToLocationGoal('Move your idle infanty unit to the indicated position.', playerInfC, {x:540, y:250}, null, 25, {xMin: 400, xMax: canvas.width, yMin: 0, yMax: 275}, undefined, eventOverrides));
		
		var enemyIssueCommand = function() {
			var command = {type: commandTypes.fallback, target: null, x: 300, y: 600, angle: null, date: Date.now()};
			enemyGeneral.canIssueCommand = true;
			enemyGeneral.issueCommand(enemyInf, command);
		}

		this.goals.add(new BattleTargetGoal('Now order that unit to attack the infantry!', playerInfC, enemyInf, enemyIssueCommand, undefined));
		
		eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		eventOverrides.addListener('window', "mousedown", null);

		this.goals.add(new DurationGoal('Note the difficulty the enemy courier <br> faces reaching its target.', 3000, enemyIssueCommand, eventOverrides));
		this.goals.add(new DurationGoal('Note the difficulty the enemy courier <br> faces reaching its target.', 3000, enemyIssueCommand, eventOverrides));
		this.goals.add(new DurationGoal('Even if it manages to deliver it\'s order, <br> capture is likely.', 5000, enemyIssueCommand, eventOverrides));
		this.goals.add(new ClickGoal('Your courier count is displayed to the left of your command buttons.', undefined ));
		this.goals.add(new ClickGoal('Captured couriers are removed from your available pool.', undefined ));
		this.goals.add(new ClickGoal('Whether couriers are able to return or are captured, <br> the available pool replenishes over time.', undefined ));
		this.goals.add(new ClickGoal('Congratulations! You completed the second tutorial.', undefined));
		this.beginGoals();
	}
}

class TutorialThreeBoard extends TutorialBoard {
	constructor(){
		super();
	}

	addUnits(){
		//fallback and artillery tutorial
		//your units nearly surround an enemy unit
		//have a unit reroute to intercept a courier being sent by enemy general
		var infA, infB, infC, infD, infE, infF, artA, artB, unitB, unitC, unitD, unitF, artUnitA, artUnitB;
		infA = 'INFA';
		infB = 'INFB';
		infC = 'INFC';
		infD = 'INFD';
		infE = 'INFE';
		infF = 'INFF';
		artA = 'ARTA';
		artB = 'ARTB';

		addPlayerGeneral(205, 460, 45, 10);
		addPlayerInfantry(240, 380, 45, "Brigade", infA);
		unitB = addPlayerInfantry(330, 360, 45, "Brigade", infB);
		artUnitA = addPlayerArtillery(100, 315, 45, "Brigade", artA);

		addEnemyGeneral(650, 150, -135, 10, false);
		unitC = addEnemyInfantry(335, 235, -115, "Brigade", infC);
		unitD = addEnemyInfantry(435, 285, -135, "Brigade", infD);
		unitF = addEnemyInfantry(445, 395, -170, "Brigade", infF);
		artUnitB = addEnemyArtillery(465, 215, -135, "Brigade", artB);

		this.addToUndead(infA, true, 3000, 200);
		this.addToUndead(infB, true, 3000, 200);
		this.addToUndead(artA, true, 3000, 200);
		this.addToUndead(infC, false, 3000, 300);
		this.addToUndead(infD, false, 3000, 200);
		this.addToUndead(artB, false, 3000, 200);
		
	}

	initializeGoals(){
		this.goals.add(new ClickGoal('Press <R> at any point to restart the current tutorial,<br> or use the arrows to navigate between tutorials.', undefined));
		
		var enemyAttackCallback = function(){
			var enemyC, enemyD, enemyF, enemyArt, friendly, command;
			enemyC = enemyInfantryList['INFC'];
			enemyD = enemyInfantryList['INFD'];
			enemyF = enemyInfantryList['INFF'];
			enemyArt = enemyArtilleryList['ARTB'];
			friendly = playerInfantryList['INFB'];

			command = {type: commandTypes.attackmove, target: friendly, x: friendly.x, y: friendly.y, angle: null, date: Date.now()};
			enemyC.updateCommand(command);
			enemyD.updateCommand(command);
			enemyF.updateCommand(command);
			enemyArt.updateCommand({type: commandTypes.move, target: friendly, x: friendly.x, y: friendly.y, angle: null, date: Date.now()});
		}
		this.goals.add(new ClickGoal('Tutorial Three: Artillery and falling back.', enemyAttackCallback));
		
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressFallbackOnly);
		eventOverrides.addListener('window', "mousedown", null);
		
		this.goals.add(new DurationGoal('The enemy is surrounding your forward infantry!', 4000, undefined, eventOverrides));
		this.goals.add(new ClickGoal('Once engaged in battle, a unit won\'t break off <br> unless ordered to fall back.', undefined));
		
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressFallbackOnly);

		var secondEnemyAttackCallback = function(){
			var enemyC, enemyD, enemyF, enemyArt, friendlyA, friendlyB, commandStack;
			enemyC = enemyInfantryList['INFC'];
			enemyD = enemyInfantryList['INFD'];
			enemyF = enemyInfantryList['INFF'];
			enemyArt = enemyArtilleryList['ARTB'];
			friendlyA = playerInfantryList['INFA'];
			friendlyB = playerInfantryList['INFB'];

			enemyC.updateCommand({type: commandTypes.attackmove, target: friendlyA, x: friendlyA.x, y: friendlyA.y, angle: null, date: Date.now()});
			enemyD.updateCommand({type: commandTypes.attackmove, target: friendlyB, x: friendlyB.x, y: friendlyB.y, angle: null, date: Date.now()});
			
			commandStack = [];
			commandStack.push({type: commandTypes.attackmove, target: null, x: 320, y: 450, angle: null, date: Date.now()});
			commandStack.push({type: commandTypes.attackmove, target: friendlyB, x: friendlyB.x, y: friendlyB.y, angle: null, date: Date.now()});
			enemyF.updateCommand(commandStack);

			enemyArt.updateCommand({type: commandTypes.attackmove, target: friendlyB, x: friendlyB.x, y: friendlyB.y, angle: null, date: Date.now()});

		}
		this.goals.add(new MoveTargetToLocationGoal('Order your infantry to fall back.', 'INFB', {x:280, y:420}, null, 25, {xMin: 0, xMax: 350, yMin: 330, yMax: canvas.height}, secondEnemyAttackCallback, eventOverrides));
		this.goals.add(new ClickGoal('You can see artillery ranges by holding <Space>.', undefined));
		this.goals.add(new ClickGoal('Targets in the yellow section may be targeting with sphere shot, <br> and targets in the red with cannister shot.', undefined));
		this.goals.add(new ClickGoal('Cannister shot can be fired at a faster rate and deals more damage.', undefined));
		this.goals.add(new ClickGoal('If a friendly unit is blocking a direct line to the enemy, <br> cannister shot can\'t be used.', undefined));
		this.goals.add(new ClickGoal('Despite being in cannister range now, the enemy artillery must <br> fire over its allies with sphere shot.', undefined));
		
		var eventOverrides = new CustomEventListenerSet();
		eventOverrides.addListener('window', "keydown", handleKeyPressMoveOnly);
		this.goals.add(new MoveTargetToLocationGoal('Position your artillery to fire on the enemy\'s flank.', 'ARTA', {x:170, y:245}, {x:0.5, y:0.5}, 25, null, undefined, eventOverrides));
		this.goals.add(new ClickGoal('Artillery will automatically fire on enemies in range.', undefined));
		this.goals.add(new ClickGoal('Furthermore, maximum damage is dealt when firing on a flank.', undefined));

		this.goals.add(new BattleTargetGoal('Order your artillery into cannister range by issuing an attack order!', 'ARTA', 'INFC', undefined, undefined));
		this.goals.add(new ClickGoal('Your artillery\'s now dealing tremendous damage by both hitting <br> the enemy\'s flank and by using cannister shot.', undefined));
		this.goals.add(new ClickGoal('Congratulations! You completed the third tutorial.', undefined));
		this.beginGoals();
	}
}

//Class to clean up passing event listeners to be enabled/disabled to the goals.
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
		if (activeUnit != null && activeUnit != undefined && activeUnit.id == id){
			activeUnit = undefined;
		}
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


