var pageFoc = true;

var score = 0;

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

var logo
/*
preload: function that gets automatically by p5js before loading the sketch.
->Everything that needs to be available when the sketch starts needs to be loaded here
(e.g. fonts, sounds,...)
*/
function sketchPreload() {
    hitSX = P$.loadSound('assets/endlessAssets/hitSX.wav');
    hitDX = P$.loadSound('assets/endlessAssets/hitDX.wav');
    miss = P$.loadSound('assets/endlessAssets/miss.wav')
    met1 = P$.loadSound('assets/met1.wav');
    met2 = P$.loadSound('assets/met2.wav');
    logo = P$.loadImage('assets/icon_transparent.png');
}


/*
Variables needed to draw the visual guide;
*/
var xLine1;
var xLine2;
var yLineH;

/*
Arrays containing circles ("rhythm hits / beats") for left and right side and other related stuff
 */
var circlesNumber = 50;
var leftCircles = new Array(circlesNumber);
var rightCircles = new Array(circlesNumber);
var leftElem = 0;
var rightElem = 0;
var firstElemInGameL = 0;
var firstElemInGameR = 0;
var lastElemL = 0;
var lastElemR = 0;

/*
Boolean value used to debug, mostly to see if everything is going ok with circles array
 */
var debugMode = false

/*
  Circle: class representing a beat circle.
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
        this.speed = params[3]
        this.flag = 0;
        this.windowW = P$.windowWidth;
        this.windowH = P$.windowHeight;
    }
    initialise(x, y, v, id) {
        this.x = x
        this.y = y
        this.flag = 1;
        this.speed = v
        this.side = 0 + (this.x == xLine2);
        this.fillColor = P$.color((1 - this.side) * 160 + 65, 20, 220 + (this.side))
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
        this.windowW = P$.windowWidth;
        this.windowH = P$.windowHeight;
    }

    updateVelocity(newV) {
        this.speed = newV;
    }

    /*
    update(): updates circle position
    */
    update() {
        this.speed = yLineH / (60 / bpm * 8 * P$.frameRate());
        this.y = this.y + this.speed;
        //check here if user missed it
        if (this.y - this.radius > P$.windowHeight) {


            //update firstElemInGameL by finding the next element in leftCircles
            //which is active (its flag is 1)
            this.flag = 0;
            if (this.side == 0) {
                let j = firstElemInGameL;
                while (leftCircles[j].flag == 0) {
                    j++;
                    j = j % leftCircles.length;
                    if(j == firstElemInGameL){
                        break;
                    }
                }
                firstElemInGameL = j;
                leftElem--;
            }
            else if (this.side == 1) {
                let j = firstElemInGameR;
                while (rightCircles[j].flag == 0) {
                    j++;
                    j = j % rightCircles.length;
                    if(j == firstElemInGameL) {
                        break;
                    }
                }
                firstElemInGameR = j;
                rightElem--;
            }
        }
    }
    /*
    show(): draws circle on the canvas
    */
    show() {
        if (this.flag) {
            P$.fill(this.fillColor);
            P$.strokeWeight(1);
            P$.stroke(240)
            P$.ellipse(this.x, this.y, this.radius, this.radius);
            //show a p5.js text beside the circle with its id
            if (debugMode) {
                P$.text(this.id, this.x + this.radius, this.y + this.radius)
            }
        }
    }
}
/*
setup(): function that gets called by p5.js at startup. Initialise variables
needed in the sketch here; load audio files, fonts, etc, in preload() instead
*/
function sketchSetup() {
    P$.createCanvas(P$.windowWidth, P$.windowHeight);
    /*
    see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
    There's no need for the audio context to be running as soon as the page is loaded
    */
    P$.getAudioContext().suspend();
    P$.frameRate(60)

    //initialise guide coordinates
    xLine1 = P$.width / 2 - P$.width / 12;
    xLine2 = P$.width / 2 + P$.width / 12;
    yLineH = 3 / 4 * P$.height;
    started = false;
    font = P$.textFont('Roboto', 30)

    // default values, the actual values will be inserted by the user
    bpm = 120;
    leftR = 4;
    rightR = 3;

    Tone.Transport.bpm.value = bpm;

    startCircleArrays();
}
/*
startCircleArrays() : function that initializes circles array
 */
startCircleArrays = function () {
    for (let i = 0; i < leftCircles.length; i++) {
        leftCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
    for (let i = 0; i < rightCircles.length; i++) {
        rightCircles[i] = new Circle([0, 0, rhythm_rad, 0])
    }
}
var guideRadius = 30; //radius of guide circles
var rhythm_rad = 20; //radius of rhythm circles


var hitMessages = new Array(2); // hit quality messages
hitMessages[0] = ""
hitMessages[1] = ""
/*
sketchDraw(): main draw function called by main p5.js draw() function
*/
function sketchDraw() {
    P$.clear();
    P$.background('rgba(255,255,255, 0)');
    if(debugMode){
        P$.textSize(20);
        //write a text in p5.js displaying firstElemnInGameL
        P$.text(firstElemInGameL, 450, 400)
        //write a text in p5.js displaying firstElemInGameR
        P$.text(firstElemInGameR, 450, 450)
        //write a text in p5.js displaying "Left elements: " and leftElem
        P$.text("Left elements: " + leftElem, 220, 500)
    }

    //display training mode
    P$.push()
    //use the "Maven Pro" text font
    P$.textFont('Monoton', 30);
    //display it on the top left corner
    P$.textAlign(P$.LEFT, P$.CENTER)
    P$.fill(250, 127, 250)
    P$.noStroke()
    P$.text("TRAINING MODE", 50, 60);
    //display the logo next to mode by resizing to be 70x70
    P$.pop()

    //display the score
    P$.push()
    //we have to keep the font otherwise it gets bugged
    P$.textFont('Monoton', 40)
    P$.textSize(80);
    //display it on the top left corner, inside a white rectangle
    P$.textAlign(P$.CENTER, P$.CENTER)
    P$.fill(250, 127, 250)
    P$.stroke(12)
    P$.text(score, P$.width/2, 150)
    P$.pop()

    // display left and right rhythms
    P$.fill(250, 127, 250)
    P$.textFont('Aldrich',32)
    P$.noStroke()
    P$.textSize(200)
    P$.text(leftR, (P$.width / 2 - P$.width / 12)/2, 400)
    P$.text(rightR, P$.width - (P$.width/1.6 - P$.width / 12)/2 , 400)


    drawReference2();
    if(isFromDidactic) // boolean variable, true if we are coming from didactic mode
        drawFromDidactic()
    // Here we are in the game, update and show each circle and display hit quality messages
    if (pageFoc) {
        P$.push()
        P$.fill(12)
        P$.textSize(20)
        P$.stroke(246, 41, 202)
        P$.text(hitMessages[0], xLine1 - 150, yLineH + 50)
        P$.stroke(85, 35, 222)
        P$.text(hitMessages[1], xLine2 + 30, yLineH + 50)
        P$.pop()
        let nL = firstElemInGameL + leftElem
        let nR = firstElemInGameR + rightElem
        let counterL = 0;
        let counterR = 0;

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

        P$.textSize(20)
        nL = nL + counterL
        nR = nR + counterR

        for (let i = firstElemInGameL; i < nL; i++) {
            leftCircles[i % leftCircles.length].update();
            leftCircles[i % leftCircles.length].show();
        }
        for (let i = firstElemInGameR; i < nR; i++) {
            rightCircles[i % rightCircles.length].update();
            rightCircles[i % rightCircles.length].show();

        }
    }

    
}
/*
drawFromDidactic(): draw function called by main p5.js draw() function, when coming by didactic mode
*/
drawFromDidactic = function(){
    //draw a left arrow on the left on the middle of the screen
    P$.push()
    P$.stroke(255)
    P$.strokeWeight(3)
    P$.fill(100)
    P$.rectMode(P$.CENTER)
    P$.rect(P$.width/20, P$.height/2, 50, 50)
    //draw a white left arrow inside
    P$.fill(255)
    P$.triangle(P$.width/20 + 20, P$.height/2 - 20, P$.width/20 + 20, P$.height/2 + 20, P$.width/20 - 20, P$.height/2)
    P$.pop()
    if (!toneLoopsStarted){
    P$.push()
    P$.stroke(12    )
    P$.fill(255)
    P$.textFont('Aldrich', 30)
    P$.textAlign(P$.CENTER)
    P$.textSize(30)
    P$.text("press spacebar to start", P$.width/2, P$.height/2)
    P$.pop()
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
    v = yLineH / (60 / bpm * 8 * P$.frameRate()); //speed necessary to reach guide after 8 beats
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
drawReference2(): draws the guide
*/
drawReference2 = function () {
    P$.stroke(180);
    P$.strokeWeight(2);
    P$.line(xLine1, 0, xLine1, P$.height);
    P$.line(xLine2, 0, xLine2, P$.height);
    P$.line(0, yLineH, P$.width, yLineH)
    P$.fill(180);
    P$.strokeWeight(3);
    P$.stroke(0, 0, 80)
    P$.ellipse(xLine1, yLineH, guideRadius, guideRadius);
    P$.ellipse(xLine2, yLineH, guideRadius, guideRadius);
}


/*
windowResized(): p5js function that gets called every time the window
gets resized; recalculate here all the variables that contain coordinates
in their formulas
*/
function sketchWindowResized() {
    P$.removeElements();
    P$.resizeCanvas(P$.windowWidth, P$.windowHeight);
    xLine1 = P$.width / 2 - P$.width / 12;
    xLine2 = P$.width / 2 + P$.width / 12;
    yLineH = 3 / 4 * P$.height;
    v = yLineH / (60 / bpm * 8 * P$.frameRate());
    //recenter circles on the lines
    //TODO: make this so it works only with active circles
    leftCircles.forEach((item, i) => {
        let c = leftCircles[i];
        c.setNewCoords(xLine1, P$.map(c.y, 0, c.windowH, 0, P$.windowHeight), P$.windowWidth, P$.windowHeight)
        c.updateVelocity(v)
    });
    rightCircles.forEach((item, i) => {
        let c = rightCircles[i];
        c.setNewCoords(xLine2, P$.map(c.y, 0, c.windowH, 0, P$.windowHeight), P$.windowWidth, P$.windowHeight)
        c.updateVelocity(v)
    });
    // draw game tutorial
    if(tutorialDisplayed){
        if(place == 0){
            textFirstDisplay = P$.createDiv(tutorialText)
            textFirstDisplay.addClass('tutorial_text')

            nextButton = P$.createDiv('>');
            nextButton.addClass('next_button');
            nextButton.mousePressed(nextButtonFunction)
            nextButton.position(P$.width/2 + 480 - 80, P$.height/2)
        }
        else if(place == 1){
            previousButton = P$.createDiv('<');
            previousButton.addClass('previous_button');
            previousButton.mousePressed(previousButtonFunction)
            previousButton.position(P$.width/2 - 480 + 55, P$.height/2)

            imgStartingFrame = P$.createImg(
                'assets/frame2.png',
                'starting Frame'
            );
            imgStartingFrame.addClass('tutorial_image')
        }
    }
}
var toneLoopsStarted = false //keeps track of whether circles can spawn
/*
startToneLoops(intL, intR): starts circle creation loops for each side
 */
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
*/

P$.keyPressed = function () {
    let key = P$.key;
    //check if any of the active circles is overlapping with the
    //reference
    if(debugMode){
        //if the key is o stop tone
        if (key == 'o' || key == 'O') {
            Tone.Transport.stop();
        }
        //if the key is p start tone
        if (key == 'p' || key == 'P') {
            Tone.Transport.start();
        }
    }

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
                hitSX.play();
                //TODO calculate the points
                //add points to the score of the player proportionally to the
                //inverse of the distance between the circle and the reference yLineH
                let yy = P$.map(Math.abs(c.y - yLineH), 0, guideRadius, 100, 0)
                let points = Math.round(yy) //Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)))
                //let points = Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)))
                score = score + points;
                displayHitQuality(points, 0)
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
            miss.play();
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
                hitDX.play();
                //calculate the points
                let yy = P$.map(Math.abs(c.y - yLineH), 0, guideRadius, 100, 0)
                let points = Math.round(yy) //Math.min(100, Math.round(1 / (Math.abs(c.y - yLineH) / guideRadius)))
                score = score + points
                displayHitQuality(points, 1)
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
                rightElem--;
                
            }
        }
        if (!hitR) {
            miss.play();
        }
    }
    if(key==' '){
        toneLoopsStarted = true
        Tone.start()
    }
    if(key == 'b' || key == 'B'){
        debugMode = !debugMode;
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
    if (metroFlag % 4 == 0) {
        met1.play()
    } else {
        met2.play();
    }
    metroFlag += 1;
}
var clearTimeoutL
var clearTimeoutR
displayHitQuality = function (points, side) {
    //prints a message on the side (side can be 0 or 1, indicating left or right side) 
    //of the guide circle 
    //to indicate how good a hit was ("OK", "GREAT", "AMAZING","PERFECT")
    //depending on the points scored
    let x = 0;
    let y = 0;
    if (side == 0) {
        clearTimeout(clearTimeoutL)
        x = xLine1;
        y = yLineH;
    } else {
        clearTimeout(clearTimeoutR)
        x = xLine2;
        y = yLineH;
    }
    let msg = "";
    if (points >= 95) {
        msg = "PERFECT";
    } else if (points >= 85 && points < 95) {
        msg = "AMAZING";
    } else if (points >= 70 && points < 85) {
        msg = "GREAT";
    } else if (points >= 40 && points < 70) {
        msg = "GOOD"
    }
    else if (points >= 0 && points < 40) {
        msg = "OK";
    }

    hitMessages[side] = msg;
    //if you want disappearing messages insert a function here (we could use for example a function that
    //sets the text color to be closer and closer to transparency)
    if (side == 0) {
        clearTimeoutL = setTimeout(()=>{hitMessages[side] = ""}, 1000);
    }
    if (side == 1) {
        clearTimeoutR = setTimeout(() => { hitMessages[side] = "" }, 1000);
    }
}



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