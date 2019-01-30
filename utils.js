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
function initializeInfantryElement(elementType){
	var strength;
	switch(elementType){
		default:
			console.log("Unsupported element type!!");
		
		case "Brigade":
			strength = 3000;
            break;
		
		case "Division":
			strength = 12000;
            break;
		
		case "Corps":
			strength = 24000;
            break;
	}
	return strength;
}

function initializeArtilleryElement(elementType){
    var batteries;
    switch(elementType){
        default:
            console.log("Unsupported element type!!");
        
        case "Brigade":
            batteries = 5;
            break;
        
        case "Reserve":
            batteries = 25;
            break;
    }
    return batteries;
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

class EventHandler {
    constructor(){
        this.activeEvents = {};
    }
    
    addEventListener(target, eventName, callback, bubble){
        if (this.activeEvents[eventName] == undefined){
            this.activeEvents[eventName] = [];
        }

        this.activeEvents[eventName].push({target: target, callback: callback});
        if (target == 'canvas'){
            canvas.addEventListener(eventName, callback, bubble);
        }
        else if (target == 'window'){
            window.addEventListener(eventName, callback, bubble);
        }
        else {
            throw 'Currently only accepting events tied to the canvas or the window!'
        }
    }

    removeEventListenersByEvent(eventName){
        var attachedEvents = this.activeEvents[eventName];
        if (attachedEvents == undefined){
            return;
        }
        for (var i = 0; i < attachedEvents.length; i++){
            var thisEvent = attachedEvents[i];
            if (thisEvent.target == 'canvas'){
                canvas.removeEventListener(eventName, thisEvent.callback, false);
            }
            else if (thisEvent.target == 'window'){
                window.removeEventListener(eventName, thisEvent.callback, false);
            }
            else {
                throw 'Currently only accepting events tied to the canvas or the window!'
            }
            attachedEvents.splice(i,1);
            i -= 1;
        }
    }

    removeAllEventListeners(){
        for (var eventName in this.activeEvents){
            this.removeEventListenersByEvent(eventName);
        }
    }

    handleEventOverrides(eventOverrides){
        for (var eventName in eventOverrides.data){
            this.removeEventListenersByEvent(eventName);
            var eventData = eventOverrides.data[eventName];
            this.addEventListener(eventData.target, eventName, eventData.callback, false);
            if (mouseOrderButtons == undefined || mouseOrderButtons == null){
                return;
            }

            //Enable or disable certain move commands
            if (eventData.callback == handleKeyPressMoveOnly){
                mouseOrderButtons.setMoveState(true);
                mouseOrderButtons.setAttackmoveState(false);
                mouseOrderButtons.setFallbackState(false);
            }
            else if (eventData.callback == handleKeyPressAttackMoveOnly){
                mouseOrderButtons.setMoveState(false);
                mouseOrderButtons.setAttackmoveState(true);
                mouseOrderButtons.setFallbackState(false);
            }
            else if (eventData.callback == handleClickToContinue){
                mouseOrderButtons.setMoveState(false);
                mouseOrderButtons.setAttackmoveState(false);
                mouseOrderButtons.setFallbackState(false);
            }
            else if (eventData.callback == handleGoalSpecificKeyPress){
                mouseOrderButtons.setMoveState(false);
                mouseOrderButtons.setAttackmoveState(false);
                mouseOrderButtons.setFallbackState(false);
            }
            else if (eventData.callback == null){
                mouseOrderButtons.setMoveState(false);
                mouseOrderButtons.setAttackmoveState(false);
                mouseOrderButtons.setFallbackState(false);
            }
        }
    }

}

class CommandHandler {
    constructor(){
    }
    setCommand(command){
        //intend to put validation logic here..
        switch (command){
            case commandTypes.move:
                if (mouseOrderButtons != undefined || mouseOrderButtons != null){
                    mouseOrderButtons.moveButton.setSelected(true);
                    mouseOrderButtons.attackmoveButton.setSelected(false);
                    mouseOrderButtons.fallbackButton.setSelected(false);
                }
                break;
            case commandTypes.attackmove:
                if (mouseOrderButtons != undefined || mouseOrderButtons != null){
                    mouseOrderButtons.moveButton.setSelected(false);
                    mouseOrderButtons.attackmoveButton.setSelected(true);
                    mouseOrderButtons.fallbackButton.setSelected(false);
                }
                break;
            case commandTypes.fallback:
                if (mouseOrderButtons != undefined || mouseOrderButtons != null){
                    mouseOrderButtons.moveButton.setSelected(false);
                    mouseOrderButtons.attackmoveButton.setSelected(false);
                    mouseOrderButtons.fallbackButton.setSelected(true);
                }
                break;
            default:
                throw 'invalid command!!'
                break;
        }
        commandType = command;
    }
}
class Queue {
    constructor(){
        this.data = [];
    }
    add(entry){
        this.data.unshift(entry);
    }
    remove(){
        return this.data.pop();
    }
    cut(i){
        return this.data.splice(i,1);
    }
    getFront(){
        return this.data[this.data.length - 1];
    }
    getBack(){
        return this.data[0];
    }
    getLength(){
        return this.data.length;
    }
    clearData(){
        this.data = [];
    }
}