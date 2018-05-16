"use strict";

class Pathfinder{
	constructor(){}
	static findPath(startX, startY, targetX, targetY, currentUnit, ignoreList){
		var wayPoints = [];
		var pathSuccess = false;
		var openSet = [];
		var closedSet = [];
		var startNode, targetNode;
		gameBoard.grid.update(currentUnit, ignoreList);
		startNode = gameBoard.grid.getNodeFromLocation(startX, startY);
		targetNode = gameBoard.grid.getNodeFromLocation(targetX, targetY);
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
			wayPoints = this.retracePath(startNode, targetNode, targetX, targetY);
			gameBoard.grid.path = wayPoints;
		}
		return wayPoints;
	}
	static retracePath(startNode, endNode, targetX, targetY){
		var path = [];
		var currentNode = endNode;
		while (currentNode != startNode){
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		//path.push(startNode);
		path.reverse();
		gameBoard.grid.pathOrig = path;
		path = this.simplifyPath(path, targetX, targetY);
		return path;
	}

	static getDirection(currentNode, targetNode){
		return {x: targetNode.indX - currentNode.indX, y: targetNode.indY - currentNode.indY};
	}

	static simplifyPath(path, targetX, targetY){
		var waypoints = [];
		var oldDirection = {x: 0, y: 0};
		var newDirection;
		for (var i = 1; i < path.length - 1; i++){
			newDirection = this.getDirection(path[i - 1], path[i]);
			if ((newDirection.x - oldDirection.x != 0) || (newDirection.y - oldDirection.y != 0)){
				waypoints.push({x:path[i-1].x, y:path[i-1].y});
			}
			
			
			oldDirection = newDirection;
		}
		waypoints.push({x: targetX, y: targetY});
		return waypoints;
	}

	static getDistance(nodeA, nodeB){
		var xDist, yDist;
		xDist = Math.abs(nodeB.indX - nodeA.indX);
		yDist = Math.abs(nodeB.indY - nodeA.indY);

		if (xDist > yDist){
			return 12 * yDist + 10 * (xDist - yDist);
		}
		else{
			return 12 * xDist + 10 * (yDist - xDist);	
		}
	}

}

class Grid{
	constructor(rows, columns, width, height){
		this.rows = rows;
		this.columns = columns;
		this.width = width;
		this.height = height;

		this.gridSpacing = {x:null, y:null};
		this.minDim = null;
		this.elem = [];
		this.initializeNodes();

		this.path = null;
	}

	initializeNodes(){

		this.gridSpacing.x = canvas.width / this.columns;
		this.gridSpacing.y = canvas.height / this.rows;

		if (this.gridSpacing.x < this.gridSpacing.y){
			this.minDim = this.gridSpacing.x;
		}
		else{
			this.minDim = this.gridSpacing.y;
		}

		for (var i = 0; i < this.columns; i++){
			var xLoc = this.gridSpacing.x/2 + this.gridSpacing.x * i;
			var rowArray = [];
			for (var j = 0; j < this.rows; j++){
				var yLoc = this.gridSpacing.y / 2 + this.gridSpacing.y * j;
				rowArray.push(new GridNode(xLoc, yLoc, this.gridSpacing.x, this.gridSpacing.y, i, j, true));
			}
			this.elem.push(rowArray);
		}
	}

	update(currentUnit, ignoreList){
		this.reset();
		
		//Doing a basic point in circle collision check temporarily.
		for (var id in unitList){
			var unit = unitList[id];
			if (unit == currentUnit || inArray(unit, ignoreList) || unit.unitType == unitTypes.courier || unit.army != currentUnit.army){
				continue;
			}
			//NOTE: This line adds only  static units in unit's army the impassable list. Removing at the moment for debug purposes
			//if (unit.command != null) continue;
			continue;
			for (var i = 0; i < this.columns; i++){
				for (var j = 0; j < this.rows; j++){
					var elem = this.elem[i][j];

					if (CollisionEngine.pointInCircle(elem.x, elem.y, unit.x, unit.y, 2 * this.minDim + unit.rerouteDistance)){
						elem.walkable = false;
					}
				}
			}
		}
	}

	reset(){
		for (var i = 0; i < this.columns; i++){
			for (var j = 0; j < this.rows; j++){
				this.elem[i][j].walkable = true;
			}
		}
	}

	getNeighbors(node){
		var neighbors = [];
		for (var i = -1; i <= 1; i++){
			for (var j = -1; j <= 1; j++){
				if (i == 0 && j == 0){
					continue;
				}
				var checkX = node.indX + i;
				var checkY = node.indY + j;

				if (checkX >= 0 && checkX < this.columns && checkY >= 0 && checkY < this.rows){
					neighbors.push(this.elem[checkX][checkY]);
				}
			}	
		}
		return neighbors;
	}

	getNodeFromLocation(x, y){
		var i,j;
		i = Math.floor(x / this.gridSpacing.x);
		j = Math.floor(y / this.gridSpacing.y);
		return this.elem[i][j];
	}
}
class GridNode{
	constructor(x, y, width, height, indX, indY, walkable){
		this.x = x;
		this.y = y;
		this.indX = indX;
		this.indY = indY;

		this.width = width;
		this.height = height;
		this.walkable = walkable;

		this.parent = null;
		this.gcost = 0;
		this.hcost = 0;

		//Might add a bool to distinguish a point occupied by a map feature or unit
	}

	fcost(){
		return gcost + hcost;
	}
}

function getAdjacentNodeFromAngle(currentNode, dirX, dirY){
	// NOTE: Not entirely accurate. If you're in the upper right corner of a particular node, a wider range of angles would point towards
	// the top, right, and top-right nodes
	

}