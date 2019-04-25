// Set vars.
var lc = document.getElementById('lc-text');
var button = document.getElementById('lc-button');

var recognizing = false;

var recognition = new webkitSpeechRecognition();
var transcript = [];
var startTime;
var beginTime;

recognition.continuous = true;
recognition.interimResults = true;

recognition.onstart = function() {
  recognizing = true;
  startTime = new Date();
  beginTime = startTime;
};

recognition.onerror = function(event) {};
recognition.onend = function() {
  recognizing = false;
};

recognition.onresult = function(event) {
  for (var i = event.resultIndex; i < event.results.length; ++i) {
    if(event.results[i][0].confidence > 0.4) {
      lc.firstChild.data = capitalize(event.results[i][0].transcript);
      if (event.results[i].isFinal) {
        addToTranscript(event.results[i][0].transcript);
      }
    }
  }
};


function capitalize(s) {
  var first_char = /\S/;
  return s.replace(first_char, function(m) {
    return m.toUpperCase();
  });
}

function toggleSpeechRecognition(event) {
  if(recognizing) {
    recognition.stop();
    lc.style.display = "none";
    button.style.display = "inline-block";
    $('body').toggleClass('lc-on');
    return;
  } else {
    lc.style.display = "inline-block";
    button.style.display = "none";
    $('body').toggleClass('lc-on');
    recognition.start();
  }
}

/**
 * Add text to the running transcript array, setting start/end times
 *
 * @param text - the text to be added to the transcript
 */
function addToTranscript(text){
  if (text){
    var endTime = new Date();
    transcript.push({"startTime": beginTime, "endTime": endTime, "text": text});
    // Reset the beginTime
    beginTime = endTime;
    saveToLocalStorage(formatTranscript());
  }
}


function formatTime(timeString){
  var time = new Date(timeString);
  var elapsedTime = time - startTime;

  var seconds = Math.floor(elapsedTime/1000);
  var milliseconds = elapsedTime - (seconds * 1000);
  var minutes = Math.floor(seconds/60);
  var hours = Math.floor(minutes/60);
  var days = Math.floor(hours/24);

  hours = hours-(days*24);
  minutes = minutes-(days*24*60)-(hours*60);
  seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);
  return ((hours < 10) ? '0' : '') + hours + ((minutes < 10) ? ':0' : ':') + minutes  + ((seconds < 10) ? ':0' : ':') + seconds + "," + milliseconds;
}

/**
 * Format the transcript array into an "SRT" format
 *
 */
function formatTranscript(){
  var output = "";
  for (var i = 0; i < transcript.length; ++i) {
    output += i+1 + "\n";
    output += formatTime(transcript[i].startTime) + " --> " + formatTime(transcript[i].endTime) + "\n";
    output += transcript[i].text + "\n\n";
  }
  return output;
}

/**
 * Save the data to localStorage
 *
 * @param data - the data to save
 */
function saveToLocalStorage(data) {
  if (data && localStorage) {
    localStorage.setItem("live-captioning", data);
  }
}
