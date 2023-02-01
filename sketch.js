//p5.js sketch file (with p5 in instance mode we can rename this file)
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
TODO:
Should we implement a queue for managing circles?
Use a non-changing array for circles, just reset them
Add bonuses for streaks
*/

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
var gameScore = 0;
var lifes = 3;

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
  nextLeftR = next left side rhythm
  nextRightR = next right side rhythm
  errorL = error in seconds committed each bar, left side
  errorR = same error but for the right side
  scheduleL = ID scheduled event creation left circles
  scheduleR = ID scheduled event creation left circles
  scheduleMetro = ID scheduled event metronome
  */
  var bpm;
  var leftR;
  var rightR;
  var nextLeftR;
  var nextRightR;
  var visualLeftR;
  var visualRightR;
  var visualNextLeftR;
  var visualNextRightR;
  var scheduleL;
  var scheduleR;
  var scheduleMetro
  //frameRate (need this to use it outside of )
  var frate;
  /*
  preload: function that gets automatically by p5js before loading the sketch.
  ->Everything that needs to be available when the sketch starts needs to be loaded here
  (e.g. fonts, sounds,...)
  */
  p5c.preload = function () {
    hit = p5c.loadSound('assets/hit.wav');
    hitSoundL = p5c.loadSound('assets/hitSXwav.wav');
    hitSoundR = p5c.loadSound('assets/hitDXwav.wav');
    miss = p5c.loadSound('assets/miss.wav')
    met1 = p5c.loadSound('assets/met1.wav');
    met2 = p5c.loadSound('assets/met2.wav');
    font = p5c.loadFont('assets/Montserrat-Bold.ttf');
    beat1 = p5c.loadSound('assets/BEAT1wav.wav');
    beat2 = p5c.loadSound('assets/BEAT2wav.wav');
    mult1 = p5c.loadSound('assets/mult1.wav');
    mult2 = p5c.loadSound('assets/mult2.wav');
    mult3 = p5c.loadSound('assets/mult3.wav');
    mult4 = p5c.loadSound('assets/mult4.wav');
    mult5 = p5c.loadSound('assets/mult5.wav');
    mult6 = p5c.loadSound('assets/mult6.wav');
    mult7 = p5c.loadSound('assets/mult7.wav');
    mult8 = p5c.loadSound('assets/mult8.wav');
    mult9 = p5c.loadSound('assets/mult9.wav');
    mult10 = p5c.loadSound('assets/mult10.wav');
    multFail = p5c.loadSound('assets/multFail.wav');

    //imgPodium = p5c.loadImage('assets/podium.png');
  }


  var started; //bool: T if we're in the game, F is we're in the menù
  var restart;
  var died;
  var colorMenu;
  var textMenu;

  /*
  Variables needed to draw the visual guide; might need a better solution for this in
  the future if we want more vertical lines (more rhythms)
  */
  var xLine1;
  var xLine2;
  var yLineH;

  //arrays containing circles ("rhythm hits / beats") for left and right side
  //it would be better to use a queue to manage these
  //we set their length to 200
  // Possible Rhythms 1 + [2, 4, 8, 16, 32] + [3,6,12,24] + the remainder until 24
  var basicRhythms = [2, 4, 8, 16, 32];
  var tripletRhythms = [3,6,12,24];
  var triplet ; // if include triplet rhythms
  var mindBlowing ; // if include other complicated rhythms
  var rhythmLimit; // maximum integer number as rhythm ( we assume as maximum 24 )
  var metroFlagChange; // how much next metronome beats to change rhythm
  var metroFlagChangeValues = [16]; // changes in only 4 measures, for now
  var metroColor; // number used for color of metronome ellipse
  var noReference; // if true there will not be the guide
  var rhythmTransition = false; // if true displays next rhythms
  var circlesNumber = 50;
  var leftCircles = new Array(circlesNumber);
  var rightCircles = new Array(circlesNumber);
  var leftElem = 0;
  var rightElem = 0;
  var firstElemInGameL = 0;
  var firstElemInGameR = 0;
  var lastElemL = 0;
  var lastElemR = 0;

  // BONUS STREAK STUFF
  var multiplier = 1;
  var multiplierConsecutiveHits = 0;
  var multiplierGreat = 0;
  var multiplierAmazing = 0;
  var multiplierPerfect = 0;
  var greatCounter = 0;
  var amazingCounter = 0;
  var perfectCounter = 0;
  var consecutiveHits = 0;
  var newConsecutiveHitsBonus = false;
  var lastHit = "OK";
  var lastMultiplier = 1;

  // RANKING STUFF
  var rankingDisplayed = false;
  var firstShow = true;
  var titleRanking;
  var columnRanking1 = [];
  var columnRanking2 = [];
  var columnRanking3 = [];
  var namesRanking = [];
  var pointsRanking = []
  var posRecord = 5;
  // FAKE RANKING
  namesRanking[0] = "Paolo Bestagini"
  namesRanking[1] = "Jesus Cevallos"
  namesRanking[2] = "Riccardo Giampic"
  namesRanking[3] = "Giovanni Rana"
  namesRanking[4] = "Ferruccio Resta"
  pointsRanking[0] = 50
  pointsRanking[1] = 25
  pointsRanking[2] = 15
  pointsRanking[3] = 10
  pointsRanking[4] = 5
  // TUTORIAL STUFF
  var tutorialDisplayed = false;

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
      this.flag = 0;

      this.windowW = p5c.windowWidth;
      this.windowH = p5c.windowHeight;
      this.failFlag = true;
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
      if( ( (this.y - this.radius) > (yLineH + guideRadius) ) && ( this.y - this.radius < p5c.windowHeight) ){
        if (this.failFlag){
            this.failFlag = false;
            if(lifes == 0 && died == false){
                reSetup()
            }
            else{
                miss.play();
                lastHit = "OK"
                multiplier = 1
                multiplierGreat = 0;
                multiplierAmazing = 0;
                multiplierPerfect = 0;
                multiplierConsecutiveHits = 0;
                consecutiveHits = 0;
                lifes -= 1;
            }
        }

      }
      if (this.y - this.radius > p5c.windowHeight) {
        //delete circles from array
        //important assumption: 
        //the circle that reaches the bottom always has position 1
        //in the array

        //TODO: move this check to the main function

        //update firstElemInGameL by finding the next element in leftCircles
        //which is active (its flag is 1)
        this.failFlag = true;
        this.flag = 0;
        if (this.side == 0) {
          let j = firstElemInGameL;
          while (leftCircles[j].flag == 0) {
            j++;
            j = j % leftCircles.length;
          }
          firstElemInGameL = j;
          leftElem--;
        }
        else if (this.side == 1) {
          let j = firstElemInGameR;
          while (rightCircles[j].flag == 0) {
            j++;
            j = j % rightCircles.length;
          }
          firstElemInGameR = j;
          rightElem--;
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
        //// show a p5.js text beside the circle with its id
        //p5c.text(this.id, this.x + this.radius, this.y + this.radius)
      }
    }
  }
  /*
  setup(): function that gets called by p5.js at startup. Initialise variables 
  needed in the sketch here; load audio files, fonts, etc, in preload() instead
  */
  function reSetup(){
    resetGame();
    if (gameScore > pointsRanking[4]){
        newPodium()
        dieNewRecordMenuTransition()
    }
    else{
        gameScore = 0;
        dieMenuTransition()
    }

  }

  resetGame = function () {
    started = false;
    died = true
    hitMessages[0] = ''
    hitMessages[1] = ''
    leftElem = 0;
    rightElem = 0;
    firstElemInGameL = 0;
    firstElemInGameR = 0;
    lastElemL = 0;
    lastElemR = 0;
    miss.stop();
    beat1.stop();
    beat2.stop();
    metroFlag = 0;
    Tone.Transport.cancel()
    stopCircleArrays()
    p5c.getAudioContext().resume()
    lifes = 3;
    rhythmLimit = 4;
    metroFlagChange = 0;
    multiplier = 1;
    multiplierGreat = 0;
    multiplierAmazing = 0;
    multiplierPerfect = 0;
    multiplierConsecutiveHits = 0;
    goodCounter = 0;
    greatCounter = 0;
    amazingCounter = 0;
    perfectCounter = 0;
    consecutiveHits = 0;
    triplet = false;
    mindBlowing = false;
    noReference = false;
    startCircleArrays()
  }
  p5c.setup = function () {
    canvas = p5c.createCanvas(p5c.windowWidth, p5c.windowHeight);
    /*
    see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
    There's no need for the audio context to be running as soon as the page is loaded
    */
    p5c.getAudioContext().suspend();
    p5c.frameRate(60) //this doesn't hope but it's like lighting a candle 
    //in a church hoping for a miracle
    // Trying to solve audio distortion by using a compressor

    //initialise guide coordinates
    xLine1 = p5c.width / 2 - p5c.width / 12;
    xLine2 = p5c.width / 2 + p5c.width / 12;
    yLineH = 3 / 4 * p5c.height;
    started = false;
    died = false;
    restart = true;
    colorMenu = 10;
    textMenu = 'Press the spacebar\n to start'

    //font = p5c.textFont('Montserrat', 30)

    bpm = 130;
    scheduleL = null;
    scheduleR = null;
    Tone.Transport.bpm.value = bpm;

    rhythmLimit = 4;
    metroFlagChange = 0;
    triplet = false;
    mindBlowing = false;
    noReference = false;

    // default starting rhythms
    leftR = 0; // has to be 0, don't change it
    rightR = 0; // has to be 0, don't change it
    nextLeftR = 1;
    nextRightR = 1;

    startCircleArrays();
    textUpTransition('Press the spacebar\nto start')
    // ranking stuff
    rankingButton = p5c.createDiv('')
    rankingButton.addClass('ranking_button')
    rankingButton.mouseOver(displayRanking)
    canvas.mouseOver(noDisplayRanking)


  }
  displayRanking = function () {
    if (firstShow){firstShow = false}
    rankingDisplayed = true
    titleRanking = p5c.createDiv('ENDLESS MODE GLOBAL RANKING').size(200, 70);
    titleRanking.position(p5c.width/2,p5c.height/2 - 250)
    titleRanking.addClass('ranking_text')
    for (let i = 0; i<6 ; i++){
        if(i==0){
            columnRanking1[i] = p5c.createDiv('Position').size(200, 70);
            columnRanking2[i] = p5c.createDiv('Name').size(200, 70);
            columnRanking3[i] = p5c.createDiv('Points').size(200, 70);
        }
        else{
            columnRanking1[i] = p5c.createDiv(i).size(200, 70);
            columnRanking2[i] = p5c.createDiv(namesRanking[i-1]).size(250, 70);
            columnRanking3[i] = p5c.createDiv(pointsRanking[i-1]).size(200, 70);
        }
        columnRanking1[i].position(p5c.width/2 - 200,p5c.height/2  - 140 + i*75)
        columnRanking1[i].addClass('ranking_text')

        columnRanking2[i].position(p5c.width/2,p5c.height/2  - 140 + i*75)
        columnRanking2[i].addClass('ranking_text')

        columnRanking3[i].position(p5c.width/2 + 200,p5c.height/2  - 140 + i*75)
        columnRanking3[i].addClass('ranking_text')
        columnRanking3[i].style('transform', 'translate(-50%, -50%)')
    }
  }

  noDisplayRanking = function () {
      if(!firstShow){
        rankingDisplayed = false
        titleRanking.remove()
        for (let i = 0; i<6 ; i++){
            columnRanking1[i].remove()
            columnRanking2[i].remove()
            columnRanking3[i].remove()
        }
      }
  }
  startCircleArrays = function () {
    for (let i = 0; i < leftCircles.length; i++) {
      leftCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
    for (let i = 0; i < rightCircles.length; i++) {
      rightCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
  }

  stopCircleArrays = function () {
    for (let i = 0; i < leftCircles.length; i++) {
      leftCircles[i] = null
    }
    for (let i = 0; i < rightCircles.length; i++) {
      rightCircles[i] = null
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
    p5c.background(10);
    //drawPodium()
    p5c.textFont(font)
    p5c.noStroke()
    p5c.fill(colorMenu)
    p5c.textAlign(p5c.CENTER)
    p5c.textSize(23)
    p5c.text(textMenu, p5c.width / 2, p5c.height / 2);

    if(!noReference){
        drawReference();
      }


    // Visual Metronome ( only outer ellipses )
    p5c.fill("black");
    p5c.strokeWeight(1);
    p5c.stroke(240, 240, 10)
    p5c.ellipse(xLine1 + (xLine2 - xLine1)/5 , yLineH + 100, guideRadius, guideRadius);
    p5c.ellipse(xLine1 + (xLine2 - xLine1)*2/5 , yLineH + 100, guideRadius, guideRadius);
    p5c.ellipse(xLine1 + (xLine2 - xLine1)*3/5 , yLineH + 100, guideRadius, guideRadius);
    p5c.ellipse(xLine1 + (xLine2 - xLine1)*4/5 , yLineH + 100, guideRadius, guideRadius);

    if(rankingDisplayed){
        rankingBackground();
    }

    if (started) {
      // Visual Metronome ( inside ellipses )
      p5c.fill("yellow");
      if (metroFlag > 0){
          metroColor = ((metroFlag - 1) % 4) + 1
      }
      p5c.strokeWeight(1);
      p5c.stroke(240, 240, 10)
      p5c.ellipse(xLine1 + (xLine2 - xLine1)*metroColor/5 , yLineH + 100, guideRadius - 50, guideRadius - 50);

      p5c.textFont(font)

      //write a text in p5.js displaying "Score: " and the score
      p5c.fill(255)
      p5c.textSize(30)
      p5c.noStroke()
      p5c.text("Score: " + gameScore, 150, 60)

      // Display Global Multiplier
      p5c.noFill()
      p5c.strokeWeight(2);
      p5c.stroke("yellow");
      p5c.ellipse(300,60 - 9,60,60)

      p5c.fill(255)
      p5c.noStroke()
      p5c.text("x" + multiplier,300,60)

      // Display Left and Right Rhythms
      p5c.fill("yellow")
      p5c.noStroke()
      p5c.textSize(300)
      p5c.text(visualLeftR, (p5c.width / 2 - p5c.width / 12)/2, 400)
      p5c.text(visualRightR,p5c.width - (p5c.width / 2 - p5c.width / 12)/2, 400)

      /*//write a text in p5.js displaying the difficulty settings of the game
      //p5c.textSize(15)
      //p5c.text("Triplet : " + triplet, 110, 80)
      //p5c.text("MindBlowing : " + mindBlowing, 110, 110)
      //p5c.text("NoReference : " + noReference, 110, 140)
      //p5c.text("MetroFlag : " + metroFlag, 100, 170)*/

      // Display available Lifes
      p5c.fill("white")
      p5c.noStroke()
      p5c.textSize(30)
      p5c.text("Lifes : " + lifes, p5c.width - 150, 60)


      p5c.fill("white")
      p5c.textSize(15)
      // Consecutive Great Hits and relative Multiplier
      p5c.text("Consecutive\nGreat", xLine2 + 1*(p5c.width - xLine2)/4, p5c.height - 125 )
      p5c.text(greatCounter, xLine2 + 1*(p5c.width - xLine2)/4 , p5c.height - 75 )
      if (multiplierGreat > 0){
        p5c.text(multiplierGreat, xLine2 + 1*(p5c.width - xLine2)/4 , p5c.height - 50 )
      }

      // Consecutive Amazing Hits and relative Multiplier
      p5c.text("Consecutive\nAmazing", xLine2 + 2*(p5c.width - xLine2)/4 , p5c.height - 125 )
      p5c.text(amazingCounter, xLine2 + 2*(p5c.width - xLine2)/4 , p5c.height - 75 )
      if (multiplierAmazing > 0){
        p5c.text(multiplierAmazing, xLine2 + 2*(p5c.width - xLine2)/4 , p5c.height - 50 )
      }

      // Consecutive Perfect Hits and relative Multiplier
      p5c.text("Consecutive\nPerfect", xLine2 + 3*(p5c.width - xLine2)/4 , p5c.height - 125 )
      p5c.text(perfectCounter, xLine2 + 3*(p5c.width - xLine2)/4 , p5c.height - 75 )
      if (multiplierPerfect > 0){
        p5c.text(multiplierPerfect, xLine2 + 3*(p5c.width - xLine2)/4 , p5c.height - 50 )
      }


      if (rhythmTransition){
            p5c.fill("darkred")
            p5c.stroke('darkred');
            p5c.strokeWeight(4);
            p5c.textSize(75);
            p5c.text(visualNextLeftR, (p5c.width / 2 - p5c.width / 12)/2, 500);
            p5c.text(visualNextRightR, p5c.width - (p5c.width / 2 - p5c.width / 12)/2 , 500);
      }
      if (newConsecutiveHitsBonus){
            p5c.fill("white")
            p5c.noStroke()
            p5c.textSize(40)
            p5c.text(consecutiveHits + " CONSECUTIVE HITS", xLine1/2, yLineH + (p5c.height - yLineH)/2 )
      }
      //we're in the game, draw the reference and update and show the cirlces


      if (pageFoc) {

        //TODO: make a falling messages class
        //The class should contain the message, the x and y coordinates, 
        //the color, the size, and eventually the time it should be displayed for
        p5c.fill(12)
        p5c.textSize(30)
        p5c.stroke(20,100,240)
        p5c.strokeWeight(4);
        p5c.text(hitMessages[0], xLine1 - 200, yLineH + 50)
        p5c.text(hitMessages[1], xLine2 + 200, yLineH + 50)

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
        // Counter  number of circles for each side
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
      p5c.stroke("white");
      p5c.strokeWeight(1);
      p5c.line(xLine1, 0, xLine1, p5c.height);
      p5c.line(xLine2, 0, xLine2, p5c.height);
      p5c.line(0, yLineH, p5c.width, yLineH)
      p5c.fill(12);
      p5c.strokeWeight(4);
      p5c.stroke("yellow")
      p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);
      p5c.ellipse(xLine2, yLineH, guideRadius, guideRadius);
      p5c.fill(12);
      p5c.strokeWeight(4);
      p5c.stroke("yellow")
      p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);

    }
    rankingBackground = function () {

        // Background
        p5c.strokeWeight(1);
        p5c.stroke(255,255,255)
        p5c.fill(62,69,75,255)
        p5c.translate(-300, -300);
        p5c.rect(p5c.width/2,p5c.height/2,600,600)
        p5c.translate(+300,+300);

        p5c.noStroke()
        p5c.fill(62,69,75,100)
        p5c.translate(-335, -335);
        p5c.rect(p5c.width/2,p5c.height/2,600,600)
        p5c.translate(+335,+335)
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
    mouseClicked(): p5js function that gets called every time the sx mouse button
    is pressed / the touchscreen is touched.
    We start the AudioContext here with userStartAudio()
    */
    p5c.mouseClicked = function () {

    }

    function startToneLoops(intL, intR) {
      // Eliminate previous scheduled events
      if (scheduleL != null && scheduleR != null){
        Tone.Transport.clear(scheduleL);
        Tone.Transport.clear(scheduleR);
      }
      scheduleL = Tone.Transport.scheduleRepeat(time => {
        addCircle('l')
      }, intL + "n");
      scheduleR = Tone.Transport.scheduleRepeat(time => {
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
    var menuTransitionInterval;

    function dieMenuTransition(){
        textUpDownTransition('You Died',10)
        setTimeout(() => {
            textUpTransition('Press the spacebar\nto retry')
            restart = true
            }, 2000)
    }

    function dieNewRecordMenuTransition(){
        textUpDownTransition('You Died',10)
        setTimeout(() => {
            textUpDownTransition('But Congratulations you are at the position ' + (posRecord + 1) + ' in the global ranking!',30)
            }, 3000)
        setTimeout(() => {
            textUpTransition('Insert your nickname!',30)
            }, 10000)
        setTimeout(() => {
            inputNickNameTransition()
            }, 11000)
    }

    function inputNickNameTransition(){
        nicknameInput = p5c.createInput('');
        nicknameInput.position(p5c.width/2, p5c.height/2 + 50);
        nicknameInput.addClass('translateClass')
        nicknameInput.size(200);

        nicknameSubmit = p5c.createButton('SUBMIT');
        nicknameSubmit.style('font-family' , 'Montserrat, sans-serif')
        nicknameSubmit.position(p5c.width/2, p5c.height/2 + 75);
        nicknameSubmit.addClass('translateClass')
        nicknameSubmit.size(100);

        nicknameSubmit.mousePressed(() => {
            let name = nicknameInput.value()
            pointsRanking[posRecord] = gameScore;
            namesRanking[posRecord] = name;
            nicknameInput.remove()
            nicknameSubmit.remove()
            gameScore = 0;
            textUpDownTransition('Updated Ranking!',30)
            setTimeout(() => {
                    textUpTransition('Press the spacebar\nto retry')
                    restart = true
                }, 4000)

            })
    }

    function textUpDownTransition(text,ms){
        menuTransitionInterval = setInterval( () => {
                textMenu = text;
                if(colorMenu < 500){
                    colorMenu += 5;
                    }
                else{
                    clearInterval(menuTransitionInterval);
                    textDownTransition(ms)
                    }
            },ms)
    }

    function textUpTransition(text){
        menuTransitionInterval = setInterval( () => {
                textMenu = text;
                if(colorMenu < 500){
                    colorMenu += 5;
                    }
                else{
                    clearInterval(menuTransitionInterval);
                    }
            },10)
    }

    function textDownTransition(ms){
        menuTransitionInterval = setInterval( () => {
                if(colorMenu > 11){
                    colorMenu -= 5;
                    }
                else{
                    clearInterval(menuTransitionInterval);
                    }
            },ms)
    }


    p5c.keyPressed = function () {
      let key = p5c.key;
      //check if any of the active circles is overlapping with the
      //reference
      if (key == ' '){
          if (!started && restart) {
            clearInterval(menuTransitionInterval)
            textDownTransition(5)
            p5c.userStartAudio();
            Tone.start();
            Tone.Transport.start();
            toggleRhythms();
            visualLeftR = leftR;
            visualRightR = rightR;
            visualNextLeftR = nextLeftR;
            visualNextRightR = nextRightR;
            started = true;
            restart = false;
            died = false;
          }
         else{}
      }
      if(started){
          if (key == 's' || key == 'S') {
            let hitL = false;
            for (let i = firstElemInGameL; i < firstElemInGameL + leftElem; i++) {
              let k = i % leftCircles.length;
              let c = leftCircles[k];
              /*if (c.flag == 1 && (c.y - rhythm_rad) > (yLineH + guideRadius) ){
                return //no point looking for further hits
              }*/
              if (Math.abs(c.y - yLineH) <= guideRadius) {
                hitL = true;
                //play sound
                hitSoundL.play();

                /*** add points to the score of the player proportionally to the
                //inverse of the distance between the circle and the reference yLineH
                let points = Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)))*** */

                // RULES FOR CALCULATING POINTS
                // distance*10 = [0,7]     -> perfect -> 100 points
                // distance*10 = [7, 20]   -> amazing -> 75 points
                // distance*10 = [20, 70]  ->  great  -> 50 points
                // distance*10 = [70, 150] ->  good   -> 25 points
                // distance*10 = [150, - ] ->   ok    -> 0 points

                let points = Math.round(Math.abs(c.y - yLineH)*10);
                hitQuality(points, 0)

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

                leftElem--;
              }
            }

            if (!hitL) {

              if(lifes <= 0 && died == false){
                reSetup()
              }
              else{
                miss.play();
                lastHit = "OK"
                multiplier = 1
                multiplierGreat = 0;
                multiplierAmazing = 0;
                multiplierPerfect = 0;
                multiplierConsecutiveHits = 0;
                consecutiveHits = 0;
                lifes -= 1;
              }
              //point penalty / error count
            }
          }
          if (key == 'k' || key == 'K') {
            let hitR = false;
            for (let i = firstElemInGameR; i < firstElemInGameR + rightElem; i++) {
              let k = i % rightCircles.length;
              let c = rightCircles[k];
              /*if (c.flag == 1 && (c.y + rhythm_rad) > (yLineH - guideRadius)){
                return //no point looking for further hits
              }*/
              if (Math.abs(c.y - yLineH) <= guideRadius) {
                hitR = true;
                //play sound
                hitSoundR.play();
                // RULES FOR CALCULATING POINTS
                // distance*10 = [0,7]     -> perfect -> 100 points
                // distance*10 = [7, 20]   -> amazing -> 75 points
                // distance*10 = [20, 70]  ->  great  -> 50 points
                // distance*10 = [70, 150] ->  good   -> 25 points
                // distance*10 = [150, - ] ->   ok    -> 0 points
                let points = Math.round(Math.abs(c.y - yLineH)*10);
                hitQuality(points, 1)

                //delete circle(s)
                rightCircles[k].toggle();
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
              if(lifes <= 0 && died == false){
                reSetup()
              }
              else{
                miss.play();
                lastHit = "OK"
                multiplier = 1
                multiplierGreat = 0;
                multiplierAmazing = 0;
                multiplierPerfect = 0;
                multiplierConsecutiveHits = 0;
                consecutiveHits = 0;
                lifes -= 1;
              }
              //point penalty / error count
            }
          }
      }
    }

    /*
    startMetronome(): starts a metronome for reference. Calls metroSound()
    to make sound*/
    var metroFlag = 0;
    startMetronome = function () {
      scheduleMetro = Tone.Transport.scheduleRepeat(time => {
        metroSound()
      }, "4n");
    }

    /*
    metroSound(): produces the correct metronome sound based on the beat
    */
    var metroFlagX;
    var scheduleFlag;
    metroSound = function () {
    //To play the beat in background
      if(metroFlag % 32 == 0){
        //p5c.getAudioContext().resume()
        beat2.stop();
        beat1.play()

      }
      else if (metroFlag % 32 == 16) {
        beat1.stop()
        beat2.play()
      }
      if (metroFlag % 4 == 0) {
        //met1.play()
      } else {
        //met2.play();
      }
      if ( (metroFlag == metroFlagChange) && (metroFlag != 1)  && (metroFlag != 0)){
            toggleRhythms();
            metroFlagX = metroFlag;
            scheduleFlag = Tone.Transport.scheduleRepeat(time => {
            rhythmTransition = true
            setTimeout( () => { rhythmTransition = false } , 500)
            }, "2n");
      }
      if ( metroFlag == metroFlagX + 8){
            Tone.Transport.clear(scheduleFlag);
            visualLeftR = leftR;
            visualRightR = rightR;
            visualNextLeftR = nextLeftR;
            visualNextRightR = nextRightR;
      }
      metroFlag += 1;
    }
    var hitMessages = new Array(2);
    hitMessages[0] = ""
    hitMessages[1] = ""

    hitQuality = function(points, side){
      //prints a message on the side (side can be 0 or 1, indicating left or right side) 
      //of the guide circle 
      //to indicate how good a hit was ("OK", "GREAT", "AMAZING","PERFECT")
      //depending on the points scored

      // RULES FOR CALCULATING POINTS
      // [0,7] -> perfect
      // [7, 20] -> amazing
      // [20, 70]-> great
      // [70, 150] -> good
      // [150, - ] -> ok

      let x = 0;
      let y = 0;
      if(side == 0){
        x = xLine1;
        y = yLineH;
      }else{
        x = xLine2;
        y = yLineH;
      }
      let msg = "";
      if(points >= 0 && points < 7){
        msg = "PERFECT";
        perfectCounter += 1;
        gameScore = gameScore + 100*multiplier;
      }else if(points >= 7 && points < 20){
        msg = "AMAZING";
        amazingCounter += 1;
        gameScore = gameScore + 75*multiplier;
        perfectCounter = 0;
        multiplierPerfect = 0;
      }else if(points >= 20 && points < 70){
        msg = "GREAT";
        greatCounter += 1;
        gameScore = gameScore + 50*multiplier;
        multiplierAmazing = 0;
        amazingCounter = 0;
        multiplierPerfect = 0;
        perfectCounter = 0;
      }else if(points >= 70 && points < 150){
        msg = "GOOD";
        gameScore = gameScore + 25*multiplier;
        multiplierGreat = 0;
        greatCounter = 0;
        multiplierAmazing = 0;
        amazingCounter = 0;
        multiplierPerfect = 0;
        perfectCounter = 0;
      }
      else if(points >= 150){
        msg = "OK";
        gameScore = gameScore + 1*multiplier;
        greatCounter = 0;
        amazingCounter = 0;
        perfectCounter = 0;
      }
      if(msg != ""){
        p5c.fill(240);
        p5c.textFont(font)
        p5c.textSize(30);
        p5c.text(msg, x, y);
      }
        hitMessages[side] = msg;

        // CONSECUTIVE GREAT BONUS STREAK
        if ( greatCounter > 0 && greatCounter % 10 == 0 ){
            multiplierGreat += 1;
        }

        // CONSECUTIVE AMAZING BONUS STREAK
        if ( amazingCounter > 0 && amazingCounter % 3 == 0 ){
            multiplierAmazing += 1;
        }

        // CONSECUTIVE PERFECT BONUS STREAK
        if ( perfectCounter > 0 && perfectCounter % 1 == 0 ){
            multiplierPerfect += 1;
        }

        // REFRESH BONUS VARIABLES
        consecutiveHits +=1
        lastMultiplier = multiplier;

        // CHECK IF CONSECUTIVE HITS BONUS
        // TODO : IMPROVE THIS TRANSITION
        if (consecutiveHits % 100 == 0 ){
            multiplierConsecutiveHits += 1;
            setTimeout( () => {
                newConsecutiveHitsBonus = true;}, 0);
            setTimeout( () => {
                newConsecutiveHitsBonus = false;}, 700);
            setTimeout( () => {
                newConsecutiveHitsBonus = true;}, 1100);
            setTimeout( () => {
                newConsecutiveHitsBonus = false;}, 1700);
            setTimeout( () => {
                newConsecutiveHitsBonus = true;}, 2100);
            setTimeout( () => {
                newConsecutiveHitsBonus = false;}, 2700);
        }

        // NEW MULTIPLIER
        multiplier = 1 + multiplierGreat + multiplierAmazing + multiplierPerfect + multiplierConsecutiveHits;

        // MAXIMUM POSSIBLE BONUS
        if (multiplier > 10){
            multiplier = 10;
        }

        // NEW BONUS OR FINISHED BONUS
        if( multiplier > lastMultiplier || multiplier == 10){
            multiplierSound()
        }
        else if (multiplier < lastMultiplier){
            multFail.play()
        }

    }
    function multiplierSound() {
        switch(multiplier){
            case 2:
                mult2.play()
            break;
            case 3:
                mult3.play()
            break;
            case 4:
                mult4.play()
            break;
            case 5:
                mult5.play()
            break;
            case 6:
                mult6.play()
            break;
            case 7:
                mult7.play()
            break;
            case 8:
                mult8.play()
            break;
            case 9:
                mult9.play()
            break;
            case 10:
                mult10.play()
            break;
            default:
        }
    }
    // STEP
    // 1) BASIC
    // 2) TRIPLET
    // 3) LIMIT ALZATO A 6
    // 4) MINDBLOWING
    // 5) LIMIT ALZATO A 7
    // 6) NO GUIDA
    // 7) AUMENTA IL BPM
    // 8) TORNA A 3)
    function toggleRhythms() {
        var arrayNewRhythms;

        // TRIPLET
        if ( gameScore >= 1500 || metroFlag >= 25*4){
            triplet = true;
        }
        // RAISE LIMIT to 6
        if ( gameScore >= 3000 || metroFlag >= 45*4){
            rhythmLimit = 6;
        }
        // MINDBLOWING
        if ( gameScore >= 25000 || metroFlag >= 65*4){
           mindBlowing = true;
        }
        // NO REFERENCE
        if ( gameScore >= 50000 ){
            noReference = true;
        }
        // RAISE LIMIT TO 7
        if ( metroFlag >= 130*4){
            rhythmLimit = 7
        }
        // RAISE LIMIT TO 9
        if ( metroFlag >= 160*4){
            rhythmLimit = 9
        }
        // RAISE LIMIT TO 11
        if ( metroFlag >= 190*4){
            rhythmLimit = 11
        }
        // RAISE LIMIT TO 13
        if ( metroFlag >= 220*4){
            rhythmLimit = 13
        }// RAISE LIMIT TO 15
        if ( metroFlag >= 250*4){
            rhythmLimit = 15
        }

        if(!started){
            arrayNewRhythms = calculateNewRhythms();
            leftR = arrayNewRhythms[0];
            rightR = arrayNewRhythms[1];
            startToneLoops(leftR,rightR);
            startMetronome(bpm);
        }
        else{
            leftR = nextLeftR;
            rightR = nextRightR;
            startToneLoops(nextLeftR,nextRightR);
        }

        arrayNewRhythms = calculateNewRhythms();
        nextLeftR = arrayNewRhythms[0];
        nextRightR = arrayNewRhythms[1];
        metroFlagChange += metroFlagChangeValues[Math.floor(Math.random() * metroFlagChangeValues.length)];
    }
    // Possible Rhythms 1 + [2, 4, 8, 16, 32] + [3,6,12,24] + the remainder
    function calculateNewRhythms(){
        var integersL = new Set();
        var integersR = new Set();
        var nextL;
        var nextR;
        var addInteger;
        for (let i = 1; i <= rhythmLimit; i++){

                addInteger = false;
                if (i == 1){
                    addInteger = true;
                }
                else if (basicRhythms.includes(i)){
                    addInteger = true;
                }
                else if (tripletRhythms.includes(i) && triplet){
                    addInteger = true;
                }
                else if (mindBlowing){
                    addInteger = true;
                }

                if(addInteger){
                    if (i != leftR){
                            integersL.add(i);
                        }
                    if (i != rightR){
                            integersR.add(i);
                        }
                    }
        }
        var itemsL = Array.from(integersL);
        var itemsR = Array.from(integersR);
        nextL = itemsL[Math.floor(Math.random() * itemsL.length)];
        nextR = itemsR[Math.floor(Math.random() * itemsR.length)];
        return [nextL,nextR];
    }

    function newPodium(){
        if(gameScore > pointsRanking[0]){
            posRecord = 0;
            pointsRanking[4] = pointsRanking[3];
            pointsRanking[3] = pointsRanking[2];
            pointsRanking[2] = pointsRanking[1];
            pointsRanking[1] = pointsRanking[0];
            namesRanking[4] = namesRanking[3];
            namesRanking[3] = namesRanking[2];
            namesRanking[2] = namesRanking[1];
            namesRanking[1] = namesRanking[0];
        }
        else if(gameScore > pointsRanking[1]){
            posRecord = 1;
            pointsRanking[4] = pointsRanking[3];
            pointsRanking[3] = pointsRanking[2];
            pointsRanking[2] = pointsRanking[1];
            namesRanking[4] = namesRanking[3];
            namesRanking[3] = namesRanking[2];
            namesRanking[2] = namesRanking[1];
        }
        else if(gameScore > pointsRanking[2]){
            posRecord = 2;
            pointsRanking[4] = pointsRanking[3];
            pointsRanking[3] = pointsRanking[2];
            namesRanking[4] = namesRanking[3];
            namesRanking[3] = namesRanking[2];
        }
        else if(gameScore > pointsRanking[3]){
            posRecord = 3;
            pointsRanking[4] = pointsRanking[3];
            namesRanking[4] = namesRanking[3];
        }
        else {
            posRecord = 4;
        }
    }
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
