const bikeLayer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.maptiler.com/">Cyclosm</a>'
});

var map = L.map('map', {
  center: [0,0],
  zoom: 3,
  layers: [bikeLayer]
});

const baseLayers = {
  "Bicycle": bikeLayer
};

//L.control.layers(baseLayers).addTo(map);

const markerGroup = L.featureGroup();

const getData = (system, endpoint) => {
  fetch(`https://api.entur.io/mobility/v2/gbfs/${ system }/${endpoint}`)
    .then(response => {
      if(response.ok) {
        return response.json();
      } else {
        return { data: { bikes: [], stations: [] }};
      }
    })
  .then(json => {

    const data = json.data.stations || json.data.bikes || [];

    data.forEach(station => {
      const marker = L.marker([station.lat, station.lon])
        .bindPopup(station.name || "Free-floating bike")
        .addTo(map);
      markerGroup.addLayer(marker);

    })

    map.fitBounds(markerGroup.getBounds());

  });
};

const drawNetwork = (network) => {
  markerGroup.eachLayer((layer) => {
    layer.remove();
  });
  markerGroup.clearLayers();
  getData(network, "station_information");
  getData(network, "free_bike_status");

  const url = new URL(window.location);
  url.searchParams.set('system', network);
  window.history.pushState({}, '', url);

}

drawNetwork("drammenbysykkel");

fetch(`https://api.entur.io/mobility/v2/gbfs`)
  .then(response => response.json())
  .then(json => {

    const options = json.systems.map(s => s.id).map(name => {
      const option = document.createElement("option");
      option.onclick = (evt) => drawNetwork(name);
      const text = document.createTextNode(name);
      option.appendChild(text);
      return option;
    });

    const select = document.getElementById("systems");

    options.forEach(option => select.appendChild(option));
  });
