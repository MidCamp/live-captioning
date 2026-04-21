// Set vars.
var lc = document.getElementById('lc-text');
var button = document.getElementById('lc-button');

var recognizing = false;
var selectedSession = null;

var recognition = new webkitSpeechRecognition();
var sessions = loadFromLocalStorage('sessions');
var currentSession = null;
var transcript = [];
var startTime;
var beginTime;
var autoRestart = false;

recognition.continuous = true;
recognition.interimResults = true;

var languageSelector = document.getElementById('language-selector');

languageSelector.addEventListener('change', function() {
  recognition.lang = languageSelector.value;
});

if (! sessions){
  sessions = [];
  $('#lc-rec').hide();
  $('#lc-sessions').hide();
} else {
  showRecordings();
}

recognition.onstart = function() {
  recognizing = true;
  recordSession();
};

recognition.onerror = function(event) {
  console.log("Recognition error: ", event.message ? event.message : event.error);
  if ((event.error == "no-speech") || (event.error == "audio-capture") || (event.error == "network") || (event.error == "bad-grammar")){
    refresh();
  }
};

recognition.onend = function() {
  recognizing = false;
  if (autoRestart){
    toggleSpeechRecognition();
  }
};

recognition.onresult = function(event) {
  for (var i = event.resultIndex; i < event.results.length; ++i) {
    if(event.results[i][0].confidence > 0.4) {
      lc.firstChild.data = capitalize(event.results[i][0].transcript);
      if (event.results[i].isFinal) {
        addToTranscript(sessions[currentSession].name, event.results[i][0].transcript);
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
    lc.firstChild.data = "Begin speaking. Click to stop.";
    button.style.display = "inline-block";    
    $('body').removeClass('lc-on');
    selectedSession = currentSession;
    showRecordings();
    return;
  } else {
    lc.style.display = "inline-block";
    button.style.display = "none";
    $('body').addClass('lc-on');
    recognition.start();    
  }
  autoRestart = false;
}

function refresh(event) {
  autoRestart = true;
  recognizing = false;
  recognition.abort();
  try {
    recognition.start()
  }catch(e){

  }
}

function newSession(event) {
  window.location.hash = '';
  currentSession = null;
  toggleSpeechRecognition(event);
}

function createSession(){
  var id, name, startTime;

  if (sessions.length === 0){
    id = 1;
  }else{
    // look at last ID, since they may not be sequential
    id = sessions[sessions.length-1].id + 1;
  }
  name = 'session_' + id;
  startTime = new Date();
  
  sessions.push({'id': id, 'name': name, 'startTime': startTime});
  saveToLocalStorage('sessions', sessions);

}


function locationHashChanged() {
  recognition.stop();
  currentSession = null;
  if (window.location.hash){
    try {
      recognition.start();      
    }catch(e){
      recognizing = true;
      recordSession();
    }
  }
}


function showRecordings() {
  $('#lc-sessions').show();
  $('#lc-rec').show();
  var list = document.getElementById('session-list');
  list.innerHTML = '';

  for (var i = 0; i < sessions.length; i++) {
    var session = sessions[i];
    var date = new Date(session.startTime);
    var dateStr = date.toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'}) +
                  ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    var item = document.createElement('div');
    item.className = 'session-item' + (selectedSession === i ? ' selected' : '');
    item.setAttribute('data-index', i);
    item.innerHTML =
      '<div class="session-info" onclick="selectSession(' + i + ')">' +
        '<span class="session-name">' + session.name + '</span>' +
        '<span class="session-date">' + dateStr + '</span>' +
      '</div>' +
      '<button class="lc-btn session-delete-btn" onclick="deleteSession(event, ' + i + ')">Delete</button>';

    list.appendChild(item);
  }

  if (selectedSession === null && sessions.length > 0) {
    var initialIndex = window.location.hash ? findSessionFromHash() : null;
    selectSession(initialIndex !== null ? initialIndex : 0);
  }
}

function selectSession(index) {
  selectedSession = index;
  var items = document.querySelectorAll('.session-item');
  for (var i = 0; i < items.length; i++) {
    var itemIndex = parseInt(items[i].getAttribute('data-index'));
    items[i].classList.toggle('selected', itemIndex === index);
  }
}

function deleteSession(event, index) {
  event.stopPropagation();
  localStorage.removeItem(sessions[index].name);
  sessions.splice(index, 1);
  saveToLocalStorage('sessions', sessions);

  if (sessions.length === 0) {
    selectedSession = null;
    $('#lc-sessions').hide();
    $('#lc-rec').hide();
  } else {
    if (selectedSession > index) {
      selectedSession--;
    } else if (selectedSession >= sessions.length) {
      selectedSession = sessions.length - 1;
    }
    showRecordings();
  }
}

function continueSession(event){
  if (selectedSession === null) return;
  currentSession = selectedSession;
  toggleSpeechRecognition(event);
}

function viewSession(format) {
  if (selectedSession === null) return;
  var session = sessions[selectedSession];
  var textArea = $('#lc-transcript textarea')[0];
  switch(format){
    case "text":
      textArea.value = formatTranscriptText(loadFromLocalStorage(session.name));
      break;
    case "srt":
    case "webVTT":
    default:
      textArea.value = formatTranscriptTimeStamped(loadFromLocalStorage(session.name), session.startTime, format);
      break;
  }
  if (format){
    $('#lc-transcript').show();    
  } else {
    $('#lc-transcript').toggle();
  }
}

function findSessionFromHash() {
  // Look for the session
    var foundSession = null;
    var i = 0;
    var hashText = window.location.hash.replace("#", "");
    do {
      if (sessions[i].name === hashText){
        foundSession = i;
      }
      i++;
    } while ((foundSession === null) && (i < sessions.length));
    return foundSession;
}

function recordSession(){
  if ((! currentSession) && (window.location.hash)){
    // Look for the session
    currentSession = findSessionFromHash();
  }

  if (currentSession === null){
    createSession();
    currentSession = sessions.length - 1;
  }
  // Load any existing transcript for the current session, in case we're continuing
  transcript = loadFromLocalStorage(sessions[currentSession].name);
  if (! transcript){
    transcript = [];
  }

  // Set the begin time for the session, which may be a continuation
  beginTime = new Date();

  // Add hash to URL, so that a refresh will add to the same session
  window.location.hash = sessions[currentSession].name;

}

/**
 * Add text to the running transcript array, setting start/end times
 *
 * @param sessionName  - key to save the transcript under in local storage
 * @param text         - the text to be added to the transcript
 */
function addToTranscript(sessionName, text){
  if (text){
    var endTime = new Date();
    transcript.push({"startTime": beginTime, "endTime": endTime, "text": text});
    // Reset the beginTime
    beginTime = endTime;
    saveToLocalStorage(sessionName, JSON.stringify(transcript));
  }
}

/**
 * Format a time string into  array into an "SRT" or "WebVTT" format
 *
 * @param timeString -- Date/Time string 
 * @param startTime  -- Date/Time string of the start used to calculate the elapsed time
 * @param format -- Style of output to be generated (currently SRT or WebVTT)
 */
function formatElapsedTime(timeString, startTimeString, format){
  var time = new Date(timeString);
  var startTime = new Date(startTimeString);

  var elapsedTime = time - startTime;

  var seconds = Math.floor(elapsedTime/1000);
  var milliseconds = elapsedTime - (seconds * 1000);
  var minutes = Math.floor(seconds/60);
  var hours = Math.floor(minutes/60);
  var days = Math.floor(hours/24);
  var millisecondsSeparator = ".";

  hours = hours-(days*24);
  minutes = minutes-(days*24*60)-(hours*60);
  seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

  if (format === "srt") {
    millisecondsSeparator = ",";
  }
  return ((hours < 10) ? '0' : '') + hours + 
          ((minutes < 10) ? ':0' : ':') + minutes  + 
          ((seconds < 10) ? ':0' : ':') + seconds + 
          millisecondsSeparator + String(milliseconds).padStart(3,'0');
}

/**
 * Format the transcript array into a timestamped output format
 * such as SRT or WebVTT.
 *
 */
function formatTranscriptTimeStamped(transcript, startTime, format){
  var output = "";
  if (format === "webVTT") {
    output += "WEBVTT\n\n";
  }
  for (var i = 0; i < transcript.length; ++i) {
    output += i+1 + "\n";
    output += formatElapsedTime(transcript[i].startTime, startTime, format) + " --> " + formatElapsedTime(transcript[i].endTime, startTime, format) + "\n";
    output += transcript[i].text + "\n\n";
  }
  return output;
}

/**
 * Format the transcript array into just text
 *
 */
function formatTranscriptText(transcript){
  var output = "";
  for (var i = 0; i < transcript.length; ++i) {
    output += transcript[i].text + "\n";
  }
  return output;
}
  /**
   * Load item from the localStorage
   *
   * @param key -- string to identify the storage item
   */
  function loadFromLocalStorage(key) {
    var savedJSON;

    if (localStorage) {
      try {
        savedJSON = JSON.parse(localStorage.getItem(key));
      } catch(e) {}
    }

    if (typeof savedJSON !== 'undefined') {
      return savedJSON;
    }
  }
/**
 * Save the data to localStorage
 *
 * @param key  - local storage key to save the data under
 * @param data - the data to save
 */
function saveToLocalStorage(key, data) {
  if (data && localStorage) {
    if (typeof data === "object"){
      localStorage.setItem(key, JSON.stringify(data));
    }else{
      localStorage.setItem(key, data);
    }
  }
}
