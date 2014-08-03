var locService = require('LocationService.js');
var guiService = require('GuiService.js');

var map = null;
var currentPopupData = null;

window.onresize = function() {
	document.getElementById('map').style.height = window.innerHeight - 20 + "px";
}

locService.readData('json/data.json', initMap);

function initMap() {
	var centerPoint = locService.meanLocation();
	var zoom = (window.innerWidth / 256) * centerPoint.zoomRatio;
	zoom = Math.floor(Math.log(zoom) / Math.LN2);

	map = L.map('map').setView([centerPoint.lat, centerPoint.lon], zoom);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	map.on('dblclick', onMapClick);

	createMarkers();
}

function onMapClick(event) {
	event.originalEvent.preventDefault();
	event.originalEvent.stopPropagation();
	var popup = L.popup();

	currentPopupData = guiService.getCreateNewPopup(event.latlng.lat, event.latlng.lng, "addNewItem()");
	popup.setLatLng(event.latlng)
		.setContent(currentPopupData.html)
		.openOn(map);
	currentPopupData.popup = popup;
	return false;
}

function createMarkers() {
	items = locService.query();
	items.forEach(function(item) {
		createMarker(item);
	});
}

function createMarker(item) {
	var loc = locService.getLocation(item);
	var tags = item.tags;
	if (tags == null) {
		tags = [];
	}
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
			var icon = getMarkerIcon(tags);
			marker = L.marker([loc.lat, loc.lon], {icon: icon}).addTo(map);
		}

		if (marker) {
			marker.bindPopup(guiService.getSmallSummary(item, function() {
				locService.removeLocation(item);
				map.removeLayer(marker);
			}, function(newDescription) {
				newItem = locService.updateLocation(item, newDescription);
				map.removeLayer(marker);
				createMarker(newItem);
			}));
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


var markerAccommodation = L.icon({
		iconUrl: '../img/marker-accommodation.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerNature = L.icon({
		iconUrl: '../img/marker-nature.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerCity = L.icon({
		iconUrl: '../img/marker-city.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerTravel = L.icon({
		iconUrl: '../img/marker-travel.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerSight = L.icon({
		iconUrl: '../img/marker-sight.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerDefault = L.icon({
		iconUrl: '../img/marker-default.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

var markerWaypoint = L.icon({
		iconUrl: '../img/marker-waypoint.png',
		iconSize: [40, 49],
		iconAnchor: [15, 49],
		popupAnchor: [5, -45]
});

function containsSome(array, list) {
	for (var i = 0; i < list.length; i++) {
		if (array.indexOf(list[i]) >= 0) {
			return true;
		}
	}
	return false;
}

function getMarkerIcon(tags) {
	var icon = markerDefault;
	if (containsSome(tags, ["accommodation", "hotel", "motel", "hostel"])) {
		icon = markerAccommodation;
	} else if (containsSome(tags, ["lookout", "nature", "hiking", "national park"])) {
		icon = markerNature;
	} else if (containsSome(tags, ["city", "town", "location"])) {
		icon = markerCity;
	} else if (containsSome(tags, ["monument", "tourist attraction", "attraction", "sight", "tour"])) {
		icon = markerSight;
	} else if (containsSome(tags, ["travel", "airport"])) {
		icon = markerTravel;
	} else if (containsSome(tags, ["waypoint", "route", "target"])) {
		icon = markerWaypoint;
	}
	return icon;
}
