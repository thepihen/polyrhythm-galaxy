var button;
var div;
var div1;
var div2;
var div3;
var started; //bool: T if we're in the game, F is we're in the menu

window.P$ = new  p5(p =>{

    p.preload = function () {
        sketchPreload();
    }
    
    p.setup= function () {
        sketchSetup();
        
        p.createCanvas(p.windowWidth, p.windowHeight);
    
        selBpm();
        selLeftHand();
        selRightHand();

        started = false;
        div =p.createDiv("TRAINING MODE");
        div.class('div');
        div.position(p.width/550, p.height/5.9)

        div1 =p.createDiv("SELECT BPM:");
        div1.class('div1');
        div1.position(p.width/2.3, p.height/2.7);

        div2 = p.createDiv("SELECT HAND RHYTHMS:");
        div2.class('div2');
        div2.position(p.width/2.7, p.height/1.87);

        div3 = p.createDiv("L / R");
        div3.class('div3');
        div3.position(p.width/2.08, p.height/1.70);


        button = p.createButton('PLAY');
        button.class('button');
        button.position(p.width/2.35, p.height/1.47)
        
        button.mousePressed(() => {
            bpm = sel.value();
            leftR = sel1.value();
            rightR = sel2.value();
            Tone.Transport.bpm.value = bpm;
            interval = 60 / bpm;
            intervalL = 4 * 1 / leftR * 60 / bpm;
            intervalR = 4 * 1 / rightR * 60 / bpm;

            sel.remove();
            sel1.remove();
            sel2.remove();

            div.remove();
            div1.remove();
            div2.remove();
            div3.remove();
            
            button.remove();
            
            P$.userStartAudio();
            Tone.start();
            started = true;
            Tone.Transport.start();
            startToneLoops(leftR, rightR);
            startMetronome(bpm)
        });
    }

    p.draw=function () {
        if (started){
            sketchDraw()
        }
        else {
            p.clear();
            p.background('rgba(255,255,255, 0)');
            writeText();
        }
    }


    p.windowResized = function() {
        if (started){
            sketchWindowResized();
        }
        else{
            p.resizeCanvas(p.windowWidth, p.windowHeight);
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
        p.text('/', p.width/2.03, p.height/1.50);
    }

    let sel;
    function selBpm() {
        sel = p.createSelect();
        sel.position(p.width/2.09, p.height/2.30);
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
        sel1.position(p.width/2.16, p.height/1.55);
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
        sel2.position(p.width/1.95, p.height/1.55);
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


