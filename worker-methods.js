/*
THIS FILE CONTAINS ALL THE METHODS THAT ARE USED BY THE WORKER AND THE WORKER ONLY
REMEMBER THAT THE WORKER ONLY COMMUNICATES WITH THE SKETCH.JS VIA POSTMESSAGE
NOTHING ELSE IS SHARED!

INPUT: x - audio buffer
RETURNS: return [BPM_estimated, secondary_bpm, third_bpm, polyrhythm[0], polyrhythm[1], polyrhythm_second_ML[0], polyrhythm_second_ML[1]]

STATUS: The BPM detection kind of works
Multiple of the real tempo are sometimes found
A big problem is that for some reason if the tempo is for example 90, and we're doing a 4v1,
we're detecting 360 as bpm (4*90) BUT for some reason we're not detecting 90 (its intensity is too low)!
If we can make this more accurate then we're done

TODO: add a flag that says: "I'm detecting a polyrhythm, please don't interrupt me" <--(lo lascio perché mi ha steso)
    -add a flag that says: "I didn't detect any polyrhythm (this happens when the tempogram values are really low)"
*/

/*
KEEP IN MIND ALL BPM DETECTION IS EXTRA WORK AS WE ASSUME THE BPM IS GIVEN!

JS doesn't support multi dimensional arrays, so we have to do arrays of arrays instead
*/

/*
An alternative implementation is to look at the track while it is played.
This is better from a user perspective since it doesn't interrupt anything
Like this: https://support.apple.com/it-it/guide/logicpro/lgcef24f3fd9/mac
*/

/*
some ideas:
-build a "probability mask" for bpm values (values around 100 bpm for example are way more common than values around 50)
-make the main function async and use await to wait for the bpm detection to finish
-use a web worker...    https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

-to detect polyrhytms one could use the following approach:
    -detect the bpm of the main rhythm
    -extract possible other bpms
    -delete all other bpms that are too close to the main bpm
    -take the 2nd most likely bpm now


    -idea 2:

    -detect the bpm of the main rhythm
    -extract possible other bpms (longer list)
    -delete all other bpms that are too close to the main bpm
    -consider the 2nd most likely bpm
    -IF it's a multiple of the main bpm (or a dividend):
        -save it aside in a temp variable
        -delete its neighbours
        -detect the next most likely BPM ("bpm2")
        -IF its intensity is higher than a threshold
            -the 2nd most likely bpm is bpm2
        -ELSE
            -the 2nd most likely bpm is temp
    
*/
//importScripts("https://cdn.jsdelivr.net/npm/p5@1.5.0/lib/p5.js")
//importScripts("https://unpkg.com/tone@14.7.58/build/Tone.js")
//importScripts("https://cdn.jsdelivr.net/npm/p5@1.5.0/lib/addons/p5.sound.js")
importScripts("https://cdn.jsdelivr.net/npm/mathjs@11.5.0/lib/browser/math.min.js")


function STFT_copilot(x, window, hop) {
    var X = [];
    for (var i = 0; i < x.length; i += hop) {
        var frame = x.slice(i, i + window.length);
        console.log("STFT: "+ i + " / " + x.length)
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
    let K = Math.floor((N + 1) / 2)
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
        window.push(0.5 * (1 - math.cos(2 * math.PI * i / (N - 1))));
    }
    return window;
}


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



//var p5c = new p5();

var SF;
var x
//load the file "song2_lq.mp3"
onmessage = (event) => {
    x = event.data[0];
    //Fs_main = event.data[1];
    Fs_main = 44100 //most files are in 44100, we need to do this otherwise
    //everything bugs since it takes the sampling rate of the system otherwise
    //see https://p5js.org/reference/#/p5/sampleRate
    console.log("Worker received event data!")
    setTimeout(() => {
        console.log("Worker started main function!")
        x = lowpass(x, 1000, Fs_main);
        main(x)
    }, 2000
    )
};

//i honestly don't know if this is really lowpassing or i'm getting trolled
//but either way it seems like it's helping
function lowpass(x, cutoff, fs) {
    var y = new Array();
    var a = 1 - math.exp(-2 * math.PI * cutoff / fs);
    y.push(x[0]);
    for (var i = 1; i < x.length; i++) {
        y.push(a * x[i] + (1 - a) * y[i - 1]);
    }
    return y;
}


//while(!SF.isLoaded()) {
//    console.log("loading");}

var X_temp;
var novs;
var BPM_estimated;
var temp_max;
var prob_mask;

//load the audio file "iojb.wav" into a variable called x
var N = 2048;
//create a Hanning window of length N and put it into a variable called window
var windowHann = hann(N);
var hop = 512;
var bpmDetected;
var arr;
var tempogram;

var Fs_main = 0;

async function main(x) {
    
    arr = new Array();
    //copy values inside x into arr
    for (var i = 0; i < x.length; i++) {
        arr.push(x[i]);
    }
    console.log("----------------------")
    console.log("Computing the novelty spectrum")
    novs = await compute_novelty_spectrum(arr, Fs = Fs_main, N , hop , gamma = 1, M = 10, norm = 1)
    var nov = novs[0]
    var Fs_nov = novs[1]
    var Theta = new Array();
    for (var i = 30; i < 601; i++) {
        Theta.push(i);
    }
    console.log("----------------------")
    console.log("Computing the Fourier tempogram")
    var temps = await compute_tempogram_Fourier(nov, Fs_nov, 500, 10, Theta)
    X_temp = temps[0]
    var T_coef = temps[1]
    var F_coef_BPM = temps[2]
    tempogram = math.abs(X_temp)
    console.log("----------------------")
    console.log("Tempogram computed - Printing results ")
    let NN = tempogram[0].length
    //tempogram = medianFiltering(tempogram)
    //console.log(tempogram)
    
    tempogram = sumVectorMultiDim(tempogram)
    tempogram = math.divide(tempogram, NN)
    
    prob_mask = buildProbabilityMask(tempogram.length)
    tempogram = math.dotMultiply(tempogram, prob_mask)
    temp_max = math.max(tempogram)

    BPM_estimated = maxIndex(tempogram) + Theta[0]
    console.log("tempogram")
    console.log(tempogram)
    console.log("----------------------")
    console.log("Estimated BPM: " + BPM_estimated)
    //console.log(temp_max)
    //console.log("BPM ESTIMATED: ")
    console.log("-----------------")
    /*
    bpmDetected = getBPM(arr, windowHann, hop);
    bpmDetected = mean(bpmDetected);

    console.log(bpmDetected);
    */

    //better_results = [BPM_estimated, secondary_BPM, polyrhythm_1, polyrhythm_2]
    let better_results = refineResults(tempogram, BPM_estimated, temp_max)

    //const result = [BPM_estimated,tempogram] 
    const result = better_results
    console.log("Worker: sending result back to main thread...")
    postMessage(result)
}

function normalise(s) {
    //normalise the audio signal in s
    var max = math.max(s);
    //calculate the difference between abs(max) and 1
    var diff = 1 - math.abs(max);
    //add diff to all values inside s, multiplying it by the sign of the value
    for (var i = 0; i < s.length; i++) {
        s[i] = s[i] + diff * math.sign(s[i]);
    }
}

function maxIndex(x) {
    var max = x[0];
    var index = 0;
    for (var i = 1; i < x.length; i++) {
        if (x[i] > max) {
            max = x[i];
            index = i;
        }
    }
    return index;
}

function mean(x) {
    //calculate the mean of values inside x
    var sum = 0;
    for (var i = 0; i < x.length; i++) {
        sum += x[i];
    }
    return sum / x.length;
}

function meanMultiDim(x) {
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
    console.log("----------------------")
    console.log("Novelty spectrum - Computing STFT")
    let X = STFT(x, windowHann, H)

    let Fs_feature = Fs / H
    let x2 = math.add(1, math.dotMultiply(gamma, math.abs(X)))
    //create a new variable Y whose values are obtained as the logarithm of each of x2 values
    //loop over x2 values and take the logarithm of each value
    let Y = new Array();
    for (var i = 0; i < x2.length; i++) {
        //each of x2 values is an array
        //take the logarithm of each value in x2[i][j]
        var temp = new Array();
        for (var j = 0; j < x2[i].length; j++) {
            temp.push(math.log(x2[i][j]));
        }
        Y.push(temp);
    }


    let Y_diff = diffFirstOrderMultiDim(Y)
    //run through each element in Y_diff and set negative elements to zero
    for (var i = 0; i < Y_diff.length; i++) {
        for (var j = 0; j < Y_diff[i].length; j++) {
            if (Y_diff[i][j] < 0) {
                Y_diff[i][j] = 0;
            }
        }
    }


    let novelty_spectrum = sumVectorMultiDim(Y_diff)
    //concatenate a 0 to novelty_spectrum
    //novelty_spectrum = math.concat(novelty_spectrum, 0)
    novelty_spectrum.push(0)
    if (M > 0) {
        local_average = compute_local_average(novelty_spectrum, M, Fs)
        
        local_average = math.multiply(local_average, -1)
        novelty_spectrum = math.add(novelty_spectrum, local_average)
        
        //novelty_spectrum[novelty_spectrum < 0] = 0.0
        for (var i = 0; i < novelty_spectrum.length; i++) {
            if (novelty_spectrum[i] < 0) {
                novelty_spectrum[i] = 0;
            }
        }
    }
    
    
    if (norm == 1) {
        max_value = math.max(novelty_spectrum)
        if (max_value > 0) {
            novelty_spectrum = math.divide(novelty_spectrum, max_value)
        }
    }
    
    return [novelty_spectrum, Fs_feature]
}

function sumVectorMultiDim(a) {
    var sum = new Array();
    for (var i = 0; i < a.length; i++) {
        sum.push(sumVector(a[i]));
    }
    return sum;
}

function sumVector(a) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) {
        sum = math.add(sum,a[i]);
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

function diffFirstOrderMultiDim(s){
    var diff = new Array();
    for (var i = 0; i < s.length; i++) {
        diff.push(diffFirstOrder(s[i]));
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

var xexp;
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
    t_pad = t_pad._data
    let M = Math.floor(Math.floor(L_pad - N) / H) + 1
    let K = Theta.length

    //let X = math.zeros([K, M])
    let X = new Array()

    let T_coef;
    let F_coef_BPM;
    for (let k = 0; k < K; k++) {
        let omega = (Theta[k] / 60) / Fs
        //exponential = np.exp(-2 * np.pi * 1j * omega * t_pad)
        let complex = new Array()
        for (var i = 0; i < t_pad.length; i++) {
            //let complex = math.complex(math.cos(2 * math.PI * omega * t_pad), - math.sin(2 * math.PI * omega * t_pad))
            complex.push(math.complex(math.cos(2 * math.PI * omega * t_pad[i]), - math.sin(2 * math.PI * omega * t_pad[i])))
        }
        //x_exp = x_pad * exponential
        let x_exp = math.dotMultiply(x_pad, complex)
        let X_row = new Array()
        for (let n = 0; n < M; n++) {
            xexp = sumVector(math.dotMultiply(win, x_exp.slice(n * H, n * H + N)))
            X_row.push(xexp)
        }
        X.push(X_row)
        //T_coef = math.range(0, M) * H / Fs
        T_coef = math.range(0, M)._data
        T_coef = math.multiply(T_coef, H/Fs)
        F_coef_BPM = Theta
    }
    console.log("X  ...")
    console.log(X)
    console.log("------------------")
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

function buildProbabilityMask(L){
    var mask = new Array();
    //Build a mask to penalise the lower and the higher values
    //(as they are less likely to be the correct tempo)
    //(remember our algorithm sometimes tends to indicate half of the tempo as the correct one)
    
    for (var i = 0; i < L; i++) {
        if (i < 40) {
            mask.push(0.3)
        } 
        
        //uncomment this part if you want a more aggressive mask
        else if (i > 400) {
            mask.push(0.3)
        } 
        else if (i >= 40 && i <= 60) {
            mask.push(0.5)
        } 
        else if (i > 60 && i < 80) {
            mask.push(0.7)
        } 
        else if (i >= 250 && i < 300) {
            mask.push(0.7)
        } 
        else if (i >= 300 && i <= 400) {
            mask.push(0.5)
        } 
        
        else if (i > 400) {
            mask.push(0.3)
        } else {
            mask.push(1)
        }
    }

    /*
    //fill mask with a normalised gaussian distribution
    //centered in 110 and with a standard deviation of 30
    for (var i = 0; i < L; i++) {
        mask.push(1/(30 * Math.sqrt(2 * Math.PI)) * Math.exp(-Math.pow(i - 110, 2) / (2 * Math.pow(30, 2))))
    }
    */
    return mask;
}

function medianFiltering(v){
    var v_filtered = new Array();
    for (var i = 0; i < v.length; i++) {
        if (i <= 3 || i >= v.length - 3) {
            v_filtered.push( math.mean(v[i]) )
        } else {
            //median filtering using an array of 8 elements
            let vv = v.slice(i - 3, i + 3)
            let vvv = new Array();
            for (var j = 0; j < vv.length; j++) {
                vvv.push( math.mean(vv[j]) )
            }

            v_filtered.push( math.median(vvv) )
        }
    }
    return v_filtered;
}

/*
-detect the bpm of the main rhythm
    -extract possible other bpms (longer list)
    -delete all other bpms that are too close to the main bpm
    -consider the 2nd most likely bpm
    -IF it's a multiple of the main bpm (or a dividend):
        -save it aside in a temp variable
        -delete its neighbours
        -detect the next most likely BPM ("bpm2")
        -IF its intensity is higher than a threshold
            -the 2nd most likely bpm is bpm2
        -ELSE
            -the 2nd most likely bpm is temp
*/
function refineResults(tempogram, BPM_estimated, temp_max){
    //TODO: add another parameter that indicates the number of possible polyrhythms to return
    let other_candidates = getMaxIndexes(tempogram, 100);
    //add 30 to each element of other_candidates
    other_candidates = other_candidates.map(x => x + 30)
    console.log("Other candidates:")
    console.log(other_candidates)
    other_candidates = removeCandidateNeighbours(other_candidates, BPM_estimated, 0.05)
    let secondary_bpm_candidate = extractSecondaryBPM(other_candidates, BPM_estimated, 0.1)
    other_candidates = removeCandidateNeighbours(other_candidates, secondary_bpm_candidate, 0.05)
    let third_bpm_candidate = extractSecondaryBPM(other_candidates, secondary_bpm_candidate, 0.1)
    
    console.log("BPM_estimated: " + BPM_estimated + "secondary_bpm_candidate: " + secondary_bpm_candidate + "third_bpm_candidate: " + third_bpm_candidate)

    let mainIntensity = temp_max
    let secondaryIntensity = null;
    if(secondary_bpm_candidate != 0 && secondary_bpm_candidate != NaN && secondary_bpm_candidate != null){
        secondaryIntensity = tempogram[secondary_bpm_candidate - 30]
    }
    let thirdIntensity = null;
    if(third_bpm_candidate != 0 && third_bpm_candidate != NaN && third_bpm_candidate != null){
        thirdIntensity = tempogram[third_bpm_candidate - 30]
    }

    let a = BPM_estimated / secondary_bpm_candidate
    let b = secondary_bpm_candidate / BPM_estimated
    let c = Math.max(a,b)
    let th = 0.1;

    

    console.log(thirdIntensity)
    console.log(third_bpm_candidate)
    let secondary_bpm = secondary_bpm_candidate
    if (thirdIntensity != null) {
        if (Math.abs(c - 2) <= th || Math.abs(c - 4) <= th) {
            if (thirdIntensity >= 0.4 * mainIntensity) {
                
                secondary_bpm = third_bpm_candidate
                third_bpm_candidate = secondary_bpm_candidate
            }
        }
    }
    let third_bpm = third_bpm_candidate
    console.log("Secondary BPM:")
    console.log(secondary_bpm)

    let polyML = estimatePolyrhythm(BPM_estimated, secondary_bpm)
    let poly_second_ML = estimatePolyrhythm(BPM_estimated, third_bpm)
    //console.log("Ratio:")
    //console.log(poly)
    let polyrhythm = findClosestPolyrhythm(polyTable, polyML)
    let polyrhythm_second_ML = findClosestPolyrhythm(polyTable, poly_second_ML)
    if(Math.abs(polyrhythm[0] - polyrhythm[1]) && polyrhythm[0]>=10){
        //set both to 1
        polyrhythm[0] = 1
        polyrhythm[1] = 1
    }
    //do the same for the second
    if(Math.abs(polyrhythm_second_ML[0] - polyrhythm_second_ML[1]) && polyrhythm_second_ML[0]>=10){
        //set both to 1
        polyrhythm_second_ML[0] = 1
        polyrhythm_second_ML[1] = 1
    }

    console.log("Closest polyrhythms:")
    console.log(polyrhythm[0] + " vs " + polyrhythm[1])
    console.log(polyrhythm_second_ML[0] + " vs " + polyrhythm_second_ML[1])
    return [BPM_estimated, secondary_bpm, third_bpm, polyrhythm[0], polyrhythm[1], polyrhythm_second_ML[0], polyrhythm_second_ML[1]]
}

//-------------------- COPIED FROM MAIN --------------------

var polyTable = buildPolyrhythmRatioTable();

function getMaxIndexes(a, N) {
    //return the indexes of the N greatest values in arr
    let arr = a.slice(0);
    var maxIndexes = [];
    for (var i = 0; i < N; i++) {
        maxIndexes.push(arr.indexOf(Math.max(...arr)));
        arr[maxIndexes[i]] = -Infinity;
    }
    return maxIndexes;
}

function extractSecondaryBPM(other_candidates, BPM, threshold = 0.1) {
    //return the secondary BPM if it is close enough to the main BPM
    //otherwise return 0
    let secondary_bpm = 0;
    for (var i = 0; i < other_candidates.length; i++) {
        if (Math.abs(other_candidates[i] - BPM) > threshold * BPM) {
            secondary_bpm = other_candidates[i];
            break;
        }
    }
    return secondary_bpm;
}

function removeCandidateNeighbours(other_candidates, BPM, threshold = 0.05){
    let cand2 = new Array()
    for (var i = 0; i < other_candidates.length; i++) {
        if (Math.abs(other_candidates[i] - BPM) > threshold * BPM) {
            cand2.push(other_candidates[i]);
        }
    }
    return cand2;
}

function estimatePolyrhythm(BPM, secondary_bpm) {
    //return the polyrhythm if it exists
    //otherwise return 0
    let poly = 0;
    if (secondary_bpm != 0) {
        poly = secondary_bpm / BPM;
    }
    return poly;
}


function buildPolyrhythmRatioTable() {
    //return a table of the ratios of the polyrhythm
    let table = new Array();
    //reasonably let's keep table 12 by 12 (max polyrhythm is 12/12)
    for (var i = 1; i < 13; i++) {
        let row = new Array()
        for (var j = 1; j < 13; j++) {
            row.push(i / j);
        }
        table.push(row)
    }
    /*
    //fill "uncommon" positions with a very low number (e.g. -50)
    //fill the last row and the last column with -50
    for (var i = 0; i < 12; i++) {
        table[11][i] = -50;
        table[i][11] = -50;
    }
    */
    return table;
}

function findClosestPolyrhythm(table, ratio) {
    //return the closest polyrhythm to the ratio
    //if the ratio is not in the table, return 0
    let min = 1000; //arbitrary large number for initialization
    let poly = [0, 0];
    for (var i = 0; i < table.length; i++) {
        for (var j = 0; j < table[i].length; j++) {
            let diff = Math.abs(table[i][j] - ratio);
            if (diff < min) {
                min = diff;
                poly[0] = i + 1;
                poly[1] = j + 1;
            }
        }
    }
    return poly;
}