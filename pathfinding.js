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
		startNode = gameBoard.grid.getClosestValidNodeFromLocation(startX, startY);
		targetNode = gameBoard.grid.getClosestValidNodeFromLocation(targetX, targetY);
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
				var newMovementCostToNeighbor = currentNode.gcost + this.getDistance(currentNode, neighbor) + neighbor.movementPenalty;
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

	static findRetreatPath(startX, startY, dirX, dirY, currentUnit, ignoreList){
		var targetNode = gameBoard.grid.getWalkableNodeOnNearestSide(startX, startY, dirX, dirY);
		return this.findPath(startX, startY, targetNode.x, targetNode.y, currentUnit, ignoreList);
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
		var xDist, yDist, diagonalCost, straightCost;
		xDist = Math.abs(nodeB.indX - nodeA.indX);
		yDist = Math.abs(nodeB.indY - nodeA.indY);
		
		diagonalCost = 14;
		straightCost = 10;
		if (xDist > yDist){
			return diagonalCost * yDist + straightCost * (xDist - yDist);
		}
		else{
			return diagonalCost * xDist + straightCost * (yDist - xDist);	
		}
	}
	static getRetreatLocationPastClosestSide(x, y){
		var location, side, outOfBounds;
		if (x < 0 || x > canvas.width || y < 0 || y > canvas.height){
			location = null;
			outOfBounds = true;
		}
		else{
			side = gameBoard.grid.getClosestSide(x,y);
			if (side == 'left'){
				location = {x: -100, y: y};
			}
			else if (side == 'right'){
				location = {x: canvas.width + 100, y: y};
			}
			else if (side == 'top'){
				location = {x: x, y: -100};
			}
			else if (side == 'bot'){
				location = {x: x, y: canvas.height + 100};
			}
			else{
				throw 'Invalid side found!'
			}
			outOfBounds = false;
		}
		return {location: location, outOfBounds: outOfBounds};
	}
}

class Grid{
	constructor(rows, columns, width, height, externallyLoadedMap){
		this.rows = rows;
		this.columns = columns;
		this.width = width;
		this.height = height;
		this.externallyLoadedMap = externallyLoadedMap;
		this.gridSpacing = {x:null, y:null};
		this.minDim = null;
		this.elem = [];
		this.passableElem = [];
		this.impassableElem = [];
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
				var node = new GridNode(xLoc, yLoc, this.gridSpacing.x, this.gridSpacing.y, i, j, 0);
				this.passableElem.push(node);
				rowArray.push(node);
			}
			this.elem.push(rowArray);
		}

		if (!this.externallyLoadedMap){
			return;
		}
		this.passableElem = [];
		var elemInfo = mapData.split(';');
		elemInfo.pop(1);
		var rowOne, rowCount, colCount;
		rowOne = elemInfo[0].split(',');
		rowCount = elemInfo.length;
		colCount = rowOne.length;

		if ((rowCount != this.rows) || (colCount != this.columns)){
			throw 'Read-in map\'s dimensions do not match expected dimensions';
		}

		for (var i = 0; i < this.rows; i++){
			var thisRow = elemInfo[i].split(',');
			for (var j = 0; j < this.columns; j++){
				var thisElem = this.elem[j][i];
				thisElem.tileType = parseInt(thisRow[j]);
				if (thisElem.tileType == tileTypes.mountain){
		        	thisElem.impassable = true; //Reserved for permanantly unwalkable terrain
		        	thisElem.walkable = false;
					this.impassableElem.push(thisElem);
				}
				else{
					thisElem.impassable = false;
					thisElem.walkable = true;
					this.passableElem.push(thisElem);
				}
			}
		}
	}
	loadExternalMap(){

	}

	update(currentUnit, ignoreList){
		this.reset();
		if (currentUnit.auxiliaryUnit){
			this.updateForAuxiliaryUnit(currentUnit, ignoreList);
		}
		else{
			this.updateForCombatUnit(currentUnit, ignoreList);
		}
	}

	updateForAuxiliaryUnit(currentUnit, ignoreList){
		for (var id in currentUnit.enemyList){
			var unit = currentUnit.enemyList[id];
			if (inArray(unit, ignoreList)){
				continue;
			}
			if (unit.command != null) continue; //unit is moving
			this.getAllNodesInRadius(unit.x, unit.y, 2 * unit.combatRadius, true);
		}
	}

	updateForCombatUnit(currentUnit, ignoreList){
		if (currentUnit.retreating){
			for (var id in currentUnit.enemyList){
				var unit = currentUnit.enemyList[id];
				if (inArray(unit, ignoreList)){
					continue;
				}
				if (unit.command != null) continue; //unit is moving
				this.getAllNodesInRadius(unit.x, unit.y, 2 * unit.combatRadius, true);
			}
		}
	}

	reset(){
		for (var i = 0; i < this.passableElem.length; i++){
			this.passableElem[i].walkable = true;
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

		if (i >= 0 && i < this.columns && j >= 0 && j < this.rows){
			return this.elem[i][j];
		}
		return null;
	}

	getAllNodesInRadius(x, y, radius, setUnwalkable){
		var nodes, radiusSq, rootNode, xExtent, yExtent;
		nodes = [];
		radiusSq = radius * radius;
		rootNode = this.getNodeFromLocation(x, y);
		nodes.push(rootNode);

		xExtent = Math.floor(radius / this.gridSpacing.x);
		yExtent = Math.floor(radius / this.gridSpacing.y);
		for (var i = -xExtent; i <= xExtent; i++){
			for (var j = -yExtent; j <= yExtent; j++){
				if (i == 0 && j == 0){
					continue;
				}
				var checkX = rootNode.indX + i;
				var checkY = rootNode.indY + j;

				if (checkX >= 0 && checkX < this.columns && checkY >= 0 && checkY < this.rows){
					var elem = this.elem[checkX][checkY];
					if (elem.impassable) continue; //Check this out.. might need to be walkable check
					if (getDistanceSq(x, y, elem.x, elem.y) <= radiusSq){
						if (setUnwalkable){
							elem.walkable = false;	
						}
						nodes.push(elem);
					}
				}
			}
		}
		return nodes;
	}

	getClosestValidNodeFromLocation(x, y){
		var i,j;
		i = Math.floor(x / this.gridSpacing.x);
		j = Math.floor(y / this.gridSpacing.y);

		if (i < 0){
			i = 0;
		}
		else if (i >= this.columns){
			i = this.columns - 1;
		}
		if (j < 0){
			j = 0;
		}
		else if (j >= this.rows){
			j = this.rows - 1;
		}
		return this.elem[i][j];
	}

	getClosestSide(x, y, node){
		var currentNode, dists, sorted;

		currentNode = (node == undefined)? this.getNodeFromLocation(x, y) : node;
		dists = {};
		dists['left']  = currentNode.indX;
		dists['right'] = this.columns - currentNode.indX;
		dists['top']   = currentNode.indY;
		dists['bot']   = this.rows - currentNode.indY;
		
		sorted = sortDictByValue(dists);
		return sorted[0]
	}

	getWalkableNodeOnNearestSide(x, y, dirX, dirY, returnEdge){
		//unit is retreating from x,y in preferred direction dirX, dirY
		var currentNode, side;
		currentNode = this.getNodeFromLocation(x, y);
		side = this.getClosestSide(x, y, currentNode);
		return this.findWalkableNodeOnEdge(side, currentNode, dirX, dirY, true);
	}
	
	findWalkableNodeGreaterThanInColumn(xInd, targetNode){
		var start = (targetNode.indY < (this.rows - 1))? targetNode.indY + 1 : (this.rows - 1);
		for (var i = start; i < this.rows; i ++){
			var node = this.elem[xInd][i];
			if (node.walkable){
				return node;
			}
		}
		return null;
	}

	findWalkableNodeLessThanInColumn(xInd, targetNode){
		var start = (targetNode.indY > 0)? targetNode.indY - 1 : 0;
		for (var i = start; i >= 0; i--){
			var node = this.elem[xInd][i];
			if (node.walkable){
				return node;
			}
		}
		return null;
	}

	findWalkableNodeGreaterThanInRow(yInd, targetNode){
		var start = (targetNode.indX < (this.columns - 1))? targetNode.indX + 1 : (this.columns - 1);
		for (var i = start; i < this.columns; i ++){
			var node = this.elem[i][yInd];
			if (node.walkable){
				return node;
			}
		}
		return null;
	}
	
	findWalkableNodeLessThanInRow(yInd, targetNode){
		var start = (targetNode.indX > 0)? targetNode.indX - 1 : 0;
		for (var i = start; i >= 0; i--){
			var node = this.elem[i][yInd];
			if (node.walkable){
				return node;
			}
		}
		return null;
	}

	findWalkableNodeInColumn(xInd, currentNode, dirY){
		var targetNode = this.elem[xInd][currentNode.indY];
		if (targetNode.walkable){
			return targetNode;
		}
		if (dirY < 0){
			//look up direction first
			var node = this.findWalkableNodeLessThanInColumn(xInd, targetNode);
			if (node == null){
				//nothing. look down
				node = this.findWalkableNodeGreaterThanInColumn(xInd, targetNode);	
			}
		}
		else{
			//look up direction first
			var node = this.findWalkableNodeGreaterThanInColumn(xInd, targetNode);
			if (node == null){
				//nothing. look down
				node = this.findWalkableNodeLessThanInColumn(xInd, targetNode);	
			}
		}
		return node;
	}

	findWalkableNodeInRow(yInd, currentNode, dirX){
		var targetNode = this.elem[currentNode.indX][yInd];
		if (targetNode.walkable){
			return targetNode;
		}
		if (dirX < 0){
			//look left direction first
			var node = this.findWalkableNodeLessThanInRow(yInd, targetNode);
			if (node == null){
				//nothing. look right
				node = this.findWalkableNodeGreaterThanInRow(yInd, targetNode);	
			}
		}
		else{
			//look right direction first
			var node = this.findWalkableNodeGreaterThanInRow(yInd, targetNode);
			if (node == null){
				//nothing. look left
				node = this.findWalkableNodeLessThanInRow(yInd, targetNode);	
			}
		}
		return node;
	}

	findWalkableNodeOnEdge(edge, currentNode, dirX, dirY, firstIter){
		//prefer nodes in dirX, dirY direction. If it fails to find a node, try
		//another edge. If that fails, drop out.
		var targetNode;
		if (edge == 'left'){
			targetNode = this.findWalkableNodeInColumn(0, currentNode, dirY);
			if (targetNode == null && firstIter){
				if (dirY < 0){
					//try above
					targetNode = this.findWalkableNodeOnEdge('top', currentNode, dirX, dirY, false);
				}
				else{
					//try below
					targetNode = this.findWalkableNodeOnEdge('bot', currentNode, dirX, dirY, false);
				}
			}
		}
		else if (edge == 'right'){
			targetNode = this.findWalkableNodeInColumn(this.columns - 1, currentNode, dirY);
			if (targetNode == null && firstIter){
				if (dirY < 0){
					//try above
					targetNode = this.findWalkableNodeOnEdge('top', currentNode, dirX, dirY, false);
				}
				else{
					//try below
					targetNode = this.findWalkableNodeOnEdge('bot', currentNode, dirX, dirY, false);
				}
			}
		}
		else if (edge == 'top'){
			targetNode = this.findWalkableNodeInRow(0, currentNode, dirX);
			if (targetNode == null && firstIter){
				if (dirX < 0){
					//try left
					targetNode = this.findWalkableNodeOnEdge('left', currentNode, dirX, dirY, false);
				}
				else{
					//try right
					targetNode = this.findWalkableNodeOnEdge('right', currentNode, dirX, dirY, false);
				}
			}
		}
		else if (edge == 'bot'){
			targetNode = this.findWalkableNodeInRow(this.rows - 1, currentNode, dirX);
			if (targetNode == null && firstIter){
				if (dirX < 0){
					//try left
					targetNode = this.findWalkableNodeOnEdge('left', currentNode, dirX, dirY, false);
				}
				else{
					//try right
					targetNode = this.findWalkableNodeOnEdge('right', currentNode, dirX, dirY, false);
				}
			}
		}
		else {
			throw 'Expecting edge to be left, right, top, or bot'
		}

		return targetNode;
	}

	isLocationImpassable(x, y){
		var i,j;
		i = Math.floor(x / this.gridSpacing.x);
		j = Math.floor(y / this.gridSpacing.y);
		return this.elem[i][j].impassable;
	}
}
class GridNode{
	constructor(x, y, width, height, indX, indY, tileType){
		this.x = x;
		this.y = y;
		this.indX = indX;
		this.indY = indY;

		this.width = width;
		this.height = height;
		this.tileType = tileType;
		switch(this.tileType){
			default:
				this.impassable = false;
				this.walkable = true;
				this.movementPenalty = 3;
			case tileTypes.mountain:
				this.impassable = true;
				this.walkable = false;
				this.movementPenalty = 10;
				break;
			case tileTypes.plain:
				this.impassable = false;
				this.walkable = true;
				this.movementPenalty = 3;
				break;
			case tileTypes.road:
				this.impassable = false;
				this.walkable = true;
				this.movementPenalty = 0;
				break;
		}

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