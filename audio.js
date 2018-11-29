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
class AudioController {
    constructor(){
        this.currentlyPlaying = [];
    }


}
class AudioGroup {
    constructor(pitchVariance){
        this.pitchVariance = pitchVariance;
        this.clips = [];
        this.weights = [];
        this.rollingWeights = [];
        this.totalWeight = 0;

        this.debugTally = [];
    }

    addClip(clip, weight){
        this.clips.push(clip);
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

        this.debugTally.push(0);
    }

    playClip(i, varyPitch){
        //play clip at index i
        var clip = this.clips[i];
        if (varyPitch){
            clip.playbackRate = 1 + getRandomFloat(-this.pitchVariance, this.pitchVariance);
        }
        else{
            clip.playbackRate = 1;   
        }
        clip.play();
    }

    playRandomClip(varyPitch){
        var ind = getRandomInt(1, this.totalWeight);
        for (var i = this.rollingWeights.length - 1; i > -1; i--){
            if (ind < this.rollingWeights[i]){
                continue;
            }
            //this.playClip(i, varyPitch);
            this.debugAddTally(i);
            break;
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
    constructor(clipURL, count){
        this.clipURL = clipURL;
        this.available = new Queue();
        this.unavailable = [];

        for (var i = 0; i < count; i++){
            var audio = new Audio(clipURL);
            var arg = this.clipURL;
            this.unavailable.push(audio);
        }
    }
    update(){

    }
    onAudioLoad(e){
        console.log(e);
        console.log(this);
    }
}

class AudioClip {
    constructor(clipURL){
        this.clipURL = clipURL;
        this.audio = new Audio(this.clipURL);
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

