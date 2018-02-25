"use strict";

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
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
	for (var i = 0; i < array.length; i++){
		if (obj == array[i]){
			return true;
		}
	}
	return false;
}

// Unit functions
function initializeElement(elementType){
	var strength;
	switch(elementType){
		default:{
			console.log("Unsupported element type!!");
		}
		case "Brigade":{
			strength = 3000;
		}
		case "Division":{
			strength = 12000;
		}
		case "Corps":{
			strength = 24000;
		}
	}
	return strength;
}