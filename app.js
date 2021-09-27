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

  const bikes = fetch(`https://api.entur.io/mobility/v2/gbfs/${ system }/free_bike_status`)
    .then(response => {
      if(response.ok) {
        return response.json();
      } else {
        return { data: { bikes: [] }};
      }
    });

  Promise.all([info, status, bikes]).then(data => {

    const info = data[0];
    const status = data[1];

    info.data.stations.forEach(station => {

      const stationStatus = status.data.stations.find(s => s.station_id == station.station_id) || { num_bikes_available: 0};

      const available = stationStatus.num_bikes_available;

      const marker = L.marker([station.lat, station.lon], { icon: svgIcon(available) })
        .bindPopup(`<strong>${station.name}</strong> <br> ${available} bicycles available`|| "Free-floating bike")
        .addTo(map);
      markerGroup.addLayer(marker);
    });

    const bikes = data[2];

    bikes.data.bikes.forEach(station => {
      const marker = L.marker([station.lat, station.lon], { icon: svgIcon(1) })
        .addTo(map);
      markerGroup.addLayer(marker);
    });

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



const modal = document.querySelector(".modal");
const closeButton = document.querySelector(".close-button");
const textArea = document.querySelector("textarea");

function toggleModal() {
  modal.classList.toggle("show-modal");

  const html = `
<iframe
  src="${window.location.href}"
  style="border:0px #ffffff none;"
  name="bicycle-rental-map"
  scrolling="no"
  frameborder="0"
  marginheight="0px"
  marginwidth="0px"
  height="400px"
  width="600px"
  allowfullscreen>
</iframe>
`;
  textArea.value = html.trim();

}

function windowOnClick(event) {
  if (event.target === modal) {
    toggleModal();
  }
}

closeButton.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);


L.easyButton('<img class="embed" src="embed.svg">', function(btn, map){
  toggleModal();
}).addTo(map);
