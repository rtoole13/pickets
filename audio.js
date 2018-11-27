"use strict";

var audio_bugle = new Audio('assets/audio/Bugle_Tune.mp3');

//audio_bugle.ended to check if still playing.
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