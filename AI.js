"use strict";

class EnemyGeneral extends General{
    constructor(x, y, angle, courierCount, army){
        super(x, y, angle, courierCount, army);
        this.flightRadius = 150;
        this.closeFriendlyRadius = 150;
        this.panicRadius = 75;
        this.AIcontrolled = true;
        this.riskAssessment = {};
        this.nearbyEnemies = [];
        this.nearbyFriendlies = [];
        this.routingFriendlies = [];
        this.freeFriendlies = [];
        this.nearbyNotBattlingFriendlies = [];
        this.skirmishingFriendlies = [];
        this.battlingFriendlies = [];
        this.flankedRiskMultiplier = 3;
        this.battleRiskMultiplier = 2;
        this.stateChangeTimer = new Timer(500, true);
        this.stateChangeTimer.start();
        this.AIstates = enemyGenStates; //global enum surviving, rallying, commanding
        this.currentState = this.AIstates.commanding;

    }
    update(dt){
        this.evaluateBoard();
        this.executeStateLogic();
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
            this.riskAssessment[id] = this.calculateUnitRisk(unit);

            var distanceSq = getDistanceSq(this.x, this.y, unit.x, unit.y);
            if (distanceSq <= (this.closeFriendlyRadius * this.closeFriendlyRadius)){
                this.nearbyFriendlies.push(id);
                if (!unit.inBattle){
                    this.nearbyNotBattlingFriendlies.push(id);
                }
            }
            if (unit.retreating){
                this.routingFriendlies.push(id);
                break;
            }
            if (unit.isSkirmishing){
                this.skirmishingFriendlies.push(id);
            }
            else if (unit.inBattle){
                this.battlingFriendlies.push(id);
            }
            else{
                this.freeFriendlies.push(id);
            }
        }
    }
    calculateUnitRisk(unit){
        var risk = unit.skirmishCollisionList.length + (unit.combatCollisionList.length * this.battleRiskMultiplier) +
                   (unit.recentlyFlanked * this.flankedRiskMultiplier);
        return risk;

    }
    executeStateLogic(){
        //Only change state if timer is up.
        if (!this.stateChangeTimer.checkTime()){
            return;
        }
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
            //enemies are near! Run!
            var centroid = getCentroidAndClosest(this.x, this.y, this.nearbyEnemies, playerUnitList);
            if (centroid.closestDist <= this.panicRadius){
                //Run! 
                this.moveDirectlyAwayFrom(centroid.closestUnit.x, centroid.closestUnit.y);
            }
            if (rayCastSegment(this.x, this.y, centroid.centerX, centroid.centerX, 15, this.nearbyFriendlies) != null){
                //A friendly is blocking the path
                this.currentState = this.AIstates.rallying;
                return;    
            }
            if (this.nearbyNotBattlingFriendlies.length > 0){
                //friends are near to help
                var nearID = getClosestUnitToPosition(this.x, this.y, this.nearbyNotBattlingFriendlies);
                if (nearID != null){
                    var nearUnit, midpoint;
                    nearUnit = enemyUnitList[nearID];
                    if (centroid.centroidDist <= this.panicRadius){
                        this.moveBehindUnit(nearUnit, centroid.centerX, centroid.centerY, this.panicRadius * 2);
                    }
                    //route friendly to intercept enemy.
                    var midpoint = getMidpoint(this.x, this.y, centroid.centerX, centroid.centerY);   
                    this.issueCommandWrapper(nearUnit, commandTypes.attackmove, null, midpoint.x, midpoint.y, true);
                }
                //3) move to opposite side of friend.
                
            }
            else{
                //no friends immediately near.
                //1) move towards nearest friendly along enemy's path
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
            
            //final action
            this.currentState = this.AIstates.commanding;
        }
        else{
            this.stateCommand();
            return;
        }
    }
    stateCommand(){
        //1) evaluate unit risk
        if (this.freeFriendlies.length > 0){
            //free friendlies
        }
        else if (this.skirmishingFriendlies.length > 0){
            //no free, but some skirmishing.
        }
        else{
            //no free, no skirmishing, some battling.
        }
        this.currentState = this.AIstates.surviving;
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
        var dir, locDist;
        dir = normalizeVector(unit.x - x, unit.y - y);
        this.moveToLocation(unit.x + (distance * dir.x), unit.y + (distance * dir.y));
    }

    possiblyFleeFromNearbyEnemies(){
        for (var i = 0; i < this.nearbyEnemies.length; i++){

        }
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
