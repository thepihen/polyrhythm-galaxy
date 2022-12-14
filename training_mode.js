let button;
var started; //bool: T if we're in the game, F is we're in the menu
window.P$ = new  p5(p =>{

    var font;
    p.preload = function () {
        sketchPreload();
    }

    /*var bpmGeneral;
    var leftGeneral;
    var rightGeneral;*/
    p.setup= function () {
        sketchSetup();
        p.createCanvas(p.windowWidth, p.windowHeight);
        font = p.textFont('Roboto',30);

        selBpm();
        selLeftHand();
        selRightHand();

        started = false;

        button = p.createButton('PLAY');
        button.position(p.width/2.11, p.height/1.35)
        let col = p.color(240, 240, 10);
        button.style('background-color', col);
        button.style('font-size', '25px');
        button.style('family-font', 'Roboto');
        button.style('border', col)
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
            p.background(12);
            drawReference();
            writeText();
        }
    }

    drawReference =function (){
        p.stroke(240);
        p.strokeWeight(1);
        p.fill(12);
        p.strokeWeight(4);
        p.stroke(240,240,10)

    }

    p.windowResized = function() {
        if (started){
            sketchWindowResized();
        }
        else{
            p.removeElements();
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        }
    }


    writeText=function () {
        p.fill(12);
        p.textSize(60);
        p.text('TRAINING MODE', p.width/2, p.height/3.5);
        p.textAlign(p.CENTER);
        p.fill(240)
        p.stroke(12)
        p.textAlign(p.CENTER);
        p.textSize(25);
        p.text('Select BPM:', p.width/2, p.height/2.45)
        p.fill(240)
        p.stroke(12)
        p.textAlign(p.CENTER);
        p.textSize(25);
        p.text('Select Hand Rhythms:', p.width/2, p.height/1.7)
        p.text('L', p.width/2.08, p.height/1.52)
        p.text('/', p.width/2.0, p.height/1.52)
        p.text('R', p.width/1.94, p.height/1.52)
        p.text('/', p.width/2.0, p.height/1.41)
    }

    let sel;
    function selBpm() {
        sel = p.createSelect();
        sel.position(p.width/2.12, p.height/2.3);
        sel.style('font-size', '20px');
        sel.style('family-font', 'Roboto');
        let textCol = p.color(255);
        sel.style('color', textCol)
        let backCol = p.color(12);
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
        sel1.position(p.width/2.12, p.height/1.47);
        sel1.style('font-size', '20px');
        sel1.style('family-font', 'Roboto');
        let textCol = p.color(255);
        sel1.style('color', textCol)
        let backCol = p.color(12);
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
        sel2.position(p.width/1.98, p.height/1.47);
        sel2.style('font-size', '20px');
        sel2.style('family-font', 'Roboto');
        let textCol = p.color(255);
        sel2.style('color', textCol)
        let backCol = p.color(12);
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

    /*function variables() {
        bpmGeneral=bpmEvent();
        leftGeneral=leftEvent();
        rightGeneral=rightEvent();
    }*/
})


/*function playButton() {
    button = createButton('PLAY');
    button.position(width/2.11, height/1.35)
    let col = color(240, 240, 10);
    button.style('background-color', col);
    button.style('font-size', '25px');
    button.style('family-font', 'Roboto');
    button.style('border', col)

    let button = document.querySelector('#button');
    button.addEventListener('mouseup', (e) => {
    let log = document.querySelector('#log');
    switch (e.button) {
        case 0:
            pbmGeneral = bpmEvent();
            leftGeneral=leftEvent();
            rightGeneral=rightEvent();
            break;
        default:
        log.textContent = `Unknown button code: ${e.button}`;
    }
    });
}*/






  
  
