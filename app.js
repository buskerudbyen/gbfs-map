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
const drawNetwork = (network) => {

  fetch(`https://api.entur.io/mobility/v2/gbfs/${ network }/station_information`)
    .then(response => response.json())
    .then(json => {
      const markerGroup = L.featureGroup();

      json.data.stations.forEach(station => {
        console.log(station);
        const marker = L.marker([station.lat, station.lon])
          .bindPopup(station.name)
          .addTo(map);
        markerGroup.addLayer(marker);

      })

      map.fitBounds(markerGroup.getBounds());

    });
}

drawNetwork("drammenbysykkel");
