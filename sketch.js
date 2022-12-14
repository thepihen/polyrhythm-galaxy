//p5.js sketch file (with p5 in instance mode we can rename this file)
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
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

var score = 0;

//use p5 in instance mode
p5_instance = function (p5c) {

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

  //arrays containing circles ("rhythm hits / beats") for left and right side
  //it would be better to use a queue to manage these
  //we set their lengt to 200
  var leftCircles = new Array(200);
  var rightCircles = new Array(200);
  var leftElem = 0;
  var rightElem = 0;
  var firstElemInGameL = 0;
  var firstElemInGameR = 0;
  var lastElemL = 0;
  var lastElemR = 0;
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
      this.flag = 0;

      this.windowW = p5c.windowWidth;
      this.windowH = p5c.windowHeight;
      //side: 0 left,1 right
      //this.side = 0 + (this.x == xLine2);
      //this.fillColor = p5c.color(50+200*(1-this.side), 10, 50+200*(this.side))
    }
    //TODO: delete id field
    initialise(x, y, v, id) {
      this.x = x
      this.y = y
      this.flag = 1;
      this.speed = v
      this.side = 0 + (this.x == xLine2);
      this.fillColor = p5c.color(50 + 200 * (1 - this.side), 10, 50 + 200 * (this.side))
      this.id = id;
    }
    toggle() {
      this.flag = 0;
      this.x = 0;
      this.y = 0;
      this.speed = 0;
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

        //TODO: move this check to the main function

        //update firstElemInGameL by finding the next element in leftCircles
        //which is active (its flag is 1)
        this.flag = 0;
        if (this.side == 0) {
          let j = firstElemInGameL;
          while (leftCircles[j].flag == 0) {
            j++;
            j = j % leftCircles.length;
          }
          firstElemInGameL = j;
        }
        else if (this.side == 1) {
          let j = firstElemInGameR;
          while (rightCircles[j].flag == 0) {
            j++;
            j = j % rightCircles.length;
          }
          firstElemInGameR = j;
        }
      }
    }
    /*
    if (this.side == 0) {
      leftCircles.splice(0, 1)
    } else if (this.side == 1) {
      rightCircles.splice(0, 1)
    }
    */
    /*
    show(): draws circle on the canvas
    */
    //TODO delete id part
    show() {
      if (this.flag) {
        p5c.fill(this.fillColor);
        p5c.strokeWeight(1);
        p5c.stroke(12)
        p5c.ellipse(this.x, this.y, this.radius, this.radius);
        //show a p5.js text beside the circle with its id
        p5c.text(this.id, this.x + this.radius, this.y + this.radius)
      }
    }
  }
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
    startCircleArrays();
  }
  startCircleArrays = function () {
    for (let i = 0; i < leftCircles.length; i++) {
      leftCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
    for (let i = 0; i < rightCircles.length; i++) {
      rightCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
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
      //write a text in p5.js displaying firstElemnInGameL
      p5c.text(firstElemInGameL, 100, 100)
      //write a text in p5.js displaying firstElemInGameR
      p5c.text(firstElemInGameR, 100, 200)
      //write a text in p5.js displaying "Score: " and the score
      p5c.text("Score: " + score, 100, 300)
      //write a text in p5.js displaying "Left elements: " and leftElem
      p5c.text("Left elements: " + leftElem, 150, 400)

      //we're in the game, draw the reference and update and show the cirlces
      drawReference();
      if (pageFoc) {
        let nL = firstElemInGameL + leftElem
        let nR = firstElemInGameR + rightElem
        let counterL = 0;
        let counterR = 0;
        //TODO: solve an error: deleting for example element 1 implies
          //leftElem-- but firstElemInGameL is still 0
          //This means we're counting one less element than we should 

        //TODO write a better fix
        for (let i = firstElemInGameL; i < nL; i++) {
          if (leftCircles[i % leftCircles.length].flag == 0) {
            counterL++;
          }
        } 
        for (let i = firstElemInGameR; i < nR; i++) {
          if (rightCircles[i % rightCircles.length].flag == 0) {
            counterR++;
          }
        }
        nL = nL + counterL
        nR = nR + counterR

        for (let i = firstElemInGameL; i < nL; i++) {
          leftCircles[i % leftCircles.length].update();
          leftCircles[i % leftCircles.length].show();
        }
        for (let i = firstElemInGameR; i < firstElemInGameR + rightElem; i++) {
          rightCircles[i % rightCircles.length].update();
          rightCircles[i % rightCircles.length].show();
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

        //TODO: DELETE ID
        rightCircles[lastElemR].initialise(xLine2, 0, v, lastElemR);
        lastElemR++;
        if (lastElemR == rightCircles.length)
          lastElemR = 0;
        rightElem++;
      } else if (side == 'l') {
        leftCircles[lastElemL].initialise(xLine1, 0, v, lastElemL);
        lastElemL++;
        if (lastElemL == leftCircles.length)
          lastElemL = 0;
        leftElem++;
      }
    }
    /* 
    drawReference(): draws the guide
    */
    drawReference = function () {
      p5c.stroke(240);
      p5c.strokeWeight(1);
      p5c.line(xLine1, 0, xLine1, p5c.height);
      p5c.line(xLine2, 0, xLine2, p5c.height);
      p5c.line(0, yLineH, p5c.width, yLineH)
      p5c.fill(12);
      p5c.strokeWeight(4);
      p5c.stroke(240, 240, 10)
      p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);
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
      //TODO: make this so it works only with active circles
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
        for (let i = firstElemInGameL; i < firstElemInGameL + leftElem; i++) {
          let k = i % leftCircles.length;
          let c = leftCircles[k];
          if (c.flag == 1 && c.y < yLineH - guideRadius) {
            return //no point looking for further hits
          }
          if (Math.abs(c.y - yLineH) <= guideRadius) {
            hitL = true;
            //play sound
            hit.play();
            //TODO calculate the points
            //add points to the score of the player proportionally to the
            //inverse of the distance between the circle and the reference yLineH
            score = score + Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)));

            //delete circle(s)
            leftCircles[k].toggle();

            //check if the element is the first one in the game; if so,
            //update firstElemInGameL to the next element which is active
            //(its flag is 1)
            if (k == firstElemInGameL) {
              //update firstElemInGameL by finding the next element in leftCircles
              //which is active (its flag is 1)
              let j = firstElemInGameL;
              while (leftCircles[j].flag == 0) {
                j++;
                j = j % leftCircles.length;
              }
              firstElemInGameL = j;
            }
            /*
            if(k == firstElemInGameL){
            //calculate the points
            firstElemInGameL++;
            firstElemInGameL = firstElemInGameL % leftCircles.length;
            }*/
            leftElem--;
          }
        }
        /*
        leftCircles.forEach((item, i) => {
          let c = leftCircles[i];
          if (Math.abs(c.y - yLineH) <= guideRadius) {
            hitL = true;
            //play sound
            hit.play();
            //delete circle(s)
            leftCircles.splice(i, 1)
            //calculate the points
          }
        });
        */
        if (!hitL) {
          miss.play();
          //point penalty / error count
        }
      }
      if (key == 'k' || key == 'K') {
        let hitR = false;
        for (let i = firstElemInGameR; i < firstElemInGameR + rightElem; i++) {
          let k = i % rightCircles.length;
          let c = rightCircles[k];
          if (c.flag == 1 && c.y < yLineH - guideRadius)
            return //no point looking for further hits
          if (Math.abs(c.y - yLineH) <= guideRadius) {
            hitR = true;
            //play sound
            hit.play();
            //TODO calculate the poin
            score = score + Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)));
            //delete circle(s)
            rightCircles[k].toggle();
            ts
            if (k == firstElemInGameR) {
              //update firstElemInGameL by finding the next element in leftCircles
              //which is active (its flag is 1)
              let j = firstElemInGameR;
              while (rightCircles[j].flag == 0) {
                j++;
                j = j % rightCircles.length;
              }
              firstElemInGameR = j;
            }
            /*
            if(k == firstElemInGameL){
            //calculate the points
            firstElemInGameL++;
            firstElemInGameL = firstElemInGameL % leftCircles.length;
            }*/
            rightElem--;
          }
        }
        /*
        rightCircles.forEach((item, i) => {
          let c = rightCircles[i];
          if (Math.abs(c.y - yLineH) <= guideRadius) {
            hitR = true;
            //play sound
            hit.play();
            //delete circle(s)
            rightCircles.splice(i, 1)
            //calculate the points
          }
        });*/
        if (!hitR) {
          miss.play();
          //point penalty / error count
        }
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

  }

myp5 = new p5(p5_instance)

document.onblur = function () {
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