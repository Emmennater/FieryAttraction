
class Sounds {
  constructor() {
    this.playing = [rocketSound];
    // rocketSound.setVolume(0);
    // rocketSound.loop();
    // burningSound.setVolume(0);
    // burningSound.loop();
  }
  
  setSoundVolume(sound, volume, time = 0.2) {
    sound.amp(volume, time);
  }
  
  startSound(sound, volume = 0.05, time = 0.2) {
    // sound.setVolume(0.2);
    sound.stop();
    sound.play();
    this.setSoundVolume(sound, volume, time);
    
    // if (!sound) return;
    // let idx = this.playing.indexOf(sound);
    // if (idx == -1) return;
    // rocketSound.volume(0.2);
  }
  
  stopSound(sound, time = 0.2) {
    // sound.setVolume(0.02);
    sound.amp(0.0, time);
    
    // if (!sound) return;
    // let idx = this.playing.indexOf(sound);
    // if (idx == -1) return;
    // sound = this.playing[idx];
    // sound.stop();
  }
  
  playRandomly(sound, volume = 0.5, pitch = 0.8) {
    let rate = Math.random() * 0.2 + pitch;
    sound.stop();
    sound.setVolume(volume);
    sound.rate(rate);
    sound.play();
  }
}

class HTMLSounds {
  constructor() {
    this.running = [];
    this.volumeSlider = document.getElementById("master-volume");
    this.master = getItem("fiery-attraction-sfx-volume") || 1.0;
    this.volumeSlider.value = 100 * this.master;
  }

  updateMaster() {
    this.master = this.volumeSlider.value / 100;
    storeItem("fiery-attraction-sfx-volume", this.master);
  }

  removeSoundFromQueue(sound) {
    for (let i = this.running.length - 1; i >= 0; --i) {
      if (this.running[i].sound == sound) {
        this.running.splice(i, 1);
      }
    }
  }

  fadeSound(sound, volume, time) {
    volume = constrain(volume * this.master, 0, 1);
    this.running.push({
      sound, volume, time, startVolume: sound.volume, startTime: time
    })
  }

  playSound(sound, volume = 0.1, stack = false) {
    volume = constrain(volume * this.master, 0, 1);
    sound.volume = volume;
    if (!stack || sound.paused) {
      sound.play();
    } else {
      sound.currentTime = 0;
    }
  }

  stopSound(sound) {
    sound.volume = 0;
    this.removeSoundFromQueue(sound);
  }
  
  runSounds(dt) {
    for (let i = this.running.length - 1; i >= 0; --i) {
      const fade = this.running[i];
      if (fade.time <= 0) {
        this.running.splice(i, 1);
        continue;
      }
      fade.time = Math.max(fade.time - dt, 0);
      fade.sound.volume = map(fade.time, fade.startTime, 0, fade.startVolume, fade.volume);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initSounds() {
  document.addEventListener('click', async function(event) {
    if (!event.isTrusted || documentClicked) return;
    documentClicked = true;

    soundTrack.volume = 0;
    titleScreenTrack.volume = 0;
    rocketSound.volume = 0;
    collisionSound.volume = 0;
    burningSound.volume = 0;
    shootSound.volume = 0;
    hitSound.volume = 0;
    explodeSound.volume = 0;

    titleScreenTrack.play();
    await sleep(50);
    soundTrack.play();
    await sleep(50);
    rocketSound.play();
    await sleep(50);
    burningSound.play();
  });
}

/*





















*/
