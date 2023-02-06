var button;
var div;
var div1;
var div2;
var div3;
var started; //bool: T if we're in the game, F is we're in the menu

var tutorialText = "Welcome to the training mode.&#10;Improve your skills choosing BPM and two rhythms,"+
"one for the left hand and one for the right hand.&#10;You need to press respectively the key 'S' and the key 'K' "+
"every time a falling rhythm dot is inside the guide circle.&#10;"+
"&#10;"+
"This mode goes on forever. To exit, just press the 'Home' button in the upper right corner.&#10;"+
"&#10;"+
"Have a good training session!";

var tutorialDisplayed = false;
var placeZeroTutorialDisplayed = false;
var tutorialButton;

var rhyLeft;
var rhyRight;
var bpmFromDidactic;
var skipChoices = false
var isFromDidactic = false
window.P$ = new  p5(p =>{

    p.preload = function () {
        sketchPreload();
    }
    
    p.setup= function () {
        sketchSetup();
        
        p.createCanvas(p.windowWidth, p.windowHeight);
    
        

        if (window.location.search.slice(1) != "") {
            //skipChoices=true&bpm=90&leftR="+selectedPolyrhythm[0]+"&rightR
            let a = window.location.search.slice(1).split("&").forEach(function (e) {
                
                let b = e.split("=");
                if (b[0] == "skipChoices") {
                    skipChoices = b[1]
                    if(skipChoices == "true"){
                        skipChoices = true
                    }else{
                        skipChoices = false
                    }
                }
                else if(b[0] == "from"){
                    if(b[1] == "didactic"){
                        isFromDidactic = true
                    }
                }
                else if (b[0] == "bpm") {
                    bpmFromDidactic = b[1]
                }
                else if (b[0] == "leftR") {
                    rhyLeft = b[1]
                }
                else if (b[0] == "rightR") {
                    rhyRight = b[1]
                }
            })
        }
        
        started = false;

        if(!skipChoices){
            div = p.createDiv("TRAINING MODE");
            div.class('div');
            div.position(p.windowWidth/100, p.windowHeight/5)

            div1 =p.createDiv("SELECT BPM:");
            div1.class('div1');
            div1.position(p.width/100, p.height/2.6);

            div2 = p.createDiv("SELECT HAND RHYTHMS:");
            div2.class('div2');
            div2.position(p.width/120, p.height/1.80);

            div3 = p.createDiv("L / R");
            div3.class('div3');
            div3.position(p.width/100, p.height/1.67);
        
            button = p.createButton('PLAY');
            button.class('button');
            button.position(p.width/2.35, p.height/1.47)

            button.mousePressed(() => {
                if (!skipChoices) {
                    bpm = sel.value();
                    leftR = sel1.value();
                    rightR = sel2.value();
                }
                Tone.Transport.bpm.value = bpm;
                interval = 60 / bpm;
                intervalL = 4 * 1 / leftR * 60 / bpm;
                intervalR = 4 * 1 / rightR * 60 / bpm;
    
                if(!skipChoices){
                sel.remove();
                sel1.remove();
                sel2.remove();
    
                
                div1.remove();
                div2.remove();
                div3.remove();
                }
                div.remove();
                button.remove();
                
                P$.userStartAudio();
                Tone.start();
                started = true;
                Tone.Transport.start();
                startToneLoops(leftR, rightR);
                startMetronome(bpm)
            });


            selBpm();
            selLeftHand();
            selRightHand();
        }else{
            bpm = bpmFromDidactic;
            leftR = rhyLeft;
            rightR = rhyRight;
            Tone.Transport.bpm.value = bpm;
            interval = 60 / bpm;
            intervalL = 4 * 1 / leftR * 60 / bpm;
            intervalR = 4 * 1 / rightR * 60 / bpm;
            P$.userStartAudio();
            Tone.start();
            started = true;
            Tone.Transport.start();
            startToneLoops(leftR, rightR);
            startMetronome(bpm)
        }
   
        
        
        // tutorial stuff
        tutorialButton = p.createDiv('?')
        tutorialButton.addClass('tutorial_button')
        tutorialButton.mousePressed(displayTutorial)

    }

    // display tutorial
    var nextButton;
    var previousButton;
    var imgStartingFrame;
    var imgPlayingFrame;
    var textFirstDisplay;
    var place = 0;

    displayTutorial = function () {
        if(tutorialDisplayed){
            nextButton.remove();
            sel.show();
            sel1.show();
            sel2.show();
            div.show();
            div1.show();
            div2.show();
            div3.show();
            
            button.show();

            if(place == 0){
                    textFirstDisplay.remove();
                    placeZeroTutorialDisplayed = false;
                    nextButton.remove();
                }
            if(place == 1){
                imgStartingFrame.remove();
                previousButton.remove();
                nextButton.remove();
                }
            if(place == 2){
                imgPlayingFrame.remove();
                previousButton.remove();
                }
            place=0;
            tutorialDisplayed = false;
        } else {
            sel.hide();
            sel1.hide();
            sel2.hide();

            div.hide();
            div1.hide();
            div2.hide();
            div3.hide();
            
            button.hide();

            nextButton = p.createDiv('>');
            nextButton.addClass('next_button');
            nextButton.mousePressed(nextButtonFunction)
            nextButton.position(p.width/1.25, p.height/2)

            textFirstDisplay = p.createDiv(tutorialText)
            textFirstDisplay.addClass('tutorial_text')

            placeZeroTutorialDisplayed = true;
            tutorialDisplayed = true;
        }
        

    }

    nextButtonFunction = function() {
        if(place == 0){
            textFirstDisplay.hide();
            placeZeroTutorialDisplayed = false;
            previousButton = p.createDiv('<');
            previousButton.addClass('previous_button');
            previousButton.mousePressed(previousButtonFunction)
            previousButton.position(p.width/6, p.height/2)
            place += 1;
            nextButton.hide();
            imgStartingFrame = p.createImg(
                    'assets/frame2.png',
                    'starting Frame'
                );
            imgStartingFrame.addClass('tutorial_image')
        }
        
    }

    previousButtonFunction = function() {
        if (place == 1) {
            place -= 1;
            previousButton.hide()
            placeZeroTutorialDisplayed = true;
            nextButton.show();
            textFirstDisplay.show()
            imgStartingFrame.hide()
        }
    }



    p.draw=function () {
        if (started){
            sketchDraw()
        }
        else {
            p.clear();
            p.background('rgba(255,255,255, 0)');
            if(isFromDidactic)
                drawFromDidactic()
            if(!skipChoices){
                writeText();
            }
        }

        if(tutorialDisplayed){
            tutorialBackground();
        }
    }

    drawFromDidactic = function () {
        //draw a left arrow on the left on the middle of the screen
        
        p.push()
        p.stroke(255)
        p.strokeWeight(3)
        p.fill(100)
        p.rectMode(p.CENTER)
        p.rect(p.width / 20, p.height / 2, 50, 50)
        //draw a white left arrow inside
        p.fill(255)
        p.triangle(p.width / 20 + 20, p.height / 2 - 20, p.width / 20 + 20, p.height / 2 + 20, p.width / 20 - 20, p.height / 2)
        p.pop()
    }

    tutorialBackground = function () {
        p.strokeWeight(1);
        p.stroke(255,255,255)
        p.fill(39,38,38,230)

        //p.translate(-480, -270);
        p.rect(p.width/2,p.height/2,1000,540)
        //p.translate(480, 270);

    }


    p.windowResized = function() {
        if (started){
            sketchWindowResized();
        }
        else{
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        }
    }

    p.mousePressed = function(){
        //P$.rect(P$.width / 20, P$.height / 2, 50, 50)
        if(isFromDidactic && p.mouseX > p.width / 20 - 25 && p.mouseX < p.width / 20 + 25 && p.mouseY > p.height / 2 - 25 && p.mouseY < p.height / 2 + 25){
            window.open("didactic.html?from=training", "_self")
        }
    }
    
    writeText=function () {
        
        p.stroke(250, 127, 250);
        p.strokeWeight(3);
        p.noFill();
        p.rectMode(p.CENTER);
        p.rect(p.width/2.0, p.height/2.4, 480, 90);
        p.rect(p.width/2.0, p.height/1.65, 480, 120);

        p.noStroke();
        p.textFont('Aldrich');
        p.textSize(20);
        p.fill(255, 255, 255);
        p.text('/', p.width/2.01, p.height/1.54);
    }

    let sel;
    function selBpm() {
        sel = p.createSelect();
        sel.position(p.width/2.05, p.height/2.32);
        sel.style('font-size', '20px');
        sel.style('family-font', 'Aldrich');
        let textCol = p.color(92,71,255);
        sel.style('color', textCol)
        let backCol = p.color(255, 255, 255);
        sel.style('background-color', backCol);
        sel.style('border', textCol);

        sel.option('60')
        sel.option('70')
        sel.option('80')
        sel.option('90')
        sel.option('100')
        sel.option('110')
        sel.option('120')

        sel.changed(bpmEvent);

    }

    function bpmEvent() {
        return sel.value()
    }

    let sel1;
    function selLeftHand() {
        sel1 = p.createSelect();
        sel1.position(p.width/2.13, p.height/1.57);
        sel1.style('font-size', '20px');
        sel1.style('family-font', 'Aldrich');
        let textCol = p.color(92,71,255);
        sel1.style('color', textCol)
        let backCol = p.color(255, 255, 255);
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
        sel2 = p.createSelect();
        sel2.position(p.width/1.92, p.height/1.57);
        sel2.style('font-size', '20px');
        sel2.style('family-font', 'Aldrich');
        let textCol = p.color(92,71,255);
        sel2.style('color', textCol)
        let backCol = p.color(255, 255, 255);
        sel2.style('background-color', backCol);
        sel2.style('border', textCol);

        sel2.option('1')
        sel2.option('2')
        sel2.option('3')
        sel2.option('4')
        sel2.option('5')
        sel2.option('6')
        sel2.option('7')

        sel2.changed(rightEvent);
    }

    function rightEvent() {
        return sel2.value()
    }

})


