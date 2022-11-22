//p5.js sketch file
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
TODO:
are circles deleted when they're no longer in game?
Should we implement a queue for managing circles?

Stop sketch if window isn't focused (use focused())
*/

/*
Variables we will use in preload()
*/
var hit; //hit.wav (sound played when you successfully hit a note)
var font; //font used for text
var met1; //higher pitched hit of metronome
var met2; //lower pitched hit of metronome

/* 
Variables related to bpm and polyrhythms
bpm = track bpm
leftR = left side rhythm
rightR = right side rhythm
interval = time distance between beats [in seconds]
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
function preload(){
  //soundFormats('wav');
  hit = loadSound('assets/hit.wav');
  met1 = loadSound('assets/met1.wav');
  met2 = loadSound('assets/met2.wav');
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
var leftCircles = [];
var rightCircles = [];

/*
setup(): function that gets called by p5.js at startup. Initialise variables 
needed in the sketch here; load audio files, fonts, etc, in preload() instead
*/
function setup() {
  createCanvas(windowWidth, windowHeight);
  /*
  see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
  There's no need for the audio context to be running as soon as the page is loaded
  */
  getAudioContext().suspend(); 

  //initialise guide coordinates
  xLine1 = width / 2 - width / 12;
  xLine2 = width / 2 + width / 12;
  yLineH = 3 / 4 * height;
  started = false;
  font = textFont('Roboto', 30)

  bpm = 120;
  // 4 vs 3 polyrhythm for testing, ideally we will get input from user
  leftR = 4;
  rightR = 3;

  interval = 60 / bpm;
  //time between notes on the L(eft) side and R(ight) side
  intervalL = 4 * 1/leftR * 60 / bpm;
  intervalR = 4 * 1/rightR * 60 / bpm;

  frameRate(60)
}


var guideRadius = 30; //radius of guide circles
var counter = 0; //not used now, might be used to count frames IN GAME
var rhythm_rad = 20; //radius of rhythm circles

/*
draw(): p5js function that gets automatically called once per frame
(by default 60 frames per second) 
*/
function draw(){
  background(12);
  if(started){
    //we're in the game, draw the reference and update and show the cirlces
    drawReference();
    leftCircles.forEach((item, i) => {
      leftCircles[i].update()
      leftCircles[i].show()
    });
    rightCircles.forEach((item, i) => {
      rightCircles[i].update()
      rightCircles[i].show()
    });
  }else{
    //we're in the menu
    fill(10,240,10)
    rectMode(CENTER)
    rect(width/2,height/2,200,200);
    fill(240)
    textFont(font)
    textAlign(CENTER)
    text("Click\nto start :)", width/2,height/2);
  }
}

var v; //speed of circles in [pixel/frame]
/*
addCircle(side): adds one beat circle to the specified side
$side can have to values:
r: add one circle right side
l: add one circle left side
*/
function addCircle(side){
  v = yLineH / (60 / bpm * 8 * frameRate()); //speed necessary to reach guide after 8 beats
  //Circle([ xCenter, yCenter, radius, velocity (pixel/frame) ])
  if(side=='r'){
    rightCircles.push(new Circle([xLine2, 0, rhythm_rad, v]))
  }else if(side=='l'){
    leftCircles.push(new Circle([xLine1, 0, rhythm_rad, v]))
  }
}
/* 
drawReference(): draws the guide
*/
function drawReference(){
  stroke(240);
  strokeWeight(1);
  line(xLine1, 0, xLine1,height);
  line(xLine2, 0, xLine2,height);
  line(0,yLineH,width,yLineH)
  fill(12);
  strokeWeight(4);
  stroke(240,240,10)
  ellipse(xLine1,yLineH,guideRadius,guideRadius);
  ellipse(xLine2,yLineH,guideRadius,guideRadius);
}
/* 
windowResized(): p5js function that gets called every time the window
gets resized; recalculate here all the variables that contain coordinates 
in their formulas
*/
function windowResized() {
  removeElements();
  resizeCanvas(windowWidth, windowHeight);
  xLine1 = width/2 - width/12;
  xLine2 = width/2 + width/12;
  yLineH = 3/4 * height;
  v = yLineH / (60 / bpm * 8 * frameRate());
  //recenter circles on the lines
  leftCircles.forEach((item, i) => {
    let c = leftCircles[i];
    c.setNewCoords(xLine1, map(c.y,0,c.windowH,0,windowHeight), windowWidth, windowHeight)
    c.updateVelocity(v)
  });
  rightCircles.forEach((item, i) => {
    let c = rightCircles[i];
    c.setNewCoords(xLine2, map(c.y, 0, c.windowH, 0, windowHeight), windowWidth, windowHeight)
    c.updateVelocity(v)
  });
}
/* 
mousePressed(): p5js function that gets called every time a mouse button
is pressed / the touchscreen is touched.
We start the AudioContext here with userStartAudio()
*/
function mousePressed(){
  if(!started){
  userStartAudio();
  started = true;
  startMetronome(bpm)
  }
}

/* 
keyPressed(): p5js function that gets called every time a key is pressed.
Use key to get the specific key.
We see here for now if a beat circle is overlapping with the reference;
points will later need to be assigned based on how much the circle
was overlapping with the reference.
The circle will also need to be deleted
*/

function keyPressed(){
  //check if any of the active circles is overlapping with the
  //reference
  if (key=='s' || key=='S'){
    leftCircles.forEach((item, i) => {
      let c = leftCircles[i];
      if (Math.abs(c.y - yLineH) <= guideRadius) {
        //play sound
        hit.play();
        //calculate the points
        //delete circle(s)
        //for now no deletion happens, it just becomes hidden
        c.flag = 0;
      }
    });
  }
  if (key == 'k' || key == 'K') {
    rightCircles.forEach((item, i) => {
      let c = rightCircles[i];
      if (Math.abs(c.y - yLineH) <= guideRadius) {
        //play sound
        hit.play();
        //calculate the points
        //delete circle(s)
        //for now no deletion happens, it just becomes hidden
        c.flag = 0;
      }
    });
  }
}

/*
startMetronome(): starts a metronome for reference. Calls metroSound()
to make sound*/
var metroFlag = 0;
function startMetronome(){
  setInterval(metroSound, interval * 1000 )
}

/*
metroSound(): produces the correct metronome sound based on the beat
*/
function metroSound(){
  if(metroFlag == 4) {
    addCircle('l')
    addCircle('r')
    setInterval(addCircle, intervalL * 1000, 'l');
    setInterval(addCircle, intervalR * 1000, 'r');
  }
  if (metroFlag % 4==0) {
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
class Circle{
  /*
  params:
  x,y,radius?, color, speed,...
  */
  constructor(params){
    this.x = params[0]
    this.y = params[1]
    this.radius = params[2]
    //this.color = params[3]
    this.speed = params[3]
    this.flag = 1;

    this.windowW = windowWidth;
    this.windowH = windowHeight;
  }

  /*
  setNewCoords(): allows user to set new coordinates for the circle.
  Useful for recentering circles when the window gets resized
  
  newX,newY: new coordinates
  windowW, windowH: new windowWidth and windowHeight (which may be equal to
  the old ones if the window didn't get resized when this got called)
  */
  setNewCoords(newX,newY,windoW,windowH){
    this.x = newX
    this.y = newY
    this.windowW = windowWidth;
    this.windowH = windowHeight;
  }
  
  updateVelocity(newV){
    this.speed = newV;
  }

  /*
  update(): updates circle position
  */
  update(){
    this.y = this.y + this.speed;
  }
  /*
  show(): draws circle on the canvas
  */
  show(){
    if(this.flag){
      fill(80,200,20);
      strokeWeight(1);
      stroke(12)
      ellipse(this.x,this.y,this.radius,this.radius);
    }
  }
}