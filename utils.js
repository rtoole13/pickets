"use strict";

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomFloat(min, max){
	min = Math.ceil(min);
	max = Math.ceil(max);
	return Math.random() * (max - min) + min;
}

function getRandomID(idLength) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < idLength; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getUniqueID(idLength, dict){
	var id = getRandomID(idLength);

	if (id in dict){
		return getUniqueID(idLength, dict);
	}
	else{
		return id;
	}
}

function inArray(obj, array){
	if (array == null){
		return false;
	}
	for (var i = 0; i < array.length; i++){
		if (obj == array[i]){
			return true;
		}
	}
	return false;
}

function hexToRGB(hex, alpha){
	hex = hex.replace("#", "");
	var r, g, b;
	if (alpha == undefined){
		alpha = 1.0;
	}
	r = parseInt(hex.substring(0,2), 16);
	g = parseInt(hex.substring(2,4), 16);
	b = parseInt(hex.substring(4,6), 16);
	return 'rgba(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ', ' + alpha.toString() + ')';
	
}

// Unit functions
function initializeElement(elementType){
	var strength;
	switch(elementType){
		default:
			console.log("Unsupported element type!!");
		
		case "Brigade":
			strength = 3000;
		
		case "Division":
			strength = 12000;
		
		case "Corps":
			strength = 24000;
		
	}
	return strength;
}