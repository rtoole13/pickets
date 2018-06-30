"use strict";

class CollisionEngine{
	constructor(){

	}
	static broadCheck(){
		//Check all
		var unitA, unitB;
		for (var idA in unitList){
			unitA = unitList[idA];

			// Since I'm potentially only checking collision in DEBUG MODE every second or so. I'm only clearing the collision list and 
			// returning the unit to a rerouting == false state here
			unitA.friendlyCollisionList = [];
			unitA.enemyCollisionList = []; 

			unitA.rerouteTargetX = null;
			unitA.rerouteTargetY = null;
			unitA.rerouting = false;

			var friendlyList, enemyList;
			switch(unitA.army){
				case armies.blue:
					friendlyList = playerUnitList;
					enemyList = enemyUnitList;
					break;
				
				case armies.red:
					friendlyList = enemyUnitList;
					enemyList = playerUnitList;
					break;

				default:
					console.log('Nonexistent army.');
					break;
				
			}
			this.checkEnemyCollision(unitA, idA, enemyList);
			
			if (unitA.command == null){
				//General doesn't have a 'command'. Still want to check coll, however
				continue;
			}

			this.checkFriendlyCollision(unitA, idA, friendlyList);
		}

	}
	static checkEnemyCollision(unitA, idA, enemyList){
		//Check unitA against enemies
		for (var idB in enemyList){
			if (unitA.enemyCollisionList.includes(idB)){
				//I think this ought to properly skip over a collision that's already been checked entirely
				continue;
			}

			unitA.enemyCollisionList.push(idB);
			/*
			if (unitA.combatCollisionList.includes(idB) || unitA.skirmishCollisionList.includes(idB)){
				// these units have already collided this frame!
				//NOTE: This really means that collision has already been checked and this pair IS colliding
				continue;
			}
			*/
			var unitB = enemyList[idB];
			var distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
			switch(unitA.command){
				case commandTypes.move:
					this.moveCollisionEnemy(unitA, idA, unitB, idB, distanceSq);
					break;
				
				case commandTypes.attackmove:
					this.attackMoveCollisionEnemy(unitA, idA, unitB, idB, distanceSq);
					break;
				
				case commandTypes.fallback:
					this.fallBackCollisionEnemy(unitA, idA, unitB, idB, distanceSq);
					break;
				default:
					//static units
					this.staticCollisionEnemy(unitA, idA, unitB, idB, distanceSq);
					break;
			}

			switch(unitB.command){
				case commandTypes.move:
					this.moveCollisionEnemy(unitB, idB, unitA, idA, distanceSq);
					break;
				
				case commandTypes.attackmove:
					this.attackMoveCollisionEnemy(unitB, idB, unitA, idA, distanceSq);
					break;
				
				case commandTypes.fallback:
					this.fallBackCollisionEnemy(unitB, idB, unitA, idA, distanceSq);
					break;
				default:
					//static units
					this.staticCollisionEnemy(unitB, idB, unitA, idA, distanceSq);
					break;
			}

		}
		//check lists to determine whether skirmishing or not
		//cannot reset the skirmish flag at engine.broadcheck() call. If that were the case,
		//unit's will always 'enter' skirmish state every frame
		if (!unitA.auxiliaryUnit && unitA.skirmishCollisionList.length < 1){
			unitA.isSkirmishing = false;
		}
		if (!unitB.auxiliaryUnit && unitB.skirmishCollisionList.length < 1){
			unitB.isSkirmishing = false;
		}

	}
	static checkFriendlyCollision(unitA, idA, friendlyList){
		//Check unitA against friendlies.
		for (var idB in friendlyList){
			if (idA == idB){
				continue;
			}
			if (unitA.friendlyCollisionList.includes(idB)){
				// these units have already collided this frame!
				continue;
			}
			var unitB = friendlyList[idB];

			this.collisionDynamicFriendly(unitA, idA, unitB, idB);
		}
	}

	static collisionDynamicFriendly(unitA, idA, unitB, idB){
		var radiusA = unitA.combatRadius;
		var radiusB = unitB.combatRadius;
		
		var distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			distanceSq = getDistanceSq(unitA.targetPosition.x, unitA.targetPosition.y, unitB.x, unitB.y);
			if (unitA.targetSigma > unitA.combatRadius){
				var rad = radiusB - (unitA.targetSigma - unitA.combatRadius);
				if (distanceSq <= (rad * rad)){
					unitA.getNextWaypoint();
				}
			}
			else{
				if(distanceSq <= (unitA.combatRadius * unitA.combatRadius)){
					unitA.getNextWaypoint();
				}
			}

			var relVel, velA, velB;
			if (unitA.targetPosition == null){
				velA = {x: 0, y: 0};
			}
			else {
				velA = {x: Math.abs(unitA.currentSpeed) * (unitA.targetPosition.x - unitA.x) / unitA.targetDistance,
				    	y: Math.abs(unitA.currentSpeed) * (unitA.targetPosition.y - unitA.y) / unitA.targetDistance};
			}
			
			if (unitB.targetPosition == null){
				velB = {x: 0, y: 0};
			}
			else {
				velB = {x: Math.abs(unitA.currentSpeed) * (unitB.targetPosition.x - unitB.x) / unitB.targetDistance,
				    	y: Math.abs(unitA.currentSpeed) * (unitB.targetPosition.y - unitB.y) / unitB.targetDistance};
			}
			relVel = {x: velA.x - velB.x, y: velA.y - velB.y};

			var dX = unitA.x - unitB.x;
			var dY = unitA.y - unitB.y;
			if (dotProduct(dX, dY, relVel.x, relVel.y) >= 0){

				//could potentially grab next waypoint if there's one available?
				//only if there's logic to make sure the path to the next waypoint is clear
			}
			else{
				//We've got a collision. Do things.
				//get normalized normal (pointing from B to A)
				var normal = normalizeVector(dX, dY);
				// get vector perpendicular to norm, in the general direction of A's dir.
				// perpendicular to normal: 1 of 2
				var perp = {x: -1 * normal.y, y: normal.x};
				
				if (dotProduct(unitA.dirX, unitA.dirY, perp.x, perp.y) < 0){
					// perpendicular to normal: 2 of 2
					perp.x = normal.y;
					perp.y = -1 * normal.x;	

				}
				var redirectDir = {x: 0, y: 0};
				if (dotProduct(relVel.x, relVel.y, perp.x, perp.y) < 0){
					// A is to be rerouted in the negative perp direction. 
					// if B is moving too, it gets routed in the perp direction.
					
					redirectDir.x = -1 * perp.x;
					redirectDir.y = -1 * perp.y;
				}
				else{
					// A is to be rerouted in the perp direction.
					// if B is moving too, it gets routed in the negative perp direction.
					redirectDir.x = perp.x;
					redirectDir.y = perp.y;
				}
				
				redirectDir = normalizeVector(redirectDir.x, redirectDir.y);
				
				unitA.rerouteTargetX = unitA.x + unitA.rerouteDistance * redirectDir.x;
				unitA.rerouteTargetY = unitA.y + unitA.rerouteDistance * redirectDir.y;
				
				if (velB.x != 0 && velB.y != 0){
					unitB.rerouteTargetX = unitB.x + unitB.rerouteDistance * -redirectDir.x;
					unitB.rerouteTargetY = unitB.y + unitB.rerouteDistance * -redirectDir.y;
					unitB.rerouting = true;
				}
				unitA.rerouting = true;
				
			}
			unitA.friendlyCollisionList.push(idB);
			unitB.friendlyCollisionList.push(idA);
		}
	}

	static staticCollisionEnemy(unitA, idA, unitB, idB, distanceSq){
		
		if (unitA.auxiliaryUnit && unitB.auxiliaryUnit){
			// No collision between opposing auxiliary units
			return;
		}
		else if (unitA.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitA, idA, unitB, idB, distanceSq);
			return;
		}
		else if (unitB.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitB, idB, unitA, idA, distanceSq);
			return;
		}

		var radiusA = unitA.skirmishRadius;
		var radiusB = unitB.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}
		unitA.skirmishCollisionList.push(idB);
		
		radiusA = unitA.combatRadius;
		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}
		unitA.combatCollisionList.push(idB);
	}

	static moveCollisionEnemy(unitA, idA, unitB, idB, distanceSq){
		// Unit was moving from out of skirmish into it, considering it's a move order. halt the unit in place.
		if (unitA.auxiliaryUnit && unitB.auxiliaryUnit){
			// No collision between opposing auxiliary units
			return;
		}
		else if (unitA.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitA, idA, unitB, idB, distanceSq);
			return;
		}
		else if (unitB.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitB, idB, unitA, idA, distanceSq);
			return;
		}
		var radiusA = unitA.skirmishRadius;
		var radiusB = unitB.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}

		unitA.skirmishCollisionList.push(idB);
		if (unitA.isSkirmishing){
			if (!this.attackMoveCollisionEnemy(unitA, idA, unitB, idB, distanceSq)){
				this.resolveSkirmishCollision(unitA, unitB, idB, true);
			}
		}
		else{
			this.resolveSkirmishCollision(unitA, unitB, idB, false);
		}
		unitA.isSkirmishing = true;
		return true;
		
	}
	static auxiliaryUnitCollision(unitAux, idAux, unitOther, idOther, distanceSq){
		//general collision
		var radiusA = unitAux.combatRadius;
		var radiusB = unitOther.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}

		if (unitAux.unitType == unitTypes.general){
			unitAux.captured = true;
		}
		else if (unitAux.unitType == unitTypes.courier){
			unitAux.reportToGeneral(false);
		}
	}

	static attackMoveCollisionEnemy(unitA, idA, unitB, idB, distanceSq){
		if (unitB.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitB, idB, unitA, idA, distanceSq);
			return;
		}
		var radiusA = unitA.combatRadius;
		var radiusB = unitB.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return false;
		}
		unitA.combatCollisionList.push(idB);
		this.resolveCombatCollision(unitA, unitB, idB);
		return true;
	}

	static resolveSkirmishCollision(unit, otherUnit, otherID, isSkirmishing){
		if (unit.target != null){
			if (unit.target == otherUnit){
				// rotate to otherUnit
				var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);

				unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
				unit.updateCommand(null);
				
			}
			else{
				// don't rotate to otherUnit
			}
		}
		else{
			// no target unit specified
			var targetFinalPosition = (unit.path.length > 0) ? unit.path[unit.path.length - 1] : unit.targetPosition;
			if (getDistanceSq(targetFinalPosition.x, targetFinalPosition.y, unit.x, unit.y) > Math.pow(unit.combatTargetProximityTol, 2)){
			// if not near specified target location, dont rotate to specified orientation
				unit.targetAngleFinal = null;
			}
		}
		if (!isSkirmishing){
			unit.updateCommand(null);
		}
	}

	static resolveCombatCollision(unit, otherUnit, otherID){
		if (unit.inBattle){
			unit.updateCommand(null);
		}
		else{
			var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);
			unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
			unit.updateCommand(null);
		}
	}

	static fallBackCollisionEnemy(unitA, idA, unitB, idB){
		//TODO fallback collision logic
	}

	static pointInCircle(x, y, xt, yt, radius){
		if (getDistanceSq(x, y, xt, yt) < Math.pow(radius,2)){
			return true;
		}
		return false;
	}
}

function getAngleFromDir(dirX, dirY){
	if (dirY >= 0){
		return - Math.acos(dirX) * 180 / Math.PI;	
	}
	else{
		return Math.acos(dirX) * 180 / Math.PI;	
	}
}

function rotateVector(xi, yi, theta, degrees){
	//Rotate a vector by theta (-theta == CW, +theta == CCW)
	//returns a vector (vector.x, vector.y)
	if (degrees){
		theta *= Math.PI/180;
	}
	return {x: xi * Math.cos(theta) - yi * Math.sin(theta), 
			y: xi * Math.sin(theta) + yi * Math.cos(theta)};
}

function getDistanceSq(xi, yi, xf, yf){
	//Get the distance squared between points (xi,yi) and (xf, yf)
	return getVectorMagSq(xf-xi, yf-yi);
}

function getDistance(xi, yi, xf, yf){
	//Get the distance squared between points (xi,yi) and (xf, yf)
	return Math.sqrt(getVectorMagSq(xf-xi, yf-yi));
}

function getVectorMagSq(x, y){
	//Get the magnitude squared of the vector (x,y)
	return Math.pow(x,2) + Math.pow(y,2);
}

function getVectorMag(x, y){
	//Get the magnitude of the vector (x,y)
	return Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
}

function dotProduct(x, y, xt, yt){
	//Calculate the dot product of two vectors, (x,y) and (xt,yt)
	return x*xt + y*yt;
}

function getAngle(x, y, xt, yt, degrees){
	//Get the angle between the two vectors, (x,y) and (xt,yt)
	var angle = Math.acos(dotProduct(x, y, xt, yt)/(getVectorMag(x,y) * getVectorMag(xt,yt)));
	if (degrees){
		return  angle * 180/Math.PI;
	}
	return angle;
}

function normalizeVector(x, y){
	var magnitude = getVectorMag(x, y);
	return {x: x / magnitude, y: y / magnitude};
}

class Timer{
	constructor(duration, repeating){
		this.duration = duration;
		this.repeating = repeating;
	}
	start(){
		this.startTime = Date.now();
	}
	checkTime(){
		if ( Date.now() - this.startTime > this.duration){
			if (this.repeating){
				this.start();
			}
			return true;
		}
		return false;
	}
}