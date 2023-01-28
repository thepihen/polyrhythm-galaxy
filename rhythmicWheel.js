/* TODO (with final project)
-> Insert Metronome
-> Insert Start/Stop Buttons
-> Insert Changing Rhythms Buttons
*/

var beatSpeed;
var rhythmOuter;
var rhythmInner;
var wheelBPM = 60;
var hand_start_radius;
var x_hand_start;
var y_hand_start;
var x_hand;
var y_hand;
var big_circle_radius;
var circles_radius;
var wheel_time;
var wheelStarted;
var circlesNumberMax = 12;
var circlesOuter = new Array(circlesNumberMax); // Outer
var circlesInner = new Array(circlesNumberMax); // Inner
var enableSlideOuter = false;
var enableSlideInner = false;
var slideInner = 0;
var slideOuter = 0;
var dragPointOuter = 0;
var dragPointInner = 0;
var xCenter = 0;
var yCenter = 0;

setupRhythmicWheel = function (){
    rhythmOuter = 4;
    rhythmInner = 3;

    beatSpeed = 2 * Math.PI / (60 / wheelBPM * 4 * P$.frameRate());
    wheelStarted = false;

    xCenter = P$.width - P$.width/8;
    yCenter = P$.height - 150;

    wheel_time = 0;
    y_hand = Math.sin(wheel_time + Math.PI/2);
    x_hand = Math.cos(wheel_time + Math.PI/2);
    y_hand_start = Math.sin(wheel_time + Math.PI);
    x_hand_start = Math.cos(wheel_time + Math.PI);
    big_circle_radius = 96;
    hand_start_radius = 1.6;
    circles_radius = 16;

    startCircleWheelArrays();
}

startCircleWheelArrays = function () {
    for (let i = 0; i < circlesNumberMax; i++) {
        circlesOuter[i] = new WheelCircle([true,false,10,false])
    }
    for (let i = 0; i < circlesNumberMax; i++) {
        circlesInner[i] = new WheelCircle([true,false,10,false])
    }
}

var x_outer;
var y_outer;
var x_inner;
var y_inner;
var outer_time;
var inner_time;
var wheelPlayButton;
var wheelResetButton;
drawRhythmicWheel = function () {

    if (enableSlideOuter){
        slideOuter = dragPointOuter;
    }

    if (enableSlideInner){
        slideInner = dragPointInner;
    }

    // Big Circles
    P$.fill(0,0,0,75);
    P$.strokeWeight(3)
    P$.ellipse(xCenter, yCenter, big_circle_radius * 2, big_circle_radius * 2); // Outer ellipse
    P$.ellipse(xCenter, yCenter, big_circle_radius, big_circle_radius); // Inner ellipse


    // Circles
    for (let i = 0; i < rhythmOuter; i++) {
        x_outer = (xCenter) - big_circle_radius*Math.cos(i * 2 *Math.PI/rhythmOuter + Math.PI/2 + slideOuter);
        y_outer = (yCenter) - big_circle_radius*Math.sin(i * 2 *Math.PI/rhythmOuter + Math.PI/2 + slideOuter);
        outer_time = (i * 2 *Math.PI/rhythmOuter + slideOuter)%(Math.PI*2)
        if(outer_time < 0){
            outer_time = outer_time + Math.PI*2;
        }
        if ( wheel_time >= outer_time - 0.1 && wheel_time <= outer_time + 0.2 && wheelStarted ){
            circlesOuter[i].play('outer')
        }

        if(i==0){
            circlesOuter[i].show(x_outer, y_outer, circles_radius,'black')
        }
        else{
            circlesOuter[i].show(x_outer, y_outer, circles_radius,'red')
        }
    }

    for (let i = 0; i < rhythmInner; i++) {
        x_inner = (xCenter) - (big_circle_radius/2)*Math.cos(i * 2 *Math.PI/rhythmInner + Math.PI/2 + slideInner);
        y_inner = (yCenter) - (big_circle_radius/2)*Math.sin(i * 2 *Math.PI/rhythmInner + Math.PI/2 + slideInner);
        inner_time = ( i * 2 *Math.PI/rhythmInner + slideInner)%(Math.PI*2)
        if (inner_time < 0){
            inner_time = inner_time + Math.PI*2;
        }
        if ( wheel_time >= inner_time - 0.1 && wheel_time <= inner_time + 0.2 && wheelStarted ){
            circlesInner[i].play('inner')
        }

        if(i==0){
            circlesInner[i].show(x_inner , y_inner , circles_radius,'black')
        }
        else{
            circlesInner[i].show(x_inner , y_inner , circles_radius,'blue')
        }
    }

    // Hand
    P$.stroke(255,255,255)
    P$.line((xCenter) - hand_start_radius*x_hand_start, (yCenter) - hand_start_radius*y_hand_start , (xCenter) - (big_circle_radius+15)*x_hand , (yCenter) - (big_circle_radius+15)*y_hand );
    P$.line((xCenter) + hand_start_radius*x_hand_start, (yCenter) + hand_start_radius*y_hand_start , (xCenter) - (big_circle_radius+15)*x_hand , (yCenter)  - (big_circle_radius+15)*y_hand );
    P$.fill(255,255,255,255);
    P$.arc(xCenter, yCenter, hand_start_radius*2, hand_start_radius* 2, wheel_time , wheel_time + Math.PI)
    for (let i = 0; i < 10; i++) {
        P$.line((xCenter) - hand_start_radius*(i/10)*x_hand_start, (yCenter) - hand_start_radius*(i/10)*y_hand_start , (xCenter) - (big_circle_radius+15)*x_hand , (yCenter) - (big_circle_radius+15)*y_hand);
    }

    for (let i = 0; i < 10; i++) {
        P$.line((xCenter) + hand_start_radius*(i/10)*x_hand_start, (yCenter) + hand_start_radius*(i/10)*y_hand_start , (xCenter) - (big_circle_radius+15)*x_hand , (yCenter) - (big_circle_radius+15)*y_hand);
    }

    if (wheelStarted){
        beatSpeed = 2 * Math.PI / (60 / wheelBPM * 4 * P$.frameRate());
        wheel_time = wheel_time + beatSpeed;
        y_hand = Math.sin(wheel_time + Math.PI/2);
        x_hand = Math.cos(wheel_time + Math.PI/2);
        y_hand_start = Math.sin(wheel_time + Math.PI);
        x_hand_start = Math.cos(wheel_time + Math.PI);

        if (wheel_time >= 2*Math.PI){
            wheel_time = 0;
        }
    }else{
        wheel_time = 0;
        y_hand = Math.sin(wheel_time + Math.PI / 2);
        x_hand = Math.cos(wheel_time + Math.PI / 2);
        y_hand_start = Math.sin(wheel_time + Math.PI);
        x_hand_start = Math.cos(wheel_time + Math.PI);
    }
    //add a play button over the wheel
    
}

var wheelIsShown = false

setWheelShown = function (shown) {
    wheelIsShown = shown
    setupWheelButtons(wheelIsShown)
}

setupWheelButtons = function (shown) {
    if(shown){
        wheelResetButton = P$.createDiv('RESET SHIFT')
        wheelResetButton.addClass('reset_button_rw')
        wheelResetButton.mousePressed(function (){
            slideOuter = 0;
            slideInner = 0;
        })

        wheelPlayButton = P$.createDiv('')
        wheelPlayButton.addClass('play_button_rw')
        wheelPlayButton.mousePressed(function (){
            if (!wheelStarted) {
                wheelStarted = true;
            }
            else {
                wheelStarted = false;
            }
        })
        wheelPlayButton.position(xCenter,yCenter - big_circle_radius - 50)
        wheelResetButton.position(xCenter,yCenter + big_circle_radius + 25)
    }
    else{
        wheelStarted = false;
        wheelPlayButton.remove()
        wheelResetButton.remove()
    }
}

keyPressedRhythmicWheel = function () {
    if (!wheelIsShown)
        return
    if ( P$.key == 'k' || P$.key == 'K'){
        if (!wheelStarted){
            wheelStarted = true;
        }
        else {
            wheelStarted = false;
        }
    }
}
mousePressedRhythmicWheel = function () {
    if (!wheelIsShown)
        return
    for(let i = 0; i < rhythmOuter; i++) {
        const isPressed = mouseInCircle(circlesOuter[i]);

        if(isPressed) {
            enableSlideOuter = true
            break;
        }
    }

    for(let i = 0; i < rhythmInner; i++) {
        const isPressed = mouseInCircle(circlesInner[i]);

        if(isPressed) {
            enableSlideInner = true
            break;
        }
    }

}
mouseDraggedRhythmicWheel = function () {
    if(P$.mouseX > xCenter){
        if(P$.mouseY < P$.pmouseY ){
            dragPointOuter = slideOuter - 0.04;
            dragPointInner = slideInner - 0.07;
        }
        else if(P$.mouseY > P$.pmouseY ){
            dragPointOuter = slideOuter + 0.04;
            dragPointInner = slideInner + 0.07;
        }
    }
    else{
        if(P$.mouseY > P$.pmouseY ){
            dragPointOuter = slideOuter - 0.04;
            dragPointInner = slideInner - 0.05;
        }
        else if(P$.mouseY < P$.pmouseY ){
            dragPointOuter = slideOuter + 0.04;
            dragPointInner = slideInner + 0.05;
        }
    }
}
mouseReleasedRhythmicWheel = function () {
    enableSlideOuter = false
    enableSlideInner = false
}

//updates wheel location (called when window is resized)
updateWheelLocation = function(){
    xCenter = P$.width - P$.width / 8;
    yCenter = P$.height - 150;
}

function mouseInCircle(pos) {
    return P$.dist(P$.mouseX, P$.mouseY, pos.x, pos.y) < circles_radius;
}

class WheelCircle {
    constructor(params) {
        this.flag = params[0]
        this.played = params[1]
        this.i = params[2]
        this.x = params[3]
        this.y = params[4]
        this.hitted = params[5]
    }

    show(x,y,radius,fillColor) {
        if (this.flag) {
            if (this.hitted == true){
                P$.fill('yellow');
                radius = radius + this.i;
                this.i = this.i - 1;
            }
            else{
                P$.fill(fillColor);
            }
            this.x = x;
            this.y = y;
            P$.strokeWeight(1);
            if(fillColor == 'black'){
                P$.stroke(255,255,255)
            }
            else{
                P$.stroke(0,0,0)
            }
            P$.ellipse(x, y,radius,radius);
        }
    }

    play(side) {
        if (this.played == false) {
            const a = -171.7391
            const b = 1.2172 * 10000
            const bugTimeout = a*wheelBPM + b
            console.log(bugTimeout)
            if (side == 'inner') {
                hitInner.play()
            }
            if (side == 'outer') {
                hitOuter.play()
            }
            this.played = true;
            this.hitted = true;

            setTimeout( () => {
                this.i = 10
                this.hitted = false
            } , 150);

            if(wheelBPM >= 70){
                setTimeout( () => {
                    this.played = false
                } , 150);
            }
            else{
                setTimeout( () => {
                    this.played = false
                } , bugTimeout);
            }
        }
    }
}





