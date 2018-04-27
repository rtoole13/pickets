"use strict";

class CollisionEngine{
	constructor(){

	}
	static broadCheck(){
		//Check all
		var unitA, unitB;
		for (var idA in unitList){
			unitA = unitList[idA];
			if (unitA.command == null){
				continue;
			}
			var friendlyList, enemyList;
			switch(unitA.army){
				case armies.blue:{
					friendlyList = playerUnitList;
					enemyList = enemyUnitList;
					break;
				}
				case armies.red:{
					friendlyList = enemyUnitList;
					enemyList = playerUnitList;
					break;
				}
				default:{
					console.log('Nonexistent army.');
					break;
				}
			}
			this.checkEnemyCollision(unitA, idA, enemyList);
			this.checkFriendlyCollision(unitA, idA, friendlyList);
		}

	}
	static checkEnemyCollision(unitA, idA, enemyList){
		//Check unitA against enemies
		for (var idB in enemyList){
			if (idA == idB){
				continue;
			}
			var unitB = enemyList[idB];

			switch(unitA.command){
				case commandTypes.move:{
					this.moveCollisionEnemy(unitA, unitB);
					break;
				}
				case commandTypes.attackmove:{
					this.attackMoveCollisionEnemy(unitA, unitB);
					break;
				}
				case commandTypes.fallback:{
					
					break;
				}
			}
		}

	}
	static checkFriendlyCollision(unitA, idA, friendlyList){
		//Check unitA against friendlies.
		for (var idB in friendlyList){
			if (idA == idB){
				continue;
			}
			var unitB = friendlyList[idB];
			if (unitA.command == null){
				this.collisionStaticFriendly(unitA, unitB);
			}
			else{
				this.collisionDynamicFriendly(unitA, unitB);
			}
		}
	}
	static collisionStaticFriendly(unitA, unitB){
		var radiusA = unitA.combatRadius;
		var radiusB = unitB.combatRadius;
		var distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			//Whether to handle both A and B's coll? Or just As
			console.log('collision with static friendy');
		}
	}

	static collisionDynamicFriendly(unitA, unitB){
		var radiusA = unitA.combatRadius;
		var radiusB = unitB.combatRadius;
		var distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
		
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			//Whether to handle both A and B's coll? Or just As
			
		}
	}

	static moveCollisionEnemy(unitA, unitB){
		
	}

	static attackMoveCollisionEnemy(unitA, unitB){
		var radiusA = unitA.combatRadius;
		var radiusB = unitB.combatRadius;
		var distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
		
		if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
			//Whether to handle both A and B's coll? Or just As
			console.log('attack move collision with enemy');
		}
	}
	/*
	static checkCollision(unitA, unitB){
		if (unitA.state == unitStates.marching || unitB.state == unitStates.marching){
			var radiusA, radiusB, distanceSq, friendly = false;
			if (unitA.army == unitB.army){
				//Friendly
				radiusA = unitA.combatRadius;
				radiusB = unitB.combatRadius;
				friendly = true;
			}
			else{
				//Enemy
				radiusA = unitA.skirmishRadius;
				radiusB = unitB.skirmishRadius;
			}
			distanceSq = getDistanceSq(unitA.x, unitA.y, unitB.x, unitB.y);
			if (distanceSq <= Math.pow(radiusA + radiusB, 2)){
				unitA.handleHit(unitB, distanceSq, friendly);
				unitB.handleHit(unitA, distanceSq, friendly);
			}
		}
	}
	*/
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