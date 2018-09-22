"use strict";

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
				rowArray.push(new GridNode(xLoc, yLoc, this.gridSpacing.x, this.gridSpacing.y, i, j, true, 0));
			}
			this.elem.push(rowArray);
		}
	}

	update(){
		this.reset();
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

	paintGrid(x, y){
		var thisNode = this.getNodeFromLocation(x, y);
		thisNode.tileType = activeBrush;
		if (thisNode.tileType == brushes.mountain){
			thisNode.impassable = true;
		}
		else{
			thisNode.impassable = false;
		}
	}

	save(){
		var jsonContent = "data:text/javascript;charset=utf-8,";
		
		var str = this.elem[0][0].tileType;
		for (var i = 0; i < this.rows; i++){
			var start;
			if (i == 0){
				start = 1;
			}
			else{
				start = 0;
			}

			for (var j = start; j < this.columns - 1; j++){
				if (j == 0){
					str += parseInt(this.elem[j][i].tileType);
				}
				else{
					str += (',' + parseInt(this.elem[j][i].tileType));
				}
			}
			str += (',' + parseInt(this.elem[j][i].tileType) + ';');
		}
		var link;
		jsonContent += 'var mapData = \'';
		jsonContent += encodeURIComponent(str);
		jsonContent += '\'';
		link = document.createElement("a");
		link.setAttribute("href", jsonContent);
		link.setAttribute("download", "map.js");
		link.innerHTML= "Click to download";
		document.body.appendChild(link); // Required for FF
		link.click();
	}
}
class GridNode{
	constructor(x, y, width, height, indX, indY, walkable, tileType){
		this.x = x;
		this.y = y;
		this.indX = indX;
		this.indY = indY;

		this.width = width;
		this.height = height;
		this.walkable = walkable;
		this.tileType = tileType;
		if (this.tileType == brushes.mountain){
        	this.impassable = true; //Reserved for permanantly unwalkable terrain
		}
		else{
			this.impassable = false;
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