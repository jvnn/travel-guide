var fs = require('fs');
var locService = require('LocationService.js');
var guiService = require('GuiService.js');

var map = null;

fs.readFile('json/data.json', 'utf-8', function(error, contents) {
	if (error == null) {
		parseData(contents);
		initMap();
	} else {
		console.log("Couldn't read data file: " + error);
	}
});


function parseData(contents) {
	var data = JSON.parse(contents);
	locService.setData(data);
}

function initMap() {
	var centerPoint = locService.meanLocation();
	var zoom = (window.innerWidth / 256) * centerPoint.zoomRatio;
	zoom = Math.floor(Math.log(zoom) / Math.LN2);

	map = L.map('map').setView([centerPoint.lat, centerPoint.lon], zoom);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	map.on('click', onMapClick);

	createMarkers();
}

function onMapClick(event) {
	var popup = L.popup();
	popup.setLatLng(event.latlng)
		.setContent(guiService.getCreateNewPopup(event.latlng.lat, event.latlng.lng, function(item) {
			locService.addLocation(item);
		}))
		.openOn(map);
}

function createMarkers() {
	items = locService.query();
	items.forEach(function(item) {
		var loc = locService.getLocation(item);
		if (loc) {
			var marker = null;
			if (loc.radius) {
				var radiusMeters = locService.convertTo(loc.radius, "m");
				console.log(radiusMeters);
				marker = L.circle([loc.lat, loc.lon], radiusMeters, {
					color: '#30f',
    			fillColor: '#00f',
    			fillOpacity: 0.1
				}).addTo(map);
			} else {
				marker = L.marker([loc.lat, loc.lon]).addTo(map);
			}

			if (marker) {
				marker.bindPopup(guiService.getSmallSummary(item));
			}
		}
	});
}
