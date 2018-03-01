"use strict";

class Pathfinder{
	constructor(){}
	static findPath(startNode, targetNode){
		var wayPoints = [];
		var pathSuccess = false;
		var openSet = [];
		var closedSet = [];
		openSet.push(startNode);
		
		while (openSet.length > 0){
			var currentNode = openSet[0];
			for (var i = 1; i < openSet.count; i++){
				if (openSet[i].fcost < currentNode.fcost || openSet[i].fcost == currentNode.fcost && openSet[i].hcost < currentNode.hcost){
					currentNode = openSet[i];
				}
			}
			closedSet.push(currentNode);
			openSet.splice(openSet.indexOf(currentNode), 1);
			
			if (currentNode == targetNode){
				pathSuccess = true;
				break;
			}
			var neighbors = gameBoard.grid.getNeighbors(currentNode);
			for (var j = 0; j < neighbors.length; j++){
				var neighbor = neighbors[j];
				if (!neighbor.walkable || inArray(neighbor, closedSet)){
					continue;
				}
				var newMovementCostToNeighbor = currentNode.gcost + this.getDistance(currentNode, neighbor);
				if (newMovementCostToNeighbor < neighbor.gcost || !inArray(neighbor, openSet)){
					neighbor.gcost = newMovementCostToNeighbor;
					neighbor.hcost = this.getDistance(neighbor, targetNode);
					neighbor.parent = currentNode;

					if (!inArray(neighbor, openSet)){
						openSet.push(neighbor);
					}
				}
			}
		}
		if (pathSuccess){
			wayPoints = this.retracePath(startNode, targetNode);
			gameBoard.grid.path = wayPoints;
		}
	}
	static retracePath(startNode, endNode){
		var path = [];
		var currentNode = endNode;
		while (currentNode != startNode){
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		//path.push(startNode);
		path.reverse();

		return path;
	}

	static getDirection(){

	}

	static simplifyPath(){

	}

	static getDistance(nodeA, nodeB){
		var xDist, yDist;
		xDist = Math.abs(nodeB.indX - nodeA.indX);
		yDist = Math.abs(nodeB.indY - nodeA.indY);

		if (xDist > yDist){
			return 14 * yDist + 10 * (xDist - yDist);
		}
		else{
			return 14 * xDist + 10 * (yDist - xDist);	
		}
	}

}