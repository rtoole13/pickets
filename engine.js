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
			
			if ((unitA.command == null) || (unitA.unitType == unitTypes.courier)){
				continue;
			}
			//Note: Because of the way the collision is checked, cant populate AI's nearby friendlies
			this.checkFriendlyCollision(unitA, idA, friendlyList);
		}

	}

	static checkEnemyCollision(unitA, idA, enemyList){
		//Check unitA against enemies
		for (var idB in enemyList){
			var unitB = enemyList[idB];
			if (unitB.enemyCollisionList.includes(idA)){
				//I think this ought to properly skip over a collision that's already been checked entirely
				continue;
			}
			
			unitA.enemyCollisionList.push(idB);

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
		if (!unitA.auxiliaryUnit){
			if (unitA.unitType == unitTypes.artillery){
				if (unitA.cannisterCollisionList.length < 1){
					unitA.isSkirmishing = false;
				}
			}
			else{
				if (unitA.skirmishCollisionList.length < 1){
					unitA.isSkirmishing = false;
				}
			}
		}
	}

	static artilleryCheckEnemies(){

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

			if (unitB.unitType == unitTypes.courier){
				continue;
			}
			this.collisionDynamicFriendly(unitA, idA, unitB, idB);
		}
	}

	static collisionDynamicFriendly(unitA, idA, unitB, idB){
		var radiusA, radiusB, distanceSq;
		
		radiusA = unitA.combatRadius;
		radiusB = unitB.combatRadius;
		distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			if (unitA.targetPosition != null){
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
				
				if (dotProduct(velA.x, velA.y, velB.x, velB.y) > 0){
					//units are heading in the same direction.
					if (dotProduct(velA.x, velA.y, normal.x, normal.y) < 0){
						//unitA is behind unitB
						unitA.rerouteTargetX = unitA.x + unitA.rerouteDistance * redirectDir.x;
						unitA.rerouteTargetY = unitA.y + unitA.rerouteDistance * redirectDir.y;
						unitA.rerouting = true;
					}
					else{
						//unitB is behind unitA
						if (velB.x != 0 && velB.y != 0){
							unitB.rerouteTargetX = unitB.x + unitB.rerouteDistance * -redirectDir.x;
							unitB.rerouteTargetY = unitB.y + unitB.rerouteDistance * -redirectDir.y;
							unitB.rerouting = true;
						}
					}
				}
				else{
					unitA.rerouteTargetX = unitA.x + unitA.rerouteDistance * redirectDir.x;
					unitA.rerouteTargetY = unitA.y + unitA.rerouteDistance * redirectDir.y;
					
					if (velB.x != 0 && velB.y != 0){
						unitB.rerouteTargetX = unitB.x + unitB.rerouteDistance * -redirectDir.x;
						unitB.rerouteTargetY = unitB.y + unitB.rerouteDistance * -redirectDir.y;
						unitB.rerouting = true;
					}
					unitA.rerouting = true;
				}
				
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

		switch (unitA.unitType){
			case unitTypes.artillery:
				return this.staticCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq);
			default:
				return this.staticCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq);
		}
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

		switch (unitA.unitType){
			case unitTypes.artillery:
				return this.moveCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq);
			default:
				return this.moveCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq);
		}
	}

	static attackMoveCollisionEnemy(unitA, idA, unitB, idB, distanceSq){
		if (unitB.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitB, idB, unitA, idA, distanceSq);
			return;
		}

		switch (unitA.unitType){
			case unitTypes.artillery:
				return this.attackMoveCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq);
			default:
				return this.attackMoveCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq);
		}
	}

	static staticCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq){
		var radiusA = unitA.skirmishRadius;
		var radiusB = unitB.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}
		unitA.isSkirmishing = true;
		unitA.skirmishCollisionList.push(idB);

		radiusA = unitA.combatRadius;
		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return;
		}
		unitA.combatCollisionList.push(idB);
	}

	static moveCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq){
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

	static attackMoveCollisionDefaultEnemy(unitA, idA, unitB, idB, distanceSq){
		var radiusA = unitA.combatRadius;
		var radiusB = (unitB.unitType == unitTypes.artillery)? unitB.smallArmsRadius : unitB.combatRadius;

		if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
			return false;
		}
		unitA.combatCollisionList.push(idB);
		this.resolveCombatCollision(unitA, unitB, idB);
		return true;
	}

	static staticCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq){
		if (distanceSq > unitA.sphereShotRadiusSq){
			return;
		}
		else{
			if (distanceSq <= unitA.cannisterRadiusSq){
				unitA.cannisterCollisionList.push(idB);
				unitA.isSkirmishing = true;

				var radiusA = unitA.smallArmsRadius;
				var radiusB = (unitB.unitType == unitTypes.artillery)? unitB.smallArmsRadius : unitB.combatRadius;
				if (distanceSq >= Math.pow(radiusA + radiusB, 2)){
					return;
				}
				unitA.combatCollisionList.push(idB);
			}
			else{
				unitA.sphereShotCollisionList.push(idB);
			}
		}

	}

	static moveCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq){
		if (distanceSq > unitA.sphereShotRadiusSq){
			return;
		}
		
		if (distanceSq <= unitA.cannisterRadiusSq){
			unitA.cannisterCollisionList.push(idB);
			if (unitA.isSkirmishing){
				if (!this.attackMoveCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq)){
					this.resolveArtilleryMoveCollision(unitA, unitB, idB, true, true);
				}
			}
			else{
				this.resolveArtilleryMoveCollision(unitA, unitB, idB, true, false);
			}
			unitA.isSkirmishing = true;
		}
		else{
			unitA.sphereShotCollisionList.push(idB);
			this.resolveArtilleryMoveCollision(unitA, unitB, idB, false, false);
		}
	}

	static attackMoveCollisionArtilleryEnemy(unitA, idA, unitB, idB, distanceSq){
		if (unitB.auxiliaryUnit){
			this.auxiliaryUnitCollision(unitB, idB, unitA, idA, distanceSq);
			return;
		}
		if (distanceSq > unitA.sphereShotRadiusSq){
			return false;
		}
		var radiusA = unitA.smallArmsRadius;
		var radiusB = (unitB.unitType == unitTypes.artillery)? unitB.smallArmsRadius : unitB.combatRadius;
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			unitA.cannisterCollisionList.push(idB);
			unitA.combatCollisionList.push(idB);
			return this.resolveArtilleryCombatCollision(unitA, unitB, idB, true);
		}
		else if (distanceSq <= unitA.cannisterRadiusSq){
			unitA.cannisterCollisionList.push(idB);
			return this.resolveArtilleryCombatCollision(unitA, unitB, idB, false);
		}
		else{
			unitA.sphereShotCollisionList.push(idB);
			return false;
		}
		
	}

	static auxiliaryUnitCollision(unitAux, idAux, unitOther, idOther, distanceSq){
		//general collision
		var radiusA, radiusB;
		if (unitAux.unitType == unitTypes.general && unitAux.AIcontrolled){
			radiusA = unitAux.flightRadius;
			radiusB = unitOther.combatRadius;

			if (distanceSq <= Math.pow(radiusA + radiusB, 2) && !unitOther.inBattle){
				unitAux.nearbyEnemies.push(idOther);
			}
		}

		radiusA = unitAux.combatRadius;
		radiusB = unitOther.courierCaptureRadius;

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

	static resolveSkirmishCollision(unit, otherUnit, otherID, isSkirmishing){
		if (unit.target != null){
			if (unit.target == otherUnit){
				// rotate to otherUnit
				var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);

				unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
				unit.updateCommand(null, true);
				
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
			unit.updateCommand(null, true);
		}
	}

	static resolveCombatCollision(unit, otherUnit, otherID){
		if (!unit.inBattle){
			var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);
			unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
		}
		unit.updateCommand(null, true);
	}

	static fallBackCollisionEnemy(unitA, idA, unitB, idB, distanceSq){
		//TODO fallback collision logic
		// if unitB is in front of unitA, do nothing.
		if (dotProduct(unitA.dirX, unitA.dirY, unitB.x - unitA.x, unitB.y - unitB.y) > 0){
			return;
		}
		else{
			this.attackMoveCollisionEnemy(unitA, idA, unitB, idB, distanceSq);
		}
	}

	static resolveArtilleryMoveCollision(unit, otherUnit, otherID, inCannisterRange, isSkirmishing){
		if (isSkirmishing){
			if (unit.target != null){
				if (unit.target == otherUnit){
					//rotate to target
					var dir, angle;
					dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);
					angle = getAngle(dir.x, dir.y, unit.dirX, unit.dirY, true);
					if (angle > unit.firingAngleRange){
						//not in cone, rotate
						unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
					}
					unit.firingTarget = unit.target;
					unit.updateCommand(null, true);
				}
				else{
					//do nothing
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
		}
		else{
			if (inCannisterRange){
				// no target unit specified
				var targetFinalPosition = (unit.path.length > 0) ? unit.path[unit.path.length - 1] : unit.targetPosition;
				if (getDistanceSq(targetFinalPosition.x, targetFinalPosition.y, unit.x, unit.y) > Math.pow(unit.combatTargetProximityTol, 2)){
					// if not near specified target location, dont rotate to specified orientation
					// rotate to enemy in cannister range
					var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);
					unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
				}
				unit.updateCommand(null, true);
			}
			else{
				if (unit.target != null){

					if (unit.target == otherUnit){
						//rotate to target
						var dir, angle;
						dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);
						angle = getAngle(dir.x, dir.y, unit.dirX, unit.dirY, true);
						if (angle > unit.firingAngleRange){
							//not in cone, rotate
							unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
						}
						unit.firingTarget = unit.target;
						unit.updateCommand(null, true);
					}
					else{
						//do nothing
					}
				}
			}
		}
	}

	static resolveArtilleryCombatCollision(unit, otherUnit, otherID, inSmallArmsRange){
		if (inSmallArmsRange){
			this.resolveCombatCollision(unit, otherUnit, otherID);
			return true;
		}
		if (unit.target != null){
			if (unit.target == otherUnit){
				// rotate to otherUnit
				var dir = normalizeVector(otherUnit.x - unit.x, otherUnit.y - unit.y);

				unit.targetAngleFinal = getAngleFromDir(dir.x, dir.y);
				unit.firingTarget = unit.target;
				unit.updateCommand(null, true);
				return true;
			}
			else{
				// do nothing
			}
		}
		return false;
	}

	static pointInCircle(x, y, xt, yt, radius){
		if (getDistanceSq(x, y, xt, yt) < Math.pow(radius,2)){
			return true;
		}
		return false;
	}

	static pointInAABB(x, y, xMin, xMax, yMin, yMax){
		if ((x >= xMin) && (x <= xMax)){
			if ((y >= yMin) && (y <= yMax)){
				return true;
			}	
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

function getAngleFromNormalizedDir(dirX, dirY){
	var dir = normalizeVector(dirX, dirY);
	return getAngleFromDir(dir.x, dir.y);
}
function getDirFromAngle(angle){
	return {x: Math.cos((angle) * Math.PI/180), y: - Math.sin((angle) * Math.PI/180)};
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

function getCentroid(ids, unitDict){
	//given a list of ids and a dictionary, find center of mass
	var centerX = 0;
    var centerY = 0;
    for (var i = 0; i < ids.length; i++){
        var unit = unitDict[ids[i]];
        centerX += unit.x;
        centerY += unit.y;
    }
    centerX /= ids.length;
    centerY /= ids.length;

    return {x: centerX, y: centerY}
}

function getCentroidAndClosest(x, y, ids, unitDict){
	//given a list of ids and a dictionary, find center of mass and the 
	//unit nearest to (x,y) and it's distance to (x,y)
	var closestDistSq = Infinity;
	var closestUnit;
	var centerX = 0;
    var centerY = 0;
    for (var i = 0; i < ids.length; i++){
        var unit = unitDict[ids[i]];
        var distSq = getDistanceSq(x, y, unit.x, unit.y);
        if (distSq < closestDistSq){
        	closestDistSq = distSq;
        	closestUnit = unit;
        }
        centerX += unit.x;
        centerY += unit.y;

    }
    centerX /= ids.length;
    centerY /= ids.length;

    return {centerX: centerX, centerY: centerY, centroidDist: getDistance(x, y, centerX, centerY), 
    	    closestUnit: closestUnit, closestDist: Math.sqrt(closestDistSq)}
}

function vectorProjection(xA, yA, xB, yB, segment){
	//Project vector (xA, yA) onto vector (xB, yB)
	//if segment == true, return null if the projection is negative
	//or greater than the magnitude of (xB, yB)
	var projMagAB, aDotB, magB;
	aDotB = dotProduct(xA, yA, xB, yB);
	magB = getVectorMag(xB, yB);
	projMagAB = aDotB / magB;
	if (segment){
		if ((aDotB < 0) || (projMagAB > magB)){
			return null;
		}	
	} 
	return {x: projMagAB * xB / magB, y: projMagAB * yB / magB}
}

function vectorRejection(xA, yA, xB, yB, segment){
	//Project vector (xA, yA) onto vector (xB, yB), get rejection
	//if segment == true, return null if the rejection is not on
	//segment defined by (xB, yB)
	var projAB = vectorProjection(xA, yA, xB, yB, segment);
	if (projAB == null){
		return null;
	}
	return {x: xA - projAB.x, y: yA - projAB.y};
}

function getClosestUnitToPosition(x, y, idList, ignoreList){
	//Given a list of unit ids, idlist, find the one closest to the
	//point (x,y). If none between, return null
	//ignore any ids in the ignore list
	var id, unit, distSq, closestID, closestDistSq;
	
	closestID = null;
	closestDistSq = Infinity;
	for (var i = 0; i < idList.length; i++){
		id = idList[i];
		if (ignoreList.includes(id)){
			continue;
		}
		unit = unitList[id];
		distSq = getDistanceSq(x, y, unit.x, unit.y);
		if (distSq < closestDistSq){
			closestDistSq = distSq;
			closestID = id;
		}
	}
	return closestID;
}

function unitsInDictNearToPosition(x, y, targetDistanceSq, unitDict, ignoreList){
	//Given a unit dict, position, and distanceSq value, return number of units in the dict
	//within specified distance from point
	var id, unit, distSq, unitCount = 0;
	
	for (var id in unitDict){
		if (ignoreList.includes(id)){
			continue;
		}
		unit = unitDict[id];
		distSq = getDistanceSq(x, y, unit.x, unit.y);
		if (distSq <= targetDistanceSq){
			unitCount += 1;
		}
	}
	return unitCount;

}
function getMidpoint(xA, yA, xB, yB){
	return {x: xA + ((xB - xA) / 2), y: yA + ((yB - yA) / 2)}
}

function positionOutOfBounds(x, y){
	if (x < 0 || x > canvas.width || y < 0 || y > canvas.height){
		return true;
	}
	return false;
}
function positionCloseToEdge(x, y, buffer){
	if (x < buffer || x > (canvas.width - buffer) || y < buffer || y > (canvas.height - buffer)){
		return true;
	}
	return false;
}

function anyAlongRay(xA, yA, xB, yB, unitDict, ignoreList, thisUnit){
	//Give a ray origin (xA, yA) and terminating location (xB, yB),
	//return true if any on ray, else false.
	//ignore ids in ignoreList
	//if thisUnit provided, check perpDist against unit.combatRadius + thisUnit.combatRadius

	var id, unit, vecA, vecB, perpA, perpDist, perpLimit;
	vecB = {x: xB - xA, y: yB - yA};
	for (var id in unitDict){
		if (ignoreList.includes(id)){
			continue;
		}
		unit = unitDict[id];
		vecA = {x: unit.x - xA, y: unit.y - yA};

		perpA = vectorRejection(vecA.x, vecA.y, vecB.x, vecB.y, true);
		if (perpA == null){
			continue;
		}
		perpDist = getVectorMag(perpA.x, perpA.y);
		
		if (thisUnit != undefined){
			perpLimit = thisUnit.combatRadius + unit.combatRadius;
		}
		else{
			perpLimit = unit.combatRadius;
		}
		if (perpDist < perpLimit){
			return true;
		}
	}
	return false;
}
function rayCastSegment(xA, yA, xB, yB, pathWidth, idList, unitDict, returnAll){
	//Give a ray origin (xA, yA) and terminating location (xB, yB),
	//return the first id along that path (to within pathWidth), else null.
	var id, unit, vecA, vecB, perpA, closestDist;
	vecB = {x: xB - xA, y: yB - yA};
	if (returnAll){
		var allColliders = [];
		for (var i = 0; i < idList.length; i++){
			id = idList[i];
			unit = unitDict[id];
			if (unit == undefined){
				continue;
			}
			vecA = {x: unit.x - xA, y: unit.y - yA};

			perpA = vectorRejection(vecA.x, vecA.y, vecB.x, vecB.y, true);
			if (perpA == null){
				continue;
			}
			var perpDist = getVectorMag(perpA.x, perpA.y);
			if (perpDist < (unit.combatRadius + (pathWidth / 2))){
				allColliders.push[id];
			}
		}
		allColliders = sortListByDistToPoint(xA, yA, allColliders, unitDict);
		return allColliders;
	}
	else{
		var closestID;
		closestID = null;
		closestDist = Infinity;
		for (var i = 0; i < idList.length; i++){
			id = idList[i];
			unit = unitList[id];
			if (unit == undefined){
				continue;
			}
			vecA = {x: unit.x - xA, y: unit.y - yA};

			perpA = vectorRejection(vecA.x, vecA.y, vecB.x, vecB.y, true);
			if (perpA == null){
				continue;
			}
			var perpDist = getVectorMag(perpA.x, perpA.y);
			if (perpDist < (unit.combatRadius + (pathWidth / 2))){
				if (perpDist < closestDist){
					closestDist = perpDist;
					closestID = id;
				}
			}
		}
		return closestID;
	}
}

function getClosestUnitBetweenPoints(xA, yA, xB, yB, idList, unitDict, ignoreList){
	//Given a list of unit ids, idlist, find the one closest to the
	//path drawn from (xA, yA) to (xB, yB). If none between, return
	//null
	var vecA, vecB, magB, dirB, closestDist, closestID, perpA, id, unit;
	vecB = {x: xB - xA, y: yB - yA};
	magB = getVectorMag(vecB.x, vecB.y);
	dirB = {x: vecB.x / magB, y: vecB.y / magB};

	closestID = null;
	closestDist = Infinity;
	for (var i = 0; i < idList.length; i++){
		id = idList[i];
		if (ignoreList.includes(id)){
			continue;
		}
		unit = unitDict[id];
		vecA = {x: unit.x - xA, y: unit.y - yA};
		
		perpA = vectorRejection(vecA.x, vecA.y, vecB.x, vecB.y, true);
		if (perpA == null){
			continue;
		}
		var perpDist = getVectorMag(perpA.x, perpA.y);
		if (perpDist < closestDist){
			closestDist = perpDist;
			closestID = id;
		}
	}
	return closestID;
}

function sortListByDistFromLine(xA, yA, xB, yB, idList, unitDict){
	//Given a list of unit ids, idlist, sort the list based off of which
	//is closest to the path drawn from (xA, yA) to (xB, yB).
	var vecA, vecB, magB, dirB, perpA, id, unit, distDict;
	vecB = {x: xB - xA, y: yB - yA};
	magB = getVectorMag(vecB.x, vecB.y);
	dirB = {x: vecB.x / magB, y: vecB.y / magB};

	distDict = {};
	for (var i = 0; i < idList.length; i++){
		id = idList[i];
		unit = unitDict[id];
		vecA = {x: unit.x - xA, y: unit.y - yA};
		perpA = vectorRejection(vecA.x, vecA.y, vecB.x, vecB.y, false);

		distDict[id] = getVectorMag(perpA.x, perpA.y);
	}
	return sortDictByValue(distDict);
}

function sortListByDistToPoint(x, y, idList, unitDict){
	//Assuming list of IDs given. Sort by proximity to (x,y)
	//Draw actual units form unitDict
	var unitA, unitB, distSqA, distSqB, sortedList, unsorted = true;
	sortedList = idList;
	if (sortedList.length < 2){
		return sortedList;
	}
	while (unsorted){
		unsorted = false;
		for (var i = 0; i < sortedList.length - 1; i++){
			unitA = unitDict[sortedList[i]];
			unitB = unitDict[sortedList[i + 1]];
			distSqA = getDistanceSq(x, y, unitA.x, unitA.y);
			distSqB = getDistanceSq(x, y, unitB.x, unitB.y);
			if (distSqB < distSqA){
				var temp = sortedList[i+1];
				sortedList[i+1] = sortedList[i];
				sortedList[i] = temp;
				unsorted = true;
			}
		}
	}	
	return sortedList;
}

class Timer{
	constructor(duration, repeating){
		this.duration = duration;
		this.repeating = repeating;
		this.startTime = 0;
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
	shortTimer(){
		this.startTime = -Infinity;
	}
	getElapsedTime(){
		return (Date.now() - this.startTime);
	}
}