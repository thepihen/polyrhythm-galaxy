//p5.js sketch file (with p5 in instance mode we can rename this file)
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
IMPORTANT:
this version has a major bug:
we assume the frameRate is a fixed 60 fps, but it isn't.
That means the speed of the beats is different one from another.
DON'T USE THIS FILE UNTIL IT IS FIXED

TODO:
Should we implement a queue for managing circles?
Use a non-changing array for circles, just reset them
Add bonuses for streaks
*/

//const Synth = new Tone.Synth().toDestination()


/*
Tone stuff
*/
/*
Tone.Transport.bpm.value = 80;
// start/stop the oscillator every quarter note
Tone.Transport.scheduleRepeat(time => {
  osc.start(time).stop(time + 0.1);
}, "4n");
Tone.Transport.start();
// ramp the bpm to 120 over 10 seconds
Tone.Transport.bpm.rampTo(120, 10);
*/

//needed until we find a better way to track document focus changes
//(see bottom of this file)
//this just tracks the state
var pageFoc = true;


//use p5 in instance mode
p5_instance = function(p5c) {

  /*
  Variables we will use in preload()
  */
  var hit; //hit.wav (sound played when you successfully hit a note)
  var miss; //miss.wav (sound played when you miss a note)
  var font; //font used for text
  var met1; //higher pitched hit of metronome
  var met2; //lower pitched hit of metronome

  /*
  Variables related to bpm and polyrhythms
  bpm = track bpm
  leftR = left side rhythm
  rightR = right side rhythm
  interval = time distance between beats [in seconds]
  errorL = error in seconds committed each bar, left side
  errorR = same error but for the right side
  */
  var bpm;
  var leftR;
  var rightR;
  var interval;
  var hitRightL;
  var hitRightLCircleGlowRadius;
  var hitRightR;
  var hitRightRCircleGlowRadius;


//frameRate (need this to use it outside of )
  var frate;
  /*
  preload: function that gets automatically by p5js before loading the sketch.
  ->Everything that needs to be available when the sketch starts needs to be loaded here
  (e.g. fonts, sounds,...)
  */
  p5c.preload = function () {
    //soundFormats('wav');
    hit = p5c.loadSound('assets/hit.wav');
    miss = p5c.loadSound('assets/miss.wav')
    met1 = p5c.loadSound('assets/met1.wav');
    met2 = p5c.loadSound('assets/met2.wav');
    //font = loadFont("Roboto")
  }


  var started; //bool: T if we're in the game, F is we're in the menu

  /*
  Variables needed to draw the visual guide; might need a better solution for this in
  the future if we want more vertical lines (more rhythms)
  */
  var xLine1;
  var xLine2;
  var yLineH;
  var gGuideL;
  var bGuideL;
  var gGuideR;
  var bGuideR;
//arrays containing circles ("rhythm hits / beats") for left and right side
//it would be better to use a queue to manage these
  var leftCircles = [];
  var rightCircles = [];
  var leftQualities = [];
  var rightQualities = [];

  /*
  setup(): function that gets called by p5.js at startup. Initialise variables
  needed in the sketch here; load audio files, fonts, etc, in preload() instead
  */
  p5c.setup = function () {
    p5c.createCanvas(p5c.windowWidth, p5c.windowHeight);
    /*
    see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
    There's no need for the audio context to be running as soon as the page is loaded
    */
    p5c.getAudioContext().suspend();
    p5c.frameRate(60) //this doesn't hope but it's like lighting a candle
    //in a church hoping for a miracle

    //initialise guide coordinates
    xLine1 = p5c.width / 2 - p5c.width / 12;
    xLine2 = p5c.width / 2 + p5c.width / 12;
    yLineH = 3 / 4 * p5c.height;
    started = false;
    font = p5c.textFont('Roboto', 30)

    bpm = 120;
    // 4 vs 3 polyrhythm for testing, ideally we will get input from user
    leftR = 4;
    rightR = 3;

    Tone.Transport.bpm.value = bpm;

    interval = 60 / bpm;
    //time between notes on the L(eft) side and R(ight) side
    intervalL = 4 * 1 / leftR * 60 / bpm;
    intervalR = 4 * 1 / rightR * 60 / bpm;
    hitRightL = false;
    hitRightLCircleGlowRadius = 1;
    hitRightR = false;
    hitRightRCircleGlowRadius = 1;
    gGuideR = 191;
    bGuideR = 0;
    gGuideL = 191;
    bGuideL = 0;
  }


  var guideRadius = 30; //radius of guide circles
  var counter = 0; //not used now, might be used to count frames IN GAME
  var rhythm_rad = 20; //radius of rhythm circles

  /*
  draw(): p5js function that gets automatically called once per frame
  (by default 60 frames per second)
  */
  p5c.draw = function () {
    p5c.background(12);
    //console.log(frameRate())
    if (started) {
      //we're in the game, draw the reference and update and show the cirlces
      drawReference();
      if (pageFoc) {
        leftCircles.forEach((item, i) => {
          leftCircles[i].update()
          leftCircles[i].show()
        });
        rightCircles.forEach((item, i) => {
          rightCircles[i].update()
          rightCircles[i].show()
        });

        leftQualities.forEach((item, i) => {
          if(leftQualities[i] != null){
            leftQualities[i].show();
          }
        });
        rightQualities.forEach((item, i) => {
          if(rightQualities[i] != null){
            rightQualities[i].show();
          }
        });

        if (hitRightL) {
          leftHitAnimation();
        }
        if (hitRightR) {
          rightHitAnimation();
        }
      }
    } else {
      //we're in the menu
      p5c.fill(10, 240, 10)
      p5c.rectMode(p5c.CENTER)
      p5c.rect(p5c.width / 2, p5c.height / 2, 200, 200);
      p5c.fill(240)
      p5c.textFont(font)
      p5c.textAlign(p5c.CENTER)
      p5c.text("Click\nto start :)", p5c.width / 2, p5c.height / 2);
    }
  }

  var v; //speed of circles in [pixel/frame]
  /*
  addCircle(side): adds one beat circle to the specified side
  $side can have to values:
  r: add one circle right side
  l: add one circle left side
  */
  addCircle = function (side) {
    v = yLineH / (60 / bpm * 8 * p5c.frameRate()); //speed necessary to reach guide after 8 beats
    //Circle([ xCenter, yCenter, radius, velocity (pixel/frame) ])
    if (side == 'r') {
      rightCircles.push(new Circle([xLine2, 0, rhythm_rad, v]))
    } else if (side == 'l') {
      leftCircles.push(new Circle([xLine1, 0, rhythm_rad, v]))
    }
  }
  addQuality = function (side,text,r,g,b) {
    //Quality([text,r,g,b,dim,x,y])
    if (side == 'r') {
      rightQualities.push(new Quality([text,r,g,b,50,xLine2 + 100 + Math.random()*10,yLineH + Math.random()*50]))
    } else if (side == 'l') {
      leftQualities.push(new Quality([text,r,g,b,50,xLine1 - 100 + Math.random()*10,yLineH + Math.random()*50]))
    }
    if(leftQualities.length > 1){
      leftQualities[0] = null;
      setTimeout(() =>{leftQualities = [leftQualities[1]]},1);
    }
    if(rightQualities.length > 1){
      rightQualities[0] = null;
      setTimeout(() =>{rightQualities = [rightQualities[1]]},1);
    }
  }
  /*
  drawReference(): draws the guide
  */
  drawReference = function () {
    /*p5c.stroke(0);
    p5c.strokeWeight(2);
    p5c.line(xLine1, 0, xLine1,p5c.height);
    p5c.line(xLine2, 0, xLine2,p5c.height);
    p5c.line(0,yLineH,p5c.width,yLineH);*/
    p5c.fill(12);
    p5c.strokeWeight(4);
    p5c.stroke(255, gGuideL, bGuideL); // 255, 255, 143
    p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);
    p5c.stroke(255, gGuideR, bGuideR);
    p5c.ellipse(xLine2, yLineH, guideRadius, guideRadius);
  }
  /*
  windowResized(): p5js function that gets called every time the window
  gets resized; recalculate here all the variables that contain coordinates
  in their formulas
  */
  p5c.windowResized = function () {
    p5c.removeElements();
    p5c.resizeCanvas(p5c.windowWidth, p5c.windowHeight);
    xLine1 = p5c.width / 2 - p5c.width / 12;
    xLine2 = p5c.width / 2 + p5c.width / 12;
    yLineH = 3 / 4 * p5c.height;
    v = yLineH / (60 / bpm * 8 * p5c.frameRate());
    //recenter circles on the lines
    leftCircles.forEach((item, i) => {
      let c = leftCircles[i];
      c.setNewCoords(xLine1, p5c.map(c.y, 0, c.windowH, 0, p5c.windowHeight), p5c.windowWidth, p5c.windowHeight)
      c.updateVelocity(v)
    });
    rightCircles.forEach((item, i) => {
      let c = rightCircles[i];
      c.setNewCoords(xLine2, p5c.map(c.y, 0, c.windowH, 0, p5c.windowHeight), p5c.windowWidth, p5c.windowHeight)
      c.updateVelocity(v)
    });
  }
  /*
  mousePressed(): p5js function that gets called every time a mouse button
  is pressed / the touchscreen is touched.
  We start the AudioContext here with userStartAudio()
  */
  p5c.mousePressed = function () {
    if (!started) {
      p5c.userStartAudio();
      Tone.start();
      started = true;
      Tone.Transport.start();
      startToneLoops(leftR, rightR);
      startMetronome(bpm)
    }
    //addCircle('l')
    //addCircle('r')
    //intervalLflag = setInterval(addCircle, intervalL * 1000, 'l');
    //intervalRflag = setInterval(addCircle, intervalR * 1000, 'r');
  }

  function startToneLoops(intL, intR) {
    Tone.Transport.scheduleRepeat(time => {
      addCircle('l')
    }, intL + "n");
    Tone.Transport.scheduleRepeat(time => {
      addCircle('r')
    }, intR + "n");
  }

  /*
  keyPressed(): p5js function that gets called every time a key is pressed.
  Use key to get the specific key.
  We see here for now if a beat circle is overlapping with the reference;
  points will later need to be assigned based on how much the circle
  was overlapping with the reference.
  The circle will also need to be deleted
  */

  p5c.keyPressed = function () {
    let key = p5c.key;

    //check if any of the active circles is overlapping with the
    //reference
    if (key == 's' || key == 'S') {
      let hitL = false;
      leftCircles.forEach((item, i) => {
        let c = leftCircles[i];
        let point = Math.abs(c.y - yLineH);
        if (point <= guideRadius) {
          hitL = true;
          //play sound
          hit.play();
          //delete circle(s)
          leftCircles.splice(i, 1)
          //calculate the points
          //hit animations
          setTimeout(() => {
                hitRightL = true;
                gGuideL = 255;
                bGuideL = 143;
                setTimeout(() => {
                  hitRightL = false;
                  gGuideL = 190;
                  bGuideL = 0;
                  hitRightLCircleGlowRadius = 1;
                }, 300);
              }
              , 50);
          //hit quality
          if (point <= 2) {
            //awesome
            addQuality('l','Awesome', 190,255,34);
          }
          if (point > 2 && point <= 7) {
            //great
            addQuality('l','Great', 190,255,34);
          }
          if (point > 7 && point <= 13) {
            //ok
            addQuality('l','Ok', 190,255,34);
          }
          if (point > 13 && point <= 20) {
            //bad
            addQuality('l','Bad', 190,255,34);
          }
          if (point > 20) {
            //terrible
            addQuality('l','Terrible', 190,255,34);
          }
        }
      });
      if (!hitL) {
        miss.play();
        //point penalty / error count
      }
    }
    if (key == 'k' || key == 'K') {
      let hitR = false;
      rightCircles.forEach((item, i) => {
        let c = rightCircles[i];
        let point = Math.abs(c.y - yLineH);
        if (Math.abs(c.y - yLineH) <= guideRadius) {
          hitR = true;
          //play sound
          hit.play();
          //delete circle(s)
          rightCircles.splice(i, 1)
          //calculate the points
          setTimeout(() => {
                hitRightR = true;
                gGuideR = 255;
                bGuideR = 143;
                setTimeout(() => {
                  hitRightR = false;
                  gGuideR = 190;
                  bGuideR = 0;
                  hitRightRCircleGlowRadius = 1;
                }, 300);
              }
              , 50);

          //hit quality
          if (point <= 2) {
            //awesome
            addQuality('r','Awesome', 190,255,34);
          }
          if (point > 2 && point <= 7) {
            //great
            addQuality('r','Great', 190,255,34);
          }
          if (point > 7 && point <= 13) {
            //ok
            addQuality('r','Ok', 190,255,34);
          }
          if (point > 13 && point <= 20) {
            //bad
            addQuality('r','Bad', 190,255,34);
          }
          if (point > 20) {
            //terrible
            addQuality('r','Terrible', 190,255,34);
          }
        }
      });
      if (!hitR) {
        miss.play();
        //point penalty / error count
      }
    }
  }

  function leftHitAnimation() {
    p5c.noStroke();
    p5c.fill(255, 255, 100, 2);
    for (i = 0; i < hitRightLCircleGlowRadius; i++) {
      p5c.ellipse(xLine1, yLineH, i * 3);
    }
    if (hitRightLCircleGlowRadius <= 100) {
      hitRightLCircleGlowRadius += 2;
    }
  }

  function rightHitAnimation() {
    p5c.noStroke();
    p5c.fill(255, 255, 100, 2);
    for (i = 0; i < hitRightRCircleGlowRadius; i++) {
      p5c.ellipse(xLine2, yLineH, i * 3);
    }
    if (hitRightRCircleGlowRadius <= 100) {
      hitRightRCircleGlowRadius += 2;
    }
  }

  /*
  startMetronome(): starts a metronome for reference. Calls metroSound()
  to make sound*/
  var metroFlag = 0;
  startMetronome = function () {
    Tone.Transport.scheduleRepeat(time => {
      metroSound()
    }, "4n");
  }

  /*
  metroSound(): produces the correct metronome sound based on the beat
  */
  metroSound = function () {
    if (metroFlag == 4) {
      /*
      addCircle('l')
      addCircle('r')
      setInterval(addCircle, intervalL * 1000, 'l');
      setInterval(addCircle, intervalR * 1000, 'r');
      */
    }
    if (metroFlag % 4 == 0) {
      met1.play()
    } else {
      met2.play();
    }
    metroFlag += 1;
  }

  /*
  Circle(): class representing a beat circle.
  Constructor: Circle([ xCenter, yCenter, radius, velocity (pixel/frame) ])
  */
  class Circle {
    /*
    params:
    x,y,radius?, color, speed,...
    */
    constructor(params) {
      this.x = params[0]
      this.y = params[1]
      this.radius = params[2]
      //this.color = params[3]
      this.speed = params[3]
      this.flag = 1;

      this.windowW = p5c.windowWidth;
      this.windowH = p5c.windowHeight;
      //side: 0 left,1 right
      this.side = 0 + (this.x == xLine2);
      this.fillColor = p5c.color(50 + 200 * (1 - this.side), 10, 50 + 200 * (this.side))
    }

    /*
    setNewCoords(): allows user to set new coordinates for the circle.
    Useful for recentering circles when the window gets resized
    
    newX,newY: new coordinates
    windowW, windowH: new windowWidth and windowHeight (which may be equal to
    the old ones if the window didn't get resized when this got called)
    */
    setNewCoords(newX, newY, windoW, windowH) {
      this.x = newX
      this.y = newY
      this.windowW = p5c.windowWidth;
      this.windowH = p5c.windowHeight;
    }

    updateVelocity(newV) {
      this.speed = newV;
    }

    /*
    update(): updates circle position
    */
    update() {
      this.speed = yLineH / (60 / bpm * 8 * p5c.frameRate());
      this.y = this.y + this.speed;
      //check here if user missed it
      if (this.y - this.radius > p5c.windowHeight) {
        //delete circles from array
        //important assumption: 
        //the circle that reaches the bottom always has position 1
        //in the array
        if (this.side == 0) {
          leftCircles.splice(0, 1)
        } else if (this.side == 1) {
          rightCircles.splice(0, 1)
        }
      }
    }

    /*
    show(): draws circle on the canvas
    */
    show() {
      if (this.flag) {
        p5c.fill(this.fillColor);
        p5c.strokeWeight(1);
        p5c.stroke(12)
        p5c.ellipse(this.x, this.y, this.radius, this.radius);
      }
    }
  }

  class Quality {
    /*
    params:
    text, color, dim ...
    */
    constructor(params) {
      this.text = params[0]
      this.r = params[1]
      this.g = params[2]
      this.b = params[3]
      this.dim = params[4]
      this.x = params[5]
      this.y = params[6]
      this.flag = 1;
    }
    /*
    show(): draws text on the canvas
    */
    show() {
      if (this.flag) {
        p5c.textSize(this.dim);
        p5c.fill(this.r, this.g, this.b);
        p5c.text(this.text, this.x, this.y);
      }
    }
  }
}
myp5 = new p5(p5_instance)

document.onblur = function(){
  //pause audio and do not update circles
  Tone.Transport.pause();
  pageFoc = false;
  //pause the game
}
document.onfocus = function () {
  //resume audio and update circles
  Tone.Transport.start();
  pageFoc = true;
}