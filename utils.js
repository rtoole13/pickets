"use strict";

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomFloat(min, max){
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
	if (alpha == undefined){
		alpha = 1.0;
	}
	return getColorPrefix(hex) + alpha.toString() + ')';
}

function getColorPrefix(hex){
	hex = hex.replace("#", "");
	var r, g, b;
	r = parseInt(hex.substring(0,2), 16);
	g = parseInt(hex.substring(2,4), 16);
	b = parseInt(hex.substring(4,6), 16);
	return 'rgba(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ', ';
}

function capitalizeFirstLetter(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
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

function sortDictByValue(thisDict){
	//Given a dict, thisDict, of numbers, sort and return
	//a list with the smallest number first
	var sortedList, valA, valB, unsorted = true;
	var sortedList = Object.keys(thisDict);

	if (sortedList.length < 2){
		return sortedList;
	}
	while (unsorted){
		unsorted = false;
		for (var i = 0; i < sortedList.length - 1; i++){
			valA = thisDict[sortedList[i]];
			valB = thisDict[sortedList[i + 1]];
			if (valB < valA){
				var temp = sortedList[i+1];
				sortedList[i+1] = sortedList[i];
				sortedList[i] = temp;
				unsorted = true;
			}
		}
	}	
	return sortedList;
}
