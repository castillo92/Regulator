
var host = location.hostname;
var restPort = 80;
if (host == "") {
  host = "192.168.1.8";
}

function onLoad(cmd) {
  var xhr = new XMLHttpRequest();
  xhr.onerror = function(e) {
    alert(xhr.status + " " + xhr.statusText);
  }
  xhr.onload = function(e) {
    if (cmd == "E") {
      showEvents(xhr.responseText);
    } else if (cmd == "L") {
      showCsvFilesList(xhr.responseText);
    } else if (cmd == "A") {
      showAlarm(xhr.responseText);
      //{"a":2,"t":1501962011,"v1":262,"v2":200,"c":1}
    } else {
      showValues(xhr.responseText);
    }
  };
  xhr.open("GET", "http://" + host + ":" + restPort + "/" + cmd, true);
  xhr.send();
}

var valueLabels = {"mr" : "Manual run", "st" : "State", "r" : "Relays", "h" : "Heating", "m" : "Meter", "b" : "Battery", "a" : "Available", "i" : "Inverter", "soc" : "SoC", "ec" : "Events", "ts" : "Temp.sens.", "csv" : "CSV Files", "v" : "Version"};
var stateLabels = {"N" : "rest", "M" : "monitoring", "R" : "regulating", "O" : "OVERHEAT", "H" : "manual run", "A" : "ALARM"};
var alarmLabels = {"-" : "No alarm", "W" : "WiFi", "P" : "Pump", "M" : "MODBUS"};

function showValues(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  for (var key in valueLabels) {
    var val = data[key];
    if (val == null)
      continue;
    var unit = "";
    if (key == "r" || key == "ec"  || key == "ts" || key == "v") {
    } else if (key == "st") {
      val = stateLabels[val];
    } else if (key == "csv") {
      val = "list";
    } else if (key == "soc") {
      unit = "%";
    } else if (key == "mr") {
      unit = " min.";
    } else {
      unit = " W";
    }
    var boxDiv = document.createElement("DIV");
    if (key == "ec" || key == "csv" || (key == "st" && val == "ALARM")) {
      boxDiv.className = "value-box value-box-clickable";
    } else {
      boxDiv.className = "value-box";
    }
    boxDiv.appendChild(createTextDiv("value-label", valueLabels[key]));
    boxDiv.appendChild(createTextDiv("value-value", val + unit));
    if (key == 'ec') {
      boxDiv.onclick = function() {
        location = "events.html";
      }
    } else if (key == "csv") {
      boxDiv.onclick = function() {
        location = "csvlst.html";
      }
    } else if (key == "st" && val == "ALARM") {
      boxDiv.onclick = function() {
        location = "alarm.html";
      }
    }
    contentDiv.appendChild(boxDiv);
  }
  var state = data["st"];
  if (state != "A") {
    if (state != "H") {
      contentDiv.appendChild(createCommandBox("Manual run", "Start", "H"));
    } else {
      contentDiv.insertBefore(createCommandBox("Manual run", "Stop", "H"), contentDiv.firstElementChild);
    }
  }
  var s = data["r"];
  if (s.charAt(0) == "0" && s.charAt(6) == "0") {
    contentDiv.appendChild(createCommandBox("Valves", "Back", "V"));
  }
}

var eventHeaders = ["timestamp", "event", "value 1", "value 2", "count"];
var eventLabels = ["EEPROM", "Restart", "Watchdog", "Wifi NC", "Pump problem", "MODBUS error", "Overheat", "Balboa pause", "Manual run", "Valves back", "Suspend calibration", "BattSett"];

function showEvents(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  var eventsHeaderDiv = document.createElement("DIV");
  eventsHeaderDiv.className = "table-header";
  for (var i in eventHeaders) {
    eventsHeaderDiv.appendChild(createTextDiv("table-header-cell", eventHeaders[i]));
  }
  contentDiv.appendChild(eventsHeaderDiv);
  var events = data.e;
  events.sort(function(e1, e2) { return (e2.t - e1.t); });
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var tmpstmp = "";
    if (event.t != 0) {
      tmpstmp = t2s(event.t);
    }
    var v1 = "";
    if (event.v1 != 0) {
      v1 = "" + event.v1;
    }
    var v2 = "";
    if (event.v2 != 0) {
      v2 = event.v2;
    }
    var eventDiv = document.createElement("DIV");
    eventDiv.className = "table-row";
    eventDiv.appendChild(createTextDiv("table-cell", tmpstmp));
    eventDiv.appendChild(createTextDiv("table-cell", eventLabels[event.i]));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", v1));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", v2));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", "" + event.c));
    contentDiv.appendChild(eventDiv);
  }
  if (data["s"] == 0) {
    contentDiv.appendChild(createButton("Save", "S"));
  }
}

function showCsvFilesList(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  var eventsHeaderDiv = document.createElement("DIV");
  eventsHeaderDiv.className = "table-header";
  eventsHeaderDiv.appendChild(createTextDiv("table-header-cell", "File"));
  eventsHeaderDiv.appendChild(createTextDiv("table-header-cell", "Size (kb)"));
  contentDiv.appendChild(eventsHeaderDiv);
  var files = data.f;
  files.sort(function(f1, f2) { return -f1.fn.localeCompare(f2.fn); });
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var fileDiv = document.createElement("DIV");
    fileDiv.className = "table-row";
    fileDiv.appendChild(createLinkDiv("table-cell", file.fn, "/CSV/" + file.fn));
    fileDiv.appendChild(createTextDiv("table-cell table-cell-number", "" + file.size));
    contentDiv.appendChild(fileDiv);
  }
}


function showAlarm(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  var label = alarmLabels[data.a];
  contentDiv.appendChild(createTextDiv("message-label", label));
  if (data.a == 0) 
    return;
  contentDiv.appendChild(createTextDiv("message-timestamp", t2s(data.e.t)));
  if (label == "Pump") {
    contentDiv.appendChild(createTextDiv("message-text", "Current sensor value is " + data.e.v1 + ". Expected value is " + data.e.v2 + "."));
    contentDiv.appendChild(createButton("Reset", "P"));
  }
}

function createTextDiv(className, value) {
  var div = document.createElement("DIV");
  div.className = className;
  div.appendChild(document.createTextNode("" + value));
  return div;
}

function createLinkDiv(className, value, url) {
  var div = document.createElement("DIV");
  div.className = className;
  var link = document.createElement("A");
  link.href = url;
  link.appendChild(document.createTextNode("" + value));
  div.appendChild(link);
  return div;
}

function createButton(text, command) {
  var button = document.createElement("BUTTON");
  button.className = "button";
  button.onclick = function() {
    if (!confirm("Are you sure?"))
      return;
    var xhr = new XMLHttpRequest();
    xhr.onerror = function(e) {
      alert(xhr.status + " " + xhr.statusText);
    }
    xhr.onload = function(e) {
      location.reload();
    };
    xhr.open("GET", "http://" + host + ":" + restPort + "/" + command, true);
    xhr.send();
  }
  button.appendChild(document.createTextNode(text));
  return button;
}

function createCommandBox(title, label, command) {
  var boxDiv = document.createElement("DIV");
  boxDiv.className = "value-box";
  boxDiv.appendChild(createTextDiv("value-label", title));
  var div = document.createElement("DIV");
  div.className = "value-value";
  div.appendChild(createButton(label, command));
  boxDiv.appendChild(div);
  return boxDiv;
}

function t2s(t) {
  var date = new Date(t * 1000);
  var tmpstmp = date.toISOString();
  return tmpstmp.substring(0, tmpstmp.indexOf('.')).replace('T', ' ');
}
