"use strict";

var audio_bugle = new Audio('assets/audio/Bugle_Tune.mp3');

var audio_bugle2 = new Audio('assets/audio/Bugle_Tune.mp3');
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
        
        var id = 'bugle';
        this.audioPools[id] = new AudioPool('assets/audio/Bugle_Tune.mp3', 2, 0.2, id);
        
        //create AudioGroups
        this.audioGroups = {};
        id = 'attack';
        var audioGroup = new AudioGroup(0.5);
        audioGroup.addClip('bugle', 1);
        this.audioGroups[id] = audioGroup;
    }
    playAudioGroup(id, varyPitch){
        var audioGroup, poolID;
        audioGroup = this.audioGroups[id];
        poolID = this.audioGroups[id].getRandomClip();
        this.audioPools[poolID].playAvailableClip(varyPitch, audioGroup.volume);
    }
    updatePools(){
        for (var id in this.audioPools){
            this.audioPools[id].checkUnavailable();
        }
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
    }

    playAvailableClip(varyPitch, volume){
        var clip = this.available.remove();
        if (clip == undefined){
            return null;
        }
        this.unavailable.push(clip);
        console.log(clip);
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

class AudioClip {
    constructor(clipURL, poolID){
        this.clipURL = clipURL;
        this.poolID = poolID;
        this.audio = new Audio(this.clipURL);
        this.audio.play();
        this.ended = false;
        this.audio.onended = function(){}
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
}

