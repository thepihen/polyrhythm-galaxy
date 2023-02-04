var pageFoc = true;

//use p5 in instance mode
p5_instance = function (p5c) {
    var tutorialText = "Welcome to the endless mode!&#10;Test your ability in playing cross-rhythms!&#10;" +
        "The game will provide you two rhythms, one to the left and one to the right, " +
        "that you need to play in time by pressing respectively the key 'S' and the key 'K' " +
        "every time a falling rhythm dot is inside the yellow circle of the related side.&#10;";
    var tutorialText2 = "Pay Attention!&#10;The provided rhythms will be more and more difficult and every time " +
        "you miss a dot or press a key at the wrong time you will lose one of the three available " +
        "lifes that permits you to continue the game. Finally, remember to be more accurate possible " +
        "in order to increase extra points bonus and climb the global ranking!";

    var dieTexts = ['You Died','You Died','Press the spacebar\nto retry'];
    var dieDirs = ['up', 'down', 'up']
    var dieIndex = 0;

    var recordTexts = ['You Died','You Died','','','Insert your Nickname!']
    var recordDirs = ['up', 'down', 'up','down','up']
    var recordIndex = 0;

    var updateTexts = ['Updated Ranking!','Updated Ranking!','Press the spacebar\nto retry']
    var updateDirs = ['up', 'down', 'up']
    var updateIndex = 0;

    var gameScore = 0;
    var lifes = 3;
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
    nextLeftR = next left side rhythm
    nextRightR = next right side rhythm
    errorL = error in seconds committed each bar, left side
    errorR = same error but for the right side
    scheduleL = ID scheduled event creation left circles
    scheduleR = ID scheduled event creation left circles
    scheduleMetro = ID scheduled event metronome
    */
    var bpm;
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
    var scheduleMetro
    var soundtrack;
    //frameRate (need this to use it outside of )
    var frate;
    /*
    preload: function that gets automatically by p5js before loading the sketch.
    ->Everything that needs to be available when the sketch starts needs to be loaded here
    (e.g. fonts, sounds,...)
    */
    p5c.preload = function () {
        font = 'Aldrich';
        soundtrackDieRecord = new Tone.Players({
            die: "assets/endlessAssets/die.wav",
            record: "assets/endlessAssets/record.wav"
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

    }


    var started; //bool: T if we're in the game, F is we're in the menù
    var restart;
    var firstTime = true;
    var died;
    var changingBPMVisual = false;
    var newBPMTransition = false;
    var loaded = false;
    var colorMenu;
    var opacityMenu;
    var textMenu;

    /*
    Variables needed to draw the visual guide; might need a better solution for this in
    the future if we want more vertical lines (more rhythms)
    */
    var xLine1;
    var xLine2;
    var yLineH;

    //arrays containing circles ("rhythm hits / beats") for left and right side
    //it would be better to use a queue to manage these
    //we set their length to 200
    // Possible Rhythms 1 + [2, 4, 8, 16, 32] + [3,6,12,24] + the remainder until 24
    var basicRhythms = [2, 4, 8, 16, 32];
    var tripletRhythms = [3,6,12,24];
    var triplet ; // if include triplet rhythms
    var mindBlowing ; // if include other complicated rhythms
    var rhythmUpperLimit; // maximum integer number as rhythm ( we assume as maximum 24 )
    var rhythmLowerLimit;
    var metroFlagChange; // how much next metronome beats to change rhythm
    var metroFlagChangeValues = [16]; // changes in only 4 measures, for now
    var metroColor; // number used for color of metronome ellipse
    var noReferenceFlag; // if true there will not be the guide
    var noReference;
    var noReferenceLimit;
    var rhythmTransition;// if true displays next rhythms
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

    // FAKE RANKING
    namesRanking[0] = "GGnoDiMaio"
    namesRanking[1] = "jnfrdm"
    namesRanking[2] = "AndreBonafede"
    namesRanking[3] = "Cospi_TheHungriest"
    namesRanking[4] = "IJalisse"
    pointsRanking[0] = 122364
    pointsRanking[1] = 86849
    pointsRanking[2] = 54721
    pointsRanking[3] = 43602
    pointsRanking[4] = 6/*25890*/

    // TUTORIAL STUFF
    var tutorialDisplayed = false;
    var placeZeroTutorialDisplayed = false;
    var tutorialButton;

    // OTHER
    var exitButton;
    var animationY
    var animationXLeft;
    var animationXRight;
    var animationDisplayedLeft = false;
    var animationDisplayedRight = false;
    var animationVisualMetronomeDisplayed = false;
    var intervalAnimationVisualMetronome;
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
    var guideR = 255;
    var guideG = 255;
    var guideB = 0;

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
            this.fillColor = p5c.color(50 + 200 * (1 - this.side), 10, 50 + 200 * (this.side))
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
                //delete circles from array
                //important assumption:
                //the circle that reaches the bottom always has position 1
                //in the array

                //TODO: move this check to the main function

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
        if (this.side == 0) {
          leftCircles.splice(0, 1)
        } else if (this.side == 1) {
          rightCircles.splice(0, 1)
        }
        */
        /*
        show(): draws circle on the canvas
        */
        //TODO delete id part
        show() {
            if (this.flag) {
                p5c.fill(this.fillColor);
                p5c.strokeWeight(1);
                p5c.stroke(12)
                p5c.ellipse(this.x, this.y, this.radius, this.radius);
                //// show a p5.js text beside the circle with its id
                //p5c.text(this.id, this.x + this.radius, this.y + this.radius)
            }
        }
    }
    /*
    setup(): function that gets called by p5.js at startup. Initialise variables
    needed in the sketch here; load audio files, fonts, etc, in preload() instead
    */
    function reSetup(){
        resetGame();
        if (gameScore > pointsRanking[4]){
            /*record.play()*/
            soundtrackDieRecord.player("record").start();
            newPodium()
            recordIndex = 0;
            recordTexts[2] = 'But Congratulations you are at the position ' + (posRecord + 1) + ' in the global ranking!'
            recordTexts[3] = 'But Congratulations you are at the position ' + (posRecord + 1) + ' in the global ranking!'
            mainTextTransition(recordTexts,recordIndex,recordDirs,12,true,() => {
                setTimeout(() => {
                    inputNickNameTransition()
                }, 200)
            })
        }
        else{
            /*die.play()*/
            soundtrackDieRecord.player("die").start();
            gameScore = 0;
            /*dieMenuTransition1()*/
            dieIndex = 0;
            mainTextTransition(dieTexts,dieIndex,dieDirs,10,true,() => {noPlayingAnimation();restart = true;})
        }

    }

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
        Tone.Transport.cancel();
        stopCircleArrays()
        startCircleArrays()
        for (let i = 100; i< 160; i = i+10) {
            if(soundtrackBeat1.player(i).state == "started"){soundtrackBeat1.player(i).mute = true;}
            if(soundtrackBeat2.player(i).state == "started"){soundtrackBeat2.player(i).mute = true;}
        }
        Tone.Transport.stop();
        bpm = 100;
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
    p5c.setup = function () {
        canvas = p5c.createCanvas(p5c.windowWidth, p5c.windowHeight);
        p5c.frameRate(60)
        Tone.start();

        //initialise guide coordinates
        xLine1 = p5c.width / 2 - p5c.width / 12;
        xLine2 = p5c.width / 2 + p5c.width / 12;
        yLineH = 3 / 4 * p5c.height;
        started = false;
        died = false;
        restart = true;
        loaded = true;
        colorMenu = 255;
        opacityMenu = 0;
        textMenu = 'Press the spacebar\n to start'


        bpm = 100;
        scheduleL = null;
        scheduleR = null;
        Tone.Transport.bpm.value = bpm;

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

        startCircleArrays();
        mainTextTransition(['Press the spacebar\nto start',],0,['up',],10,false)

        // logo
        logo = p5c.createImg(
            'assets/icon_transparent.png',
            'app logo'
        );
        logo.addClass('logo')

        // ranking stuff
        imgPodium = p5c.createImg(
            'assets/endlessAssets/podium.png',
            'podium logo'
        );
        imgPodium.addClass('ranking_button')
        imgPodium.mouseOver(displayRanking)
        canvas.mouseOver(noDisplayRanking)

        // tutorial stuff
        tutorialButton = p5c.createDiv('?')
        tutorialButton.addClass('tutorial_button')
        tutorialButton.mousePressed(displayTutorial)

        // exit stuff
        exitButton = p5c.createDiv('X')
        exitButton.addClass('exit_button')

        // periodic animations before starting
        noPlayingAnimation();
    }

    noPlayingAnimation = function () {
        animationDisplayedLeft = false;
        animationDisplayedRight = false;
        animationXLeft = 0;
        animationXRight = p5c.width;
        animationY = yLineH;
        animationRadius = 10;
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

        animationTimeout4 = setTimeout( () => {
            // FIRST GUIDES ANIMATION
            guideR = 253;
            guideG = 253;
            guideB = 150;
            animationTimeout5 = setTimeout( () => {
                guideR = 255;
                guideG = 255;
                guideB = 0;
            } , 700)
            // START GUIDES ANIMATION INTERVAL
            intervalAnimationGuides = setInterval( () => {
                guideR = 253;
                guideG = 253;
                guideB = 150;
                animationTimeout6 = setTimeout( () => {
                    guideR = 255;
                    guideG = 255;
                    guideB = 0;
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
    }
    clearNoPlayingAnimations = function () {
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
    var textFirstDisplay2;
    var place = 0;
    displayTutorial = function () {
        if(!started && !rankingDisplayed){
            if(tutorialDisplayed){
                nextButton.remove();

                if(place == 0){
                    textFirstDisplay.remove();
                    textFirstDisplay2.remove();
                    placeZeroTutorialDisplayed = false;
                    previousButton.remove();
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

                textFirstDisplay = p5c.createDiv(tutorialText)
                textFirstDisplay.addClass('tutorial_text')

                textFirstDisplay2 = p5c.createDiv(tutorialText2)
                textFirstDisplay2.addClass('tutorial_text')
                textFirstDisplay2.style("top","62%")

                placeZeroTutorialDisplayed = true;
                tutorialDisplayed = true;
            }
        }
    }

    nextButtonFunction = function() {
        if(place == 0){
            textFirstDisplay.remove();
            textFirstDisplay2.remove();
            placeZeroTutorialDisplayed = false;
            previousButton = p5c.createDiv('<');
            previousButton.addClass('previous_button');
            previousButton.mousePressed(previousButtonFunction)
            place += 1;
            imgStartingFrame = p5c.createImg(
                'assets/endlessAssets/frame0.png',
                'starting Frame'
            );
            imgStartingFrame.addClass('tutorial_image')
        }
        else if (place == 1) {
            nextButton.remove()
            place += 1;
            imgStartingFrame.remove();
            nextButton.style("opacity","100%")
            imgPlayingFrame = p5c.createImg(
                'assets/endlessAssets/frame1.png',
                'playing Frame'
            );
            imgPlayingFrame.addClass('tutorial_image')
        }
    }
    previousButtonFunction = function() {
        if (place == 1) {
            place -= 1;
            previousButton.remove()
            placeZeroTutorialDisplayed = true;
            textFirstDisplay = p5c.createDiv(tutorialText)
            textFirstDisplay.addClass('tutorial_text')
            textFirstDisplay2 = p5c.createDiv(tutorialText2)
            textFirstDisplay2.addClass('tutorial_text')
            textFirstDisplay2.style("top","65%")
            imgStartingFrame.remove()
        }
        else if (place == 2) {
            place -=1
            nextButton = p5c.createDiv('>');
            nextButton.addClass('next_button');
            nextButton.mousePressed(nextButtonFunction)
            imgPlayingFrame.remove()
            imgStartingFrame = p5c.createImg(
                'assets/endlessAssets/frame0.png',
                'starting Frame'
            );
            imgStartingFrame.addClass('tutorial_image')
        }
    }

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
    startCircleArrays = function () {
        for (let i = 0; i < leftCircles.length; i++) {
            leftCircles[i] = new Circle([0, 0, rhythm_rad, 0])
        }
        for (let i = 0; i < rightCircles.length; i++) {
            rightCircles[i] = new Circle([0, 0, rhythm_rad, 0])
        }
    }

    stopCircleArrays = function () {
        for (let i = 0; i < leftCircles.length; i++) {
            leftCircles[i] = null
        }
        for (let i = 0; i < rightCircles.length; i++) {
            rightCircles[i] = null
        }
    }
    var guideRadius = 30; //radius of guide circles
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
        p5c.noStroke()
        p5c.fill(colorMenu,opacityMenu)
        p5c.textAlign(p5c.CENTER)
        p5c.textSize(15)
        p5c.text(textMenu, p5c.width / 2, p5c.height / 2);


        if(!noReferenceFlag){
            drawReference();
        }

        if(changingBPMVisual){
            p5c.textFont(font)
            p5c.noStroke()
            p5c.fill(255)
            p5c.textAlign(p5c.CENTER)
            p5c.textSize(15)
            p5c.text("Next BPM will be : " + bpm, p5c.width / 2, p5c.height / 2);
        }

        // Visual Metronome ( only outer ellipses )
        p5c.fill("black");
        p5c.strokeWeight(1);
        p5c.stroke(250, 127, 250);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*2/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*3/5 , yLineH + 100, guideRadius, guideRadius);
        p5c.ellipse(xLine1 + (xLine2 - xLine1)*4/5 , yLineH + 100, guideRadius, guideRadius);


        //diplay endless mode
        p5c.textFont('Monoton', 30)
        p5c.stroke(12);
        p5c.fill(250, 127, 250)
        p5c.text('ENDLESS MODE', 220, 70)

        if (started) {
            // Visual Metronome ( inside ellipses )
            p5c.fill(250, 127, 250);
            if (metroFlag > 0){
                metroColor = ((metroFlag - 1) % 4) + 1
            }
            p5c.strokeWeight(1);
            p5c.stroke(250, 127, 250)
            p5c.ellipse(xLine1 + (xLine2 - xLine1)*metroColor/5 , yLineH + 100, guideRadius - 50, guideRadius - 50);


            p5c.textFont('Monoton')
            //write a text in p5.js displaying "Score: " and the score
            p5c.textFont('Monoton')
            p5c.fill(250, 127, 250)
            p5c.textSize(40)
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
            p5c.fill("white")
            p5c.noStroke()
            p5c.textSize(25)
            p5c.text("Lifes : " + lifes, p5c.width/1.5, p5c.height/1.4)


            p5c.fill("white")
            p5c.textSize(15)
            // Consecutive Great Hits and relative Multiplier
            p5c.text("Consecutive\nGreat", p5c.width/1.5, p5c.height/11)
            p5c.text(greatCounter, p5c.width/1.5, p5c.height/6)
            if (multiplierGreat > 0){
                p5c.text(multiplierGreat, xLine2 + 1*(p5c.width - xLine2)/4 , p5c.height - 50 )
            }

            // Consecutive Amazing Hits and relative Multiplier
            p5c.text("Consecutive\nAmazing", p5c.width/1.28, p5c.height/11)
            p5c.text(amazingCounter, p5c.width/1.28, p5c.height/6)
            if (multiplierAmazing > 0){
                p5c.text(multiplierAmazing, xLine2 + 2*(p5c.width - xLine2)/4 , p5c.height - 50 )
            }

            // Consecutive Perfect Hits and relative Multiplier
            p5c.text("Consecutive\nPerfect", p5c.width/1.12, p5c.height/11)
            p5c.text(perfectCounter, p5c.width/1.12, p5c.height/6)
            if (multiplierPerfect > 0){
                p5c.text(multiplierPerfect, xLine2 + 3*(p5c.width - xLine2)/4 , p5c.height - 50 )
            }


            if (rhythmTransition){
                p5c.fill(128, 0, 0)
                p5c.strokeWeight(4);
                p5c.noStroke()
                p5c.textSize(75);
                p5c.text(visualNextLeftR, (p5c.width / 2 - p5c.width / 12)/2, 500);
                p5c.text(visualNextRightR, p5c.width - (p5c.width / 2 - p5c.width / 12)/2 , 500);
            }
            if (newConsecutiveHitsBonus){
                p5c.textFont(font)
                p5c.fill("white")
                p5c.noStroke()
                p5c.textSize(20)
                p5c.text(consecutiveHits + " CONSECUTIVE HITS!", xLine1/2 + 50, p5c.height - 200)
            }
            //we're in the game, draw the reference and update and show the cirlces


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
                // Counter  number of circles for each side
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

        // Ranking Stuff
        if(badNickname){
            p5c.textFont(font)
            p5c.noStroke()
            p5c.fill("red")
            p5c.textAlign(p5c.CENTER)
            p5c.textSize(15)
            p5c.text(badNicknameText, p5c.width / 2, p5c.height / 2 + 120);
        }

        if(animationDisplayedLeft){
            animationXLeft = animationXLeft + 2;
            p5c.fill(246, 41, 202)
            p5c.noStroke()
            for(let i =0; i<16; i++){
                if(animationXLeft - 15*i < xLine1){p5c.ellipse(animationXLeft - 15*i ,animationY,animationRadius,animationRadius)}
            }
        }

        if(animationDisplayedRight){
            animationXRight = animationXRight - 2;
            p5c.fill(85, 35, 222)
            p5c.noStroke()
            for(let i =0; i<16; i++){
                if(animationXRight + 15*i > xLine2){p5c.ellipse(animationXRight + 15*i ,animationY,animationRadius,animationRadius)}
            }
        }
        if(animationVisualMetronomeDisplayed){
            p5c.fill(250, 127, 250);
            p5c.strokeWeight(1);
            p5c.stroke(250, 127, 250)
            p5c.ellipse(xLine1 + (xLine2 - xLine1)*metroColor/5 , yLineH + 100, guideRadius - 50, guideRadius - 50);
        }

        if(rankingDisplayed){
            rankingBackground();
        }

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
        p5c.stroke("black");
        p5c.strokeWeight(3);
        p5c.line(xLine1, 0, xLine1, p5c.height);
        p5c.line(xLine2, 0, xLine2, p5c.height);
        p5c.line(0, yLineH, p5c.width, yLineH)
        p5c.fill(12);
        p5c.strokeWeight(3);
        p5c.stroke(guideR,guideG,guideB)
        p5c.ellipse(xLine1, yLineH, guideRadius, guideRadius);
        p5c.ellipse(xLine2, yLineH, guideRadius, guideRadius);
        p5c.fill(12);
    }
    rankingBackground = function () {
        p5c.strokeWeight(1);
        p5c.stroke(255,255,255)
        p5c.fill(62,69,75,255)
        p5c.translate(-300, -300);
        p5c.rect(p5c.width/2,p5c.height/2,600,600)
        p5c.translate(+300,+300);

        p5c.noStroke()
        p5c.fill(62,69,75,100)
        p5c.translate(-335, -335);
        p5c.rect(p5c.width/2,p5c.height/2,600,600)
        p5c.translate(+335,+335)
    }

    tutorialBackground = function () {
        p5c.strokeWeight(1);
        p5c.stroke(255,255,255)
        p5c.fill(62,69,75,255)
        p5c.translate(-480, -270);
        p5c.rect(p5c.width/2,p5c.height/2,960,540)
        p5c.translate(480, 270);

        p5c.noStroke()
        p5c.fill(62,69,75,100)
        p5c.translate(-500, -290);
        p5c.rect(p5c.width/2,p5c.height/2,960,540)
        p5c.translate(500, 290);

        if(placeZeroTutorialDisplayed){
            p5c.textFont(font)
            p5c.noStroke()
            p5c.fill("red")
            p5c.textAlign(p5c.CENTER)
            p5c.textSize(10)
            p5c.text("Click here\nto see visual\nexamples of a\nmatch game", p5c.width / 2 + 435, p5c.height / 2 + 30);
        }

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
    }
    /*
    mouseClicked(): p5js function that gets called every time the sx mouse button
    is pressed / the touchscreen is touched.
    We start the AudioContext here with userStartAudio()
    */
    p5c.mouseClicked = function () {

    }

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
    keyPressed(): p5js function that gets called every time a key is pressed.
    Use key to get the specific key.
    We see here for now if a beat circle is overlapping with the reference;
    points will later need to be assigned based on how much the circle
    was overlapping with the reference.
    The circle will also need to be deleted
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

    var paused = false;
    p5c.keyPressed = function () {
        let key = p5c.key;
        //check if any of the active circles is overlapping with the
        //reference
        if (key == "p" || key == "P"){
            if(paused){
                paused = false;
                started = true;
                for (let i = 100; i< 160; i = i+10) {
                    if (soundtrackBeat1.player(i).state == "paused") {
                        soundtrackBeat1.player(i).start();
                    }
                    if (soundtrackBeat2.player(i).state == "paused") {
                        soundtrackBeat2.player(i).start();
                    }
                }
                if (soundtrackDieRecord.player("die").state == "paused") {
                    soundtrackBeat2.player(i).start();
                }
                    if (soundtrackDieRecord.player("die").state == "paused") {
                        soundtrackBeat2.player(i).start();
                    }
                Tone.Transport.start();
            }
            else{
                paused = true;
                started = false;
                for (let i = 100; i< 160; i = i+10) {
                    if (soundtrackBeat1.player(i).state == "started") {
                        soundtrackBeat1.player(i).stop();
                    }
                    if (soundtrackBeat2.player(i).state == "started") {
                        soundtrackBeat2.player(i).stop();
                    }
                }
                if (soundtrackDieRecord.player("die").state == "started") {
                    soundtrackBeat2.player(i).stop();
                }
                if (soundtrackDieRecord.player("die").state == "started") {
                        soundtrackBeat2.player(i).stop();
                }

                Tone.Transport.pause();
            }
        }


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
                guideR = 255;
                guideG = 255;
                guideB = 0;
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

        if(started){
            if (key == 's' || key == 'S') {
                let hitL = false;
                for (let i = firstElemInGameL; i < firstElemInGameL + leftElem; i++) {
                    let k = i % leftCircles.length;
                    let c = leftCircles[k];
                    if (Math.abs(c.y - yLineH) <= guideRadius) {
                        hitL = true;
                        //play sound
                        /*hitSoundL.play();*/
                        if(lastL == 1){
                            soundtrackHitL2.start();
                            lastL = 2;
                        }
                        else if (lastL == 2){
                            soundtrackHitL1.start();
                            lastL = 1;
                        }

                        // RULES FOR CALCULATING POINTS
                        // distance*10 = [0,7]     -> perfect -> 100 points
                        // distance*10 = [7, 20]   -> amazing -> 75 points
                        // distance*10 = [20, 70]  ->  great  -> 50 points
                        // distance*10 = [70, 150] ->  good   -> 25 points
                        // distance*10 = [150, - ] ->   ok    -> 0 points

                        let points = Math.round(Math.abs(c.y - yLineH)*10);
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
                                if ( j == firstElemInGameL){break}
                            }
                            firstElemInGameL = j;
                        }

                        leftElem--;
                    }
                }

                if (!hitL) {

                    if(lifes <= 0 && died == false){
                        reSetup()
                    }
                    else{
                        /*miss.play();*/
                        lastMiss +=1;
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
            if (key == 'k' || key == 'K') {
                let hitR = false;
                for (let i = firstElemInGameR; i < firstElemInGameR + rightElem; i++) {
                    let k = i % rightCircles.length;
                    let c = rightCircles[k];
                    if (Math.abs(c.y - yLineH) <= guideRadius) {
                        hitR = true;
                        //play sound
                        /*hitSoundR.play();*/
                        if(lastR == 1){
                            soundtrackHitR2.start();
                            lastR = 2;
                        }
                        else if (lastR == 2){
                            soundtrackHitR1.start();
                            lastR = 1;
                        }

                        // RULES FOR CALCULATING POINTS
                        // distance*10 = [0,7]     -> perfect -> 100 points
                        // distance*10 = [7, 20]   -> amazing -> 75 points
                        // distance*10 = [20, 70]  ->  great  -> 50 points
                        // distance*10 = [70, 150] ->  good   -> 25 points
                        // distance*10 = [150, - ] ->   ok    -> 0 points
                        let points = Math.round(Math.abs(c.y - yLineH)*10);
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
                                if ( j == firstElemInGameR){break}
                            }
                            firstElemInGameR = j;
                        }
                        rightElem--;
                    }
                }
                if (!hitR) {
                    if(lifes <= 0 && died == false){
                        reSetup()
                    }
                    else{
                        lastMiss +=1;
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
    metroSound(): produces the correct metronome sound based on the beat
    */
    var metroFlagX;
    var scheduleFlag;
    var scheduleNoReference;
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

            }

            if(newBPMTransition){
                newBPMTransition = false;
                soundtrackDieRecord.player("die").start();

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
                changingBPMVisual = true;
                Tone.Transport.stop();
                bpm = bpm + 10;
                Tone.Transport.bpm.value = bpm;
                restart = true;
                metroFlag = -1;

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
                }, 4000)
            }
            else{
                soundtrackBeat1.player(bpm).start();
            }

        }
        else if (metroFlag % 32 == 16) {
            soundtrackBeat2.player(bpm).start();

        }
        if (metroFlag % 4 == 0) {
            //met1.play()
        } else {
            //met2.play();
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
        //to indicate how good a hit was ("OK", "GREAT", "AMAZING","PERFECT")
        //depending on the points scored

        // RULES FOR CALCULATING POINTS
        // [0,7] -> perfect
        // [7, 20] -> amazing
        // [20, 70]-> great
        // [70, 150] -> good
        // [150, - ] -> ok

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
        if(points >= 0 && points < 7){
            msg = "PERFECT";
            perfectCounter += 1;
            amazingCounter += 1;
            greatCounter += 1;
            gameScore = gameScore + 100*multiplier;
        }else if(points >= 7 && points < 20){
            msg = "AMAZING";
            amazingCounter += 1;
            greatCounter += 1;
            gameScore = gameScore + 75*multiplier;
            perfectCounter = 0;
            multiplierPerfect = 0;
        }else if(points >= 20 && points < 70){
            msg = "GREAT";
            greatCounter += 1;
            gameScore = gameScore + 50*multiplier;
            multiplierAmazing = 0;
            amazingCounter = 0;
            multiplierPerfect = 0;
            perfectCounter = 0;
        }else if(points >= 70 && points < 150){
            msg = "GOOD";
            gameScore = gameScore + 25*multiplier;
            multiplierGreat = 0;
            greatCounter = 0;
            multiplierAmazing = 0;
            amazingCounter = 0;
            multiplierPerfect = 0;
            perfectCounter = 0;
        }
        else if(points >= 150){
            msg = "OK";
            gameScore = gameScore + 1*multiplier;
            greatCounter = 0;
            amazingCounter = 0;
            perfectCounter = 0;
        }
        if(msg != ""){
            p5c.fill(240);
            p5c.textFont(font)
            p5c.textSize(20);
            p5c.text(msg, x, y);
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
    
    function toggleRhythms() {
        var arrayNewRhythms;

        // 1) BMP 100 -> 110 and TRIPLET after 8 measures ( TODO: amount of score to do in order to go faster beyond )
        if (bpm == 100 && metroFlag >= 32){
            newBPMTransition = true;
            triplet = true;
        }
        // 2) BMP 110 -> 120 and UPPER LIMIT TO 6 after 8 measures ( TODO: amount of score to do in order to go faster beyond )
        if (bpm == 110 && metroFlag >= 32 * 2){
            newBPMTransition = true;
            rhythmUpperLimit = 6;
        }
        // 3) BMP 120 -> 130 and MINDBLOWING after 8 measures ( TODO: amount of score to do in order to go faster beyond )
        if (bpm == 120 && metroFlag >= 32 * 4){
            newBPMTransition = true;
            mindBlowing = true;
        }
        // 4) BMP 130 -> 140 and LOWER LIMIT TO 3 after 12 measures ( TODO: amount of score to do in order to go faster beyond )
        if (bpm == 130 && metroFlag >= 32 * 12){
            newBPMTransition = true;
            rhythmLowerLimit = 3;
        }
        // 5) BMP 140 -> 150 and LOWER LIMIT TO 4 and UPPER LIMIT TO 8 after 12 measures ( TODO: amount of score to do in order to go faster beyond )
        if (bpm == 140 && metroFlag >= 32 * 24){
            newBPMTransition = true;
            rhythmUpperLimit = 8;
            rhythmLowerLimit = 4;
        }

        // inf) BMP 150 -> ... and LOWER LIMIT +1 and UPPER LIMIT +2 after 12 measures
        if (bpm >= 150 && metroFlag >= 32 * 48){
            newBPMTransition = true;
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
            namesRanking[0] = '';
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