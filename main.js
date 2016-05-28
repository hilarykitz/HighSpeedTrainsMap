var map = L.map('map', {maxZoom: 9, minZoom:2}).setView([51.7833, 19.4667], 4);
var token = 'sk.eyJ1IjoiaGlsYXJ5a2l0ejIiLCJhIjoiY2lrcXFwajc5MDAwcHZva3Fsd2h2aGlvbCJ9.Nq4HNGoGosl1boPA0oGgog';

var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/hilarykitz2.a696f846/{z}/{x}/{y}.png?access_token=' + token, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
}).addTo(map);

map.createPane('labels');

var terrain = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
  maxZoom: 13,
  opacity:0.4
});

var carto = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  opacity:0.9,
  pane: 'labels'
}).addTo(map);

terrain.addTo(map);


map.getPane('labels').style.zIndex = 650;
map.getPane('markerPane').style.zIndex = 666;
map.getPane('labels').style.pointerEvents = 'none';



var cityLocGetter = new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google({
          bounds: 35.084380|-11.333104|70.211940|51.163554
       })
});
cityLocGetter.addTo(map);




$.getJSON("data/routes.json", function(data) {

var i = 0, level, countries = [], countryList = [], cities = [], cityList = [], routes = [];
var dataSet = [];
    $.each(data, function(d){
        var URL = data[d].URL, 
            country = data[d].Countries,
            city = data[d].dep_city,
            speed = data[d].speed,
            route = data[d].route,      
            countryIndex = findCountryObject(dataSet, country);
        if (countryIndex === -1) {
          dataSet.push({
            countryName: country,
            departuresCities: []
          });//push
          countryIndex = dataSet.length -1;
        }

        var departureCityIndex = findDepartureCityObject(dataSet[countryIndex].departuresCities, city);
        
        if (departureCityIndex === -1) {
          dataSet[countryIndex].departuresCities.push({
            departureCityName: city,
            routes: []
          });//push
          departureCityIndex = dataSet[countryIndex].departuresCities.length -1;
        }

        dataSet[countryIndex].departuresCities[departureCityIndex].routes.push({
          routeName: route,
          url: URL 
        });//push
    });//each
      listCountries(dataSet);//list the countries
});//end callback


function findCountryObject(arr, cuntName) {
  for (i = 0; i < arr.length; i++) {
    if (arr[i].countryName === cuntName) {
      return i;
    }
  }
  return -1;
};

function findDepartureCityObject(arr, cityName) {
  for (i = 0; i < arr.length; i++) {
    if (arr[i].departureCityName === cityName) {
      return i;
    }
  } 
  return -1;
};

function listCountries(set) {
          $.each(set, function(i){
            var country = set[i].countryName;
            var cTitle = country.replace("_"," ");
            var city = set[i].departuresCities;
            $("#links").append("<li class='a-list'><p class='a-trigger'>" + cTitle + "</p><ul class='" + country + "'></ul></li>");  
            for (var s = 0; s < city.length; s++) {
              var cityName = city[s].departureCityName;
              var speed = city[s].speed;
              var cityTitle = cityName.replace("_"," ");
                $("." + country).append("<li class='b-list'><p class='b-trigger' onclick=fly('" + cityName + "," + country + "') >" + cityTitle + "</p><ul class=" + cityName + "></ul></li>");   
              var route = city[s].routes;
                for (var r = 0; r < route.length; r++ ) {
                  var rName = route[r].routeName.replace(" - ",","), dest = rName.split(",")[1], rTitle = route[r].routeName.replace("_"," ").replace("+Italy","");
                  var rURL = route[r].url;
                  (route[r].url) ? routeURL = "<a target='_blank' href=" + route[r].url + ">" : routeURL = "<a>";
                  $("." + cityName).append("<li onmouseover=fly('" + dest + "','" + rName + "','" + rURL + "')>" + routeURL + rTitle + "</a></li>");
                }//routes
            }//cities
          });//countries
      
      $(".a-trigger").unbind("click").click(function(){
         $(".icon").remove();
        var tp = $(this).parent(".a-list");
        if (tp.hasClass("open-list")) {
          tp.removeClass("open-list");
        } else {tp.addClass("open-list");  $(".open-list").not(tp).removeClass("open-list");}
      });
      $(".b-trigger").unbind("click").click(function(){
        var tp = $(this).parent(".b-list");
        if (tp.hasClass("open-b-list")) {
          tp.removeClass("open-b-list");
        } else {tp.addClass("open-b-list");  $(".open-b-list").not(tp).removeClass("open-b-list");}
        $(".icon").remove();
      });
};//list countries

$.getJSON( "data/trains.json", function( data ) {

 $.each(data.features, function(i, feature){
      var i = -1,
        coordArray = [],
        countrypolys = [];

  $.each(feature.geometry.coordinates, function(j, coordinates){
      var latLng = new L.LatLng(coordinates[0], coordinates[1]);
      coordArray.push(latLng);  
    });

    var polylineOptions = {
               weight: 1.7,
               className: feature.properties.className,
               opacity:1,
               smoothFactor:1
             };

    var underlineOptions = {
               weight: 3,
               opacity:1,
               smoothFactor:1,
               className: feature.properties.className + " underline"
             };

    var popup = L.popup();
    var providerURL , connection;
    var name = feature.properties.name;
    (feature.properties.url) ? providerURL = "<a target='_blank' href='http://www.goeuro.com/train_providers/" + feature.properties.url + "'>" : providerURL = "";
    (feature.properties.connections) ? connection = "<p>"+ feature.properties.connections + "</p>" : connection = "";
    var info = "<h1 class='maxspeed " + feature.properties.className + "'>" + feature.properties.maxspeed + "<p>km/hr</p></h1><img onerror='hide(this)' class='train-icon' src='http://cdn.goeuro.com/static_content/web/content/rest/highspeed_trains/"+ name +".png'/><p class='provider'>" + providerURL + name+ "</a></p></div><p>"+ connection + "</p></div>";
    var underlineTrains = new L.Polyline(coordArray, underlineOptions).bindPopup(info).on("mouseover", function(e){
                       this.setStyle({weight: 9});
                    }).on("mouseout", function(e){
                        this.setStyle({weight: 3});
                    }).on('click', function(e) { 
                        this.openPopup();
                      }).addTo(map);
    var polylineTrains = new L.Polyline(coordArray, polylineOptions).bindPopup(info).on("mouseover", function(e){
                       underlineTrains.setStyle({weight: 9});
                    }).on("mouseout", function(e){
                        underlineTrains.setStyle({weight: 3});
                    }).on('click', function(e) { 
                        this.openPopup();
                      }).addTo(map);


  });//data each
});//callback


map.on('click', function(e){
  var lat = e.latlng.lat;
  var lng = e.latlng.lng;
  $(".open").removeClass("open");
  $("#lats").append("[" + lat + "," + lng + "],");
});

var shownCities = [];

var icon = new L.divIcon({    
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        shadowSize: [1, 1],
        className: 'icon',
        html: "<div class='animated-icon'></div>"
});  


function fly(thisCity, thisRoute, rURL) {

  $(".animated-icon").addClass("used");
    if (shownCities.thisCity) {}
    else { 
      var city = thisCity; 
      if (thisRoute){var route = thisRoute.replace(","," → ").replace("_"," ");};
   
    var googleGeocodeProvider = new L.GeoSearch.Provider.Google({region:"EU"}), addressText = thisCity + " Europe";
    console.log(addressText);
        googleGeocodeProvider.GetLocations( addressText, function ( data ) {
            var lat = data[0].X;
            var lng = data[0].Y;
            var latlng = [lng, lat];
            var marker = new L.Marker(latlng, {icon: icon}); 
            marker.addTo(map);
          if (rURL) {
            marker.bindPopup("<a target='_blank' style='font-size:12px;' href="+rURL+"><p>" + route + "</p></a>").openPopup();
          }
            map.setView( latlng, 7, {animate:true, duration:0.75, noMoveStart:true, easeLinearity: 0.05});

        }, {region:"EU"});//geocoder
    }//else
};

function hide(t) {
  t.style.display = "none";
};

$(".sidebar-tab").unbind("click").click(function(){
  $(this).toggleClass("open");
  $(".sidebar").toggleClass("open");
});