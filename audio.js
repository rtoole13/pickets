"use strict";

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
        this._muted = false;
        this._globalVolumeScale = 1;
        //create AudioPools
        this.audioPools = {};
        this.loadingPools = [];
        this.initializePools();
        this.loaded = false;

        //create AudioGroups
        this.audioGroups = {};
        this.initializeAudioGroups();

        //managed clips
        this.managedClips = [];
    }

    get muted(){
        return this._muted;
    }

    set muted(value){
        if (typeof(value)!='boolean'){
            return;
        }
        this._muted = value; 
    }

    get globalVolumeScale(){
        return this._globalVolumeScale;
    }

    set globalVolumeScale(value){
        if (value <= 0){
            this._globalVolumeScale = 0;
        }
        else if (value >= 1){
            this._globalVolumeScale = 1;
        }
        else{
            this._globalVolumeScale = value;
        }
    }

    checkForLoadedPools(){
        for (var i = 0; i < this.loadingPools.length; i++){
            var id = this.loadingPools[i];
            if (this.audioPools[id].loadedCount >= this.audioPools[id].count){
                this.loadingPools.splice(i,1);
                return this.audioPools[id].clipURL;
            }
        }
        if (this.loadingPools.length == 0){
            this.loaded = true;
        }
        return null
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
        this.initializePool('assets/audio/cannonfire/cannon1.ogg', 3, 0.1, 'cannon1');
        this.initializePool('assets/audio/cannonfire/cannon2.ogg', 3, 0.1, 'cannon2');
        this.initializePool('assets/audio/cannonfire/cannon3.ogg', 3, 0.1, 'cannon3');
        this.initializePool('assets/audio/mouse/click.ogg', 3, 0.3, 'click1');
        this.initializePool('assets/audio/ambient/farm.ogg', 2, 0, 'farm');
        this.initializePool('assets/audio/orders/attackmove.ogg', 1, 0.2, 'attackmove');
        this.initializePool('assets/audio/orders/fallback1.ogg', 1, 0.2, 'fallback1');
        this.initializePool('assets/audio/orders/fallback2.ogg', 1, 0.2, 'fallback2');
        this.initializePool('assets/audio/orders/move1.ogg', 1, 0.2, 'move1');
        this.initializePool('assets/audio/orders/move2.ogg', 1, 0.2, 'move2');
        this.initializePool('assets/audio/orders/move3.ogg', 1, 0.2, 'move3');
    }
    initializeAudioGroups(){
        var skirmishDict, battleDict, artilleryDict, clickDict, ambientDict, attackmoveDict, moveDict, fallbackDict;
        
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
            cannon1 : 1,
            cannon2 : 1,
            cannon3 : 1
        }
        clickDict = {
            click1: 1
        }
        ambientDict = {
            farm: 1
        }
        attackmoveDict = {
            attackmove: 1
        }
        moveDict = {
            move1: 1,
            move2: 1,
            move3: 1
        }
        fallbackDict = {
            fallback1: 1,
            fallback2: 1
        }

        this.initializeAudioGroup('skirmish', 1, skirmishDict);
        this.initializeAudioGroup('battle', 1, battleDict);
        this.initializeAudioGroup('artillery', 0.65, artilleryDict);
        this.initializeAudioGroup('click', 0.3, clickDict, 300);
        this.initializeAudioGroup('ambient', 1, ambientDict);
        this.initializeAudioGroup('move', 0.5, moveDict, 250);
        this.initializeAudioGroup('attackmove', 0.2, attackmoveDict, 500);
        this.initializeAudioGroup('fallback', 0.2, fallbackDict, 250);
    }

    initializePool(clip, count, pitchVariance, id){
        this.audioPools[id] = new AudioPool(clip, count, pitchVariance, id);
        this.loadingPools.push(id);
    }

    initializeAudioGroup(id, volume, clipDict, minimumInterval){
        var audioGroup = new AudioGroup(volume, minimumInterval);

        for (var poolID in clipDict){
            audioGroup.addClip(poolID, clipDict[poolID]);
        }
        this.audioGroups[id] = audioGroup;
    }

    playAudioGroup(id, varyPitch){
        if (this.muted){
            return;
        }
        var audioGroup, poolID;
        audioGroup = this.audioGroups[id];
        if (audioGroup.canPlay()){
            poolID = audioGroup.getRandomClip();
            this.audioPools[poolID].playAvailableClip(varyPitch, audioGroup.volume);
            audioGroup.canPlayTimer.start();
        }

    }

    fadeInAudioGroup(id, varyPitch, startVolume, endVolume, fadeDuration, completionCallback){
        if (this.muted){
            return;
        }
        var audioGroup, poolID, clip, timer;
        audioGroup = this.audioGroups[id];
        poolID = audioGroup.getRandomClip();

        clip = this.audioPools[poolID].playAvailableClip(varyPitch, startVolume);
        if (clip == null){
            return;
        }
        timer = new Timer(fadeDuration, false);
        timer.start();
        this.managedClips.push({id: id, clipType: 'fadeIn', clip: clip, startVolume: startVolume, volumeDiff: endVolume - startVolume, 
                                duration: fadeDuration, timer: timer, callback: completionCallback});   
    }

    fadeOutAudioGroup(id, varyPitch, startVolume, endVolume, fadeDuration, completionCallback){
        if (this.muted){
            return;
        }
        var audioGroup, poolID, clip, clipDuration, delayTime, delayTimer, timer;
        audioGroup = this.audioGroups[id];
        poolID = audioGroup.getRandomClip();

        clip = this.audioPools[poolID].playAvailableClip(varyPitch, startVolume);
        if (clip == null){
            return;
        }
        clipDuration = clip.duration * 1000;
        delayTime = clipDuration - fadeDuration;
        delayTimer = new Timer(delayTime, false);//fine if negative
        delayTimer.start();

        fadeDuration = (delayTime <= 0)? clipDuration : fadeDuration;
        timer = new Timer(fadeDuration, false);
        
        this.managedClips.push({id: id, clipType: 'fadeOut', clip: clip, startVolume: startVolume, volumeDiff: endVolume - startVolume, 
                                duration: fadeDuration, delayTimer: delayTimer, timer: timer, began: false, callback: completionCallback});
    }
    
    crossFadeLoopAudioGroup(id, varyPitch, startVolume, maxVolume, crossFadeDuration){
        if (this.muted){
            return;
        }
        var audioGroup, poolID, clip, clipDuration, fadeOutDelayTime, fadeOutDelayTimer, crossFadeTimer;
        audioGroup = this.audioGroups[id];
        poolID = audioGroup.getRandomClip();

        clip = this.audioPools[poolID].playAvailableClip(varyPitch, startVolume);
        if (clip == null){
            return;
        }
        clipDuration = clip.duration * 1000;
        fadeOutDelayTime = clipDuration - crossFadeDuration;
        if (fadeOutDelayTime < 0){
            throw 'Cross fade duration must be shorter than the clip duration!!'
        }

        fadeOutDelayTimer = new Timer(fadeOutDelayTime, false);
        fadeOutDelayTimer.start();

        crossFadeTimer = new Timer(crossFadeDuration, false);
        crossFadeTimer.start();
        this.managedClips.push({id: id, varyPitch : varyPitch, clipType: 'crossFadeLoop', clip: clip, startVolume: startVolume, maxVolume: maxVolume, 
                                duration: crossFadeDuration, crossFadeDelayTimer: fadeOutDelayTimer, crossFadeTimer: crossFadeTimer, began: false});   
    }
    
    update(){
        this.updateManagedClips();
        this.updatePools();
    }

    updateManagedClips(){
        for (var i = 0; i < this.managedClips.length; i++){
            if (this.updateManagedClip(this.managedClips[i])){
                //Managed clip finished with active management.
                this.managedClips.splice(i,1);
                i -= 1;
            }
        }
    }

    updateManagedClip(clipDict){
        if (clipDict.clipType == 'fadeIn'){
            if (clipDict.timer.checkTime()){
                if (clipDict.clip.ended){
                    if (clipDict.completionCallback != undefined || clipDict.completionCallback != null ){
                        clipDict.completionCallback();
                    }
                    return true;
                }
                clipDict.currentVolume = clampFloat(clipDict.startVolume + clipDict.volumeDiff, 0, 1);
            }
            else{
                clipDict.currentVolume = clampFloat(clipDict.startVolume + clipDict.volumeDiff, 0, 1);
            }
            if (this.muted){
                clipDict.clip.volume = 0;
            }
            else{
                clipDict.clip.volume = clipDict.currentVolume;
            }
            return false;
        }
        else if (clipDict.clipType == 'fadeOut'){
            if (clipDict.began){
                if (clipDict.timer.checkTime()){
                    if (clipDict.completionCallback != undefined || clipDict.completionCallback != null ){
                        clipDict.completionCallback();
                    }
                    return true;
                }
                clipDict.currentVolume = clampFloat(clipDict.startVolume + clipDict.volumeDiff * clipDict.timer.getElapsedTime() / clipDict.duration, 0, 1);
            }
            else{
                clipDict.currentVolume = clipDict.startVolume;
                if (clipDict.delayTimer.checkTime()){
                    clipDict.began = true;
                    clipDict.timer.start();
                }
            }
            if (this.muted){
                clipDict.clip.volume = 0;
            }
            else{
                clipDict.clip.volume = clipDict.currentVolume;
            }
            return false;
        }
        else if (clipDict.clipType == 'crossFadeLoop'){
            var volumeDiff = clipDict.maxVolume - clipDict.startVolume;
            if (clipDict.began){
                if (clipDict.crossFadeTimer.checkTime()){
                    return true;
                }
                clipDict.currentVolume = clampFloat(clipDict.maxVolume - (volumeDiff * clipDict.crossFadeTimer.getElapsedTime() / clipDict.duration), 0, 1);
            }
            else{
                if (!clipDict.crossFadeTimer.checkTime()){
                    clipDict.currentVolume = clampFloat(clipDict.startVolume + volumeDiff * clipDict.crossFadeTimer.getElapsedTime() / clipDict.duration, 0, 1);
                }
                if (clipDict.crossFadeDelayTimer.checkTime()){
                    this.crossFadeLoopAudioGroup(clipDict.id, clipDict.varyPitch, clipDict.startVolume, clipDict.maxVolume, clipDict.duration);
                    clipDict.began = true;
                    clipDict.crossFadeTimer.start();
                }
            }
            if (this.muted){
                clipDict.clip.volume = 0;
            }
            else{
                clipDict.clip.volume = clipDict.currentVolume;
            }
            return false;
        }

        throw 'Unexpected clip type!!';
    }

    killManagedClips(){
        for (var i = 0; i < this.managedClips.length; i++){
            this.managedClips[i].clip.volume = 0;
            this.managedClips.splice(i, 1);
        }
    }

    updatePools(){
        var unavailableSum = 0;
        for (var id in this.audioPools){
            unavailableSum += this.audioPools[id].checkUnavailable();
        }
    }


}

class AudioGroup {
    constructor(volume, minimumInterval){
        this.clips = [];
        this.weights = [];
        this.rollingWeights = [];
        this.volume = volume;
        this.totalWeight = 0;
        this.minimumInterval = (minimumInterval == undefined) ? 0 : minimumInterval;
        this.canPlayTimer = new Timer(this.minimumInterval, false);
        this.canPlayTimer.shortTimer();
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

    canPlay(){
        if (this.canPlayTimer.checkTime()){
            return true;
        }
        return false;
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
        this.loadedCount = 0;
        this.loaded = false;

        var audio;
        for (var i = 0; i < count; i++){
            audio = new Audio(clipURL);
            audio.canplay = onAudioLoad(this);
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
        return clip;
    }
}

function onAudioLoad(audioPool){
    audioPool.loadedCount += 1;
}