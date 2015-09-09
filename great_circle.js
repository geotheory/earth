// ny = {lon: -74.0059, lat: 40.7127 };
// lon = {lon: -0.1275, lat: 51.5072 };

R = 6378.137; // earth radius
//R = 3390; // earth radius
DEG2RAD =  Math.PI/180.0;
RAD2DEG = 1/DEG2RAD;

function gc_distance(p1, p2){
  var a1 = p1.lat * DEG2RAD;
  var a2 = p2.lat * DEG2RAD;
  var a_lat = (p2.lat-p1.lat) * DEG2RAD;
  var a_lon = (p2.lon-p1.lon) * DEG2RAD;
  var a = Math.sin(a_lat/2) * Math.sin(a_lat/2) +
        Math.cos(a1) * Math.cos(a2) *
        Math.sin(a_lon/2) * Math.sin(a_lon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

function gc_bearing(p1, p2){
  var λ1 = p1.lon * DEG2RAD;
  var φ1 = p1.lat * DEG2RAD;
  var λ2 = p2.lon * DEG2RAD;
  var φ2 = p2.lat * DEG2RAD;
  var φ = Math.sin(λ2-λ1) * Math.cos(φ2);
  var x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2-λ1);
  var brng = Math.atan2(φ, x) * RAD2DEG;
  if(brng < 0) brng += 360.0;
  return brng;
}

function gc_final_bearing(p1, p2){
  var b = gc_bearing(p2, p1);
  return (b + 180.0) % 360.0;
}

function gc_waypoint(p1, brng, d){
  var λ1 = p1.lon * DEG2RAD;
  var φ1 = p1.lat * DEG2RAD;
  brng = brng * DEG2RAD;
  var φ2 = Math.asin( Math.sin(φ1) * Math.cos(d/R) +
    Math.cos(φ1) * Math.sin(d/R) * Math.cos(brng) );
  var λ2 = λ1 + Math.atan2(Math.sin(brng) * Math.sin(d/R) * Math.cos(φ1),
    Math.cos(d/R) - Math.sin(φ1) * Math.sin(φ2));
  return {lon: λ2 * RAD2DEG, lat: φ2 * RAD2DEG};
}

// console.log("great_circle.js read in");