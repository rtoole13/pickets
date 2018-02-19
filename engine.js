"use strict";

class CollisionEngine{
	constructor(){

	}
	static broadCheck(){
		//Check all
		var unitA, unitB;
		for (var idA in unitList){
			unitA = unitList[idA];
			for (var idB in unitList){
				if (idB == idA){
					//Pointing towards self
					continue;
				}
				unitB = unitList[idB];
				this.checkCollision(unitA, unitB); //calling a static method from a static method w/ 'this'
			}
		}

	}
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

}

function pointInCircle(x, y, xt, yt, radius){
		if (getDistanceSq(x, y, xt, yt) <= Math.pow(radius,2)){
			return true;
		}
		return false;
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