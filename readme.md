# Polyrhythm Galaxy
## A rhythm game mixed with polyrhythm recognition software

Try this website on [Github Pages!](https://thepihen.github.io/polyrhythm-galaxy/)

Check out a quick video presentation of this project below (click on the image to go to YouTube):

<a href="http://www.youtube.com/watch?feature=player_embedded&v=Es_a3-yu_hU
" target="_blank"><img src="http://img.youtube.com/vi/Es_a3-yu_hU/0.jpg" 
alt="Polyrhythm Galaxy video presentation" width="240" height="180" border="10" /></a>

## __The modes__
Polyrhythm Galaxy is composed of 3 modes:
* Training Mode
* Endless Mode
* Didactic Mode

In this readme, we'll describe each of them briefly.

### __Training Mode__
The training mode lets the user pick a BPM and two concurring rhythms forming a polyrhythm and jump directly into a rhythm game interface. In this rhythm game, the user has to click 's' and 'k' while dots fall from the top of the screen in two columns, following the two rhythms. There is no penalty for errors and a score is kept.

We think this is a decent way for the user to get better on a particular polyrhythm of their choice. This mode owes its name due to the fact that it serves as a good training for the second mode, the _endless mode_.

### __Endless Mode__
The "main" mode of this website.
This game mode is pretty straightforward (and, in case of doubts, it even contains a tutorial) and is built over hte same basic ideas as the training mode. The main difference is that the user is faced with progressively harder polyrhythms at increasing BPMs. A score is calculated keeping count of multiple factors, such as streaks, and is used to create a ranking when the user loses. We think this mode is perfect for those looking to challenge themselves and their friends on polyrhythms!

### __Didactic Mode__
This mode is completely different from the previous two: rather than a rhythm game here a dialogue between a helper and the user happens (though it's mostly the helper speaking). The user can record themselves playing what they think is a polyrhythm or upload an audio file and the system will try to recognise it to the best of its capacities. Easier polyrhythms are more likely to be found.

The didactic mode employs a Fourier tempogram to do BPM estimation. The math is handled by a web worker; for this reason, if the user's browser doesn't support web workers (possible if it's very outdated), the website may not work as expected and/or the analysis feature might be unavailable.

## __Goals of this project__
Our objective with this project was to make something that could help less experienced musicians when learning polyrhythms.
We think training and endless mode provide the user with the perfect interface to learn polyrhythms by practicing them.
Didactic mode, instead, can be used to get feedback on how good someone is doing at a certain polyrhythm (during our testing phase the algorithm was usually successful at recognizing simple polyrhythms).

## Dependencies
The three main dependencies are p5js (and its sound library), tone.js and math.js. 

p5js is used for graphics in general; its sound library, p5.sound, is used for simple audio stuff (e.g. playback of an audio file, skipping to a certain position during playback, recording sounds,...) thanks to its SoundFile objects.

tone.js is used mainly to make timed events happen correctly with Transport. The endless mode uses tone to handle all audio-related tasks.

math.js is used by the worker for operations on ("multi-dimensional") arrays and useful misc functions such as the fft.

## KNOWN BUGS
* If your audio device sample rate is not set to 44100 Hz, the polyrhythm analysis in the didactic mode will return completely wrong results. It assumes you're providing it only with audio at 44.1 kHz and __that your audio device is set to the same sampling rate.__
* In Endless Mode there could be audio problems if the game is started too early and the system was not able to totally load audio files. Moreover the game performance slightly changes with respect to the browser. In particular, system works the better with Microsoft Edge. With Google Chrome there could be slowdowns , while in Firefox in the first game, dots can start time shifted with respect to the metronome and after few seconds become correctly synchronized. In general there could be
sometimes really closer dots, especially in the first game when the second background beat enters the game for the first time.
* Sometimes in the didactic mode the browser fails to load the helper messages and the face image. Reloading the page might fix this.
* On some systems p5js will use very high percentages of CPU and GPU power, causing the website to lag. We haven't found a fix on this yet but we're working on it.
