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
/*
Tone.Transport.bpm.value = 80;
// start/stop the oscillator every quarter note
Tone.Transport.scheduleRepeat(time => {
  osc.start(time).stop(time + 0.1);
}, "4n");
Tone.Transport.start();
*/

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

//use p5 in instance mode
p5_instance = function (p5c) {
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
      this.time = 20 //time between each character

      //we have reached the end of the phrase
      this.wait = false  //true if we're waiting for the user to press a key
      this.interval = null //the interval that will be used to play a "speech" sound
      this.cursorBlink = false //used to manage the blinking cursor
      this.isIdle = false //is the helper idle? (not saying anything - no new messages)
      this.state = "working" //the state of the helper (working, idle, etc)
    }

    /*
    showFace: displays the face of the helper
    */
    showFace() {
      if (!started)
        p5c.image(this.faces[this.currFace], p5c.width - 400, p5c.height - 400)
      else {
        p5c.image(this.faces[this.currFace], p5c.width / 14, 2 * p5c.height / 4)
      }
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
      p5c.rect(p5c.width / 2, p5c.height - 150, p5c.width / 2, 200)
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
          p5c.rect(3 / 4 * p5c.width - 25, p5c.height - 75, 15, 15)
        }
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
      p5c.rect(p5c.width / 4, p5c.height - 300, p5c.width / 6, 50)
      p5c.fill(0)
      p5c.textSize(32)
      p5c.textAlign(p5c.LEFT)
      p5c.text(this.name, p5c.width / 4 + 10, p5c.height - 300 + 20)
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
          if (this.counter > msg.length) {
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
      p5c.text(msg.substring(0, to),
        1 * p5c.width / 4 + 10, p5c.height - 250, p5c.width / 2 - 20, 200)
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
    speech = p5c.loadSound('assets/dialogue.wav') //sound for the dialogue
    speech_end = p5c.loadSound('assets/dialogue_end.wav') //sound that plays when user clicks to pass to next message
    messages_json = p5c.loadJSON('assets/messages.json', jsonLoaded) //json file containing the Messages

    debug_soundfile = p5c.loadSound('assets/song2_lq.mp3') //debug soundfile

    bg = p5c.loadImage('assets/bg.jpg') //background image
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
      z: pass to the helper's next message<br>
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
  draw(): p5js function that gets automatically called once per frame
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
    if (recording) {
      p5c.fill(255, 0, 0)
      p5c.noStroke()
      p5c.ellipse(p5c.width / 2 + 3 * p5c.width / 8 - 15, p5c.height / 4 - p5c.height / 6 + 15, 20, 20)
    }
    if (leftChannel != null) {
      //draw the waveform
      p5c.stroke(255)
      p5c.strokeWeight(2)
      p5c.noFill()
      let resolution = p5c.int(p5c.max(1, p5c.round(leftChannel.length / (3 * p5c.width / 4))));
      let x = p5c.width / 2 - 3 * p5c.width / 8;
      let sum = 0;
      let maxAmp; //maximum amplitude
      for (let i = 0; i < leftChannel.length; i++) {
        if (maxAmp === undefined || p5c.abs(leftChannel[i]) > maxAmp) {
          maxAmp = leftChannel[i];
        }
      }
      //maxAmp = maxAmp / 2;

      p5c.beginShape()
      for (let i = 0; i < leftChannel.length; i++) {
        // Compute an average for each set of values
        sum += p5c.abs(leftChannel[i]);
        if (i % resolution == 0) {
          p5c.vertex(
            x++,
            // map the average amplitude to range from the center of the canvas to
            // either the top or bottom depending on the channel
            p5c.map(sum / resolution, 0, maxAmp, p5c.height / 4 + p5c.height / 6, p5c.height / 4 - p5c.height / 6)
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
    p5c.textSize(20);
    p5c.text("your helper", p5c.width - 450, p5c.height - 200 + 50);
    p5c.stroke(255)
    p5c.noFill()
    p5c.bezier(
      p5c.width - 550, p5c.height - 70,
      p5c.width - 550, p5c.height - 200,
      p5c.width - 450, p5c.height - 250,
      p5c.width - 400, p5c.height - 250
    )
    //we will show the face of the helper here using other functions
    p5c.line(p5c.width - 400, p5c.height - 250, p5c.width - 425, p5c.height - 200)
    p5c.line(p5c.width - 400, p5c.height - 250, p5c.width - 425, p5c.height - 275)

    //write "POLYRHYTHM HERO" in the upper middle part of the screen.
    //Write it using p5.js functions in a geometric pattern, making it stick out
    //from the background

    p5c.textSize(150);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("POLYRHYTHM HERO", p5c.width / 2, p5c.height / 6);

    //write the authors right below the title
    p5c.textSize(32);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("by Francesco Colotti, Matteo Gionfriddo, Cecilia Raho and Alice Sironi", p5c.width / 2, p5c.height / 6 + 100);
  }

  /* 
  windowResized(): p5js function that gets called every time the window
  gets resized; recalculate here all the variables that contain coordinates 
  in their formulas
  */
  p5c.windowResized = function () {
    //p5c.removeElements();
    p5c.resizeCanvas(p5c.windowWidth, p5c.windowHeight);
  }
  /* 
  mousePressed(): p5js function that gets called every time a mouse button
  is pressed / the touchscreen is touched.
  We start the AudioContext here with userStartAudio()
  */
  p5c.mousePressed = function () {

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
      leftChannel = soundFile.buffer.getChannelData(0).slice()
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
          leftChannel = soundFile.buffer.getChannelData(0).slice()
        }, 100);
        setTimeout(() => {
          mode = 2;
          requestMicrophoneAccess();

          createAudioControls();
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
          soundFile.pause()
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
        createAudioControls();
        loadMessages("common")
        break;
      case "upload3":
        //can begin common mode
        mode = 2;
        createAudioControls();
        loadMessages("common")
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

  /*
  createAudioControls: used to create the audio controls when passing to common mode
  TODO: add an upload button
  TODO: add a volume slider
  */
  var waveRefreshInterval;

  createAudioControls = function () {
    recordButton = p5c.createDiv('')
    recordButton.addClass('record_button')
    recordButton.mousePressed(function () {
      if(!recording){
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
      uploadButton.click()
    })

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
      if (leftChannel != null) {
        //if we have a soundFile, we can analyse it
        analyseSoundFile()
      }
    })
  }

  recordingWaveDrawer = function (waveRefreshInterval, recording){
    //for some reason the whole thing doesn't work at the end unless we do this bad shit
    if(recording){
      waveRefreshInterval = setInterval(() => {
        leftChannel = soundFile.buffer.getChannelData(0).slice();
      }, 300)
      
    }else{
      clearInterval(waveRefreshInterval);
      leftChannel = soundFile.buffer.getChannelData(0).slice();
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
  startMetronome = function () {
    Tone.Transport.scheduleRepeat(time => {
      metroSound()
    }, "4n");
  }

  /*
  metroSound(): produces the correct metronome sound based on the beat
  */
  metroSound = function () {
    met2.play();
    //no point using different sounds, we just need to give the user a reference
  }

  //--------------------END OF METRONOME--------------------


  //--------------------WORKER STUFF--------------------
  analyseSoundFile = function () {
    //worker stuff
    //INPUT: x - audio buffer (passed using postMessage)
    //RETURNS: return [BPM_estimated, secondary_bpm, third_bpm, polyrhythm[0], polyrhythm[1], 
    //                 polyrhythm_second_ML[0], polyrhythm_second_ML[1]]

    let audioToWorker;
    setTimeout(() => {
      audioToWorker = soundFile.buffer.getChannelData(0).slice();
      console.log("WORKER SETUP: AUDIO DATA COPIED")
      console.log("Passing the audio data to the worker!")
    }, 1000)

    setTimeout(() => {
      worker.postMessage(audioToWorker)
    }, 2000);
    worker.onmessage = (event) => {
      console.log("Main: received the result!")
      //print the estimated BPM
      BPM_estimated = event.data[0]
      second_bpm_estimated = event.data[1]
      third_bpm_estimated = event.data[2]
      first_polyrhythm = new Array(event.data[3], event.data[4])
      second_polyrhythm = new Array(event.data[5], event.data[6])
    }
  }

  //--------------------END OF WORKER STUFF--------------------


}//end of sketch
//--------------------END OF P5 SKETCH--------------------

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
