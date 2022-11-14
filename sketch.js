var hit;
function preload(){
  //everything that needs to be loaded before the sketch
  //starts needs to be put here
  soundFormats('wav');
  hit = loadSound('assets/hit');
}
var started;
function setup(){
  createCanvas(windowWidth, windowHeight);
  getAudioContext().suspend();
  xLine1 = width/2 - width/12;
  xLine2 = width/2 + width/12;
  yLineH = 3/4 * height;
  exampleCircle = new Circle([xLine1, 0,40,1]);
  started = false;
}

var exampleCircle;
var xLine1;
var xLine2;
var yLineH;
var guideRadius = 50;
function draw(){
  background(12);
  drawReference();
  if(started){
    exampleCircle.update();
    exampleCircle.show();
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
    if(Math.abs(exampleCircle.y - yLineH) <= guideRadius){
      //play sound
      hit.play();
      //calculate the points
      //delete circle(s)
      //for now no deletion happens, it just becomes hidden
      exampleCircle.flag = 0;
    }
  }
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
