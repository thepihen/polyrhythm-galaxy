//p5.js sketch file (with p5 in instance mode we can rename this file)
//https://p5js.org/reference/
//https://p5js.org/reference/#/libraries/p5.sound

/*
TODO:
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
// ramp the bpm to 120 over 10 seconds
Tone.Transport.bpm.rampTo(120, 10);
*/

//needed until we find a better way to track document focus changes
//(see bottom of this file)
//this just tracks the state
var pageFoc = true;
var bpm = 100

//recording: booelan indicating if we're recording or not
var recordedAudio;
var recording = false;

//MENU BUTTONS
//used to create an upload button
var visibleUploadButton;
//the real upload button, hidden in the back :)
var realUploadButton;
var uploadButton;

var recordSideButton;

//various other self-explanatory buttons
var faqMenuButton; //onclick:show instructions

//buttons to control the audio playback
var playButton;
var stopButton;
var stopButton;
var recordButton;


var soundFile; //the file we'll load
var leftChannel,rightChannel;
//use p5 in instance mode
p5_instance = function (p5c) {
  class Message{
    //this represent a message that the helper will say
    constructor(msg, id, nextMsgId){
      if (msg != null && msg != undefined){
        this.msg = msg
      }else{
        this.msg = ""
      }
      if (id != null && id != undefined) {
        this.id = id
      } else {
        this.id= ""
      }
      if (nextMsgId != null && nextMsgId != undefined) {
        this.nextMsgId = nextMsgId
      } else {
        this.nextMsgId = -1
      }
      //this.prevMsgId = -1
    }
    makeEmpty(){
      this.msg = ""
    }
    setId(id){
      this.id = id
    }
    getId(){
      return this.id
    }
    getMsg(){
      return this.msg
    }
    setMsg(msg){
      this.msg = msg
    }
    setNextMsgId(nextMsgId){
      this.nextMsgId = nextMsgId
    }
    //this is useless, could be used to check for errors
    setPrevMsgId(prevMsgId){
      this.prevMsgId = prevMsgId
    }
  }


  class Helper{
    constructor(faces,name){
      this.name = name
      //the parameters are the faces of the helper
      this.faces = faces
      //for now we'll not distinguish by emotion
      this.currFace = 0
      //count the frames you showed the last function for
      this.showedFor = 0
      this.lastMsg = " "
      this.counter = 0
      this.time = 20
      //we have reached the end of the phrase
      this.wait = false
      this.interval = null
      this.cursorBlink = false
      this.isIdle = false
      this.state = "working"
    }
    showFace(){
      //show the face
      if(!started)
        p5c.image(this.faces[this.currFace], p5c.width-400, p5c.height-400)
      else{
        p5c.image(this.faces[this.currFace], p5c.width/14, 2*p5c.height/4)
      }
      this.showedFor++
      if(this.showedFor == 5){
        this.currFace++
        this.currFace = this.currFace%this.faces.length
        this.showedFor = 0
      }
    }

    createTextBox(){
      //create a text box
      //use rectMode(CENTER) and draw the rect in the middle of the screen, on the bottom
      //the rect should be about width/2 long
      //the text should be in the middle of the rect
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
      if(this.wait && !this.isIdle){
        if(p5c.frameCount%30 == 0){
          this.cursorBlink = !this.cursorBlink
        }
        if(!this.cursorBlink){
         //draw a small white square on the bottom right of the text box
          p5c.rect(3/4 * p5c.width - 25, p5c.height-75, 15, 15) 
        }
      }
    }
    addAuthor(){
      //add the speaker's name on the top left corner of the text box.
      //The name is inside a rectangle with a white background

      //TODO: this part is a meme, you decide if we keep it or not
      p5c.push()
      p5c.fill(255)
      p5c.rect(p5c.width/4, p5c.height-300, p5c.width/6, 50)
      p5c.fill(0)
      p5c.textSize(32)
      p5c.textAlign(p5c.LEFT)
      p5c.text(this.name, p5c.width/4+10, p5c.height-300+20)
      p5c.pop()
      
    }
    say(message){
      //need to get the message from the message object
      let msg = message.getMsg()
      let time = this.time
      this.createTextBox()
      this.addAuthor()

      if(this.lastMsg != msg){
        this.lastMsg  = msg
        this.counter = 1
        //setTimeout(this.printMsg, this.counter*time, this.lastMsg, this.counter);
        this.printMsg(msg, this.counter)
        this.wait=false
        this.interval = setInterval( ()=>{
          this.counter++
          //play the sound corresponding to dialogue
          //(every once in a while)
          if(this.counter%5 == 0){
            speech.play()
          }
          if(this.counter > msg.length){
            this.wait = true
          }
        },time);
      }else{
        if(this.counter >= msg.length){
          clearInterval(this.interval)
          this.printMsg(msg, msg.length)
          this.wait = true
          return
        }
        //setTimeout(this.printMsg, this.counter * time, this.lastMsg, this.counter);
        this.printMsg(msg, this.counter)
      }
      //write the message inside the box (rect)
      //p5c.text(msg, 1*p5c.width/4 + 10, p5c.height-250, p5c.width/2-20, 200)
      //write the message inside the box one letter at a time
      //this is to simulate a typing effect
      //we'll use a counter to keep track of how many letters we've written
      //we'll use a timer to keep track of how much time has passed
    }
    /*
    updateCounter(time,msg, intervalHandle,cnt){
      cnt++
      if(cnt) > msg.length){
        clearInterval(this.interval)
        this.wait = false
        return
      }
    }
    */
    printMsg(msg,to){
      p5c.stroke(255)
      p5c.text(msg.substring(0, to), 
      1 * p5c.width / 4 + 10, p5c.height - 250, p5c.width / 2 - 20, 200)
    }
    isWaiting(){
      return this.wait && !this.isIdle
    }
    setIdle(){
      this.isIdle = true
      this.state = "idle"
    }
    setWorking(){
      this.isIdle = false
      this.state = "working"
    }
    getState(){
      return this.state
    }
  }
  //frameRate (need this to use it outside of )
  var frate;
  let loading = true
  var started = false;
  var userGaveMicPerm = false;
  /*
  preload: function that gets automatically by p5js before loading the sketch.
  ->Everything that needs to be available when the sketch starts needs to be loaded here
  (e.g. fonts, sounds,...)
  */
  p5c.preload = function () {
    //soundFormats('wav');
    hit = p5c.loadSound('assets/hit.wav');
    miss = p5c.loadSound('assets/miss.wav')
    met1 = p5c.loadSound('assets/met1.wav');
    met2 = p5c.loadSound('assets/met2.wav'); 
    font = p5c.loadFont('assets/Gruppo-Regular.ttf');
    speech_font = p5c.loadFont('assets/Montserrat-Light.ttf')
    face = p5c.loadImage('assets/face.png')
    face_talking1 = p5c.loadImage('assets/face_talking1.png');
    face_talking2 = p5c.loadImage('assets/face_talking2.png');
    speech = p5c.loadSound('assets/dialogue.wav')
    speech_end = p5c.loadSound('assets/dialogue_end.wav')
    messages_json = p5c.loadJSON('assets/messages.json',jsonLoaded)

    debug_soundfile = p5c.loadSound('assets/song2.mp3')
  }
  jsonLoaded = function(){
    let n = Object.keys(messages_json["record"]).length
    messages = new Array(n)
    for(let i = 0; i < n; i++){
      let msg = messages_json["record"][i]
      messages[i] = new Message(msg.msg,msg.msgId,msg.nextMsgId)
    }
    loading = false
  }
  //we need these to record using p5.js
  var mic, recorder; //mic = our microphone, recorder is p5.soundRecorder
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
    //in a church hoping for a miracle

    setupAudioStuff()
    
    faces = [face]//, face2]
    helper = new Helper(faces, "Polyev")
    msg = messages[0]

    //setup everything regarding buttons
    setupButtons()
  }
  setupAudioStuff = function(){
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
  setupButtons = function(){
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
    recordSideButton.mousePressed(function(){
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

    

    faqMenuButton.mousePressed(function(){
      //TODO: type all FAQs, everything the user needs to know, inside a black box
      //Make it look nice and make it close when user clicks on it
      faqMenuButton.hide()
      //make a black box in the middle of the screen and type "aaa" inside of it
      let box = p5c.createDiv(`<h2>HOW THIS WORKS</h2>
      Welcome to the didactic mode of Polyrhythm Hero!<br>
      In this mode, you will learn how to play basic polyrhythms.<br>
      You can choose to record yourself playing some kind of rhythm (tapping your fingers on the table is also OK) 
      or upload an audio file from your pc.<br>
      For simplicity, all recordings will be cut to 30 seconds<br>
      The website will then analyze your audio and find the polyrhythm that's closest to what you played.<br>
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
      box.size(600,600)
      box.mousePressed(function(){
        box.remove()
        faqMenuButton.show()
      }
      )

    })
    visibleUploadButton.mousePressed(function(){
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
  var counter = 0; //not used now, might be used to count frames IN GAME

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
  drawCurrentMode = function(){
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
  
  drawInterface = function(){
    //draw audio controls
    drawAudioControls()

    //draw a basic rectangle that will contain the waveform of the recorded/uploaded audio
    //the rectangle needs to be 3/4 of the screen in width and 1/3 of the screen in height
    //the rectangle needs to be centered horizontally, and 1/4 of the screen from the top
    p5c.push()
    p5c.stroke(255)
    p5c.strokeWeight(2)
    p5c.noFill()
    p5c.rectMode(p5c.CENTER)
    p5c.rect(p5c.width/2, p5c.height/4, 3*p5c.width/4, p5c.height/3)
    //draw the waveform
    p5c.stroke(255)
    p5c.strokeWeight(2)
    p5c.noFill()
    let resolution = p5c.int(p5c.max(1, p5c.round(leftChannel.length / (3*p5c.width/4) )));
    let x = p5c.width/2 - 3*p5c.width/8;
    let sum = 0;
    let maxAmp; //maximum amplitude
    for (let i = 0; i < leftChannel.length; i++) {
      if (maxAmp === undefined || p5c.abs(leftChannel[i]) > maxAmp) {
        maxAmp = leftChannel[i];
      }
    }
    maxAmp = maxAmp/2;
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
    p5c.pop()


    p5c.push()
    //draw a light blue line that will represent the current position in soundFile playback
    p5c.stroke(0, 255, 255)
    p5c.strokeWeight(2)
    p5c.noFill()
    //save the player current X position
    let playerCurrX = p5c.map(soundFile.currentTime(),0, soundFile.duration(), p5c.width / 2 - 3 * p5c.width / 8, p5c.width / 2 + 3 * p5c.width / 8)
    p5c.line(playerCurrX, p5c.height/4 - p5c.height/6+1, playerCurrX, p5c.height/4 + p5c.height/6-1) //+1,-1 to avoid overlapping with the window

    p5c.pop()

    //This is very nice to see but quite useless since we're reading only a small sample in real time
    /*
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

  drawAudioControls = function(){
    //draw the audio controls
    p5c.push()

    p5c.pop()
  }

  drawMenu = function () {
    //we're in the menu
    p5c.textFont(font);
    //divide the screen in half;

    //fill the left side with a gradient from blu to purple
    //using lerpColor() by subdividing it into 50 parts
    p5c.noStroke()
    for (var i = 0; i < 100; i++) {
      p5c.fill(p5c.lerpColor(p5c.color(0, 0, 255), p5c.color(255, 0, 255), i / 100));
      p5c.rect(0, p5c.height / 100 * i, p5c.width / 2, p5c.height / 100);
    }
    //fill the right side with a gradient from red to purple
    //using lerpColor() by subdividing it into 50 parts
    for (var i = 0; i < 100; i++) {
      p5c.fill(p5c.lerpColor(p5c.color(255, 0, 0), p5c.color(255, 0, 255), i / 100));
      p5c.rect(p5c.width / 2, p5c.height / 100 * i, p5c.width / 2, p5c.height / 100);
    }

    p5c.stroke(255)
    p5c.line(p5c.width / 2, 0, p5c.width / 2, p5c.height)
    helper.showFace()
    //left side: write "Record some sounds" on the center of this side
    //right side: write "Upload a file" on the center of this side
    //write "OR" in the middle of the screen
    p5c.textSize(50);
    p5c.textAlign(p5c.CENTER, p5c.CENTER);
    p5c.fill(255);
    p5c.text("Record some sounds", p5c.width / 4, p5c.height / 2);
    p5c.text("Upload a file", p5c.width * 3 / 4, p5c.height / 2);
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

  handleFile = function (file) {
    let sf = new p5.File(file)
    //TODO: implement proper audio file loading
    soundFile = p5c.loadSound(file, ()=>{
      //if you need to test the file is loaded, uncomment this line
      //soundFile.play()
      setTimeout(() => {
        leftChannel = soundFile.buffer.getChannelData(0)
      }, 3000);
    })
    //now remove all useless buttons
    removeUselessButtons()
    setTimeout( ()=> { 
    mode = 1 //user chose their file
    //show some intro messages and then move to mode 2
    console.log("FILE MODE")
    loadMessages("upload")
    started = true;
    },5000);
  }
  
  //this function loads the messages from the json file
  //messages_key is the key of the message array to load (see json file)
  loadMessages = function(messages_key){
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

  removeUselessButtons = function(){
    //removes the useless buttons after the user made their choice in the menu
    realUploadButton.remove()
    //visibleUploadButton.hide()
    visibleUploadButton.remove()
    faqMenuButton.remove()
    recordSideButton.remove()
  }
  /* 
  keyPressed(): p5js function that gets called every time a key is pressed.
  Use key to get the specific key.
  We see here for now if a beat circle is overlapping with the reference;
  points will later need to be assigned based on how much the circle
  was overlapping with the reference.
  The circle will also need to be deleted
  */

  var currMessage = 0
  p5c.keyPressed = function () {
    let key = p5c.key;
    let keyCode = p5c.keyCode;
    //if the key is z (ignore case) and the game is not paused, 
    //check if the helper is waiting (isWaiting == true); if so,
    //play the 'speech_end' sound and set isWaiting to false
    if (key == 'z' || key == 'Z') {
      //if (!paused) {
      if (helper.isWaiting()) {
        speech_end.play();
        handleMessage(msg.getId())
        //switch msg to the next message to display
        currMessage++
        msg.makeEmpty()
        if(msg.nextMsgId != -1){
          setTimeout(() => { msg = messages[currMessage] }, 150)
        }else{
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
          leftChannel = debug_soundfile.buffer.getChannelData(0).slice()
        }, 100);
        setTimeout(()=>{
        mode = 2;
        createAudioControls();
        started = true
        }, 200); 
      }
    }

    //spacebar
    if(keyCode==32){
      if(mode==2)
        if(!soundFile.isPlaying()){
          soundFile.play()
        }else{
            soundFile.pause()
        }
    }
  }
  var micCheck; //needed to check if the user gave us permission to access the microphone
  //for special messages, we need to handle them differently
  handleMessage = function(id){
    switch (id){
      //recordIntro3: last message before asking the user for permission to access the microphone
      case "recordIntro3":
        //ask user permission to access the microphone
        mic.start(obtainedMicPerm, errorMicPerm)
        //check periodically if the user gave us permission to access the microphone
        micCheck = setInterval(() => {
          mic.start(obtainedMicPerm)
        }, 1000)
        break;
      case "record2":
        //can begin common mode
        mode = 2;
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
  //used to create the audio controls when passing to common mode
  createAudioControls = function(){
    recordButton = p5c.createDiv('')
    recordButton.addClass('record_button')
    recordButton.mousePressed(function(){
      console.log("record button pressed")
    })
    playButton = p5c.createDiv('')
    playButton.addClass('play_button')
    playButton.mousePressed(function () {
      console.log("play button pressed")
      if(!soundFile.isPlaying()){
        soundFile.play()
      }else{
        soundFile.pause()
      }
    })
    stopButton = p5c.createDiv("")
    stopButton.addClass('stop_button')
    stopButton.mousePressed(function () {
      console.log("stop button pressed")
      soundFile.stop()
    })
  }
  errorMicPerm = function(){
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

  obtainedMicPerm = function(){
    //if micCheck is not null, it means that we were checking for permission
    //Clear micCheck

    if(micCheck != null){
      clearInterval(micCheck)
    }
    userGaveMicPerm = true
    msg = messages[currMessage]
    helper.setWorking()
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
    if (metroFlag == 4) {
    }
    if (metroFlag % 4 == 0) {
      met1.play()
    } else {
      met2.play();
    }
    metroFlag += 1;
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



var messages;