/*
KEEP IN MIND ALL BPM DETECTION IS EXTRA WORK AS WE ASSUME THE BPM IS GIVEN!

JS doesn't support multi dimensional arrays, so we have to do arrays of arrays instead
*/

function STFT_copilot(x, window, hop) {
    var X = [];
    for (var i = 0; i < x.length; i += hop) {
        var frame = x.slice(i, i + window.length);
        console.log(i + " / " + x.length)
        X.push(math.fft(frame));
    }
    return X;
}

function STFT(x, w, H) {
    /*
    Compute a basic version of the discrete short-time Fourier transform (STFT)

    Args:
    x: Signal to be transformed
    w: Window function
        H: Hopsize

    Returns:
    X: The discrete short - time Fourier transform
    */
    let N = w.length
    let L = x.length
    let M = Math.floor((L - N) / H)
    let X = new Array()
    for (var m = 0; m < M + 1; m++) {
        let x_win = math.dotMultiply(x.slice(m * H, m * H + N), w)
        let X_win = math.fft(x_win)
        X.push(X_win)
        console.log(m + "/" + M)
    }
    console.log(X)
    let K = Math.floor((N + 1)  / 2)
    //iterate over all arrays in X and slice them to length K
    for (var i = 0; i < X.length; i++) {
        X[i] = X[i].slice(0, K)
    }

    //X = X.slice(0, K)
    return X
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
    var bpm = new Array();
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
var tempogram;

var X;

function main(x) {
    arr = new Array();
    //copy values inside x into arr
    for (var i = 0; i < x.length; i++) {
        arr.push(x[i]);
    }

    var novs = compute_novelty_spectrum(arr, Fs = 22050, N = 2048, hop, gamma = 1, M = 10, norm = 1)
    var nov = novs[0]
    var Fs_nov = novs[1]
    var Theta = new Array();
    for (var i = 30; i < 601; i++) {
        Theta.push(i);
    }
    var temps = compute_tempogram_Fourier(nov, Fs_nov, 500, 10, Theta)
    X = temps[0]
    var T_coef = temps[1]
    var F_coef_BPM = temps[2]
    tempogram = Math.abs(X)

    /*
    bpmDetected = getBPM(arr, windowHann, hop);
    bpmDetected = mean(bpmDetected);

    console.log(bpmDetected);
    */
}

function mean(x) {
    //calculate the mean of values inside x
    var sum = 0;
    for (var i = 0; i < x.length; i++) {
        sum += x[i];
    }
    return sum / x.length;
}

function meanMultiDim(x){
    //calculate the mean of values inside x
    var sum = new Array();
    var tempSum;
    for (var i = 0; i < x.length; i++) {
        tempSum = 0;
        for (var j = 0; j < x[i].length; j++) {
            tempSum += x[i][j];
        }
        sum.push(tempSum / x[i].length);
    }
    return sum;
}


//function compute_novelty_spectrum(x, Fs = 1, N = 1024, H = 256, gamma = 100, M = 10, norm = 1)
function compute_novelty_spectrum(x, Fs, N, H, gamma, M, norm) {
    //Compute spectral-based novelty function
    let X = STFT(x, windowHann, H)
    let Fs_feature = Fs / H
    let Y = Math.log(1 + gamma * Math.abs(X))
    let Y_diff = diffFirstOrder(Y)
    Y_diff[Y_diff < 0] = 0
    let novelty_spectrum = sumVectorMultiDim(Y_diff)
    //concatenate a 0 to novelty_spectrum
    //novelty_spectrum = math.concat(novelty_spectrum, 0)
    novelty_spectrum.push(0)
    if (M > 0) {
        local_average = compute_local_average(novelty_spectrum, M)
        novelty_spectrum = novelty_spectrum - local_average
        novelty_spectrum[novelty_spectrum < 0] = 0.0
    }
    if (norm == 1) {
        max_value = Math.max(novelty_spectrum)
        if (max_value > 0) {
            novelty_spectrum = novelty_spectrum / max_value
        }
    }
    return [novelty_spectrum, Fs_feature]
}

function sumVectorMultiDim(a){
    var sum = new Array();
    for (var i = 0; i < a.length; i++) {
        sum.push(sumVector(a[i]));
    }
    return sum;
}

function sumVector(a) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) {
        sum += a[i];
    }
    return sum;
}

function diffFirstOrder(s) {
    var diff = [];
    for (var i = 1; i < s.length; i++) {
        diff.push(s[i] - s[i - 1]);
    }
    return diff;
}

function compute_local_average(x, M_sec, Fs) {
    //Compute local average of signal
    let L = x.length
    let M = Math.ceil(M_sec * Fs)
    let local_average = new Array();
    for (let m = 0; m < L; m++) {
        a = Math.max(m - M, 0)
        b = Math.min(m + M + 1, L)
        local_average.push((1 / (2 * M + 1)) * sumVector(x.slice(a, b)))
    }
    return local_average
}

function compute_tempogram_Fourier(x, Fs, N, H, Theta) {
    /*
    Compute Fourier-based tempogram
    
    Args:
    x: Input signal
    Fs: Sampling rate
    N: Window length
    H: Hop size
    Theta: Set of tempi(given in BPM)
    
    Returns:
    X: Tempogram
    T_coef: Time axis(seconds)
    F_coef_BPM: Tempo axis(BPM)
    */
    let win = hann(N)
    let L = x.length
    let x_pad = pad(x, Math.floor(N / 2), Math.floor(N / 2))
    let L_pad = x_pad.length
    let t_pad = math.range(0, L_pad)
    let M = Math.floor(Math.floor(L_pad - N) / H) + 1
    let K = Theta.length
    let X = math.zeros([K, M])
    let T_coef;
    let F_coef_BPM;
    for (let k = 0; k < K; k++) {
        let omega = (Theta[k] / 60) / Fs
        //exponential = np.exp(-2 * np.pi * 1j * omega * t_pad)
        let complex = math.complex(math.cos(2 * math.PI * omega * t_pad), - math.sin(2 * math.PI * omega * t_pad))
        //x_exp = x_pad * exponential
        let x_exp = math.dotMultiply(x_pad, complex)
        for (let n = 0; n < M; n++) {
            X[k, n] = sumVector(math.dotMultiply(win, x_exp.slice(n * H, n * H + N)))
        }
        T_coef = math.range(0, M) * H / Fs
        F_coef_BPM = Theta
    }
    return [X, T_coef, F_coef_BPM]
}


function pad(x, before, after) {
    var arr = new Array();
    for (var i = 0; i < before; i++) {
        arr.push(0);
    }
    for (var i = 0; i < x.length; i++) {
        arr.push(x[i]);
    }
    for (var i = 0; i < after; i++) {
        arr.push(0);
    }
    return arr;
}
