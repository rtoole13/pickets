"use strict";

class EnemyGeneral extends General{
    constructor(x, y, angle, courierCount, army, smart){
        super(x, y, angle, courierCount, army);
        this.flightRadius = 150;
        this.closeFriendlyRadius = 150;
        this.panicRadius = 75;
        this.AIcontrolled = true;
        this.riskAssessment = {};
        this.riskThreshold = 8;
        this.nearbyEnemies = [];
        this.nearbyFriendlies = [];
        this.routingFriendlies = [];
        this.freeFriendlies = [];
        this.nearbyNotBattlingFriendlies = [];
        this.skirmishingFriendlies = [];
        this.battlingFriendlies = [];
        this.flankedRiskMultiplier = 3;
        this.battleRiskMultiplier = 2;
        this.recentAssistFactor = 3;
        this.stateChangeTimer = new Timer(500, true);
        this.stateChangeTimer.start();
        this.AIstates = enemyGenStates; //global enum surviving, rallying, commanding
        this.currentState = this.AIstates.commanding;
        this.recentlyAssistedUnitID = '';
        this.smart = smart;

    }
    update(dt){
        if (this.smart){
            this.executeStateLogic();
        }
        super.update(dt);
        this.nearbyEnemies = [];
        this.nearbyFriendlies = [];
        this.freeFriendlies = [];
        this.skirmishingFriendlies = [];
        this.battlingFriendlies = [];
        this.nearbyNotBattlingFriendlies = [];
    }
    evaluateBoard(){
        //due to awkward structure, cant pre-populate these lists in the broadCollisionCheck in the main game loop
        for(var id in enemyInfantryList){
            var unit = enemyInfantryList[id];

            //track risk value of all friendlies
            this.riskAssessment[id] = this.calculateUnitRisk(unit, id);

            var distanceSq = getDistanceSq(this.x, this.y, unit.x, unit.y);
            if (distanceSq <= (this.closeFriendlyRadius * this.closeFriendlyRadius)){
                this.nearbyFriendlies.push(id);
                if (unit.combatCollisionList.length == 0){
                    this.nearbyNotBattlingFriendlies.push(id);
                }
            }
            if (unit.retreating){
                this.routingFriendlies.push(id);
                break;
            }
            if (unit.skirmishCollisionList.length > 0){
                // this awkward nesting here is due to the fact that the collision engine doesn't remove units from the skirmish
                // collision list if they exist in the combat collision list
                if (unit.combatCollisionList.length > 0){
                    this.battlingFriendlies.push(id);
                }
                else{
                    this.skirmishingFriendlies.push(id);
                }
            }
            else{
                this.freeFriendlies.push(id);
            }
        }
        this.nearbyNotBattlingFriendlies = sortListByDistToPoint(this.x, this.y, this.nearbyNotBattlingFriendlies, enemyInfantryList);
        this.routingFriendlies = sortListByDistToPoint(this.x, this.y, this.routingFriendlies, enemyInfantryList);
        this.battlingFriendlies = sortListByDistToPoint(this.x, this.y, this.battlingFriendlies, enemyInfantryList);   
        this.skirmishingFriendlies = sortListByDistToPoint(this.x, this.y, this.skirmishingFriendlies, enemyInfantryList);
        this.freeFriendlies = sortListByDistToPoint(this.x, this.y, this.freeFriendlies, enemyInfantryList);
    }
    calculateUnitRisk(unit, id){
        var risk = unit.skirmishCollisionList.length + (unit.combatCollisionList.length * this.battleRiskMultiplier) +
                   (unit.recentlyFlanked * this.flankedRiskMultiplier);
        if (id == this.recentlyAssistedUnitID){
            //Unit was helped last command, reduce apparent risk.
            risk -= this.recentAssistFactor;
        }
        return risk;

    }
    executeStateLogic(){
        //Only change state if timer is up.
        if (!this.stateChangeTimer.checkTime()){
            return;
        }
        //evaluate the gameboard
        this.evaluateBoard();

        if (this.currentState == this.AIstates.surviving){
            this.stateSurvive();
        }
        else if (this.currentState == this.AIstates.rallying){
            this.stateRally();
        }
        else{
            this.stateCommand();
        }
    }
    stateSurvive(){
        if (this.nearbyEnemies.length > 0){
            //enemies are near! Run (maybe)!
            var centroid = getCentroidAndClosest(this.x, this.y, this.nearbyEnemies, playerUnitList);
            if (rayCastSegment(this.x, this.y, centroid.centerX, centroid.centerY, 10, this.nearbyFriendlies, enemyInfantryList, false) != null){
                //A friendly is blocking the path
                console.log('enemyGeneral: a friendly seems to be blocking path to enemy');
                this.currentState = this.AIstates.rallying;
                return;    
            }
            if (centroid.closestDist <= this.panicRadius){
                //Run! Staying in survival state 
                console.log('enemyGeneral: Enemy centroid too close, running');
                this.moveDirectlyAwayFrom(centroid.closestUnit.x, centroid.closestUnit.y);
                return;
            }
            if (this.nearbyNotBattlingFriendlies.length > 0){
                //friends are near to help
                var nearID, potentialAid;
                potentialAid = sortListByDistToPoint(centroid.centerX, centroid.centerY, this.nearbyNotBattlingFriendlies, enemyInfantryList);
                nearID = potentialAid[0];
                if (nearID != null){
                    var nearUnit, midpoint;
                    nearUnit = enemyUnitList[nearID];
                    if (centroid.centroidDist <= this.panicRadius){
                        //Enemy centroid is too close. Move behind this nearUnit.
                        console.log('enemyGeneral: Enemy centroid close, running to near, not fighting friend');
                        this.moveBehindUnit(nearUnit, centroid.centerX, centroid.centerY, this.panicRadius * 2);
                    }
                    //route friendly to intercept enemy.
                    console.log('enemyGeneral: Routing friend to intercept enemy');
                    var midpoint = getMidpoint(this.x, this.y, centroid.centerX, centroid.centerY);   
                    this.issueCommandWrapper(nearUnit, commandTypes.move, null, midpoint.x, midpoint.y, true);
                }
                
            }
            else{
                console.log('enemyGeneral: No friends near, running to likely help');
                this.runToLikelyHelp();
            }

            //final action
            this.currentState = this.AIstates.rallying;
        }
        else{
            this.stateRally();
        }

        //Either way, change state.
    }
    stateRally(){
        if (this.routingFriendlies.length > 0){
            //1) find a routing unit to which path is clear
            //2) route near to that unit if path is available,
            //   else, do nothing and jump to commanding state.
            this.routingFriendlies = sortListByDistToPoint(this.x, this.y, this.routingFriendlies, enemyUnitList);
            for (var i = 0; i < this.routingFriendlies.length; i++){
                var unit = enemyUnitList[this.routingFriendlies[i]];
                if (rayCastSegment(this.x, this.y, unit.x, unit.y, 15, this.nearbyEnemies, enemyInfantryList, false) == null){
                    //Path is relatively free to the routing enemy
                    console.log('enemyGeneral: Path is clear to a routing unit, Moving towards.')
                    this.moveTowardsUnit(unit, this.commandRadius / 2);
                    return;
                }
            }
        }
        else{
            this.stateCommand();
            return;
        }
    }
    stateCommand(){
        var unitInNeed = this.getUnitMostAtRisk();
        if (!defendingAI){
            if (unitInNeed != null){
                this.sendAssistance(unitInNeed);
            }
            else{
                this.aggressiveCommand();
            }
        }
        else{
            this.defensiveCommand(unitInNeed);
        }
        
        //1) evaluate unit risk
        if (this.freeFriendlies.length > 0){
            //free friendlies
            //this.hailMary(this.freeFriendlies, enemyUnitList);
        }
        else if (this.skirmishingFriendlies.length > 0){
            //no free, but some skirmishing.
        }
        else{
            //no free, no skirmishing, some battling.
        }
        this.currentState = this.AIstates.surviving;
    }

    defenseNecessary(){
        //return an array of ids that need defending.
        var defenseNecessary = []
        for(var id in this.riskAssessment){
            if (this.riskAssessment[id] > this.riskThreshold){
                defenseNecessary.push(id);
            }
        }
        return defenseNecessary;
    }

    getUnitMostAtRisk(){
        var highestRiskValue = 0;
        var mostAtRiskID = null;
        for(var id in this.riskAssessment){
            if (this.riskAssessment[id] > this.riskThreshold && this.riskAssessment[id] > highestRiskValue){
                highestRiskValue = this.riskAssessment[id];
                mostAtRiskID = id;
            }
        }
        return mostAtRiskID;
    }
    defensiveCommand(unitInNeed){
        if (unitInNeed != null){
            this.sendAssistance(unitInNeed);
        }

    }

    sendAssistance(unitInNeed){
        if (this.freeFriendlies.length > 0){
            this.sendAssistanceFromList(unitInNeed, this.freeFriendlies);
        }
        else if(this.skirmishingFriendlies.length > 0){
            this.sendAssistanceFromList(unitInNeed, this.skirmishingFriendlies);
        }
    }

    sendAssistanceFromList(unitInNeed, unitList){
        var unit = enemyInfantryList[unitInNeed];
        var ignoreList = [];
        ignoreList.push(unitInNeed);
        var closestFreeUnit = getClosestUnitToPosition(unit.x, unit.y, unitList, ignoreList);
        if (closestFreeUnit != null){
            var target, targetID = null;
            if (unit.combatCollisionList.length > 0){
                targetID = unit.combatCollisionList[0];
            }
            else if (unit.skirmishCollisionList.length > 0){
                targetID = unit.skirmishCollisionList[0];
            }
            target = playerInfantryList[targetID];
            console.log('enemyGeneral: Sending a unit to assist another at risk.');
            this.issueCommandWrapper(enemyInfantryList[closestFreeUnit], commandTypes.attackmove, target, target.x, target.y, false);
            this.recentlyAssistedUnitID = unitInNeed;
        }
    }

    aggressiveCommand(){

    }

    hailMary(idList, unitDict){
        console.log('enemyGeneral: All in assault on the enemy general!');
        var unit;
        for (var i = 0; i < idList.length; i++){
            unit = unitDict[idList[i]];
            this.issueCommandWrapper(unit, commandTypes.attackmove, playerGeneral, playerGeneral.x, playerGeneral.y, true);
        }
    }

    moveDirectlyAwayFrom(x, y){
        var newX, newY;
        newX = 2 * this.x - x;
        newY = 2 * this.y - y;
        this.moveToLocation(newX, newY);
    }

    moveBehindLocation(x, y, distance){
        //move to location past x, y by distance;
        var dir, locDist;
        dir = normalizeVector(x - this.x, y - this.y);
        this.moveToLocation(x + (distance * dir.x), y + (distance * dir.y));
    }

    moveBehindUnit(unit, x, y, distance){
        //move to a location on the other side of unit from (x, y) by distance;
        var dir = normalizeVector(unit.x - x, unit.y - y);
        this.moveToLocation(unit.x + (distance * dir.x), unit.y + (distance * dir.y));
    }

    moveTowardsUnit(unit, distance){
        //Move to within distance from unit
        var dir = normalizeVector(unit.x - this.x, unit.y - this.y);
        this.moveToLocation(unit.x - (distance * dir.x), unit.y - (distance * dir.y));
    }

    runToLikelyHelp(){
        //looks for the nearest free friendly unit. if not found, looks for the nearest skirmishing
        //unit. If not found, looks for the nearest unit in battle and move to within command range
        //of it.
        var nearID, nearUnit;
        nearID = getClosestUnitToPosition(this.x, this.y, this.freeFriendlies, []);
        if (nearID == null){
            nearID = getClosestUnitToPosition(this.x, this.y, this.skirmishingFriendlies, []);
        }
        if (nearID == null){
            nearID = getClosestUnitToPosition(this.x, this.y, this.battlingFriendlies, []);
        }
        nearUnit = enemyUnitList[nearID];
        this.moveTowardsUnit(nearUnit, this.commandRadius);
    }

    issueCommandWrapper(targetFriendly, commandType, targetEnemy, targetOriginX, targetOriginY, intercepting){
        var dir, targetAngle = null;
        if (intercepting){
            dir = normalizeVector(targetOriginX - this.x, targetOriginY - this.y);
            targetAngle = getAngleFromDir(dir.x, dir.y);
        }
        this.issueCommand(targetFriendly, {type: commandType, target: targetEnemy, x: targetOriginX, y: targetOriginY, angle: targetAngle, date: Date.now(), queue: false});
    }

    sendCourier(target, command){
        if (this.courierCount > 0){
            if (this.courierCooldown.checkTime()){
                addEnemyCourier(this.x, this.y, this.angle, this, target, command);
                this.courierCount -= 1;
                this.issuedCourierCount += 1;
            }
            else{
                console.log('Courier sending on cooldown!');
            }   
        }
        else{
            console.log('No couriers available!');
        }
    }
}

