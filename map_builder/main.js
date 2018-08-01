"use strict";

//Base//
var canvas = document.getElementById('gameCanvas'),
	canvasContext,
	mouseX,
	mouseY,
	mouseDown = false,

//Game Objects//
	grid,
	brushes,
	activeBrush;

window.onload = function(){
	canvasContext = canvas.getContext('2d');
	
	canvas.style.cursor = "crosshair";
	canvas.addEventListener("mousedown", handleMouseDown, false);
	canvas.addEventListener("mouseup", handleMouseUp, false);
	canvas.addEventListener("contextmenu", handleRightRelease, false);
	canvas.addEventListener("mousemove", getMousePosition, false);
	window.addEventListener("keydown", handleKeyPress, false);
	init();

}

function init(){

	brushes = Object.freeze({plain:0, road:1, mountain:2});
	activeBrush = brushes.plain;
	
	grid = new Grid(30, 40, canvas.width, canvas.height);
	main();
}

function main(){
	//Main loop
	//Updates
	grid.update();
	
	if (mouseDown){
		grid.paintGrid(mouseX, mouseY);
	}

	draw();

	requestAnimationFrame(main);
}

//Event Handlers
function handleMouseDown(e){
	switch(e.button){
		case 0:
			handleLeftClick(e);
			break;
		
		case 2:
			break;
		
	}
}

function handleMouseUp(e){
	switch(e.button){
		case 0:
			handleLeftRelease(e);
			break;
		
		case 2:
			break;
		
	}
}

function handleLeftClick(e){
	mouseDown = true;
	return;
}

function handleLeftRelease(e){
	mouseDown = false;
	return;
}
function handleRightRelease(e){
	e.preventDefault();
	activeBrush = (activeBrush + 1 ) % Object.keys(brushes).length;
	console.log(activeBrush);
	return;
}

function handleKeyPress(e){
	var keyCode = e.keyCode;
	if (keyCode == 32){
		console.log("Saved to file");
		grid.save();
	}
	return;
}

function getMousePosition(e){
	var rect = canvas.getBoundingClientRect(),
        root = document.documentElement;

	mouseX = e.pageX - rect.left - root.scrollLeft;
	mouseY = e.pageY - rect.top - root.scrollTop;
}
