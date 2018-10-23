"use strict";

class EnemyGeneral extends General{
    constructor(x, y, angle, courierCount, army){
        super(x, y, angle, courierCount, army);
        this.flightRadius = 75;
        this.AIcontrolled = true;
        this.nearbyEnemies = [];
        this.nearbyFriendlies = [];
        this.routingFriendlies = [];
        this.freeFriendlies = [];
        this.skirmishingFriendlies = [];
        this.battlingFriendlies = [];
        this.stateChangeTimer = new Timer(500, true);
        this.stateChangeTimer.start();
        this.AIstates = enemyGenStates; //global enum surviving, rallying, commanding
        this.currentState = this.AIstates.commanding;

    }
    update(dt){
        this.executeStateLogic();
        super.update(dt);
        this.nearbyEnemies = [];
        this.nearbyFriendlies = [];
        this.freeFriendlies = [];
        this.skirmishingFriendlies = [];
        this.battlingFriendlies = [];
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
            //enemies are near!
            var centroid = getCenterOfMass(this.nearbyEnemies, playerUnitList);
            this.moveDirectlyAwayFrom(centroid.x, centroid.y);
            
            if (this.nearbyFriendlies.length > 0){
                //friends are near to help
                //1) find nearest friend that is not in combat
                //2) route friendly to intercept enemy. 
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
}
