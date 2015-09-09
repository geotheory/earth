cols = ["FF94C9EF","FFA1E82B","FFEEAF7D","FF49E6A3","FFEC9DEF","FFF3BB2B","FFD9F0D2","FFC7DE78","FFEFB2C6","FF42E7EA",
"FFE4E42A","FFCDBAF0","FF8FD39C","FFD6D3DA","FFCBBC79","FFE8C25B","FF43EBCC","FFAECE43","FF4BF18A","FFF4A4A1",
"FF9DCCD4","FFF6AD4A","FF86DEC1","FF41C9E1","FFEEBAA1","FFEFAEDE","FFE3F15E","FFEDE59C","FFE2CF4B","FFDBC49A",
"FF6CE088","FFEEB569","FFBBF3BE","FF7CE9B1","FFB2CEB0","FF77DDE3","FFC2EAEA","FFE2C3CA","FF87EDDF","FFD1D0C4",
"FFD0CAE4","FFD8D66D","FF75CFEF","FFAEE149","FFC9CD44","FF67D1C6","FFADC4F0","FFF1D59C","FFE3CD7D","FF54DCF8"];
coln = 0;

msg_head = "<html><head><title>internal_page</title><style> p {line-height:1.4; margin-left: 10%; margin-right: 10%; word-wrap: break-word; color: #999;} body { overflow: hidden; width: 95%; color: #ddd; text-align: center; font-family: arial; padding: 0em 0;} h1 { width: 80%; font-size: 2em; margin: auto; padding: 0em 0; }img, div { display: block; margin: auto; padding: 0em; }</style></head><body  onKeyDown='return keyDown(event);' onKeyUp='return keyUp(event);''><img src='img/wikiglobe.gif' width='100' height='100'>";
msg_tail = "</body></html>";
wiki404 = "<h2>Oh dear..</h2><p>The page that pointer links to doesn't seem to exist.  It's URL may have recently changed.</p><p><b>";
// wiki_comma = "<h2>We've hit a bug..</h2><p>The page that pointer links to has a comma in the URL, which causes problems for a dependency of this app.  This will hopefully be resolved soon.</p>";
wiki_comma = "<h2>We've hit a bug..</h2><p>Something is causing problems for a dependency of this app.  I'm working to resolve..</p>";
welcome_msg = msg_head + "<h2>Wiksplorer</h2><p>Navigate by keyboard. Mouseclick place-markers<br/>to view their Wikipedia content</p><h4>Navigation</h4><style type='text/css'>.key{width: 20%; text-align:center; color: #D7B852;}.ctrl{width: 80%; color: #999;}</style><table width='100%' class='welcome_tbl'><tr><td class='key'>w / s</td><td class='ctrl'>Move forward / backward</td></tr><tr><td class='key'>a / d</td><td class='ctrl'>Strafe left / right</td></tr><tr><td class='key'>&#8596; arrows</td><td class='ctrl'>Turn left / right</td></tr><tr><td class='key'>&#8597; arrows</td><td class='ctrl'>Move up / down</td></tr></table><h4>Other controls</h4><table width='100%' class='welcome_tbl'><tr><td class='key'>h</td><td class='ctrl'>Show Wikipedia search area</td></tr><tr><td class='key'>j</td><td class='ctrl'>Search for and display Wikipedia entries</td></tr><tr><td class='key'>r</td><td class='ctrl'>Remove all Wikipedia entries from map</td></tr><tr><td class='key'>g</td><td class='ctrl'>Toggle lat/longitude grid</td></tr><tr><td class='key'>b</td><td class='ctrl'>Toggle Google Earth places</td></tr></table>" + msg_tail;
welcome_scr = true;

wiki_url = "http://en.m.wikipedia.org/wiki/Earth";
data = 0;
kk = 0;
circle = 0;
circle_mode = false;
circle_time = 0;

camCoords = {lat: 51.504753, lon: -0.126375, alt: 250, heading: 180, tilt: 70};
bearing = 180;
camX = camCoords.lon;
camY = camCoords.lat;
cameraAltitude = 200;

lastFrame = 0;

speedForward = 0.0;
speedUp = 0.1;
speedStrafe = 0.0;
speedTurn = 0.0;
f_bearing = 0.0;

tilt = 0;
tiltForward = 0.0;
tiltAltitude = 0.0;
tiltForwardSpeed = 0.0;
tiltSide = 0.0;

roll = 0;
rollSpeed = 0;
maxRoll = 20;
heightFromGround = 0;

DEG2RAD = Math.PI/180.0;
slowMult = 1 / (Math.cos(150 * DEG2RAD) + 1); // adjustment constant for slow interpolation function
slowFrames = 30;

// indices to time slowing interpolations
slowForward = 1000;
slowStrafe = 1000;
slowUp = 1000;
slowTurn = 1000;

// log manouvering speeds to interpolate back to zero when slowing
maxForward = 0;
maxStrafe = 0;
maxUp = 0;
maxTurn = 0;
maxRollTilt = 0;

// dampen/constrain speed-up commands
dampForward = 0.9;
dampUp = 0.9;
dampStrafe = 0.85;
dampTurn = 0.9;
dampRoll = 0.9;
dampRollSpeed = 0.9;

// calibration variables
calGeneral = 0.8;
calForward = 0.015;
calStrafe = 0.015;
calUp = 0.6;
calDown = 0.3;
calUpDamp = 0.0;
calTurn = 2.5;
maxTurnSpeed = 100.0;
calRoll = 0.1;
calAltitude = 0.0; // special scalar
calAltAdjust = 1.0/50;

// booleans
turnLeft = false;
turnRight = false;
tiltUp = false;
tiltDown = false;
moveForward = false;
moveBackward = false;
strafeLeft = false;
strafeRight = false;
altitudeUp = false;
altitudeDown = false;
rolling = false;
borders = false;
mapInset = false;
grid = false;
moving = false;
api_active = true;
kml_pointer = false;

function wrap180(a){
  if(a > 180) a -= 360;
  else if(a < -180) a += 360;
  return a;
};

function wrap360(a){
  if(a > 360) a -= 360;
  else if(a < 0) a += 360;
  return a;
};

function moveCamera(p1, brng, dist){
  var p2 = gc_waypoint(p1, brng, dist);
  var finalBearing = wrap360(gc_final_bearing(p1, p2));
  return [{lon: p2.lon, lat: p2.lat}, finalBearing];
};

function interpSlow(maxval, t){
  return maxval * slowMult * (Math.cos((150 + 30 * t/slowFrames) * DEG2RAD) + 1);
}

// WIKIPEDIA FUNCTIONS

function modifications(){
  $("#wikipedia").contents().find("div").remove( ".hatnote" ); // remove hatnote
  // revert wikipedia links back to their domain
  var domain = "http://" + document.location.host + '/wiki';
  $("#wikipedia").contents().find("a").each(function(){
      // if(this.href.contains("/wiki/")) this.href = this.href.replace(domain, "https://en.m.wikipedia.org/wiki");
      if(this.href.indexOf("/wiki/") != -1) this.href = this.href.replace(domain, "https://en.m.wikipedia.org/wiki");
      // data.indexOf("Call to a member function find") == -1
  });
  $('#wikipedia').contents().scrollTop(0);
}

// KML FUNCTIONS

// add spindlytext.js placemarker
function formatSpindle(title, kml_col){
  var d = spindlyDict[title];
  var degreesToCam = Math.atan2(d.position.lon - d.campos.lon, d.position.lat - d.campos.lat) * 180 / Math.PI;
  var scale = d.size/150;
  var spindle = new Spindlytext(d.position.lat, d.position.lon, d.height, {colour: kml_col, lineWidth: 2.4});
  spindlex = spindle;
  spindle.text(title, {bearing: degreesToCam, size: 4*scale, colour: kml_col, lineWidth: 2.4});
  var nodeKml  = spindle.kml();
  var node = ge.parseKml(nodeKml);
  return node;
}

function spindleMousedown(node, title, url){
  google.earth.addEventListener(node, 'mousedown', function(){
    if(welcome_scr){
      welcome_scr = false;
      $('.cd-btn').show();
    }
    if(wiki_url != title){
      wiki_url = title;
      $.post("wikipedia.php", { url: url }, function(data, status){
        dataw = data;
        if(!data) console.log(status);
        // FIX FOOTNOTE PROBLEM RELATING TO 4 LINES BELOW
        if(data.indexOf("failed to open stream") != -1) data = msg_head + wiki404 + url + "</b></p>" + msg_tail;
        if(data.indexOf("Call to a member function find") != -1) data = msg_head + wiki_comma + msg_tail;
        $("#wikipedia").contents().find("body").html(data);
        modifications();
      });
    }
  });
}

// add spindlytext.js placemarker
function addSpindlyMarker(title){
  var d = spindlyDict[title];
  var node = formatSpindle(title, d.kmlcol);
  nodex = node;
  spindlyDict[title]['node'] = node;
  ge.getFeatures().appendChild(node);

  // MOUSEDOWN
  spindleMousedown(node, title, d.url);

  // MOUSEOVER
  google.earth.addEventListener(node, 'mouseover', function(){
    while(selected_kml.length > 0){
      var other_title = selected_kml.pop();
      removeSpindlyMarker(other_title);
      addSpindlyMarker(other_title);
    }
    selected_kml.push(title);
    removeSpindlyMarker(title);   // remove existing
    node = formatSpindle(title, 'FFFFFFFF');
    spindlyDict[title]['node'] = node;
    ge.getFeatures().appendChild(node);  // append white
    spindleMousedown(node, title, d.url);

    // MOUSEOUT
    google.earth.addEventListener(node, 'mouseout', function(){
      removeSpindlyMarker(title);
      addSpindlyMarker(title);
    });
  });
}


// remove spindlytext placemarker
function removeSpindlyMarker(title){
  ge.getFeatures().removeChild(spindlyDict[title].node);
};


// remove all KML elements
function resetKML(){
  var features = ge.getFeatures();
  while (features.getFirstChild()){
    features.removeChild(features.getFirstChild());
  }
  spindlyDict = {};
}


// API target - return search position and radius
function wiki_target(){
  var p0 = {lon: camX, lat: camY};
  var p1 = gc_waypoint(p0, bearing, heightFromGround * 0.0035);
  var radius = Math.min(20, heightFromGround/500);
  var elev1 = ge.getGlobe().getGroundAltitude(p1.lat, p1.lon);
  var elev2 = Math.max(20, Math.round(elev1));
  return {pos: p1, radius: radius, elev: elev2};
};

// draw KML circle matching API search area
function wiki_circle(){
  if(!circle_mode){
    circle_time = (new Date()).getTime();
    circle_mode = true;
    kml_pointer = false;
    var target = wiki_target();
    var height = Math.min(10000, Math.max(10, (heightFromGround - target.elev) * 0.4));
    var p0 = target.pos;
    var radius = target.radius;
    var ang = 24;
    var coords = '';
    for(var i=0; i<16; i++){
      var p1 = gc_waypoint(p0, i*ang, radius)
      coords = coords + ' ' + p1.lon + ',' + p1.lat + ',' + height;
    }
    var kmlcol_line = 'ff00ffff';
    var kmlcol_fill = '6600ffff';
    var kmlargs = '';
    var kmlwidth = 2;
    var root = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Style id="transBluePoly"><LineStyle><width>' + kmlwidth + '</width><color>' + kmlcol_line + '</color></LineStyle><PolyStyle><color>' + kmlcol_fill + '</color></PolyStyle></Style><Placemark><name>api_target</name><styleUrl>#transBluePoly</styleUrl><Polygon><extrude>1</extrude><altitudeMode>relativeToGround</altitudeMode><outerBoundaryIs><LinearRing><coordinates>';
    var tail = '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>';
    var kml = root + coords + tail;
    circle = ge.parseKml(kml);
    ge.getFeatures().appendChild(circle);
  }
};

// API call
function wiki_api(){
  wiki_circle();
  var rows = 20;
  var target = wiki_target();
  var position = target.pos;
  var radius = target.radius;
  var root = "http://api.geonames.org/findNearbyWikipediaJSON?formatted=true&lat=";
  var auth = "&username=geotheory&style=full&maxRows=";
  var api_call = root + position.lat + "&lng=" + position.lon + auth + rows + "&radius=" + radius;
  jsonIn = $.getJSON( api_call, function() {});
  jsonIn.complete(function() {
    data = jsonIn.responseJSON.geonames;
  });
};


//----------------------------------------------------------------------------
// Input Handlers
//----------------------------------------------------------------------------

function keyDown(event) {
  if (!event) {
    event = window.event;
  }
  if(event.keyCode == 66){           // B: Borders
    borders = !borders;
    ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, borders);
    event.returnValue = false;
  } else if (event.keyCode == 77) {  // M: Map inset
    mapInset = !mapInset;
    ge.getOptions().setOverviewMapVisibility(mapInset);
    event.returnValue = false;
  } else if (event.keyCode == 71) {  // G: grid
    grid = !grid;
    ge.getOptions().setGridVisibility(grid);
    event.returnValue = false;
  } else if (event.keyCode == 82) {  // R: remove all existing KML
    resetKML();
    event.returnValue = false;
  } else if (event.keyCode == 70) {  // F: activate/freeze API
    api_active = !api_active;
    event.returnValue = false;
  } else if (event.keyCode == 72) {  // H: toggle kml aimer
    kml_pointer = !kml_pointer;
    event.returnValue = false;
  } else if (event.keyCode == 74) {  // J: NA
    wiki_api();
    event.returnValue = false;

  // NAVIGATION
  } else if (event.keyCode == 38) {  // Up arrow: Altitude Up
    altitudeUp = true;
    event.returnValue = false;
  } else if (event.keyCode == 40) {  // Down arrow: Altitude Down
    altitudeDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 37) {  // A: Turn Left
    turnLeft = true;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // D: Turn Right
    turnRight = true;
    event.returnValue = false;
  } else if (event.keyCode == 65 ||
             event.keyCode == 97) {  // Left arrow: Strafe Left
    strafeLeft = true;
    event.returnValue = false;
  } else if (event.keyCode == 68 ||
             event.keyCode == 100) { // Right arrow: Strafe Right
    strafeRight = true;
    event.returnValue = false;
  } else if (event.keyCode == 87 ||
             event.keyCode == 119) { // W: Move Forward
    moveForward = true;
    event.returnValue = false;
  } else if (event.keyCode == 83 ||
             event.keyCode == 115) {  // S: Move backward
    moveBackward = true;
  } else {
    return true;
  }
  return false;
}

function keyUp(event) {
  if (!event) {
    event = window.event;
  }

  if (event.keyCode == 38) {         // Altitude Up
    altitudeUp = false;
    slowUp = 0;
    maxUp = speedUp;
    event.returnValue = false;
  } else if (event.keyCode == 40) {  // Altitude Down
    altitudeDown = false;
    slowUp = 0;
    maxUp = speedUp;
    event.returnValue = false;
  } else if (event.keyCode == 37) {  // Turn left.
    turnLeft = false;
    slowTurn = 0;
    maxTurn = speedTurn;
    maxRollTilt = roll;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // Turn Right.
    turnRight = false;
    slowTurn = 0;
    maxTurn = speedTurn;
    maxRollTilt = roll;
    event.returnValue = false;
  } else if (event.keyCode == 65 ||
             event.keyCode == 97) {  // Strafe Left.
    strafeLeft = false;
    slowStrafe = 0;
    maxStrafe = speedStrafe;
    event.returnValue = false;
  } else if (event.keyCode == 68 ||
             event.keyCode == 100) {  // Strafe Right.
    strafeRight = false;
    slowStrafe = 0;
    maxStrafe = speedStrafe;
    event.returnValue = false;
  } else if (event.keyCode == 87 ||
             event.keyCode == 119) {  // Move Forward.
    moveForward = false;
    slowForward = 0;
    maxForward = speedForward;
    event.returnValue = false;
  } else if (event.keyCode == 83 ||
             event.keyCode == 115) {  // Move Forward.
    moveBackward = false;
    slowForward = 0;
    maxForward = speedForward;
  }
  return false;
}

function refocus(){
  // remove DOM focus from elements that suppress key-listeners
  $('embed').trigger('focus');
  $('embed').trigger('blur');
  $('#wikipedia').trigger('blur');
  $('#side_panel').trigger('focus');
}


function welcome(){
  welcome_scr = true;
  $('.cd-btn').hide();
  $('#wikipedia').contents().find("body").html(welcome_msg);

  // manage iframe focus
  var iframe = $("#wikipedia");
  $('body', iframe.get(0).contentDocument).mouseup(function(){
    refocus();
  });
}

function simulatedClick(target, options) {

    var event = target.ownerDocument.createEvent('MouseEvents'),
        options = options || {};

    //Set your default options to the right of ||
    var opts = {
        type: options.type                   || 'click',
        canBubble:options.canBubble          || true,
        cancelable:options.cancelable        || true,
        view:options.view                    || target.ownerDocument.defaultView,
        detail:options.detail                || 1,
        screenX:options.screenX              || 0, //The coordinates within the entire page
        screenY:options.screenY              || 0,
        clientX:options.clientX              || 0, //The coordinates within the viewport
        clientY:options.clientY              || 0,
        ctrlKey:options.ctrlKey              || false,
        altKey:options.altKey                || false,
        shiftKey:options.shiftKey            || false,
        metaKey:options.metaKey              || false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
        button:options.button                || 0, //0 = left, 1 = middle, 2 = right
        relatedTarget:options.relatedTarget  || null,
    }

    //Pass in the options
    event.initMouseEvent(
        opts.type,
        opts.canBubble,
        opts.cancelable,
        opts.view,
        opts.detail,
        opts.screenX,
        opts.screenY,
        opts.clientX,
        opts.clientY,
        opts.ctrlKey,
        opts.altKey,
        opts.shiftKey,
        opts.metaKey,
        opts.button,
        opts.relatedTarget
    );

    //Fire the event
    target.dispatchEvent(event);
}


// MAIN LOOP

function update() {
  kk++;

  var now = (new Date()).getTime();

  if(kml_pointer) wiki_circle();

  if(circle_mode){
    if(now - circle_time > 1000){
      circle_mode = false;
      ge.getFeatures().removeChild(circle);
      circle = 0;
    }
  }

  // time variable
  var dt = (now - lastFrame) / 1000.0;
  if (dt > 0.25) dt = 0.25;
  lastFrame = now;

  // GE environmental variables
  camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
  heightFromGround = cameraAltitude - ge.getGlobe().getGroundAltitude(camY, camX);
  calAltitude = 1.5 * Math.pow(Math.max(0.7, heightFromGround * calAltAdjust), 0.88);
  
  // FORWARD
  if (moveForward || moveBackward) {
    var forwardVelocity = calForward * calAltitude;
    if (moveBackward) forwardVelocity *= -1;
    speedForward += forwardVelocity * dt;
    speedForward *= dampForward;
  }

  if(!moveForward & !moveBackward & slowForward <= slowFrames){
    speedForward = interpSlow(maxForward, slowForward);
    slowForward++;
  }

  
  // STRAFE
  if (strafeLeft || strafeRight) {
    var strafeVelocity = calStrafe * calAltitude;
    if (strafeLeft) strafeVelocity *= -1;
    speedStrafe += strafeVelocity * dt;
    speedStrafe *= dampStrafe;
  }
  
  if(!strafeLeft & !strafeRight & slowStrafe <= slowFrames){
    speedStrafe = interpSlow(maxStrafe, slowStrafe);
    slowStrafe++;
  }

  // TURN
  
  // increase turn speed at slow
  var slowTurnMult;
  var totalSpeed = Math.abs(speedForward) + Math.abs(speedStrafe);
  if(totalSpeed < 0.5) slowTurnMult = 0.7 + Math.min(Math.max((0.5 - totalSpeed),0),0.5)/0.5;
  else slowTurnMult = 0.7;

  if      (turnLeft || turnRight) {
    var turn = calTurn * slowTurnMult * 0.05;
    if(turnLeft) turn *= -1;
    speedTurn += turn;
    speedTurn *= dampTurn;
    if (speedTurn > maxTurnSpeed) speedTurn = maxTurnSpeed;
    else if (speedTurn < -maxTurnSpeed) speedTurn = -maxTurnSpeed;
  }
  //speedTurn *= dampTurn;
  //if(Math.abs(speedTurn) < 0.01) speedTurn = 0;

  if(!turnLeft & !turnRight & slowTurn <= slowFrames){
    speedTurn = interpSlow(maxTurn, slowTurn);
    slowTurn++;
  }

  // ALTITUDE
  if(altitudeUp || altitudeDown) calUpDamp = Math.max(Math.min(calUpDamp + 0.06, 1.0),0.3);
  calUpDamp *= 0.95;

  if (altitudeUp) speedUp += calUpDamp * calUp * calAltitude * calGeneral;
  else if (altitudeDown) speedUp -= calUpDamp * calDown * calAltitude * calGeneral;
  speedUp *= dampUp;

  if(!altitudeUp & !altitudeDown & slowUp <= slowFrames){
    speedUp = interpSlow(maxUp, slowUp);
    slowUp++;
  }

  if(heightFromGround > 4 | (heightFromGround <= 4 & speedUp > 0)) cameraAltitude += speedUp;
  else if(heightFromGround < 4) {
    speedUp = 0;
    cameraAltitude += 4 - heightFromGround;
  }
  cameraAltitude = Math.min(65000000, Math.max(4, cameraAltitude));

  // TILT
  var Z = Math.log(Math.max(1, heightFromGround));
  tilt = -44.158190 + (Z *  26.208879) + (Math.pow(Z,2) * -4.244970) + 
          (Math.pow(Z,3) * 0.270058) + (Math.pow(Z,4) * -0.004788);
  tilt = Math.min(90, Math.max(0, 90 - tilt));
  
  // GREAT CIRCLE CALCULATIONS
  var bearingAdjust = speedTurn,
      lastBearing = bearing,
      currentPosition = { lon: camX, lat: camY },
      destination = currentPosition;

  bearing = wrap360(bearing + speedTurn); // feeds into movements but overwritten if they take place

  // FORWARD / BACKWARD
  if(Math.abs(speedForward) < 0.00001) speedForward = 0;
  else{
    var moveBearing = bearing;
    if(speedForward < 0) moveBearing = (moveBearing + 180) % 360; // u-turn
    var forwardMove = moveCamera(currentPosition, moveBearing, Math.abs(speedForward));
    destination = forwardMove[0];

    // camera direction after move
    bearing = forwardMove[1];
    if(speedForward < 0) bearing = (bearing + 180) % 360; // look forwards
  }

  // STRAFE
  if(Math.abs(speedStrafe) < 0.00001) speedStrafe = 0;
  else{

    var strafeBearing = bearing;
    if(speedStrafe < 0) strafeBearing -= 90;
    else strafeBearing += 90;
    var strafeMove = moveCamera(destination, strafeBearing, Math.abs(speedStrafe));
    destination = strafeMove[0];

    // camera direction after move
    bearing = strafeMove[1];
    if(speedStrafe < 0) bearing += 90;
    else bearing -= 90;
  }

  // ROLL
  if(speedForward > 0){
    if(turnLeft) rollSpeed += calRoll * 1/slowTurnMult;
    if(turnRight) rollSpeed -= calRoll * 1/slowTurnMult;
    rollSpeed *= dampRollSpeed;
    roll += rollSpeed;
    roll *= dampRoll;
    if(roll > maxRoll) roll = maxRoll;
    if(roll < -maxRoll) roll = -maxRoll;
  }

  if(!turnLeft & !turnRight & slowTurn <= slowFrames){
    roll = interpSlow(maxRollTilt, slowTurn);
  }
  
  camX = wrap180(destination.lon);
  camY = destination.lat;
  bearing = wrap360(bearing);

  camera.set(camY, camX,                       // position
             cameraAltitude,                   // altitude
             ge.ALTITUDE_ABSOLUTE,             // ge.ALTITUDE_ABSOLUTE
             bearing,                          // heading
             tilt,                             // tilt
             roll);                            // roll
  
  ge.getView().setAbstractView(camera);


  // new data received
  if(data != 0){
    var N = data.length;
    var k = 0;
    data = data.sort(function(a,b) { return parseFloat(b.rank) - parseFloat(a.rank) } ); // re-sort
    var adj = cameraAltitude * 0.12;
    for(var i=0; i<N; i++){
      var d = data[i];
      if(!(d.title in spindlyDict)){
        k++;
        if(k == 5) break;
        var p0 = {lat: d.lat, lon: d.lng};
        var elev_adj = adj * (k-2);
        var elev = cameraAltitude - elev_adj;
        var wlink = d.wikipediaUrl.replace("en.", "https://en.m."); // mobile version
        var kmlcol = cols[++coln];
        coln = coln % 50;
        spindlyDict[d.title] = { position: p0, campos: {lon: camX, lat: camY}, height: elev, size: cameraAltitude*0.9, kmlcol: kmlcol, url: wlink };
        addSpindlyMarker(d.title);
      }
    }
    data2 = data; // log for dev use
    data = 0;
  }

}
