//p5.js sketch file (with p5 in instance mode we can rename this file)
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
TODO:
add a background image to make everything prettier
maybe add some stupid effects to make things even more pretty

RECORDING MODE:
-Implement recording

UPLOAD MODE:
-Bring debug fixes (disappearing waveform,etc)

(note: both modes bring to common mode)

COMMON MODE:
-Peak detection
-Polyrhythm detection
-Cut audio if longer than 30 seconds

IF THERE'S TIME:
-Implement a createGraphics approach to manage helper text
*/

/*
Tone stuff
*/
const limiter = new Tone.Limiter(-2).toMaster();
const compressor = new p5.Compressor()
limiter.connect(Tone.Master)
Tone.Transport.bpm.value = 90;
// start/stop the oscillator every quarter note
/*
Tone.Transport.scheduleRepeat(time => {
  osc.start(time).stop(time + 0.1);
}, "4n");
*/
//Tone.Transport.start();


//needed until we find a better way to track document focus changes
//(see bottom of this file)
//this just tracks the state
var pageFoc = true;

//we set the bpm to 100 by default; this will be the bpm
//the user will be asked to play/upload something at
var bpm = 100

//recording: booelan indicating if we're recording or not
var recordedAudio; //for the soundRecorder
var recording = false;

//MENU BUTTONS
//used to create an upload button spanning half a page
var visibleUploadButton;
//the real upload button, hidden in the back :)
var realUploadButton;
var uploadButton;

//same idea as above, a bit simpler 
var recordSideButton;

//various other self-explanatory buttons
var faqMenuButton; //onclick:show instructions

//buttons to control the audio playback
var playButton;
var stopButton;
var stopButton;
var recordButton;
var analyseButton; //analyse the audio file for matching polyrhythms
var uploadButton_ingame;

var soundFile; //the file we'll load
var maxDuration = 15; //maximum duration of the audio file in seconds
var leftChannel, rightChannel; //we'll save the audio values in here

var messages; //to save the messages we'll display

//bpm / polyrhythm detection stuff
var worker;
var BPM_estimated
var second_bpm_estimated
var third_bpm_estimated
var first_polyrhythm
var second_polyrhythm


// Rhythmic Wheel Stuff
var hitOuter
var hitInner
//answer buttons
var answer1
var answer2
var answer3
var hovered = [0, 0, 0]
var selectedAnswer = -1 

//use p5 in instance mode
window.P$ = new p5(p5c => {
  class Message {
    /*
    Message: class that represents a message that the helper will say
    Important fields of a Message:
    msg: the actual message
    id: the id of the message
    nextMsgId: the id of the next message the helper will say
    */
    constructor(msg, id, nextMsgId) {
      if (msg != null && msg != undefined) {
        this.msg = msg
      } else {
        this.msg = ""
      }
      if (id != null && id != undefined) {
        this.id = id
      } else {
        this.id = ""
      }
      if (nextMsgId != null && nextMsgId != undefined) {
        this.nextMsgId = nextMsgId
      } else {
        this.nextMsgId = -1
      }
      //this.prevMsgId = -1
    }
    //used for emptying the dialogue box without switching to another message
    //Especially useful for when we don't want to display a new message immediately
    makeEmpty() {
      this.msg = ""
    }
    setId(id) {
      this.id = id
    }
    getId() {
      return this.id
    }
    getMsg() {
      return this.msg
    }
    setMsg(msg) {
      this.msg = msg
    }
    setNextMsgId(nextMsgId) {
      this.nextMsgId = nextMsgId
    }
    //this is useless, could be used to check for errors
    setPrevMsgId(prevMsgId) {
      this.prevMsgId = prevMsgId
    }
  }

  //-----------------------end of Message-------------------------

  class Helper {
    /*
    Helper: the helper is the character that is displayed on the screen
    and says stuff to help the user
    --Inputs--
    faces: array of faces (images of a face) of the helper
    name: the name of the helper
    */
    constructor(faces, name) {
      this.name = name //displayed name (e.g. "Polyev")
      //the parameters are the faces of the helper
      this.faces = faces //this could be an array of images or a single image
      //for now we'll not distinguish by emotion (=> we use a single face)
      this.currFace = 0

      //count the frames you showed the last face for
      //this.showedFor = 0

      this.lastMsg = " "
      this.counter = 0  //counts how many characters of the message have been displayed
      this.time = 30 //time between each character

      //we have reached the end of the phrase
      this.wait = false  //true if we're waiting for the user to press a key
      this.interval = null //the interval that will be used to play a "speech" sound
      this.cursorBlink = false //used to manage the blinking cursor
      this.isIdle = false //is the helper idle? (not saying anything - no new messages)
      this.state = "working" //the state of the helper (working, idle, etc)

      //if the message requires an answer, we'll save the choices here
      this.answers = new Array()
      this.hasAnswers = false
    }

    /*
    showFace: displays the face of the helper
    */
    showFace() {
      p5c.push()
      //p5c.imageMode(p5c.CORNERS)
      //make the face appear next to the text box in the same position
      //REGARDLESS of the screen resolution and zoom
      
      if (!started)
        p5c.image(this.faces[this.currFace], p5c.width - 1 * p5c.width/5, p5c.height - 2*p5c.height/5, p5c.width/6,p5c.height/2)
      else {
        //p5c.width / 2, 5*p5c.height/6 , p5c.width / 2, p5c.height/5
        let h = this.faces[this.currFace].height
        p5c.image(this.faces[this.currFace], p5c.width / 14, 2 * p5c.height / 4, 37*p5c.width/192, p5c.height/2 * 8/7)
      }
      
      p5c.pop()
      /*
      //this made more sense when there were multiple faces
      this.showedFor++
      if(this.showedFor == 5){
        this.currFace++
        this.currFace = this.currFace%this.faces.length
        this.showedFor = 0
      }
      */
    }

    /*
    createTextBox: creates the text box where the helper will say stuff
    Also manages the blinking cursor on the bottom right of the text box
    */
    createTextBox() {
      //create a text box
      //the text is in the middle of the rect
      p5c.rectMode(p5c.CENTER)
      p5c.fill(12, 12, 12, 150)
      p5c.rect(p5c.width / 2, 5*p5c.height/6 , p5c.width / 2, p5c.height/5)
      //print message using speech_font
      p5c.stroke(255)
      p5c.fill(255)
      p5c.textFont(speech_font)
      p5c.textSize(30)
      p5c.rectMode(p5c.CORNER)
      p5c.textWrap(p5c.WORD) //alternative is CHAR 
      //if the helper is waiting for the user to click, show a blinking cursor
      if (this.wait && !this.isIdle) {
        if (p5c.frameCount % 30 == 0) {
          this.cursorBlink = !this.cursorBlink
        }
        if (!this.cursorBlink) {
          //draw a small white square on the bottom right of the text box (the cursor)
          //p5c.width / 2, 5*p5c.height/6 , p5c.width / 2, p5c.height/5
          p5c.rect(3 / 4 * p5c.width - 30, 5 * p5c.height / 6 + p5c.height/10 - 30, 15, 15)
        }
      }

      //if there are answers, display them
      if (this.hasAnswers) {
        this.createAnswersBox()
      }
    }
    /*
    addAuthor: adds the name of the helper on the top left corner of the text box
    */
    addAuthor() {
      //The name is inside a rectangle with a white background
      //TODO: this part is more of a meme, you decide if we keep it or not
      p5c.push()
      p5c.fill(255)
      p5c.rect(p5c.width / 4, 5 * p5c.height / 6 - p5c.height / 10 - p5c.height / 20, p5c.width / 6, p5c.height/20)
      p5c.fill(0)
      p5c.textSize(32)
      p5c.textAlign(p5c.LEFT)
      p5c.text(this.name, p5c.width / 4 + 10, 5 * p5c.height / 6 - p5c.height / 10 - p5c.height / 40 - 5)
      p5c.pop()
    }
    /*
    say: displays the message on the screen
    --Inputs--
    message: Message object containing the string to print
    */
    say(message) {
      //need to get the message from the message object
      let msg = message.getMsg()
      let time = this.time
      //print textbox and helper name
      this.createTextBox()
      this.addAuthor()

      if (this.lastMsg != msg) {
        //if the message is different from the last one in memory update it
        this.lastMsg = msg
        this.counter = 1
        //setTimeout(this.printMsg, this.counter*time, this.lastMsg, this.counter);
        this.printMsg(msg, this.counter)
        this.wait = false
        //upgrade counter by one and play the sound corresponding to dialogue
        this.interval = setInterval(() => {
          this.counter++
          //play the sound corresponding to dialogue
          //(every once in a while)
          if (this.counter % 5 == 0) {
            speech.play()
          }
          if (this.counter >= msg.length) {
            this.wait = true
          }
        }, time);
      } else { //if the message is the same as the last one in memory
        if (this.counter >= msg.length) {
          //if we've reached the end of the message stop increasing the counter
          //and making sounds
          clearInterval(this.interval)
          this.printMsg(msg, msg.length)
          //wait for user input (=>show blinking cursor)
          this.wait = true
          return
        }
        //setTimeout(this.printMsg, this.counter * time, this.lastMsg, this.counter);

        //TODO: this is kinda unnedeed here...
        this.printMsg(msg, this.counter)
      }
    }
    /*
    //not needed anymore, it's all done inside of say()
    updateCounter(time,msg, intervalHandle,cnt){
      cnt++
      if(cnt) > msg.length){
        clearInterval(this.interval)
        this.wait = false
        return
      }
    }
    */

    /*
     printMsg: actually prints the message on the screen
     --Inputs--
     msg: the message to print
     to: the number of characters to print
    */
    printMsg(msg, to) {
      p5c.stroke(255)
      //p5c.width / 2, 5*p5c.height/6 , p5c.width / 2, p5c.height/5
      p5c.text(msg.substring(0, to),
        1 * p5c.width / 4 + 10, 5 * p5c.height / 6 - p5c.height / 10, p5c.width / 2 - 20, p5c.height / 5)
    }

    addAnswers(choices) {
      for (let i = 0; i < choices.length; i++) {
        this.answers.push(choices[i])
      }
      this.hasAnswers = true
    }
    stopText(clearTextFlag){
      clearInterval(this.interval)
      if (clearTextFlag){
        //also clear the text
        this.lastMsg = ""
        this.counter = 0

        this.setIdle() 
      }
    }

    removeAnswers(){
      if(!this.hasAnswers) 
        return
      this.hasAnswers = false
      answer1.remove()
      answer2.remove()
      answer3.remove()
      this.answers = []
    }


    /*
    createChoicesBox: creates the choices that the user can select
    */
    
    createAnswersBox(){
      selectedAnswer = -1
      p5c.push()
      //create a rectangle OVER the text box to contain the possible choices
      //The choices are displayed vertically, one on top of the others
      //The rectangle has a black background with a 50% opacity
      //It should be evident that the choices are clickable
      //The rectangle should be distinguishable from the normal text box
      p5c.rectMode(p5c.CENTER)
      p5c.fill(12, 12, 12)
      p5c.rect(3*p5c.width / 4 - p5c.width/16, p5c.height /2 + 100, p5c.width / 8, 150)

      //make three sub-rectangles to make the choices more visible
      
      p5c.strokeWeight(2)
      p5c.fill(200, 200, 200, 10 + hovered[0]*200)
      p5c.rect(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 50, p5c.width / 8, 50)
      p5c.fill(200, 200, 200, 10 + hovered[1] * 200)
      p5c.rect(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 100, p5c.width / 8, 50)
      p5c.fill(200, 200, 200, 10 + hovered[2] * 200)
      p5c.rect(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 150, p5c.width / 8, 50)
      
      p5c.pop()
      p5c.push()
      //print the choices
      p5c.stroke(255)
      p5c.textFont(speech_font)
      p5c.textSize(30)
      p5c.rectMode(p5c.CORNER)
      p5c.textWrap(p5c.WORD) //alternative is CHAR

      //now print the text in the choices box
      p5c.text(this.answers[0], 3 * p5c.width / 4 - p5c.width / 8, p5c.height / 2 + 20, p5c.width / 8, 50)
      p5c.text(this.answers[1], 3 * p5c.width / 4 - p5c.width / 8, p5c.height / 2 + 70, p5c.width / 8, 50)
      p5c.text(this.answers[2], 3 * p5c.width / 4 - p5c.width / 8, p5c.height / 2 + 120, p5c.width / 8, 50)
      p5c.pop()
      


      
      /*
      //create a rectangle to contain the choices
      p5c.rectMode(p5c.CENTER)
      p5c.fill(12, 12, 12, 150)
      p5c.rect(p5c.width / 2, p5c.height - 150, p5c.width / 2, 200)
      //print the choices
      p5c.stroke(255)
      p5c.fill(255)
      p5c.textFont(speech_font)
      p5c.textSize(30)
      p5c.rectMode(p5c.CORNER)
      p5c.textWrap(p5c.WORD) //alternative is CHAR 
      
      //if the helper is waiting for the user to click, show a blinking cursor
      if (this.wait && !this.isIdle) {
        if (p5c.frameCount % 30 == 0) {
          this.cursorBlink = !this.cursorBlink
        }
        if (!this.cursorBlink) {
          //draw a small white square on the bottom right of the text box (the cursor)
          p5c.rect(3 / 4 * p5c.width - 25, p5c.height - 75, 15, 15)
        }
      }
      //print the choices
      for(let i = 0; i < this.answers.length; i++){
        p5c.text(this.answers[i], 1 * p5c.width / 4 + 10, p5c.height - 250 + 50*i, p5c.width / 2 - 20, 200)
      }
      */
     
   }


    //------------------------------------------------
    //functions to manage the state of the helper

    isWaiting() {
      //is waiting for user input
      return this.wait && !this.isIdle
    }
    setIdle() {
      //is idle means that it's NOT expecting any user input
      //and it's not displaying anything on the screen
      this.isIdle = true
      this.state = "idle"
    }
    setWorking() {
      //opposite of setIdle()
      this.isIdle = false
      this.state = "working"
    }
    getState() {
      return this.state
    }
    //------------------------------------------------
  }
  //-----------------------end of Helper-------------------------

  //variables to handle the state of the application
  let loading = true //is the application loading stuff?
  var started = false; //has the user started the game?
  var userGaveMicPerm = false; //has the user given microphone permission?

  /*
  preload: function that gets automatically by p5js before loading the sketch.
  ->Everything that needs to be available when the sketch starts needs to be loaded here
  (e.g. fonts, sounds,...)
  */
  p5c.preload = function () {
    //soundFormats('wav');
    //hit = p5c.loadSound('assets/hit.wav');
    //miss = p5c.loadSound('assets/miss.wav')
    //met1 = p5c.loadSound('assets/met1.wav'); //metronome (higher)
    met2 = p5c.loadSound('assets/met2.wav'); //metronome (lower)
    font = p5c.loadFont('assets/Gruppo-Regular.ttf'); //fancy font
    speech_font = p5c.loadFont('assets/Montserrat-Light.ttf') //font for the text box
    face = p5c.loadImage('assets/face.png') //helper's face
    face_talking1 = p5c.loadImage('assets/face_talking1.png'); //helper's face while talking
    face_talking2 = p5c.loadImage('assets/face_talking2.png'); //helper's face while talking
    speech = p5c.loadSound('assets/dialogue_1.wav') //sound for the dialogue
    speech_end = p5c.loadSound('assets/dialogue_end.wav') //sound that plays when user clicks to pass to next message
    messages_json = p5c.loadJSON('assets/messages.json', jsonLoaded) //json file containing the Messages
    hitOuter = P$.loadSound('assets/hit_outer.wav'); // hit Outer Circle Rhythmic Wheel
    hitInner = P$.loadSound('assets/hit_inner.wav'); // hit Inner Circle Rhythmic Wheel
    debug_soundfile = p5c.loadSound('assets/test_5v7_174.mp3') //debug soundfile
    
    bg = p5c.loadImage('assets/bg.jpg') //background image
    loopSound_0 = p5c.loadSound('assets/loop_1.wav') //polyrhythm sound 1
    loopSound_1 = p5c.loadSound('assets/loop_2.wav') //polyrhythm sound 2
  }

  /*
  jsonLoaded: function that gets called when messages_json is loaded
  Creates an array for the messages
  */
  jsonLoaded = function () {
    let n = Object.keys(messages_json["record"]).length
    messages = new Array(n)
    for (let i = 0; i < n; i++) {
      let msg = messages_json["record"][i]
      messages[i] = new Message(msg.msg, msg.msgId, msg.nextMsgId)
    }
    loading = false
  }

  //we need these to record using p5.js
  var mic, recorder; //mic = our microphone, recorder is a p5.soundRecorder
  //var soundFile; //the file we'll load
  //var leftChannel, rightChannel;
  var fft; //needed to analyse the sound

  var mode; //0 = record from mic, 1 = load from file, 2 = common (after the first set of dialogues everything is common)
  /*
  setup(): function that gets called by p5.js at startup. Initialise variables 
  needed in the sketch here; load audio files, fonts, etc, in preload() instead
  */
  p5c.setup = function () {
    p5c.createCanvas(p5c.windowWidth, p5c.windowHeight);
    /*
    see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
    There's no need for the audio context to be running as soon as the page is loaded
    */
    p5c.getAudioContext().suspend();
    p5c.frameRate(60) //this doesn't work but it's like lighting a candle 
    //in a church praying for a miracle

    setupAudioStuff()
    setupWorker()
    faces = [face]//, face2]
    helper = new Helper(faces, "Polyev")
    msg = messages[0]

    //setup everything regarding buttons
    setupMenuButtons()

    // Setup everything about Rhythmic Wheel
    setupRhythmicWheel()
  }

  /*
  setupWorker: sets up the web-worker that will handle the audio analysis
  */
  var workerSupported;
  setupWorker = function () {
    //check if this is supported by the browser
    if (window.Worker) {
      workerSupported = true
      const myWorker = new Worker("worker-methods.js");
      worker = myWorker
      /*//TODO: move this to the part when it's actually called
      //load the audio file
      sound = p5c.loadSound("test_3v2_158.mp3");
      let x;
      setTimeout(() => {
        x = sound.buffer.getChannelData(0).slice();
        console.log("AUDIO LOADED")
        console.log("Passing the audio data to the worker!")
      }, 1000)

      setTimeout(() => {
        worker.postMessage(x)
      }, 2000);
      worker.onmessage = (event) => {
        console.log("Main: received the result!")
        //print the estimated BPM
        BPM = event.data[0]
        tempogram = event.data[1]
      }
      */
    } else {
      workerSupported = false
      console.log('Your browser doesn\'t support web workers.');
      console.log("Audio analysis will be unavailable.")
      console.log("See https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers for more informations")
      console.log("We will not perform audio analysis.")
    }

  }

  /* 
  setupAudioStuff: sets up, you guessed it, the audio stuff related to p5js
  */
  setupAudioStuff = function () {
    //we need to initialise the microphone and the recorder
    mic = new p5.AudioIn();
    recorder = new p5.SoundRecorder();
    //we set the input of the recorder to be the microphone
    recorder.setInput(mic);
    //here we would start the microphone, but we don't want to do that yet
    //We'll start only when if the user selects to record
    //This is handled in the handleMessage() function
    //we create a soundFile that will contain a pre-recorded audio
    soundFile = new p5.SoundFile();
    fft = new p5.FFT();
    //we set the input of the fft to be the microphone

    //fft.setInput(mic);
    //TODO after recording we need to call mic.disconnect()

    fft.setInput();
  }

  /*
  setupMenuButtons: setup the buttons that are used in the menu
  Contains a mousePressed function for every button to handle what 
  to do when the user clicks on it
  */
  setupMenuButtons = function () {
    //we have the real upload button hidden behind a the visible one
    realUploadButton = p5c.createFileInput(handleFile)
    //hide realUploadButton and give it the realUpload ID
    realUploadButton.hide()
    realUploadButton.id('realUpload')
    uploadButton = document.getElementById('realUpload')
    visibleUploadButton = p5c.createButton('');
    visibleUploadButton.addClass('upload_button')
    visibleUploadButton.id('menuUploadButton')
    //make visibleUploadButton hidden and a file input
    visibleUploadButton.attribute('type', 'file')
    visibleUploadButton.attribute('accept', 'audio/*')

    recordSideButton = p5c.createDiv('')
    recordSideButton.addClass('record_side')

    faqMenuButton = p5c.createDiv('?')
    faqMenuButton.addClass('faq_button')

    //two cases:
    //if the user clicked on the left half of the window:
    //ask for the BPM the user wants, ask for permission to use the microphone
    //and start recording
    //if the user clicked on the right half of the window:
    //open a file selector and ask the user to select a file
    recordSideButton.mousePressed(function () {
      bpm = p5c.createInput("What BPM do you want to use?");
      mode = 0 //user chose to record
      //started = true
      if (!started) {
        p5c.userStartAudio();
        Tone.start();
        //Tone.Transport.start();
        //startMetronome(bpm)
        //Tone.Transport.bpm.value = bpm;
        started = true
      }
      removeUselessButtons()
    })



    faqMenuButton.mousePressed(function () {
      //TODO: type all FAQs, everything the user needs to know, inside a black box
      //Make it look nice and make it close when user clicks on it
      faqMenuButton.hide()
      //make a black box in the middle of the screen and type "aaa" inside of it
      let box = p5c.createDiv(`<h2>HOW THIS WORKS</h2>
      Welcome to the didactic mode of Polyrhythm Hero!<br>
      In this mode, you will learn how to play basic polyrhythms.<br>
      You can choose to record yourself playing some kind of rhythm (tapping your fingers on the table is also OK) 
      or upload an audio file from your pc.<br>
      For simplicity, all recordings will be cut to 15 seconds<br>
      The website will then analyze your audio and find the polyrhythm that's closest to what you played (2 options will be proposed and you can choose the closest!).<br>
      You can then choose to train on the polyrhythm you found, play with it on a rhythmic wheel to obtain shifted versions 
      or record/upload a new audio.<br>
      <br>
      COMMANDS:<br>
      z / mouse1: pass to the helper's next message<br>
      m: skip all useless dialogue and get into the action right away<br>
      <br>
      We hope you enjoy your stay!<br>
      <br>
      <b>Alice, Cecilia, Francesco, Matteo</b>`)
      box.addClass('faq_box')
      //box.position(p5c.width/2, p5c.height/2 - 100)
      box.size(600, 600)
      box.mousePressed(function () {
        box.remove()
        faqMenuButton.show()
      }
      )
    })

    visibleUploadButton.mousePressed(function () {
      //p5c.userStartAudio()
      mode = 1
      //started = true
      if (!started) {
        p5c.userStartAudio();
        Tone.start();
        //Tone.Transport.start();
        //startMetronome(bpm)
        //Tone.Transport.bpm.value = bpm;
        //started = true
      }
      //click the "real" button, thus prompting file load
      uploadButton.click()
      /*
      //now remove all useless buttons
      realUploadButton.remove()
      //visibleUploadButton.hide()
      visibleUploadButton.remove()
      */
    })
  }

  //var frameCounter = 0; //not used now, might be used to count frames IN GAME

  /*
  (): p5js function that gets automatically called once per frame
  (by default 60 frames per second) 
  */
  p5c.draw = function () {
    p5c.background(12);
    if (loading)
      //we're still loading the messages (JSON loading is async)
      return

    if (started) {
      drawCurrentMode()
    }
    else {
      drawMenu()
    }
  }

  /*
  drawCurrentMode: draw but for the current mode (record, upload, common)
  */
 var numDots = 0
  drawCurrentMode = function () {
    //show bg image in the background
    p5c.image(bg, 0, 0, p5c.width, p5c.height)
    switch (mode) {
      case 0:
        //we're in record mode
        helper.showFace()
        helper.say(msg)
        break;
      case 1:
        //we're in upload mode
        helper.showFace()
        helper.say(msg)
        break;
      case 2:
        //COMMON MODE
        drawInterface()
        helper.showFace()
        helper.say(msg)
        if (isAnalysing){
          p5c.push()
          p5c.stroke(255)
          p5c.strokeWeight(2)
          p5c.fill(12, 12, 12, 150)
          p5c.rectMode(p5c.CENTER)

          p5c.rect(p5c.width / 2, p5c.height / 4, 3 * p5c.width / 4, p5c.height / 3)
          p5c.pop()
          p5c.push()
          p5c.textSize(30)
          //p5c.textAlign(p5c.CENTER, p5c.CENTER)
          p5c.textAlign(p5c.CORNER, p5c.CENTER)
          p5c.fill(255)
          //write "Analysing" with numDots dots in the middle of the box
          p5c.text("Analysing" + ".".repeat(numDots), p5c.width / 2 - p5c.width/32, p5c.height / 4)
          if(p5c.frameCount % 30 == 0){
            numDots = (numDots + 1) % 4
          }
          p5c.pop()

          
        }
        if(recording){
          p5c.push()
          p5c.stroke(255)
          p5c.strokeWeight(2)
          p5c.fill(12, 12, 12, 150)
          p5c.rectMode(p5c.CENTER)

          p5c.rect(p5c.width / 2, p5c.height / 4, 3 * p5c.width / 4, p5c.height / 3)
          p5c.pop()
          p5c.push()
          p5c.textSize(30)
          //p5c.textAlign(p5c.CENTER, p5c.CENTER)
          p5c.textAlign(p5c.CORNER, p5c.CENTER)
          p5c.fill(255)
          //write "Analysing" with numDots dots in the middle of the box
          p5c.text("Recording" + ".".repeat(numDots), p5c.width / 2 - p5c.width / 32, p5c.height / 4)
          if (p5c.frameCount % 30 == 0) {
            numDots = (numDots + 1) % 4
          }
          if (recording && numDots<2) {
            p5c.fill(255, 0, 0)
            p5c.noStroke()
            p5c.ellipse(p5c.width / 2 + 3 * p5c.width / 8 - 15, p5c.height / 4 - p5c.height / 6 + 15, 20, 20)
          }
          p5c.pop()
        }
        if(showRhythmWheel)
          drawRhythmicWheel()
        break;
    }
  }

  /*
  drawInterface: draw the interface of the common mode (buttons, waveform display, etc)
  */
  drawInterface = function () {
    //draw audio controls
    drawAudioControls()

    //draw a basic rectangle that will contain the waveform of the recorded/uploaded audio
    p5c.push()
    p5c.stroke(255)
    p5c.strokeWeight(2)
    p5c.fill(12, 12, 12, 150)
    p5c.rectMode(p5c.CENTER)
    p5c.rect(p5c.width / 2, p5c.height / 4, 3 * p5c.width / 4, p5c.height / 3)
    //if the user is recording (recording = true) draw a small red circle top right of the rectangle
    
    if (leftChannel != null) {
      //draw the waveform
      p5c.stroke(255)
      p5c.strokeWeight(2)
      p5c.noFill()
      let resolution = p5c.int(p5c.max(1, p5c.round(leftChannel.length / (3 * p5c.width / 4))));
      let x = p5c.width / 2 - 3 * p5c.width / 8;
      let sum = 0;
      let maxAmp = leftChannel[0]; //maximum amplitude
      for (let i = 1; i < leftChannel.length; i++) {
        if (p5c.abs(leftChannel[i]) > maxAmp) {
          maxAmp = leftChannel[i];
        }
      }
      //maxAmp = maxAmp / 2;

      p5c.beginShape()
      for (let i = 0; i < leftChannel.length; i++) {
        // Compute an average for each set of values
        sum += p5c.abs(leftChannel[i]);
        if (i % resolution == 0 && x <= p5c.width / 2 + 3 * p5c.width / 8) {
          p5c.vertex(
            x++,
            // map the average amplitude to range from the center of the canvas to
            // either the top or bottom depending on the channel
            p5c.max(p5c.map(sum / resolution, 0, maxAmp, p5c.height / 4 + p5c.height / 6, p5c.height / 4 - p5c.height / 6), p5c.height / 4 - p5c.height / 6)
          );
          sum = 0;
        }
      }
      p5c.endShape()
      
    }

    p5c.pop()


    p5c.push()
    //draw a light blue line that will represent the current position in soundFile playback
    p5c.stroke(0, 255, 255)
    p5c.strokeWeight(2)
    p5c.noFill()
    //player current X position
    let playerCurrX = p5c.map(soundFile.currentTime(), 0, soundFile.duration(), p5c.width / 2 - 3 * p5c.width / 8, p5c.width / 2 + 3 * p5c.width / 8)
    //if the soundFile is not playing then set the playerCurrX to the beginning of the waveform
    /* //this is bugged
    if (!soundFile.isPlaying()) {
      playerCurrX = p5c.width / 2 - 3 * p5c.width / 8
    }
    */

    p5c.line(playerCurrX, p5c.height / 4 - p5c.height / 6 + 1, playerCurrX, p5c.height / 4 + p5c.height / 6 - 1) //+1,-1 to avoid overlapping with the window

    p5c.pop()


    /*
    //This is very nice to see but quite useless since we're reading only a small sample in real time
    //draw the waveform
    let waveform = fft.waveform()
    p5c.stroke(255)
    p5c.strokeWeight(2)
    p5c.noFill()
    p5c.beginShape()
    for (var i = 0; i < waveform.length; i++){
      var x = p5c.map(i, 0, waveform.length, p5c.width/4, p5c.width/4 + p5c.width/2);
      var y = p5c.map( waveform[i], -1, 1, p5c.height/3 + p5c.height/3, p5c.height/3);
      p5c.vertex(x,y);
    }
    p5c.endShape()
    p5c.pop()
    */
  }

  /*
  drawAudioControls: draw the audio controls (play, pause, stop, etc)
  TODO: chose a different implementation for now (once created they stay
  see createAudioControls())
  */
  drawAudioControls = function () {
    p5c.push()
    //draw a rectangle that will contain the audio controls LEFT of the waveform display
    p5c.stroke(255)
    p5c.strokeWeight(2)
    p5c.fill(100)
    p5c.rectMode(p5c.CENTER)
    p5c.rect(p5c.width/8 - p5c.width/44, p5c.height / 4, p5c.width / 22, p5c.height / 3)
    //divide this rectangle in 5 equal parts
    let rectHeight = p5c.height / 3
    let rectWidth = p5c.width / 22
    let rectX = p5c.width/8 - p5c.width/44
    let rectY = p5c.height / 4
    let rectStep = rectHeight / 5
    //draw 5 squares
    p5c.fill(150)
    p5c.rect(rectX, rectY - rectStep * 2, rectWidth, rectStep)
    p5c.rect(rectX, rectY - rectStep, rectWidth, rectStep)
    p5c.rect(rectX, rectY, rectWidth, rectStep)
    p5c.rect(rectX, rectY + rectStep, rectWidth, rectStep)
    p5c.rect(rectX, rectY + rectStep * 2, rectWidth, rectStep)
    
    //draw a "OK" button in the first square
    p5c.fill(12)
    p5c.stroke(12)
    p5c.textSize(24)
    p5c.textAlign(p5c.CENTER, p5c.CENTER)
    p5c.text("OK", rectX, rectY - rectStep * 2)
    
    //draw a play button (rotated triangle) in the middle of the second square

    p5c.fill(0, 255, 76)
    p5c.stroke(12)
    p5c.strokeWeight(2)
    let playL = p5c.width/110
    p5c.triangle(rectX - playL, rectY - rectStep - playL, rectX - playL, rectY - rectStep +playL, rectX + playL, rectY-rectStep)

    //draw a stop button (rectangle) in the middle of the third square
    p5c.fill(240)
    p5c.stroke(12)
    p5c.strokeWeight(2)
    let stopL = p5c.width/110
    p5c.rect(rectX, rectY, 2*stopL, 2*stopL)

    //draw a record button (circle) in the middle of the fourth square
    p5c.fill(220, 20, 60)
    p5c.stroke(12)
    p5c.strokeWeight(2)
    let recordR = p5c.width/110
    p5c.ellipse(rectX, rectY + rectStep, 2*recordR, 2*recordR)

    //draw an upload button (triangle) in the middle of the fifth square
    p5c.fill(32, 184, 255)
    p5c.stroke(12)
    p5c.strokeWeight(2)
    let uploadL = p5c.width/110
    p5c.push()
    //draw the play button again in this square but rotate it by 90 degress
    p5c.translate(rectX, rectY + 2*rectStep)
    p5c.rotate(-p5c.PI/2)
    p5c.triangle(-uploadL, -uploadL, -uploadL, uploadL, uploadL, 0)
    p5c.pop()

    //draw a rectangle that will contain the audio controls RIGHT of the waveform display
    p5c.fill(150)
    p5c.stroke(255)
    p5c.rect(3*p5c.width/4 + p5c.width/8 + p5c.width/44, p5c.height / 4, p5c.width / 22, p5c.height / 3)
    //print the audio duration and the current time inside this box
    p5c.fill(12)
    p5c.stroke(12)
    p5c.textSize(24)
    p5c.textAlign(p5c.CENTER, p5c.CENTER)
    /*
    p5c.text(p5c.nfc(soundFile.currentTime(), 2) + " / " + p5c.nfc(soundFile.duration(), 2), 3 * p5c.width / 4 + p5c.width / 8 + p5c.width / 44, p5c.height / 4)
    */
    //print the text vertically
    p5c.push()
    p5c.translate(3 * p5c.width / 4 + p5c.width / 8 + p5c.width / 44, p5c.height / 4)
    p5c.rotate(p5c.PI / 2)
    p5c.text(p5c.nfc(soundFile.currentTime(), 2) + " / " + p5c.nfc(soundFile.duration(), 2), 0, 0)
    p5c.pop()

    p5c.pop()
  }

  /*
  drawMenu: draw the menu (the first screen)
  */
  drawMenu = function () {
    //we're in the menu
    p5c.textFont(font);
    //divide the screen in half;

    //fill the left side with a gradient from blu to purple
    //using lerpColor() by subdividing it into 50 parts
    p5c.noStroke()
    for (var i = 0; i < 100; i++) {
      //p5c.color(255, 0, 255)  p5c.color(255, 0, 255)
      p5c.fill(p5c.lerpColor(p5c.color(0, 0, 255), p5c.color(120, 0, 255), i / 100));
      p5c.rect(0, p5c.ceil(p5c.height / 100) * i, p5c.width / 2, p5c.ceil(p5c.height / 100));
    }
    //fill the right side with a gradient from red to purple
    //using lerpColor() by subdividing it into 50 parts
    for (var i = 0; i < 100; i++) {
      p5c.fill(p5c.lerpColor(p5c.color(255, 0, 0), p5c.color(120, 0, 255), i / 100));
      p5c.rect(p5c.width / 2, p5c.ceil(p5c.height / 100) * i, p5c.width / 2, p5c.ceil(p5c.height / 100));
    }

    p5c.stroke(255)
    p5c.line(p5c.width / 2, 0, p5c.width / 2, p5c.height)
    helper.showFace()
    //left side "Record" side
    //right side: "Upload" side
    p5c.textSize(50);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("Record some sounds", p5c.width / 4, p5c.height / 2);
    p5c.text("Upload a file", p5c.width * 3 / 4, p5c.height / 2);
    //write "(note - audio longer than "+maxDuration+" seconds will be cut to "+maxDuration+" seconds)" below Upload in a smaller font
    p5c.textSize(20);
    p5c.text("(audio longer than " + maxDuration + " seconds will be cut to " + maxDuration + " seconds)", p5c.width * 3 / 4, p5c.height / 2 + 50);
    p5c.textSize(30);
    p5c.text("(OR)", p5c.width / 2, p5c.height / 2 - 50);
    //create an arrow pointing to (width-400,height-200) with the text
    //"your helper" below it
    

    //need these to make this resolution independent
    //these substitute the values in the parenthesis (e.g. 450,...)
    let a = p5c.round(p5c.width/(3.5)) 
    let b = p5c.round(p5c.width/(4.26)) //450
    let c = p5c.round(p5c.width / (4.8))

    let d = p5c.round(p5c.height / (15.4))
    let e = p5c.round(p5c.height / (5.4))
    let f = p5c.round(p5c.height / (4.32))
    let g = p5c.round(p5c.height / (3.7))
    let h = p5c.round(p5c.height / (7.2))
    p5c.textSize(20);
    p5c.text("your helper", p5c.width - b, p5c.height - h);
    p5c.stroke(255)
    p5c.noFill()

    p5c.bezier(
      p5c.width - a, p5c.height - d,
      p5c.width - a, p5c.height - e,
      p5c.width - b, p5c.height - f,
      p5c.width - c, p5c.height - f
    )
    //we will show the face of the helper here using other functions
    
    p5c.line(p5c.width - c, p5c.height - f, p5c.width - b, p5c.height - e)
    p5c.line(p5c.width - c, p5c.height - f, p5c.width - b, p5c.height - g)

    //write "POLYRHYTHM HERO" in the upper middle part of the screen.
    //Write it using p5.js functions in a geometric pattern, making it stick out
    //from the background

    p5c.textSize(130);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("POLYRHYTHM HERO", p5c.width / 2, p5c.height / 6);

    
    //write the mode right below the title
    p5c.textSize(32);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("D I D A C T I C   M O D E", p5c.width / 2, p5c.height / 6 + 100);
    
  }

  /* 
  windowResized(): p5js function that gets called every time the window
  gets resized; recalculate here all the variables that contain coordinates 
  in their formulas
  */
  p5c.windowResized = function () {
    //p5c.removeElements();
    p5c.resizeCanvas(p5c.windowWidth, p5c.windowHeight);
    updateWheelLocation()
  }
  /* 
  mousePressed(): p5js function that gets called every time a mouse button
  is pressed / the touchscreen is touched.
  */
  p5c.mousePressed = function () {
    //if the mouse was pressed inside the waveform display, move the audio playback to that location
    if (p5c.mouseX >= p5c.width / 2 - 3 * p5c.width / 8 && p5c.mouseX <= p5c.width / 2 + 3 * p5c.width / 8 && p5c.mouseY >= p5c.height / 4 - p5c.height / 6 && p5c.mouseY <= p5c.height / 4 + p5c.height / 6) {
      if (soundFile != null) {
        let time = p5c.map(p5c.mouseX, p5c.width / 2 - 3 * p5c.width / 8, p5c.width / 2 + 3 * p5c.width / 8, 0, soundFile.duration());
        //let pos = p5c.mouseX
        soundFile.jump(time);
      }
    }
    //if the mouse was pressed inside the text box, do something
    //p5c.rect(p5c.width / 2, 5*p5c.height/6 , p5c.width / 2, p5c.height/5)
    if (p5c.mouseX >= p5c.width / 4 && p5c.mouseX <= 3 * p5c.width / 4 && p5c.mouseY >= 5 * p5c.height / 6 - p5c.height / 10 && p5c.mouseY <= 5 * p5c.height / 6 + p5c.height / 10) {
        //if (!paused) {
        //if the game is not paused, 
        //check if the helper is waiting (isWaiting == true); if so,
        //play the 'speech_end' sound and set isWaiting to false
        if (helper.isWaiting()) {
          speech_end.play();
          handleMessage(msg.getId())
          //switch msg to the next message to display
          currMessage++
          msg.makeEmpty()
          if (msg.nextMsgId != -1) {
            setTimeout(() => { msg = messages[currMessage] }, 150)
          } else {
            helper.setIdle()
          }
        }
    }

    mousePressedAudioControls()

    mousePressedRhythmicWheel()
  }

  /*
  mouseDragged() : p5js function that gets called every time a mouse button
  is pressed / the touchscreen is touched and dragged.
   */
  p5c.mouseDragged = function () {
    mouseDraggedRhythmicWheel()
  }

  /*
  mouseReleased() : p5js function that gets called every time mouse button
  is released.
   */
  p5c.mouseReleased = function() {
    mouseReleasedRhythmicWheel()
  }
  /*
  handleFile: handles the file that the user has uploaded
  Needed to actually load the file, extract data from it and update mode 
  */
  handleFile = function (file) {
    let sf = new p5.File(file)
    //TODO: implement proper audio file loading
    soundFile = p5c.loadSound(file, () => {
      //if you need to test the file is loaded, uncomment this line
      //soundFile.play()
      //setTimeout(() => {
      if (soundFile.duration() > maxDuration) {
        cutAudio()
      } else {
        leftChannel = soundFile.buffer.getChannelData(0).slice()
      }
      //}, 3000);
    })
    if(mode != 2){
    //now remove all useless buttons
    removeUselessButtons()
    setTimeout(() => {
      mode = 1 //user chose their file
      //show some intro messages and then move to mode 2
      console.log("FILE MODE")
      loadMessages("upload")
      started = true;
    }, 1000);
  }

  }

  cutAudio = function(){
    const ctx = p5c.getAudioContext()
    let x = soundFile.buffer.getChannelData(0);
    let y = null
    if (soundFile.buffer.getChannelData(1) != null)
      y = soundFile.buffer.getChannelData(1);
    let rate = soundFile.buffer.sampleRate;
    //cut the buffer after 10 seconds
    x = x.slice(0, rate * maxDuration);
    if (y != null)
      y = y.slice(0, rate * maxDuration);
    const buff = ctx.createBuffer(1 + (y != null), x.length, rate)
    const nowBuffering = buff.getChannelData(0);
    for (let i = 0; i < buff.length; i++) {
      nowBuffering[i] = x[i];
    }
    if (y != null) {
      const nowBuffering2 = buff.getChannelData(1);
      for (let i = 0; i < buff.length; i++) {
        nowBuffering2[i] = y[i];
      }
    }
    console.log(buff)
    console.log(buff.getChannelData(0))
    soundFile.buffer = buff
    leftChannel = soundFile.buffer.getChannelData(0).slice()
  }
  

  /*
  loadMessages: loads the messages from the json file
  --Inputs--
  messages_key: the key (in the json) of the message array to load (see json file)
                each message array is a list of messages that the user will see
                in a particular mode/moment
  */

  loadMessages = function (messages_key) {
    let n = Object.keys(messages_json[messages_key]).length
    messages = new Array(n)
    for (let i = 0; i < n; i++) {
      let msg = messages_json[messages_key][i]
      messages[i] = new Message(msg.msg, msg.msgId, msg.nextMsgId)
    }
    msg = messages[0]
    //reset message counter
    currMessage = 0;
    loading = false
  }

  /*
  getMessageById: returns the index of the message with the given id in the loaded messages array
  --Inputs--
  id: the id of the message to find
  --Outputs--
  i: index of the message with the given id in the loaded messages array
  */
  getMessageById = function (id) {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].id == id) {
        return i
      }
    }
    //if no matching message was found
    return -1
  }

  /*
  removeUselessButtons: removes the buttons after the user made their choice in the menu
  TODO: could be used for more buttons
  */
  removeUselessButtons = function () {
    realUploadButton.remove()
    //visibleUploadButton.hide()
    visibleUploadButton.remove()
    faqMenuButton.remove()
    recordSideButton.remove()
  }

  /* 
  keyPressed(): p5js function that gets called every time a key is pressed.
  Use key to get the specific key.
  */
  var currMessage = 0
  p5c.keyPressed = function () {
    let key = p5c.key;
    let keyCode = p5c.keyCode; //needed for special keys

    //if the user presses 'z' or 'Z' and the game is not paused
    //then he wants to skip to the next message
    if (key == 'z' || key == 'Z') {
      //if (!paused) {
      //if the game is not paused, 
      //check if the helper is waiting (isWaiting == true); if so,
      //play the 'speech_end' sound and set isWaiting to false
      if (helper.isWaiting()) {
        speech_end.play();
        handleMessage(msg.getId())
        //switch msg to the next message to display
        currMessage++
        msg.makeEmpty()
        if (msg.nextMsgId != -1) {
          setTimeout(() => { msg = messages[currMessage] }, 150)
        } else {
          helper.setIdle()
        }
      }
      //}

      //TODO: handle this in a better way.
      //There is no way for now to insert a non skippable pause between messages
    }

    //DEBUG: skip directly to mode 2
    if (key == 'm' || key == 'M') {
      //skip directly to mode 2
      removeUselessButtons()

      if (!started) {
        //mode = 2;
        p5c.userStartAudio();
        Tone.start();
        loadMessages("common")
        //started = true;
        soundFile = debug_soundfile
        //TODO: find a better implementation of this; unfortunately we can't do better for now
        //Making this actually load is a pain in the ass, so I'll take this for now.
        //If we try to load the right channel for some unexplained reason this breaks and doesn't load anything
        //I think it's because the data isn't available yet when we look for it
        setTimeout(() => {
          //careful that if you play a soundFile you empty its buffer => leftChannel becomes an empty array
          //We add slice() to effectively clone the array
          if (soundFile.duration() > maxDuration){
            cutAudio()
          }else{
            leftChannel = soundFile.buffer.getChannelData(0).slice()
          }
        }, 100);
        setTimeout(() => {
          mode = 2;
          requestMicrophoneAccess();

          //createAudioControls();
          started = true
        }, 200);
      }
    }

    //spacebar: let user control the audio playback in a more convenient way
    if (keyCode == 32) {
      if (mode == 2)
        if (!soundFile.isPlaying()) {
          soundFile.play()
        } else {
          soundFile.stop()
        }
    }

  }

  var micCheck; //needed to check if the user gave us permission to access the microphone
  /*
  handleMessage: for special messages, we need to handle them differently. This is the function we use
  */
  handleMessage = function (id) {
    switch (id) {
      //recordIntro3: last message before asking the user for permission to access the microphone
      case "recordIntro3":
        requestMicrophoneAccess();
        break;
      case "record2":
        //can begin common mode
        mode = 2;
        leftChannel = null;
        //createAudioControls();
        loadMessages("common")
        break;
      case "upload3":
        //can begin common mode
        mode = 2;
        //createAudioControls();
        loadMessages("common")
        break;
      case "commonFound":
        //show the multiple-choice dialogue box
        let answ1 = first_polyrhythm[0] +" vs " + first_polyrhythm[1]
        let answ2 = second_polyrhythm[0] +" vs " + second_polyrhythm[1]
        //if one of the two polyrhythms is a simple rhythm, show it but say specify that it's a simple rhythm
        if (first_polyrhythm[0] == 1 && first_polyrhythm[1] == 1){
          answ1 = answ1 + " (*)"
        }
        //do the same for second_polyrhythm
        if (second_polyrhythm[0] == 1 && second_polyrhythm[1] == 1){
          answ2 = answ2 + " (*)"
        }

        
        let answ3 = "Neither..."
        helper.addAnswers([answ1,answ2,answ3])
        //TODO: these don't get deleted when the window is resized, the should be created and deleted only once
        //when needed. Fix this ASAP
        //TODO: these don't get deleted when the window is resized, the should be created and deleted only once
        //when needed. Fix this ASAP
        answer1 = p5c.createDiv("")
        answer1.position(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 50)
        answer1.addClass('answer')
        answer1.mousePressed(function () {
          Tone.Transport.clear(tone1)
          Tone.Transport.clear(tone2)
          selectedAnswer = 0
          helper.removeAnswers()
          userAnswered(selectedAnswer, "poly")
          
        })
        answer1.mouseOver(function () {
          hovered[0] = 1
          startLoop(first_polyrhythm[0], 0)
          startLoop(first_polyrhythm[1], 1)
        })
        answer1.mouseOut(function () {
          hovered[0] = 0
          //Tone.Transport.cancel()
          Tone.Transport.clear(tone1)
          Tone.Transport.clear(tone2)
        })
        answer2 = p5c.createDiv("")
        answer2.position(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 100)
        answer2.addClass('answer')
        answer2.mousePressed(function () {
          Tone.Transport.clear(tone1)
          Tone.Transport.clear(tone2)
          selectedAnswer = 1
          helper.removeAnswers()
          userAnswered(selectedAnswer, "poly")
          
        })
        answer2.mouseOver(function () {
          hovered[1] = 1
          if(second_polyrhythm!=null && second_polyrhythm.length!=NaN){
            startLoop(second_polyrhythm[0], 0)
            startLoop(second_polyrhythm[1], 1)
          }
        })
        answer2.mouseOut(function () {
          hovered[1] = 0
          Tone.Transport.clear(tone1)
          Tone.Transport.clear(tone2)
        })
        answer3 = p5c.createDiv("")
        answer3.position(3 * p5c.width / 4 - p5c.width / 16, p5c.height / 2 + 150)
        answer3.addClass('answer')
        answer3.mousePressed(function () {
          Tone.Transport.clear(tone1)
          Tone.Transport.clear(tone2)
          selectedAnswer = 2
          helper.removeAnswers()
          userAnswered(selectedAnswer, "poly")
          
        })
        answer3.mouseOver(function () {
          hovered[2] = 1
        })
        answer3.mouseOut(function () {
          hovered[2] = 0
        })
        break;

      case "commonPolyChose":
        //RTMWHEEL
        //TODO: YOU CAN NOW CREATE AND START SHOWING THE RHYTHM WHEEL EACH TIME YOU CALL DRAW
        break;
    }
  }

  requestMicrophoneAccess = function () {
    //ask user permission to access the microphone
    mic.start(obtainedMicPerm, errorMicPerm)
    //check periodically if the user gave us permission to access the microphone
    micCheck = setInterval(() => {
      mic.start(obtainedMicPerm)
    }, 1000)
  }

  mousePressedAudioControls = function () {
    //find which audio control was clicked (using mouseX and mouseY) and call clickAudioControl
    //with the corresponding id (0: analyse, 1: play, 2: stop, 3: record, 4: upload)

    //first of all if the user didn't click inside the audio controls rectangle, return
    //p5c.width/8 - p5c.width/44, p5c.height / 4, p5c.width / 22, p5c.height / 3
    if (p5c.mouseX < p5c.width / 8 - p5c.width / 22 || p5c.mouseX > p5c.width / 8 ) {
      return
    }
    if(p5c.mouseY < p5c.height / 4 - p5c.height/6 || p5c.mouseY > p5c.height / 4 + p5c.height / 6){
      return
    }
    
    //find out which button was pressed and call clickAudioControl with the corresponding id
    let rectHeight = p5c.height / 3
    let rectWidth = p5c.width / 22
    let rectX = p5c.width / 8 - p5c.width / 44
    let rectY = p5c.height / 4
    let rectStep = rectHeight / 5

    if (p5c.mouseY >= rectY - 2 * rectStep - rectStep / 2 && p5c.mouseY < rectY - 2 * rectStep + rectStep / 2) {
      clickAudioControl(0)
    } else if (p5c.mouseY >= rectY - rectStep - rectStep / 2 && p5c.mouseY < rectY - rectStep + rectStep / 2) {
      clickAudioControl(1)
    } else if (p5c.mouseY >= rectY - rectStep / 2 && p5c.mouseY < rectY + rectStep / 2) {
      clickAudioControl(2)
    } else if (p5c.mouseY >= rectY + rectStep - rectStep / 2 && p5c.mouseY < rectY + rectStep + rectStep / 2) {
      clickAudioControl(3)
    } else if (p5c.mouseY >= rectY + 2 * rectStep - rectStep / 2 && p5c.mouseY < rectY + 2 * rectStep + rectStep / 2) {
      clickAudioControl(4)
    }

  }
  /*
  createAudioControls: used to create the audio controls when passing to common mode
  */
  var waveRefreshInterval;
  clickAudioControl = function(id){
    //id:
    //0: analyse
    //1: play
    //2: stop
    //3: record
    //4: upload
    realUploadButton = p5c.createFileInput(handleFile)
    //hide realUploadButton and give it the realUpload ID
    realUploadButton.hide()
    realUploadButton.id('realUpload')

    uploadButton = document.getElementById('realUpload')
    switch (id) {
      case 0:
        if (recording) {
          recorder.stop();
          recording = false;
          recordingWaveDrawer(waveRefreshInterval, recording);
        }
        if (soundFile != null) {
          soundFile.stop()
        }
        if (leftChannel != null && isAnalysing == false) {
          //if we have a soundFile, we can analyse it
          if(timeoutID!=null){
            clearTimeout(timeoutID)
            timeoutID = null
          }
          analyseSoundFile()
        }
        break;
      case 1:
        if (recording) {
          recorder.stop();
          recording = false;
          recordingWaveDrawer(waveRefreshInterval, recording);
        }
        if (!soundFile != null) {
          if (!soundFile.isPlaying()) {
            soundFile.play()
          } else {
            soundFile.pause()
          }
        }
        break;
      case 2:
        if (recording) {
          recorder.stop();
          recording = false;
          recordingWaveDrawer(waveRefreshInterval, recording);
        }
        if (soundFile != null) {
          soundFile.stop()
        }
        break;
      case 3:
        if (!recording && !isAnalysing) {
          soundFile = new p5.SoundFile();
          //soundFile.buffer = 0;
          recorder.record(soundFile);
          recording = true;
          recordingWaveDrawer(waveRefreshInterval, recording);
        } else {
          recorder.stop();
          recording = false;
          recordingWaveDrawer(waveRefreshInterval, recording);
        }
        break;
      case 4:
        if (recording) {
          recorder.stop();
          recording = false;
          recordingWaveDrawer(waveRefreshInterval, recording);
        }
        if (soundFile != null) {
          soundFile.stop()
        }
        if (isAnalysing == false) {
          uploadButton.click()
        }
        break;
    }
    uploadButton.remove()
    realUploadButton.remove()
  }
  //original implementation using CSS-defined buttons (not porting well to different resolutions)
  /*
  createAudioControls = function () {
    recordButton = p5c.createDiv('')
    recordButton.addClass('record_button')
    recordButton.mousePressed(function () {
      if(!recording && !isAnalysing){
        soundFile = new p5.SoundFile();
        //soundFile.buffer = 0;
        recorder.record(soundFile);
        recording = true;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }else{
        recorder.stop();
        recording = false;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }
    })
    playButton = p5c.createDiv('')
    playButton.addClass('play_button')
    playButton.mousePressed(function () {
      if(recording){
        recorder.stop();
        recording = false;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }
      if(!soundFile!=null){
        if (!soundFile.isPlaying()) {
          soundFile.play()
        } else {
          soundFile.pause()
        }
      }
    })
    stopButton = p5c.createDiv("")
    stopButton.addClass('stop_button')
    stopButton.mousePressed(function () {
      if (recording) {
        recorder.stop();
        recording = false;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }
      if(soundFile!=null){
        soundFile.stop()
      }
    })

    realUploadButton = p5c.createFileInput(handleFile)
    //hide realUploadButton and give it the realUpload ID
    realUploadButton.hide()
    realUploadButton.id('realUpload')

    uploadButton = document.getElementById('realUpload')
    uploadButton_ingame = p5c.createDiv("")
    uploadButton_ingame.addClass('upload_button_ingame')
    uploadButton_ingame.mousePressed(function () {
      console.log("uploaddd")
      if (recording) {
        recorder.stop();
        recording = false;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }
      if (soundFile != null) {
        soundFile.stop()
      }
      if(isAnalysing == false){
        uploadButton.click()
      }
    })
    //check if the web worker is supported by the browser
    if(workerSupported == true){
    analyseButton = p5c.createDiv("OK")
    //TODO: when this is clicked the user should be blocked from uploading / recording a new sound
    analyseButton.addClass('analyse_button')
    analyseButton.mousePressed(function () {
      if (recording) {
        recorder.stop();
        recording = false;
        recordingWaveDrawer(waveRefreshInterval, recording);
      }
      if (soundFile != null) {
        soundFile.stop()
      }
      if (leftChannel != null && isAnalysing == false) {
        //if we have a soundFile, we can analyse it
        analyseSoundFile()
      }
    })
    }
  }
  */

  recordingWaveDrawer = function (waveRefreshInterval, recording){
    //for some reason the whole thing doesn't work at the end unless we do this bad shit
    if(recording){
      /*
      waveRefreshInterval = setInterval(() => {
        leftChannel = soundFile.buffer.getChannelData(0).slice();
      }, 300)
      */
    }else{
      //clearInterval(waveRefreshInterval);
      //leftChannel = soundFile.buffer.getChannelData(0).slice();
      setTimeout( ()=>{
      if (soundFile.duration() > maxDuration) {
        cutAudio()
      } else {
        leftChannel = soundFile.buffer.getChannelData(0).slice()
      }
     },100);
    }
  };

  //--------------------MICROPHONE PERMISSIONS--------------------

  /*
  errorMicPerm: if the user doesn't give us permission to access the microphone, we need to tell them how to fix it
  */
  errorMicPerm = function () {
    setTimeout(() => {
      if (!userGaveMicPerm)
        msg.setMsg(`You haven't given us permission to access the microphone.
                        Don't worry this can be fixed :)`)
    }, 200) //needed in order not to bug the system out if the mic is already blocked

    setTimeout(() => {
      if (!userGaveMicPerm)
        msg.setMsg(`Refresh the page or click on the microphone icon in the address bar.
                          You should then get a new prompt!`)
    }, 6000)
  }

  /*
  obtainedMicPerm: if the user gives us permission to access the microphone, confirm everything's ok
  */
  obtainedMicPerm = function () {
    //if micCheck is not null, it means that we were checking for permission
    //Clear micCheck

    if (micCheck != null) {
      clearInterval(micCheck)
    }
    userGaveMicPerm = true
    msg = messages[currMessage]
    helper.setWorking()
  }

  //--------------------METRONOME--------------------
  /*
  startMetronome(): starts a metronome for reference. Calls metroSound()
  to make sound*/
  var metroFlag = 0;
  startLoop = function (n, i) {
    if(i == 0)
      tone1 = Tone.Transport.scheduleRepeat(time => {
      loopSound(i)
    }, n+"n");
    else{
      tone2 = Tone.Transport.scheduleRepeat(time => {
        loopSound(i)
      }, n + "n");
    }
    Tone.Transport.start();
  }

  var loopSound_0
  var loopSound_1
  /*
  metroSound(): produces the correct metronome sound based on the beat
  */
  loopSound = function (i) {
    if(i == 0)
      loopSound_0.play();
    else{
      loopSound_1.play()
    }
  }

  //--------------------END OF METRONOME--------------------


  //--------------------WORKER STUFF--------------------
  var isAnalysing = false
  analyseSoundFile = function () {
    //worker stuff
    //INPUT: x - audio buffer (passed using postMessage)
    //RETURNS: return [BPM_estimated, secondary_bpm, third_bpm, polyrhythm[0], polyrhythm[1], 
    //                 polyrhythm_second_ML[0], polyrhythm_second_ML[1]]
    isAnalysing = true
    helper.stopText(true)
    msg = new Message("", -1, -1)
    helper.removeAnswers()
    
    let audioToWorker;
    setTimeout(() => {
      audioToWorker = soundFile.buffer.getChannelData(0).slice();
      console.log("WORKER SETUP: AUDIO DATA COPIED")
      console.log("Passing the audio data to the worker!")
    }, 1000)

    setTimeout(() => {
      console.log(soundFile.buffer.sampleRate)
      worker.postMessage([audioToWorker, soundFile.buffer.sampleRate])
    }, 2000);
    worker.onmessage = (event) => {
      console.log("Main: received the result!")
      //print the estimated BPM
      BPM_estimated = event.data[0]
      second_bpm_estimated = event.data[1]
      third_bpm_estimated = event.data[2]
      first_polyrhythm = new Array(event.data[3], event.data[4])
      second_polyrhythm = new Array(event.data[5], event.data[6])

      let ind;
      if (first_polyrhythm != null && first_polyrhythm != NaN) {
        loadMessages("common")
        ind = getMessageById("commonFound")
        if (ind == -1) {
          ind = getMessageById("commonFound")
        }
      } else {
        ind = getMessageById("commonNotFound")
        if (ind == -1) {
          ind = getMessageById("commonNotFound")
        }
      }
      helper.setWorking()
      currMessage = ind
      msg = messages[currMessage]
      isAnalysing = false
    }
  }

  //--------------------END OF WORKER STUFF--------------------


  //--------------------RHYTHM WHEEL STUFF--------------------
  var rhythmWheelExists = true
  var showRhythmWheel = false
  var hasSuggested = false
  /*
  createRhythmWheel: creates the rhythm wheel or updates it if it already exists
  Inputs:
  -rhy_1: the first rhythm (on the outer circle)
  -rhy_2: the second rhythm (on the inner circle)
  */
  createRhythmWheel = function (rhy_1, rhy_2) {
    if (rhythmWheelExists) {
      //update the rhythm wheel
      //rhythmWheel.updateRhythms(rhy_1, rhy_2)
      rhythmOuter = rhy_1
      rhythmInner = rhy_2
      wheelBPM = second_bpm_estimated
      slideInner = 0
      slideOuter = 0
      if (!hasSuggested){
        suggestTrainingMode()
      }
    } else {
      //create the rhythm wheel
      //rhythmWheel = new RhythmWheel(rhy_1, rhy_2)
      rhythmWheelExists = true
    }
  }

  var timeoutID = null;
  suggestTrainingMode = function () {
    console.log("Suggesting")
    timeoutID = setTimeout(() => {
    let ind = getMessageById("commonSuggestTraining")
    if (ind == -1) {
      loadMessages("common")
      ind = getMessageById("commonSuggestTraining")
    }
    helper.removeAnswers()
    helper.setWorking()
    currMessage = ind
    msg = messages[currMessage]
    hasSuggested = true
    timeoutID = null
    },10000)
  }

  var selectedPolyrhythm = -1; 
  userAnswered = function(answer, question){
    if(question=="poly"){
      let ind
      if(answer == 0){
        selectedPolyrhythm = first_polyrhythm
        ind = getMessageById("commonPolyChose")
        if (ind == -1) {
          loadMessages("common")
          ind = getMessageById("commonPolyChose")
        }
      }else if (answer == 1){
        selectedPolyrhythm = second_polyrhythm
        ind = getMessageById("commonPolyChose")
        if (ind == -1) {
          loadMessages("common")
          ind = getMessageById("commonPolyChose")
        }
      }else{
        ind = getMessageById("commonPolyChoseNeither")
        if (ind == -1) {
          loadMessages("common")
          ind = getMessageById("commonPolyChoseNeither")
        }
      }
      helper.removeAnswers()
      helper.setWorking()
      currMessage = ind
      msg = messages[currMessage]
      if(answer!=2){
        createRhythmWheel(selectedPolyrhythm[0],selectedPolyrhythm[1])
        showRhythmWheel = true
        setWheelShown(showRhythmWheel)
      }
    }
  }


})//end of sketch
//--------------------END OF P5 SKETCH--------------------

// myp5 = new p5(p5_instance)
var tone1
var tone2

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
