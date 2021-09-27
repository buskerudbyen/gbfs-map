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

const svgIcon = (available) => { return L.divIcon({
    html: `<img class='bicycle'src='bicycle.svg'><div class='badge'>${available}</div>`,
    className: "marker",
    iconAnchor: [12,12],
    iconSize: [20, 21],
    popupAnchor: [0, 0]
  });
};


const getStationData = (system) => {

  const info = fetch(`https://api.entur.io/mobility/v2/gbfs/${ system }/station_information`)
    .then(response => {
      if(response.ok) {
        return response.json();
      } else {
        return { data: { stations: [] }};
      }
    });

  const status = fetch(`https://api.entur.io/mobility/v2/gbfs/${ system }/station_status`)
    .then(response => {
      if(response.ok) {
        return response.json();
      } else {
        return { data: { stations: [] }};
      }
    });

  Promise.all([info, status]).then(data => {

    const info = data[0];
    const status = data[1];

    info.data.stations.forEach(station => {

      const stationStatus = status.data.stations.find(s => s.station_id == station.station_id);

      console.log(stationStatus)

      const marker = L.marker([station.lat, station.lon], { icon: svgIcon(stationStatus.num_bikes_available) })
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
  getStationData(network);

  const url = new URL(window.location);
  url.searchParams.set('system', network);
  window.history.pushState({}, '', url);
}


const queryParams = new URLSearchParams(window.location.search);
const system = queryParams.get('system') || "drammenbysykkel";
drawNetwork(system);

fetch(`https://api.entur.io/mobility/v2/gbfs`)
  .then(response => response.json())
  .then(json => {

    const options = json.systems.map(s => s.id).map(name => {
      const option = document.createElement("option");
      option.value = name;
      if(name == system) {
        option.selected = "selected";
      }
      const text = document.createTextNode(name);
      option.appendChild(text);
      return option;
    });

    const select = document.getElementById("systems");
    options.forEach(option => select.appendChild(option));

    select.onchange = (evt) => {
      const system = evt.target.selectedOptions[0].value
      drawNetwork(system);
    }

  });
