/*
ENDLESS MODE:
The "main" mode of this website. This game mode is pretty straightforward (and, in case of doubts, it even contains a
tutorial) and is built over the same basic ideas as the training mode. The main difference is that the user is faced
with progressively harder polyrhythms at increasing BPMs. A score is calculated keeping count of multiple factors,
such as streaks, and is used to create a ranking when the user loses. We think this mode is perfect for those looking
to challenge themselves and their friends on polyrhythms!


KNOWN ISSUES:
There could be audio problems if the game is started too early and the system was not able to totally load audio files.
The game performance slightly changes with respect to the browser. In particular, system works the better with
Microsoft Edge. With Google Chrome there could be slowdowns , while in Firefox in the first game, dots can start
time shifted with respect to the metronome and after few seconds become correctly synchronized. In general there could be
sometimes really closer dots, especially in the first game when the second background beat enters the game for the
first time
*/
var pageFoc = true;
//use p5 in instance mode
p5_instance = function (p5c) {
    // text inside the tutorial first facade
    var tutorialText = "Welcome to the endless mode!&#10;Test your ability in playing cross-rhythms!&#10;" +
                "The game will provide you two rhythms, one to the left and one to the right, " +
                "that you need to play in time by pressing respectively the key 'S' and the key 'K' " +
                "every time a falling rhythm dot is inside the white circle of the related side.&#10;" +
                "Pay Attention!&#10;The provided rhythms will be more and more difficult, the bpm will increase " +
                "progressively and every time you miss a dot or press a key at the wrong time you will " +
                "lose one of the three available lifes that permits you to continue the game. " +
                "Finally, remember to be more accurate possible in order to increase extra points" +
                "bonus and climb the global ranking!";

    // variables for set main text transitions
    var dieTexts = ['You Died','You Died','Press the spacebar\nto retry'];
    var dieDirs = ['up', 'down', 'up']
    var dieIndex = 0;

    var recordTexts = ['You Died','You Died','','','Insert your Nickname!']
    var recordDirs = ['up', 'down', 'up','down','up']
    var recordIndex = 0;

    var updateTexts = ['Updated Ranking!','Updated Ranking!','Press the spacebar\nto retry']
    var updateDirs = ['up', 'down', 'up']
    var updateIndex = 0;

    // total game score
    var gameScore = 0;

    // player lifes
    var lifes = 3;
    var hearts = []; // used for heart images

    // variables used for dynamic circle looping creation
    var bpm;
    var bpmDisplay;
    var bpmDisplayOpacity;
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
    var scheduleMetro;

    // audio variables. Miss and hit audio are duplicated in order to alternate them. Otherwise, there could be the risk
    // that too much closer consecutive hits/misses can overload the buffer and create audio problems with tone.js
    var soundtrackDieRecordChangeBPM;
    var soundtrackHitL1;
    var soundtrackHitL2;
    var soundtrackHitR1;
    var soundtrackHitR2;
    var soundtrackMiss;
    var soundtrackMultipliers;
    var soundtrackBeat1;
    var soundtrackBeat2;
    /*
    preload: function that gets automatically by p5js before loading the sketch.
    ->Everything that needs to be available when the sketch starts needs to be loaded here
    (e.g. fonts, sounds,...)
    */
    p5c.preload = function () {
        font = 'Aldrich';
        soundtrackDieRecordChangeBPM = new Tone.Players({
            die: "assets/endlessAssets/die.wav",
            record: "assets/endlessAssets/record.wav",
            changingBPM :"assets/endlessAssets/changingBPM.wav",
        }).toDestination();

        soundtrackHitL1 = new Tone.Player("assets/endlessAssets/hitSX.wav").toDestination();
        soundtrackHitL2 = new Tone.Player("assets/endlessAssets/hitSX.wav").toDestination();

        soundtrackHitR1 = new Tone.Player("assets/endlessAssets/hitDX.wav").toDestination();
        soundtrackHitR2 = new Tone.Player("assets/endlessAssets/hitDX.wav").toDestination();

        soundtrackMiss = new Tone.Players({
            0: "assets/endlessAssets/miss.wav",
            1: "assets/endlessAssets/miss.wav",
            2: "assets/endlessAssets/miss.wav",
            3: "assets/endlessAssets/miss.wav",
        }).toDestination()

        soundtrackMultipliers = new Tone.Players({
            mult2: "assets/endlessAssets/mult2.wav",
            mult3: "assets/endlessAssets/mult3.wav",
            mult4: "assets/endlessAssets/mult4.wav",
            mult5: "assets/endlessAssets/mult5.wav",
            mult6: "assets/endlessAssets/mult6.wav",
            mult7: "assets/endlessAssets/mult7.wav",
            mult8: "assets/endlessAssets/mult8.wav",
            mult9: "assets/endlessAssets/mult9.wav",
            mult10: "assets/endlessAssets/mult10.wav",
            multFail: "assets/endlessAssets/multFail.wav",
        }).toDestination();

        soundtrackBeat1 = new Tone.Players({
            100: "assets/endlessAssets/BEAT1_100.wav",
            110: "assets/endlessAssets/BEAT1_110.wav",
            120: "assets/endlessAssets/BEAT1_120.wav",
            130: "assets/endlessAssets/BEAT1_130.wav",
            140: "assets/endlessAssets/BEAT1_140.wav",
            150: "assets/endlessAssets/BEAT1_150.wav",
        }).toDestination();

        soundtrackBeat2 = new Tone.Players({
            100: "assets/endlessAssets/BEAT2_100.wav",
            110: "assets/endlessAssets/BEAT2_110.wav",
            120: "assets/endlessAssets/BEAT2_120.wav",
            130: "assets/endlessAssets/BEAT2_130.wav",
            140: "assets/endlessAssets/BEAT2_140.wav",
            150: "assets/endlessAssets/BEAT2_150.wav",
        }).toDestination();

        for(let i =0; i < 3; i++){
            hearts[i] = p5c.loadImage('assets/endlessAssets/heart.png');
        }

    }

    // system managing booleans
    var started;
    var restart;
    var firstTime = true;
    var died;
    var changingBPMVisual = false;
    var newBPMTransition = false;
    var loaded = false;

    // main text characteristics variable
    var colorMenu;
    var opacityMenu;
    var textMenu;

    /*
    Variables needed to draw the visual guide;
    */
    var xLine1;
    var xLine2;
    var yLineH;

    // Possible Rhythms 1 + [2, 4, 8, 16, 32] + [3,6,12,24] + the remainder until 24
    var basicRhythms = [2, 4, 8, 16, 32];
    var tripletRhythms = [3,6,12,24];
    var triplet ; // if true triplet rhythms are included in the game
    var mindBlowing ; // if true other complicated rhythms are included in the game
    var rhythmUpperLimit; // maximum integer number as rhythm ( we assume as maximum 24 )
    var rhythmLowerLimit; // lower integer number as rhythms
    var metroFlagChange; // how much next metronome beats to change rhythm
    var metroFlagChangeValues = [16]; // changes in only 4 measures, for now
    var metroColor; // number used for color of metronome ellipse
    var noReferenceFlag; // if true there will not be the guide
    var noReference; // if yes there will be a noReference transition
    var noReferenceLimit; // how often no reference transition appear
    var rhythmTransition;// if true displays next rhythms

    // variable used to manage circles array system
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
    var lastMultiplier = 1;

    // RANKING STUFF
    var rankingDisplayed = false;
    var firstShowRanking = true;
    var badNickname = false;
    var badNicknameText;
    var imgPodium;
    var titleRanking;
    var columnRanking1 = [];
    var columnRanking2 = [];
    var columnRanking3 = [];
    var namesRanking = [];
    var pointsRanking = []
    var posRecord = 5;

    // RANKING VARIABLES
    namesRanking[0] = "Paul"
    namesRanking[1] = "Helen"
    namesRanking[2] = "Richard"
    namesRanking[3] = "Bianca"
    namesRanking[4] = "John"
    pointsRanking[0] = 12364
    pointsRanking[1] = 10979
    pointsRanking[2] = 7721
    pointsRanking[3] = 6602
    pointsRanking[4] = 5

    // TUTORIAL STUFF
    var tutorialDisplayed = false;
    var placeZeroTutorialDisplayed = false;
    var tutorialButton;

    // OTHER
    var animationY
    var animationXLeft;
    var animationXRight;
    var animationDisplayedLeft = false;
    var animationDisplayedRight = false;
    var animationVisualMetronomeDisplayed = false;
    var intervalAnimationVisualMetronome;
    var textAnimationInterval;
    var intervalAnimationGuides;
    var intervalAnimationLeft;
    var intervalAnimationRight;
    var animationTimeout1;
    var animationTimeout2;
    var animationTimeout3;
    var animationTimeout4;
    var animationTimeout5;
    var animationTimeout6;
    var animationTimeout7;
    var animationTimeout8;
    var animationRadius;
    var guideLeftR = 0;
    var guideLeftG = 0;
    var guideLeftB = 180;
    var guideRightR = 0;
    var guideRightG = 0;
    var guideRightB = 180;

    // BUG MULTIPLE DOTS OR MISSES VERY CLOSE
    var lastL = 2;
    var lastR = 2;
    var lastMiss = 4;

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
        }
        //TODO: delete id field
        initialise(x, y, v, id) {
            this.x = x
            this.y = y
            this.flag = 1;
            this.speed = v
            this.side = 0 + (this.x == xLine2);
            this.fillColor = p5c.color((1 - this.side) * 160 + 65, 20, 220 + (this.side))
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
                        lastMiss += 1;
                        lastMiss = (lastMiss % 3);
                        soundtrackMiss.player(lastMiss).start();

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
                //update firstElemInGameL by finding the next element in leftCircles
                //which is active (its flag is 1)
                this.failFlag = true;
                this.flag = 0;
                if (this.side == 0) {
                    let j = firstElemInGameL;
                    while (leftCircles[j].flag == 0) {
                        j++;
                        j = j % leftCircles.length;
                        if ( j == firstElemInGameL){break}
                    }
                    firstElemInGameL = j;
                    leftElem--;
                }
                else if (this.side == 1) {
                    let j = firstElemInGameR;
                    while (rightCircles[j].flag == 0) {
                        j++;
                        j = j % rightCircles.length;
                        if ( j == firstElemInGameR){break}
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
                p5c.fill(this.fillColor);
                p5c.noStroke()
                p5c.ellipse(this.x, this.y, this.radius, this.radius);
            }
        }
    }
    /*
    reSetup(): function called to compute game setup again after a death.
    The text animations and sound are different in relation of the two possible cases : simply death or death+record.
     */
    function reSetup(){
        resetGame();
        if (gameScore > pointsRanking[4]){
            soundtrackDieRecordChangeBPM.player("record").start();
            newPodium()
            recordIndex = 0;
            recordTexts[2] = 'But Congratulations you are at the position ' + (posRecord + 1) + ' in the global ranking!'
            recordTexts[3] = 'But Congratulations you are at the position ' + (posRecord + 1) + ' in the global ranking!'
            mainTextTransition(recordTexts,recordIndex,recordDirs,15,true,() => {
                setTimeout(() => {
                    inputNickNameTransition()
                }, 200)
            })
        }
        else{
            soundtrackDieRecordChangeBPM.player("die").start();
            gameScore = 0;
            dieIndex = 0;
            mainTextTransition(dieTexts,dieIndex,dieDirs,10,true,() => {noPlayingAnimation();restart = true;})
        }

    }
    /*
    resetGame(): function that contains all general things to do in order to prepare the system for a new game
    In particular :
        -Previous audio needs to be muted
        -Tone and Tone.Transport needs to be reset
        -Circles array and all the variables related need to be reset
        -All variables that describe a game (score, multiplier, game constraints...) need to be reset
     */
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
        for( let i=0 ; i<3; i++){
            if(soundtrackMiss.player(i).state == "started"){soundtrackMiss.player(i).mute;}
        }
        metroFlag = 0;
        radiusDifficulty = 1;
        Tone.Transport.clear(scheduleNoReference);
        Tone.Transport.cancel();
        stopCircleArrays()
        startCircleArrays()
        for (let i = 100; i< 160; i = i+10) {
            if(soundtrackBeat1.player(i).state == "started"){soundtrackBeat1.player(i).mute = true;}
            if(soundtrackBeat2.player(i).state == "started"){soundtrackBeat2.player(i).mute = true;}
        }
        Tone.Transport.stop();
        bpm = 100;
        bpmDisplay = 100;
        Tone.Transport.bpm.value = bpm;
        lifes = 3;
        rhythmUpperLimit = 4;
        rhythmLowerLimit = 1;
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
        noReferenceFlag = false;
        noReference = false;
        noReferenceLimit = 25000;
        newBPMTransition = false;
    }
    /*
    setup(): function that gets called by p5.js at startup. Initialise variables
    needed in the sketch here; load audio files, fonts, etc, in preload() instead
    */
    p5c.setup = function () {
        canvas = p5c.createCanvas(p5c.windowWidth, p5c.windowHeight);
        p5c.frameRate(60)
        Tone.start();

        // initialise guide coordinates
        xLine1 = p5c.width / 2 - p5c.width / 12;
        xLine2 = p5c.width / 2 + p5c.width / 12;
        yLineH = 3 / 4 * p5c.height;

        // first game settings
        started = false;
        died = false;
        restart = true;
        loaded = true;

        // main text settings
        colorMenu = 255;
        opacityMenu = 0;
        textMenu = 'Press the spacebar\n to start'

        // 'time' settings
        bpm = 100;
        bpmDisplay = 100;
        scheduleL = null;
        scheduleR = null;
        Tone.Transport.bpm.value = bpm;

        // game constraints settings
        rhythmUpperLimit = 4;
        rhythmLowerLimit = 1;
        metroFlagChange = 0;
        triplet = false;
        mindBlowing = false;
        noReferenceFlag = false;
        noReferenceLimit = 25000;
        noReference = false;

        // default starting rhythms
        leftR = 0; // has to be 0, don't change it
        rightR = 0; // has to be 0, don't change it
        nextLeftR = 1;
        nextRightR = 1;

        // circle arrays initialization
        startCircleArrays();

        // main text transition
        mainTextTransition(['Press the spacebar\nto start',],0,['up',],10,false)

        // ranking stuff
        imgPodium = p5c.createImg(
            'assets/podium.png',
            'podium logo'
        );
        imgPodium.addClass('ranking_button')
        imgPodium.mouseOver(displayRanking)
        canvas.mouseOver(noDisplayRanking)

        // tutorial stuff
        tutorialButton = p5c.createDiv('?')
        tutorialButton.addClass('tutorial_button')
        tutorialButton.mousePressed(displayTutorial)

    
        // periodic animations before starting
        noPlayingAnimation();
    }
    /*
    noPlayingAnimation(): visual animations that occurs when the user is not playing
     */
    noPlayingAnimation = function () {
        // general settings
        animationDisplayedLeft = false;
        animationDisplayedRight = false;
        animationXLeft = 0;
        animationXRight = p5c.width;
        animationY = yLineH;
        animationRadius = 10;

        // little circles animation
        intervalAnimationLeft = setInterval( () => {
            animationDisplayedLeft = true;
            animationTimeout1 = setTimeout( () => {
                animationDisplayedLeft = false;
                animationXLeft = 0;
            } , 8000)
        }, 15000);
        animationTimeout2 = setTimeout(() => {
            intervalAnimationRight = setInterval( () => {
                animationDisplayedRight = true;
                animationTimeout3 = setTimeout( () => {
                    animationDisplayedRight = false;
                    animationXRight = p5c.width;
                } , 8000)
            }, 15000);} , 3000);

        // guides and metronome animation
        animationTimeout4 = setTimeout( () => {
            // FIRST GUIDES ANIMATION
            guideLeftR = 255;
            guideLeftG = 255;
            guideLeftB = 255;
            guideRightR = 255;
            guideRightG = 255;
            guideRightB = 255;
            animationTimeout5 = setTimeout( () => {
                guideLeftR = 0;
                guideLeftG = 0;
                guideLeftB = 180;
                guideRightR = 0;
                guideRightG = 0;
                guideRightB = 180;
            } , 700)
            // START GUIDES ANIMATION INTERVAL
            intervalAnimationGuides = setInterval( () => {
                guideLeftR = 255;
                guideLeftG = 255;
                guideLeftB = 255;
                guideRightR = 255;
                guideRightG = 255;
                guideRightB = 255;
                animationTimeout6 = setTimeout( () => {
                    guideLeftR = 0;
                    guideLeftG = 0;
                    guideLeftB = 180;
                    guideRightR = 0;
                    guideRightG = 0;
                    guideRightB = 180;
                } , 700)
            }, 7000);


            // FIRST METRONOME ANIMATION
            animationTimeout7 = setTimeout(() => {
                    animationVisualMetronomeDisplayed = true;
                    metroColor = 1;
                    setTimeout( () => {metroColor = 2;} , 150)
                    setTimeout( () => {metroColor = 3;} , 300)
                    setTimeout( () => {metroColor = 4;} , 450)
                    setTimeout( () => {animationVisualMetronomeDisplayed = false;} , 600)
                },
                1100)
            // START METRONOME ANIMATION INTERVAL
            animationTimeout8 = setTimeout(() => {
                    intervalAnimationVisualMetronome = setInterval( () => {
                            animationVisualMetronomeDisplayed = true;
                            metroColor = 1;
                            setTimeout( () => {metroColor = 2;} , 150)
                            setTimeout( () => {metroColor = 3;} , 300)
                            setTimeout( () => {metroColor = 4;} , 450)
                            setTimeout( () => {animationVisualMetronomeDisplayed = false;} , 600)
                        },
                        7000);
                },
                1100);
        }, 2000);

        // main text animation
        textAnimationInterval = setInterval( () => {
            mainTextTransition(['Press the spacebar\nto start','Press the spacebar\nto start'],0,['down','up'],10,false)
        }, 7500);
    }
    /*
    clearNoPlayingAnimations(): function that clear everything related to the no-playing animations
     */
    clearNoPlayingAnimations = function () {
        clearInterval(textAnimationInterval);
        clearInterval(intervalAnimationVisualMetronome);
        clearInterval(intervalAnimationGuides);
        clearInterval(intervalAnimationLeft);
        clearInterval(intervalAnimationRight);
        clearInterval(animationTimeout1);
        clearInterval(animationTimeout2);
        clearInterval(animationTimeout3);
        clearInterval(animationTimeout4);
        clearInterval(animationTimeout5);
        clearInterval(animationTimeout6);
        clearInterval(animationTimeout7);
        clearInterval(animationTimeout8);
        animationVisualMetronomeDisplayed = false;
        animationDisplayedLeft = false;
        animationDisplayedRight = false;
    }
    var nextButton;
    var previousButton;
    var imgStartingFrame;
    var imgPlayingFrame;
    var textFirstDisplay;
    var place = 0;
    /*
    displayTutorial(): function that displays game tutorial. Is organized in three facades, each one identified by
    'place' variable content.
     */
    displayTutorial = function () {
        if(!started && !rankingDisplayed){
            if(tutorialDisplayed){
                nextButton.remove();

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
            }
            else{
                nextButton = p5c.createDiv('>');
                nextButton.addClass('next_button');
                nextButton.mousePressed(nextButtonFunction)
                nextButton.position(p5c.width/2 + 480 - 80, p5c.height/2)
                textFirstDisplay = p5c.createDiv(tutorialText)
                textFirstDisplay.addClass('tutorial_text')
                placeZeroTutorialDisplayed = true;
                tutorialDisplayed = true;
            }
        }
    }
    /*
    nextButtonFunction(): function that is called when the tutorial 'nextButton' is pressed. In particular handles the
    elements to add/remove passing from a facade to another.
     */
    nextButtonFunction = function() {
        if(place == 0){
            textFirstDisplay.remove();
            placeZeroTutorialDisplayed = false;
            previousButton = p5c.createDiv('<');
            previousButton.addClass('previous_button');
            previousButton.mousePressed(previousButtonFunction)
            previousButton.position(p5c.width/2 - 480 + 55, p5c.height/2)
            imgStartingFrame = p5c.createImg(
                'assets/endlessAssets/frame0.png',
                'starting Frame'
            );
            imgStartingFrame.addClass('tutorial_image')

            place += 1;
        }
        else if (place == 1) {
            imgStartingFrame.remove();
            nextButton.remove()
            imgPlayingFrame = p5c.createImg(
                'assets/endlessAssets/frame1.png',
                'playing Frame'
            );
            imgPlayingFrame.addClass('tutorial_image')
            place += 1;
        }
    }
    /*
    previousButtonFunction(): function that is called when the tutorial 'previousButton' is pressed. In particular
    handles the elements to add/remove passing from a facade to another.
     */
    previousButtonFunction = function() {
        if (place == 1) {
            previousButton.remove()
            placeZeroTutorialDisplayed = true;
            textFirstDisplay = p5c.createDiv(tutorialText)
            textFirstDisplay.addClass('tutorial_text')
            imgStartingFrame.remove()

            place -= 1;
        }
        else if (place == 2) {
            nextButton = p5c.createDiv('>');
            nextButton.addClass('next_button');
            nextButton.mousePressed(nextButtonFunction)
            nextButton.position(p5c.width/2 + 480 - 80, p5c.height/2)
            imgPlayingFrame.remove()
            imgStartingFrame = p5c.createImg(
                'assets/endlessAssets/frame0.png',
                'starting Frame'
            );
            imgStartingFrame.addClass('tutorial_image')

            place -=1
        }
    }
    /*
    displayRanking(): function called when ranking logo is hovered by the mouse
     */
    displayRanking = function () {
        if(!started && !tutorialDisplayed){
            if (firstShowRanking){firstShowRanking = false}
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
    }
    /*
    noDisplayRanking(): function called when the ranking logo is not hovered by the mouse( the canvas is hovered by the
    mouse)
     */
    noDisplayRanking = function () {
        if(!firstShowRanking){
            rankingDisplayed = false
            titleRanking.remove()
            for (let i = 0; i<6 ; i++){
                columnRanking1[i].remove()
                columnRanking2[i].remove()
                columnRanking3[i].remove()
            }
        }
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
    /*
    stopCircleArrays() : function that deletes circles array, used for reset the system for a new game
    */
    stopCircleArrays = function () {
        for (let i = 0; i < leftCircles.length; i++) {
            leftCircles[i] = null
        }
        for (let i = 0; i < rightCircles.length; i++) {
            rightCircles[i] = null
        }
    }
    var guideRadius = 30; //radius of guide circles
    var radiusDifficulty = 1;
    var counter = 0; //not used now, might be used to count frames IN GAME
    var rhythm_rad = 20; //radius of rhythm circles

    /*
    draw(): p5js function that gets automatically called once per frame
    (by default 60 frames per second)
    */
    p5c.draw = function () {
        p5c.clear();
        p5c.background("rgba(255, 255, 255, 0)");
        p5c.textFont(font)

        // no reference constraint
        if(!noReferenceFlag){
            drawReference();
        }

        // main text
        p5c.stroke(0,opacityMenu)
        p5c.fill(colorMenu,opacityMenu)
        p5c.textAlign(p5c.CENTER)
        p5c.textSize(15)
        p5c.text(textMenu, p5c.width / 2, p5c.height / 2);

        // text that appears in bpm changing transition
        if(changingBPMVisual){
            p5c.textFont(font)
            p5c.noStroke()
            p5c.fill(255,bpmDisplayOpacity)
            p5c.textAlign(p5c.CENTER)
            p5c.textSize(15)
            p5c.text("BPM: " + bpmDisplay, p5c.width / 2, p5c.height / 2);
        }

        // Visual Metronome ( only outer ellipses )
        p5c.fill(180);
        p5c.noStroke();
        p5c.ellipse(xLine1 + (xLine2 - xLine1)/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*2/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*3/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*4/5 , yLineH + 100, guideRadius, guideRadius);


        // diplay endless mode title
        p5c.textFont('Monoton', 30)
        p5c.stroke(12);
        p5c.fill(250, 127, 250)
        p5c.text('ENDLESS MODE', 220, 70)

        // here we are in the game
        if (started) {

            // Visual Metronome ( inside ellipses )
            p5c.fill(0,0,180);
            if (metroFlag > 0){
                metroColor = ((metroFlag - 1) % 4) + 1
            }
            p5c.strokeWeight(1);
            p5c.stroke(0,0,180)
            p5c.ellipse(xLine1 + (xLine2 - xLine1)*metroColor/5 , yLineH + 100, guideRadius - 50, guideRadius - 50);


            //write a text in p5.js displaying "Score: " and the score
            p5c.textFont('Monoton')
            p5c.fill(250, 127, 250)
            p5c.textSize(60)
            p5c.stroke(12)
            p5c.text(gameScore, p5c.width/2, 150)

            // Display Global Multiplier
            p5c.textFont(font)
            p5c.textSize(30)
            p5c.noFill()
            p5c.strokeWeight(2);
            p5c.stroke(250, 127, 250);
            p5c.ellipse(p5c.width/2 - 2,250 - 9,60,60)

            p5c.fill(255)
            p5c.noStroke()
            p5c.text("x" + multiplier,p5c.width/2,250)

            // Display Left and Right Rhythms
            p5c.fill(250, 127, 250)
            p5c.noStroke()
            p5c.textSize(200)
            p5c.text(visualLeftR, (p5c.width / 2 - p5c.width / 12)/2, 400)
            p5c.text(visualRightR,p5c.width - (p5c.width / 2 - p5c.width / 12)/2, 400)

            
            // Display available Lifes
            for(let i = 0; i < lifes; i++){
                p5c.translate(-12.5, 0)    
                p5c.image(hearts[i],p5c.width/2 - 50 + i*50,yLineH - 50, 25,25)
                p5c.translate(+12.5, 0)
             }

            p5c.fill("white")
            p5c.textSize(15)
            // Consecutive Great Hits
            p5c.text("Consecutive\nGreat", p5c.width/1.5, p5c.height/11)
            p5c.text(greatCounter, p5c.width/1.5, p5c.height/6)

            // Consecutive Amazing Hits
            p5c.text("Consecutive\nAmazing", p5c.width/1.28, p5c.height/11)
            p5c.text(amazingCounter, p5c.width/1.28, p5c.height/6)

            // Consecutive Perfect Hits
            p5c.text("Consecutive\nPerfect", p5c.width/1.12, p5c.height/11)
            p5c.text(perfectCounter, p5c.width/1.12, p5c.height/6)

            // show next rhythms for each side
            if (rhythmTransition){
                p5c.fill(128, 0, 0)
                p5c.strokeWeight(4);
                p5c.noStroke()
                p5c.textSize(55);
                p5c.text(visualNextLeftR, (p5c.width / 2.7), 500);
                p5c.text(visualNextRightR, p5c.width/1.58 , 500);
            }

            // show consecutive hits statistic when reached a certain number
            if (newConsecutiveHitsBonus){
                p5c.textFont(font)
                p5c.fill("white")
                p5c.noStroke()
                p5c.textSize(20)
                p5c.text(consecutiveHits + " CONSECUTIVE HITS!", xLine1/2 + 50, p5c.height - 200)
            }
            // same system as training mode
            if (pageFoc) {

                p5c.textFont(font)
                p5c.fill(12)
                p5c.textSize(20)
                p5c.strokeWeight(2);

                p5c.stroke(246, 41, 202)
                p5c.text(hitMessages[0], xLine1 - 100, yLineH + 50)
                p5c.stroke(85, 35, 222)
                p5c.text(hitMessages[1], xLine2 + 100, yLineH + 50)

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

        // Ranking Stuff ( handle bad nickname messages to the user )
        if(badNickname){
            p5c.textFont(font)
            p5c.noStroke()
            p5c.fill("red")
            p5c.textAlign(p5c.CENTER)
            p5c.textSize(15)
            p5c.text(badNicknameText, p5c.width / 2, p5c.height / 2 + 120);
        }
        // left little circles no playing animation
        if(animationDisplayedLeft){
            animationXLeft = animationXLeft + 2;
            p5c.fill(246, 41, 202)
            p5c.noStroke()
            for(let i =0; i<16; i++){
                if(animationXLeft - 15*i < xLine1){p5c.ellipse(animationXLeft - 15*i ,animationY,animationRadius,animationRadius)}
            }
        }
        // right little circles no playing animation
        if(animationDisplayedRight){
            animationXRight = animationXRight - 2;
            p5c.fill(85, 35, 222)
            p5c.noStroke()
            for(let i =0; i<16; i++){
                if(animationXRight + 15*i > xLine2){p5c.ellipse(animationXRight + 15*i ,animationY,animationRadius,animationRadius)}
            }
        }
        // metronome animation
        if(animationVisualMetronomeDisplayed){
            p5c.fill(0,0,180);
            p5c.strokeWeight(1);
            p5c.stroke(0,0,180)
            p5c.ellipse(xLine1 + (xLine2 - xLine1)*metroColor/5 , yLineH + 100, guideRadius - 50, guideRadius - 50);
        }
        // show ranking
        if(rankingDisplayed){
            rankingBackground();
        }
        // show tutorial
        if(tutorialDisplayed){
            tutorialBackground();
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
        p5c.stroke(180);
        p5c.strokeWeight(2);
        p5c.line(xLine1, 0, xLine1, p5c.height);
        p5c.line(xLine2, 0, xLine2, p5c.height);
        p5c.line(0, yLineH, p5c.width, yLineH)
        p5c.fill(180);
        p5c.strokeWeight(3);
        p5c.stroke(guideLeftR,guideLeftG,guideLeftB)
        p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);
        p5c.stroke(guideRightR,guideRightG,guideRightB)
        p5c.ellipse(xLine2, yLineH, guideRadius, guideRadius);
        p5c.fill(180);
    }
    /*
    rankingBackground(): draws ranking background
     */
    rankingBackground = function () {
        p5c.strokeWeight(1);
        p5c.stroke(255,255,255)
        p5c.fill(39,38,38,230)
        p5c.translate(-300, -300);
        p5c.rect(p5c.width/2,p5c.height/2,600,600)
        p5c.translate(+300,+300);

    }
    /*
      tutorialBackground(): draws tutorial background
     */
    tutorialBackground = function () {
        p5c.strokeWeight(1);
        p5c.stroke(255,255,255)
        p5c.fill(39,38,38,230)
        p5c.translate(-480, -270);
        p5c.rect(p5c.width/2,p5c.height/2,960,540)
        p5c.translate(480, 270);

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

        // re-draw ranking
        imgPodium = p5c.createImg(
            'assets/podium.png',
            'podium logo'
        );
        imgPodium.addClass('ranking_button')
        imgPodium.mouseOver(displayRanking)
        canvas.mouseOver(noDisplayRanking)

        // re-draw tutorial, it depends on the facade
        tutorialButton = p5c.createDiv('?')
        tutorialButton.addClass('tutorial_button')
        tutorialButton.mousePressed(displayTutorial)
        
        if(tutorialDisplayed){
            if(place == 0){
                textFirstDisplay = p5c.createDiv(tutorialText)
                textFirstDisplay.addClass('tutorial_text')

                nextButton = p5c.createDiv('>');
                nextButton.addClass('next_button');
                nextButton.mousePressed(nextButtonFunction)
                nextButton.position(p5c.width/2 + 480 - 80, p5c.height/2)
            }
            else if(place == 1){
                previousButton = p5c.createDiv('<');
                previousButton.addClass('previous_button');
                previousButton.mousePressed(previousButtonFunction)
                previousButton.position(p5c.width/2 - 480 + 55, p5c.height/2)

                nextButton = p5c.createDiv('>');
                nextButton.addClass('next_button');
                nextButton.mousePressed(nextButtonFunction)
                nextButton.position(p5c.width/2 + 480 - 80, p5c.height/2)

                imgStartingFrame = p5c.createImg(
                    'assets/endlessAssets/frame0.png',
                    'starting Frame'
                );
                imgStartingFrame.addClass('tutorial_image')
            }
            else if (place == 2){
                previousButton = p5c.createDiv('<');
                previousButton.addClass('previous_button');
                previousButton.mousePressed(previousButtonFunction)
                previousButton.position(p5c.width/2 - 480 + 55, p5c.height/2)

                imgPlayingFrame = p5c.createImg(
                    'assets/endlessAssets/frame1.png',
                    'playing Frame'
                );
                imgPlayingFrame.addClass('tutorial_image')
            }
        }
    }
    /*
    startToneLoops(intL, intR): starts circle creation loops for each side
    */
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
    mainTextTransition(): recursive function used to realize opacity transition of the main text.
     */
    var menuTransitionInterval;
    function mainTextTransition(texts,i,dirs,ms,doLastFunction,lastFunction){
        clearInterval(menuTransitionInterval);
        textMenu = texts[i];
        const dir = dirs[i];
        menuTransitionInterval = setInterval( () => {
            if(dir == 'up'){
                if(opacityMenu < 255){
                    opacityMenu += 2.5;
                }
                else{
                    clearInterval(menuTransitionInterval);
                    i += 1;
                    if ( i < texts.length){
                        mainTextTransition(texts,i,dirs,ms,doLastFunction,lastFunction)
                    }
                    if (i >= texts.length && doLastFunction){
                        lastFunction();
                    }
                }
            }
            else if (dir == 'down'){
                if(opacityMenu > 0){
                    opacityMenu -= 2.5;
                }
                else{
                    clearInterval(menuTransitionInterval);
                    i += 1;
                    if ( i < texts.length){
                        mainTextTransition(texts,i,dirs,ms,doLastFunction,lastFunction)
                    }
                    if (i >= texts.length && doLastFunction){
                        lastFunction();
                    }
                }
            }
        },ms)
    }
    /*
    inputNickNameTransition(): function that realizes the animations for inserting the nickname of the user after a
    new high score record
     */
    function inputNickNameTransition(){
        nicknameInput = p5c.createInput('');
        nicknameInput.position(p5c.width/2, p5c.height/2 + 50);
        nicknameInput.addClass('translateClass')
        nicknameInput.size(200);

        nicknameSubmit = p5c.createButton('SUBMIT');
        nicknameSubmit.style('font-family' , font)
        nicknameSubmit.position(p5c.width/2, p5c.height/2 + 75);
        nicknameSubmit.addClass('translateClass')
        nicknameSubmit.size(100);

        nicknameSubmit.mousePressed(() => {
            let name = nicknameInput.value()
            if ( name == ''){
                badNicknameText = "The string is empty\ncannot submit the nickname!"
                badNickname = true;
            }
            else if ( name.length > 10){
                badNicknameText = "Nickname should be maximum\n10 characters long!"
                badNickname = true;
            }
            else{
                badNickname = false;
                pointsRanking[posRecord] = gameScore;
                namesRanking[posRecord] = name;
                nicknameInput.remove()
                nicknameSubmit.remove()
                gameScore = 0;
                updateIndex = 0;
                mainTextTransition(updateTexts,updateIndex,updateDirs,10,true, () => {noPlayingAnimation();restart = true; })
            }
        })
    }


    /*
    keyPressed(): p5js function that gets called every time a key is pressed.
    Use key to get the specific key.
    */
    var paused = false;
    p5c.keyPressed = function () {
        let key = p5c.key;

        if (key == ' '){
            if (!started && restart && loaded && !rankingDisplayed && !tutorialDisplayed) {
                if(firstTime){Tone.start(); firstTime = false}
                Tone.Transport.start();
                for (let i = 100; i< 160; i = i+10) {
                    soundtrackBeat1.player(i).stop();
                    soundtrackBeat2.player(i).stop();
                    soundtrackBeat1.player(i).mute = false;
                    soundtrackBeat2.player(i).mute = false;
                }
                clearNoPlayingAnimations();
                clearInterval(menuTransitionInterval);
                mainTextTransition([textMenu,],0,['down',],5,false)
                guideLeftR = 0;
                guideLeftG = 0;
                guideLeftB = 180;
                guideRightR = 0;
                guideRightG = 0;
                guideRightB = 180;
                toggleRhythms();
                visualLeftR = leftR;
                visualRightR = rightR;
                visualNextLeftR = nextLeftR;
                visualNextRightR = nextRightR;
                started = true;
                restart = false;
                died = false;
            }
        }

        if (key == 's' || key == 'S') {

            // FEEDBACK ANIMATION
            guideLeftR = 255;
            guideLeftG = 255;
            guideLeftB = 255;
            setTimeout(() => {
                guideLeftR = 0;
                guideLeftG = 0;
                guideLeftB = 180;
            }, 250)

            // HIT/MISS CODE
            if (started) {
                let hitL = false;
                for (let i = firstElemInGameL; i < firstElemInGameL + leftElem; i++) {
                    let k = i % leftCircles.length;
                    let c = leftCircles[k];
                    if (Math.abs(c.y - yLineH) <= guideRadius / radiusDifficulty) {
                        hitL = true;
                        //play sound
                        if (lastL == 1) {
                            soundtrackHitL2.start();
                            lastL = 2;
                        } else if (lastL == 2) {
                            soundtrackHitL1.start();
                            lastL = 1;
                        }


                        let points = Math.round(Math.abs(c.y - yLineH) * 10);
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
                                if (j == firstElemInGameL) {
                                    break
                                }
                            }
                            firstElemInGameL = j;
                        }

                        leftElem--;
                    }
                }

                if (!hitL) {

                    if (lifes <= 0 && died == false) {
                        reSetup()
                    } else {
                        lastMiss += 1;
                        lastMiss = lastMiss % 3;
                        soundtrackMiss.player(lastMiss).start();

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
        }
        if (key == 'k' || key == 'K') {

            // FEEDBACK ANIMATION
            guideRightR = 255;
            guideRightG = 255;
            guideRightB = 255;
            setTimeout(() => {
                guideRightR = 0;
                guideRightG = 0;
                guideRightB = 180;
            }, 250)

            // HIT/MISS CODE
            if (started) {
                let hitR = false;
                for (let i = firstElemInGameR; i < firstElemInGameR + rightElem; i++) {
                    let k = i % rightCircles.length;
                    let c = rightCircles[k];
                    if (Math.abs(c.y - yLineH) <= guideRadius / radiusDifficulty) {
                        hitR = true;
                        //play sound
                        /*hitSoundR.play();*/
                        if (lastR == 1) {
                            soundtrackHitR2.start();
                            lastR = 2;
                        } else if (lastR == 2) {
                            soundtrackHitR1.start();
                            lastR = 1;
                        }

                        let points = Math.round(Math.abs(c.y - yLineH) * 10);
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
                                if (j == firstElemInGameR) {
                                    break
                                }
                            }
                            firstElemInGameR = j;
                        }
                        rightElem--;
                    }
                }
                if (!hitR) {
                    if (lifes <= 0 && died == false) {
                        reSetup()
                    } else {
                        lastMiss += 1;
                        lastMiss = lastMiss % 3;
                        soundtrackMiss.player(lastMiss).start();

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
    metroSound(): born to produce the correct metronome sound based on the beat, now used to count the tempo and handle
    the time events during the game. In particular is used for:
        - Visual rhythms transition ( next rhythms needs to be calculated and showed before they are applied to the user)
        - Dynamically scheduled transitions ( new bpm transition and no reference transition)
    */
    var metroFlagX;
    var scheduleFlag;
    var scheduleNoReference;
    var bpmDisplayInterval;
    metroSound = function () {
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
        //To play the beat in background
        if(metroFlag % 32 == 0){

            if(newBPMTransition){
                newBPMTransition = false;
                soundtrackDieRecordChangeBPM.player("changingBPM").start();

                // RESET GAME PARTIALLY
                started = false;
                hitMessages[0] = ''
                hitMessages[1] = ''
                leftElem = 0;
                rightElem = 0;
                firstElemInGameL = 0;
                firstElemInGameR = 0;
                lastElemL = 0;
                lastElemR = 0;
                metroFlag = 0;
                Tone.Transport.cancel();
                stopCircleArrays()
                metroFlagChange = 0;
                startCircleArrays()
                soundtrackBeat1.player(bpm).stop();
                soundtrackBeat2.player(bpm).stop();

                // INCREASE BPM
                bpmDisplayOpacity = 255;
                changingBPMVisual = true;
                Tone.Transport.stop();
                bpm = bpm + 10;
                Tone.Transport.bpm.value = bpm;
                restart = true;
                metroFlag = -1;
                bpmDisplayInterval = setInterval( () => {
                    bpmDisplay = bpmDisplay + 1;
                    if(bpmDisplay == bpm){
                        clearInterval(bpmDisplayInterval)
                        setTimeout(() => {
                            bpmDisplayOpacityInterval = setInterval( () => {
                                if(bpmDisplayOpacity > 0){ bpmDisplayOpacity -=5 }
                                else{
                                    clearInterval(bpmDisplayOpacityInterval);
                                }
                            },15)
                        }, 700)
                    };
                }, 250)

                // RESTART GAME AFTER A WHILE
                setTimeout( () => {
                    changingBPMVisual = false;
                    Tone.Transport.start();
                    toggleRhythms();
                    visualLeftR = leftR;
                    visualRightR = rightR;
                    visualNextLeftR = nextLeftR;
                    visualNextRightR = nextRightR;
                    started = true;
                    restart = false;
                    died = false;
                }, 5000)
            }
            else{
                soundtrackBeat1.player(bpm).start();
            }

        }
        else if (metroFlag % 32 == 16) {
            if(noReference && !newBPMTransition){
                noReference = false;
                // START TRANSITION
                scheduleNoReference = Tone.Transport.scheduleRepeat(time => {
                    noReferenceFlag = true;
                    setTimeout( () => {
                        noReferenceFlag = false
                    } , 500)
                }, "2n");

                // NO REFERENCE TIME
                setTimeout( () => {
                    noReferenceFlag = true;
                    Tone.Transport.clear(scheduleNoReference);
                } , 2000)
                setTimeout( () => {
                    noReferenceFlag = true;
                } , 2500)

                // END TRANSITION
                setTimeout( () => {
                    scheduleNoReference = Tone.Transport.scheduleRepeat(time => {
                        noReferenceFlag = false;
                        setTimeout( () => { noReferenceFlag = true; } , 500)
                    }, "2n");
                } , 2000 + 15000)

                // RETURNING REFERENCE DISPLAYED
                setTimeout( () => {
                    noReferenceFlag = false;
                    Tone.Transport.clear(scheduleNoReference);
                } , 2000 + 15000 + 2000)
                // RETURNING REFERENCE DISPLAYED
                setTimeout( () => {
                    noReferenceFlag = false;
                } , 2000 + 15000 + 2500)

            }
            soundtrackBeat2.player(bpm).start();

        }

        metroFlag += 1;
    }
    var hitMessages = new Array(2);
    hitMessages[0] = ""
    hitMessages[1] = ""

    var scheduleConsecutiveHits;
    hitQuality = function(points, side){
        //prints a message on the side (side can be 0 or 1, indicating left or right side)
        //of the guide circle
        //to indicate how good a hit was ("OK", "GOOD","GREAT", "AMAZING","PERFECT")
        //depending on the points scored

        // RULES FOR CALCULATING POINTS
        // distance*10 = [0,5]     -> perfect -> 100 points
        // distance*10 = [5, 15]   -> amazing -> 75 points
        // distance*10 = [15, 55]  ->  great  -> 50 points
        // distance*10 = [55, 100] ->  good   -> 25 points
        // distance*10 = [100, - ] ->   ok    -> 0 points

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
        if(points >= 0 && points < 5){
            msg = "PERFECT";
            perfectCounter += 1;
            amazingCounter += 1;
            greatCounter += 1;
            gameScore = gameScore + 100*multiplier;
        }else if(points >= 5 && points < 15){
            msg = "AMAZING";
            amazingCounter += 1;
            greatCounter += 1;
            gameScore = gameScore + 75*multiplier;
            perfectCounter = 0;
            multiplierPerfect = 0;
        }else if(points >= 15 && points < 55){
            msg = "GREAT";
            greatCounter += 1;
            gameScore = gameScore + 50*multiplier;
            multiplierAmazing = 0;
            amazingCounter = 0;
            multiplierPerfect = 0;
            perfectCounter = 0;
        }else if(points >= 55 && points < 100){
            msg = "GOOD";
            gameScore = gameScore + 25*multiplier;
            multiplierGreat = 0;
            greatCounter = 0;
            multiplierAmazing = 0;
            amazingCounter = 0;
            multiplierPerfect = 0;
            perfectCounter = 0;
        }
        else if(points >= 100){
            msg = "OK";
            gameScore = gameScore + 1*multiplier;
            greatCounter = 0;
            amazingCounter = 0;
            perfectCounter = 0;
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
        if (consecutiveHits % 100 == 0){
            multiplierConsecutiveHits += 1;
            scheduleConsecutiveHits = Tone.Transport.scheduleRepeat(time => {
                newConsecutiveHitsBonus = true;
                setTimeout( () => {
                    newConsecutiveHitsBonus = false
                } , 500)
            }, "2n",Tone.now(),"6");
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
            soundtrackMultipliers.player("multFail").start();
        }

    }
    /*
    multiplierSound() : function that reproduces multiplier sound in relation to the amount of bonus
     */
    function multiplierSound() {
        switch (multiplier) {
            case 2:
                soundtrackMultipliers.player("mult2").start();
                break;
            case 3:
                soundtrackMultipliers.player("mult3").start();
                break;
            case 4:
                soundtrackMultipliers.player("mult4").start();
                break;
            case 5:
                soundtrackMultipliers.player("mult5").start();
                break;
            case 6:
                soundtrackMultipliers.player("mult6").start();
                break;
            case 7:
                soundtrackMultipliers.player("mult7").start();
                break;
            case 8:
                soundtrackMultipliers.player("mult8").start();
                break;
            case 9:
                soundtrackMultipliers.player("mult9").start();
                break;
            case 10:
                soundtrackMultipliers.player("mult10").start();
                break;
            default:
        }
    }
    /*
    toggleRhythms(): is the core of the game. Is a function that decides how the game evolves ( when bpm transitions
    are applied, how difficulty increases and so on ). It is taken into account that it may be modified in the future.
    This depends on how simple/difficult too much dynamic/predictable the game is in the hands of users.
     */
    function toggleRhythms() {
        var arrayNewRhythms;

        // 1) BMP 100 -> 110 and TRIPLET after 8 measures
        if (bpm == 100 && metroFlag >= 32){
            newBPMTransition = true;
            triplet = true;
        }
        // 2) BMP 110 -> 120 and UPPER LIMIT TO 6 after 8 measures
        if (bpm == 110 && metroFlag >= 32 * 2){
            newBPMTransition = true;
            rhythmUpperLimit = 6;
        }
        // 3) BMP 120 -> 130 and MINDBLOWING after 8 measures
        if (bpm == 120 && metroFlag >= 32 * 4){
            newBPMTransition = true;
            mindBlowing = true;
            radiusDifficulty = 2;
        }
        // 4) BMP 130 -> 140 and LOWER LIMIT TO 3 after 12 measures
        if (bpm == 130 && metroFlag >= 32 * 12){
            newBPMTransition = true;
            rhythmLowerLimit = 3;
        }
        // 5) BMP 140 -> 150 and LOWER LIMIT TO 4 and UPPER LIMIT TO 8 after 12 measures
        if (bpm == 140 && metroFlag >= 32 * 24){
            newBPMTransition = true;
            rhythmUpperLimit = 8;
            rhythmLowerLimit = 4;
        }

        // inf) BMP 150 -> ... and LOWER LIMIT +1 and UPPER LIMIT +2 after 12 measures
        if (bpm >= 150 && metroFlag >= 32 * 48){
            // newBPMTransition = true; // -> NO higher bpm than 150 for the moment (the game it's already very difficult at that bpm)
            metroFlag = 0;
            rhythmUpperLimit = rhythmUpperLimit+2;
            rhythmLowerLimit = rhythmLowerLimit+1;
        }
        // NO REFERENCE
        if ( gameScore >= noReferenceLimit){
            noReference = true;
            noReferenceLimit = noReferenceLimit + 25000;
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
    /*
    calculateNewRhythms(): function that calculates two new rhythms based on the current game constraints
     */
    // Possible Rhythms 1 + [2, 4, 8, 16, 32] + [3,6,12,24] + the remainder
    function calculateNewRhythms(){
        var integersL = new Set();
        var integersR = new Set();
        var nextL;
        var nextR;
        var addInteger;
        for (let i = rhythmLowerLimit; i <= rhythmUpperLimit; i++){

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
    /*
    newPodium(): function that updates the ranking
     */
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