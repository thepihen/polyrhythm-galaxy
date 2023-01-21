function STFT(x, window, hop) {
    var X = [];
    for (var i = 0; i < x.length; i += hop) {
        var frame = x.slice(i, i + window.length);
        console.log(i + " / " +x.length)
        X.push(math.fft(frame));
    }
    return X;
}

//create hanning window of length N
function hann(N) {
    var window = [];
    for (var i = 0; i < N; i++) {
        window.push(0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))));
    }
    return window;
}

function getBPM(x, window, hop) {
    var X = STFT(x, window, hop);
    var bpm = [];
    for (var i = 0; i < X.length; i++) {
        var frame = X[i];
        var max = 0;
        for (var j = 0; j < frame.length; j++) {
            if (frame[j] > max) {
                max = frame[j];
            }
        }
        bpm.push(max);
    }
    return bpm;
}

//needs math.js
//or we need to define a complex number class


/*
function FFT(x) {
    var N = x.length;
    if (N <= 1) {
        return x;
    }
    var even = [];
    var odd = [];
    for (var i = 0; i < N / 2; i++) {
        even.push(x[2 * i]);
        odd.push(x[2 * i + 1]);
    }
    var q = FFT(even);
    var r = FFT(odd);
    var X = [];
    for (var k = 0; k < N / 2; k++) {
        var t = r[k] * Math.exp(-2 * Math.PI * k / N * math.I);
        X[k] = q[k] + t;
        X[k + N / 2] = q[k] - t;
    }
    return X;
}
*/


//load the audio file "iojb.wav" into a variable called x
var N = 2048;
//create a Hanning window of length N and put it into a variable called window
var windowHann = hann(N);
var hop = 1024;
var bpmDetected;
var arr;
function main(x){
    arr = new Array();
    //copy values inside x into arr
    for (var i = 0; i < x.length; i++) {
        arr.push(x[i]);
    }
    
    bpmDetected = getBPM(arr, windowHann, hop);
    bpmDetected = mean(bpmDetected);
    console.log(bpmDetected);
}

function mean(x){
    //calculate the mean of values inside x
    var sum = 0;
    for (var i = 0; i < x.length; i++) {
        sum += x[i];
    }
    return sum / x.length;
}
