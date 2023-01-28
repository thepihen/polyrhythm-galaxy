## 2023-01-21:
* created this changelog to help keep track of changes!
* included math.js for future use for complex numbers, fft, etc.
* methods.js file for everything not strictly related to p5.js (e.g. bpm estimation)
* added a new background image to the main didactic part to make everything more colorful
* added a placeholder favicon
* users can now record their audio and play it back 
* the waveform is not updating in real time
* fixed most bugs regarding the passage from recording/upload mode to common mode

## 2023-01-25
* added an algorithm for tempogram-based polyrhythm estimation. A web-worker is used for the calculations
* the algorithm returns the 2 most likely polyrhythms in the (recorded/uploaded) audio track
* to reduce computation times, the audio is now cut to be 15 (_for now_) seconds long (which is more than enough to play a polyrhythm)
* polyrhythm detection is available only if web workers are available in the user's browser. For this reason a _workerSupported_ flag has been created
* added an upload button to upload a new audio on the go
* fixed waveform display

## 2023-01-26
* the algorithm for polyrhythm detection now "talks" with the sketch
* added some new functions to manage user "answers" to the helper's questions (e.g. "which polyrhythm sounds closer?")
* KNOWN ISSUE: the page lags after audio analysis

## 2023-01-27
* introduced a rhythm wheel, with its own play button
* made the interface clearer to the user (the program now indicates when it is analysing, recording,...)
* almost finished implementing choice buttons (still missing audio)
* made a function to play polyrhythms when a choice is hovered
* the audio now gets automatically cut to 15 seconds for the above-detailed reasons

## 2023-01-28
* fixed all (hopefully) bugs regarding text management when analysing an audio file
* the user is now unable to record or upload a new audio while the worker is analysing the existing audio file
* removed some __very uncommon__ polyrhythms from the table to improve detection accuracy (before it was almost impossible to get a correct estimation for non-polyrhythmic rhythmic structures (e.g. 1v1))