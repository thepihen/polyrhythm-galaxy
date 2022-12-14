
var font;

var bpmGeneral;
var leftGeneral;
var rightGeneral;

function setup(){
  createCanvas(windowWidth, windowHeight);
  font = textFont('Roboto',30);
  selBpm();
  selLeftHand();
  selRightHand();
  button = createButton('PLAY');
  button.position(width/2.11, height/1.35)
  let col = color(240, 240, 10);
  button.style('background-color', col);
  button.style('font-size', '25px');
  button.style('family-font', 'Roboto');
  button.style('border', col)
  button.mousePressed()
    
  
}

function draw(){
    background(12);
    drawReference();
    writeText();
    
}

function drawReference(){
    stroke(240);
    strokeWeight(1);
    fill(12);
    strokeWeight(4);
    stroke(240,240,10)
    
}

function windowResized() {
    removeElements();
    resizeCanvas(windowWidth, windowHeight);
}


function writeText() {
    fill(12);
    textSize(60);
    text('TRAINING MODE', width/2, height/3.5);
    textAlign(CENTER);
    fill(240)
    stroke(12)
    textAlign(CENTER);
    textSize(25);
    text('Select BPM:', width/2, height/2.45)
    fill(240)
    stroke(12)
    textAlign(CENTER);
    textSize(25);
    text('Select Hand Rhythms:', width/2, height/1.7)
    text('L', width/2.08, height/1.52)
    text('/', width/2.0, height/1.52)
    text('R', width/1.94, height/1.52)
    text('/', width/2.0, height/1.41)
}

let sel;
function selBpm() {
    sel = createSelect();
    sel.position(width/2.12, height/2.3);
    sel.style('font-size', '20px');
    sel.style('family-font', 'Roboto');
    let textCol = color(255);
    sel.style('color', textCol)
    let backCol = color(12);
    sel.style('background-color', backCol);
    sel.style('border', textCol);

    sel.option('60 bpm')
    sel.option('70 bpm')
    sel.option('80 bpm')
    sel.option('90 bpm')
    sel.option('100 bpm')
    sel.option('110 bpm')
    sel.option('120 bpm')

    sel.changed(bpmEvent);
    
}

function bpmEvent() {
    return sel.value()

}

let sel1;
function selLeftHand() {
    sel1 = createSelect();
    sel1.position(width/2.12, height/1.47);
    sel1.style('font-size', '20px');
    sel1.style('family-font', 'Roboto');
    let textCol = color(255);
    sel1.style('color', textCol)
    let backCol = color(12);
    sel1.style('background-color', backCol);
    sel1.style('border', textCol);
    

    sel1.option('1')
    sel1.option('2')
    sel1.option('3')
    sel1.option('4')
    sel1.option('5')
    sel1.option('6')
    sel1.option('7')

    
    sel1.changed(leftEvent);
}

function leftEvent() {
     return sel1.value()
}

let sel2;
function selRightHand() {
    sel2 = createSelect();
    sel2.position(width/1.98, height/1.47);
    sel2.style('font-size', '20px');
    sel2.style('family-font', 'Roboto');
    let textCol = color(255);
    sel2.style('color', textCol)
    let backCol = color(12);
    sel2.style('background-color', backCol);
    sel2.style('border', textCol);

    sel2.option('1')
    sel2.option('2')
    sel2.option('3')
    sel2.option('4')
    sel2.option('5')
    sel2.option('6')
    sel2.option('7')
}
export function rightEvent() {
    return sel2.value()
}







  
  
