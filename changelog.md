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
