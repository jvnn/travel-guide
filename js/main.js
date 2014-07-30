var locService = require('LocationService.js');
var guiService = require('GuiService.js');

var map = null;
var currentPopupData = null;

locService.readData('json/data.json', initMap);

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

	currentPopupData = guiService.getCreateNewPopup(event.latlng.lat, event.latlng.lng, "addNewItem()");
	popup.setLatLng(event.latlng)
		.setContent(currentPopupData.html)
		.openOn(map);
	currentPopupData.popup = popup;
}

function createMarkers() {
	items = locService.query();
	items.forEach(function(item) {
		createMarker(item);
	});
}

function createMarker(item) {
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
}

function addNewItem() {
	var name = currentPopupData.dataGetter.getName(document);
	var description = currentPopupData.dataGetter.getDescription(document);
	var tagString = currentPopupData.dataGetter.getTags(document);
	var tags = [];
	if (tagString != null) {
		var tags = tagString.split(',');
	}
	var location = currentPopupData.dataGetter.getLocation();

	var newItem = locService.addLocation(name, description, tags, location);
	if (newItem) {
		createMarker(newItem);
	}
	map.closePopup(currentPopupData.popup);
}
