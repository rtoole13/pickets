"use strict";

var audio_farm  = new Audio('assets/audio/Morning_Farm.mp3');
/*
work audio controller and audioGroup to preload a fixed number of 
new Audio objects. Therefore only allowing a set amount of sounds
to be playing simultaneously.

Set up available pools for each sound effect. When a group requests
that one be played, try pulling a free one from the pool. If none are 
available, don't play. If this becomes a problem, either increase
pool size or allow one to override pool count limit.

Add a callback to each audioClip.onEnded() to add the finished sound
back to the appropriate available pool.
*/

//audio_bugle.ended to check if still playing.
class AudioHandler {
    constructor(){
        //create AudioPools
        this.audioPools = {};
        this.initializePools();
        
        //create AudioGroups
        this.audioGroups = {};
        this.initializeAudioGroups();
    }
    initializePools(){
        this.initializePool('assets/audio/gunfire/rifle1.ogg', 3, 0.1, 'rifle1');
        this.initializePool('assets/audio/gunfire/rifle2.ogg', 3, 0.1, 'rifle2');
        this.initializePool('assets/audio/gunfire/rifle3.ogg', 3, 0.1, 'rifle3');
        this.initializePool('assets/audio/gunfire/rifle4.ogg', 3, 0.1, 'rifle4');
        this.initializePool('assets/audio/gunfire/rifle5.ogg', 3, 0.1, 'rifle5');
        this.initializePool('assets/audio/gunfire/rifle6.ogg', 3, 0.1, 'rifle6');
        this.initializePool('assets/audio/gunfire/rifle7.ogg', 3, 0.1, 'rifle7');
        this.initializePool('assets/audio/gunfire/rifle8.ogg', 3, 0.1, 'rifle8');
        this.initializePool('assets/audio/gunfire/rifle9.ogg', 3, 0.1, 'rifle9');
        this.initializePool('assets/audio/gunfire/rifle10.ogg', 3, 0.1, 'rifle10');
        this.initializePool('assets/audio/gunfire/rifle11_ricochet.ogg', 3, 0.1, 'rifle11');
        this.initializePool('assets/audio/gunfire/rifle12_ricochet.ogg', 3, 0.1, 'rifle12');
        this.initializePool('assets/audio/gunfire/volley1.ogg', 3, 0.1, 'volley1');
        this.initializePool('assets/audio/gunfire/volley2.ogg', 3, 0.1, 'volley2');
        this.initializePool('assets/audio/gunfire/volley3.ogg', 3, 0.1, 'volley3');
        this.initializePool('assets/audio/gunfire/volley4.ogg', 3, 0.1, 'volley4');
    }
    initializeAudioGroups(){
        var skirmishDict, battleDict, artilleryDict;
        
        skirmishDict = {
            rifle1  : 1,
            rifle2  : 1,
            rifle3  : 1,
            rifle4  : 1,
            rifle5  : 1,
            rifle6  : 1,
            rifle11 : 1,
            rifle12 : 1
        }
        battleDict = {
            volley1 : 2,
            volley2 : 2,
            volley3 : 2,
            volley4 : 2,
            rifle6  : 1,
            rifle7  : 1,
            rifle8  : 1,
            rifle9  : 1,
            rifle11 : 1,
            rifle12 : 1
        }
        artilleryDict = {
            volley1 : 2
        }
        
        this.initializeAudioGroup('skirmish', 1, skirmishDict);
        this.initializeAudioGroup('battle', 1, battleDict);
        this.initializeAudioGroup('artillery', 1, artilleryDict);
    }

    initializePool(clip, count, pitchVariance, id){
        this.audioPools[id] = new AudioPool(clip, count, pitchVariance, id);
    }

    initializeAudioGroup(id, volume, clipDict){
        var audioGroup = new AudioGroup(volume);

        for (var poolID in clipDict){
            audioGroup.addClip(poolID, clipDict[poolID]);
        }
        this.audioGroups[id] = audioGroup;
    }

    playAudioGroup(id, varyPitch){
        var audioGroup, poolID;
        audioGroup = this.audioGroups[id];
        poolID = this.audioGroups[id].getRandomClip();

        this.audioPools[poolID].playAvailableClip(varyPitch, audioGroup.volume);
    }

    updatePools(){
        var unavailableSum = 0;
        for (var id in this.audioPools){
            unavailableSum += this.audioPools[id].checkUnavailable();
        }
        //console.log(unavailableSum);
    }

}

class AudioGroup {
    constructor(volume){
        this.clips = [];
        this.weights = [];
        this.rollingWeights = [];
        this.volume = volume;
        this.totalWeight = 0;

        //this.debugTally = [];
    }

    addClip(clipPoolID, weight){
        this.clips.push(clipPoolID);
        this.weights.push(weight);

        if (this.rollingWeights.length > 0){
            //rolling weight entry = last + new
            var lastWeight = this.rollingWeights[this.rollingWeights.length - 1];
            this.rollingWeights.push(lastWeight + weight);
        }
        else{
            //if this is the first clip added, first entry of rolling weights = weights
            this.rollingWeights.push(weight);   
        }

        this.totalWeight += weight;

        //this.debugTally.push(0);
    }

    getClipAtIndex(i){
        //play clip at index i
        return this.clips[i];
    }

    getRandomClip(){
        var ind = getRandomInt(1, this.totalWeight);
        for (var i = this.rollingWeights.length - 1; i > -1; i--){
            if (ind < this.rollingWeights[i]){
                continue;
            }
            return this.getClipAtIndex(i);
            //this.debugAddTally(i);
        }
        return this.getClipAtIndex(0);
    }

    debugAddTally(i){
        this.debugTally[i] += 1;
    }

    debugAddClips(){
        for (var i = 0; i < 4; i++){
            this.addClip(i,1);
        }
    }

    debugPlayClips(count){
        for (var i = 0; i < count; i++){
            this.playRandomClip(true);
        }
    }
}

class AudioPool {
    constructor(clipURL, count, pitchVariance, poolID){
        this.clipURL = clipURL;
        this.pitchVariance = pitchVariance;
        this.poolID = poolID;
        this.available = new Queue();
        this.unavailable = [];
        this.count = count;

        for (var i = 0; i < count; i++){
            var audio = new Audio(clipURL);
            this.available.add(audio);
        }
    }
    checkUnavailable(){
        for (var i = 0; i < this.unavailable.length; i++){
            if (this.unavailable[i].ended){
                var clip = this.unavailable.splice(i,1)[0];
                i -= 1;
                this.available.add(clip);
            }
        }
        if(this.count == this.unavailable.length){
            return 1;
        }
        return 0;
    }

    playAvailableClip(varyPitch, volume){
        var clip = this.available.remove();
        if (clip == undefined){
            return null;
        }
        this.unavailable.push(clip);
        if (varyPitch){
            clip.playbackRate = 1 + getRandomFloat(-this.pitchVariance, this.pitchVariance);
        }
        else{
            clip.playbackRate = 1;   
        }

        clip.volume = volume;
        clip.play();
    }
}

