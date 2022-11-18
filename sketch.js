var hit;
var font;
var met1;
var met2;
/* 
bpm = track bpm
leftR = left rhythm
rightR = right rhythm
*/
var bpm;
var leftR;
var rightR;
var interval;
function preload(){
  //everything that needs to be loaded before the sketch
  //starts needs to be put here
  //soundFormats('wav');
  hit = loadSound('assets/hit.wav');
  met1 = loadSound('assets/met1.wav');
  met2 = loadSound('assets/met2.wav');
}
//started: bool
//true if we're in the game
//false if we're in the menu
var started;
var xLine1;
var xLine2;
var yLineH;
//arrays containing circles for left and right side
var leftCircles = [];
var rightCircles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  getAudioContext().suspend();
  //initialise guide coordinates
  xLine1 = width / 2 - width / 12;
  xLine2 = width / 2 + width / 12;
  yLineH = 3 / 4 * height;
  started = false;
  font = textFont('Roboto', 30)

  bpm = 60;
  // 4 vs 3
  leftR = 4;
  rightR = 3;
  interval = 60 / bpm;
  intervalL = (1 / 4) * leftR * 60 / bpm;
  intervalR = (1 / 4) * rightR * 60 / bpm;
  startMetronome(bpm)
}

var exampleCircle;
var guideRadius = 30;
var counter = 0;
var rhythm_rad = 20;
function draw(){
  background(12);
  if(started){
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
    fill(10,240,10)
    rectMode(CENTER)
    rect(width/2,height/2,200,200);
    fill(240)
    textFont(font)
    textAlign(CENTER)
    text("Click\nto start :)", width/2,height/2);
  }
}
/*
side:
r adds one circle right side
l adds one circle left side
*/
function addCircle(side){
  if(side=='r'){
    rightCircles.push(new Circle([xLine2, 0, rhythm_rad, 1]))
  }else if(side=='l'){
    leftCircles.push(new Circle([xLine1, 0, rhythm_rad, 1]))
  }
}
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
function windowResized() {
  removeElements();
  resizeCanvas(windowWidth, windowHeight);
  xLine1 = width/2 - width/12;
  xLine2 = width/2 + width/12;
  yLineH = 3/4 * height;
}
function mousePressed(){
  userStartAudio();
  started = true;
}
//points will need to be assigned based on how much the circle
//was overlapping with the reference
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

var metroFlag = 0;
function startMetronome(){
  setInterval(metroSound, interval * 1000 )
}

function metroSound(){
  if(metroFlag == 4){
    addCircle('l')
    addCircle('r')
    setInterval(addCircle, intervalL * 1000, 'l');
    setInterval(addCircle, intervalR * 1000, 'r');
  }
  met2.play();
  metroFlag += 1;
}
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
  }
  update(){
    this.y = this.y + this.speed;
  }
  show(){
    if(this.flag){
      fill(80,200,20);
      strokeWeight(1);
      stroke(12)
      ellipse(this.x,this.y,this.radius,this.radius);
    }
  }
}
