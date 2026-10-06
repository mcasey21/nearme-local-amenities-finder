// Create the Leaflet map
const map = L.map('map').setView([53.3498, -6.2603], 6);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 2,
    referrerPolicy: 'strict-origin-when-cross-origin'
}).addTo(map);

// Store city data and markers
let citiesData = [];
let markers = {};

// API endpoint
const API_URL = '/api/cities/';


// Load cities from the API
async function initMap() {
    showLoading(true);

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle paginated and non-paginated responses
        citiesData = data.results || data;

        document.getElementById('cityCount').textContent = citiesData.length;

        addMarkersToMap(citiesData);

    } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities data. Make sure the API is running.');
    } finally {
        showLoading(false);
    }
}


// Add city markers to the map
function addMarkersToMap(cities) {

    // Remove existing markers
    Object.values(markers).forEach(marker => {
        map.removeLayer(marker);
    });

    markers = {};

    cities.forEach(city => {

        const latitude = parseFloat(city.latitude);
        const longitude = parseFloat(city.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Invalid coordinates for ${city.name}`);
            return;
        }

        const marker = L.circleMarker(
            [latitude, longitude],
            {
                radius: 7,
                fillColor: '#007bff',
                color: '#0056b3',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }
        ).addTo(map);

        marker.bindPopup(createPopupContent(city));

        markers[city.id] = marker;
    });
}


// Create popup content
function createPopupContent(city) {

    return `
        <div class="city-popup">
            <h3>${city.name}</h3>

            <p>
                <strong>Country:</strong>
                ${city.country}
            </p>

            ${city.region ? `
                <p>
                    <strong>Region:</strong>
                    ${city.region}
                </p>
            ` : ''}

            <p>
                <strong>Population:</strong>
                ${formatNumber(city.population)}
            </p>

            <p>
                <strong>Coordinates:</strong>
                ${city.latitude.toFixed(4)},
                ${city.longitude.toFixed(4)}
            </p>

            ${city.founded_year ? `
                <p>
                    <strong>Founded:</strong>
                    ${city.founded_year}
                </p>
            ` : ''}

            ${city.timezone ? `
                <p>
                    <strong>Timezone:</strong>
                    ${city.timezone}
                </p>
            ` : ''}
        </div>
    `;
}


// Format population numbers
function formatNumber(number) {
    return number.toString().replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ','
    );
}


// Search cities
document.getElementById('searchInput').addEventListener(
    'input',
    function(event) {

        const query = event.target.value.toLowerCase();
        const resultsDiv = document.getElementById('results');

        if (query.length === 0) {
            resultsDiv.innerHTML = '';
            addMarkersToMap(citiesData);
            return;
        }

        const filteredCities = citiesData.filter(city =>
            city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)
        );

        if (filteredCities.length === 0) {

            resultsDiv.innerHTML =
                '<p>No cities found</p>';

            Object.values(markers).forEach(marker => {
                map.removeLayer(marker);
            });

            markers = {};

            return;
        }

        addMarkersToMap(filteredCities);

        resultsDiv.innerHTML = filteredCities.map(city => `
            <div
                class="result-item"
                onclick="goToCity(${city.id})"
            >
                <strong>${city.name}</strong>,
                ${city.country}
            </div>
        `).join('');
    }
);


// Move map to a selected city
function goToCity(cityId) {

    const city = citiesData.find(
        city => city.id === cityId
    );

    if (!city) {
        return;
    }

    map.setView(
        [city.latitude, city.longitude],
        10
    );

    if (markers[cityId]) {
        markers[cityId].openPopup();
    }
}


// Reset map
document.getElementById('resetBtn').addEventListener(
    'click',
    function() {

        map.setView(
            [53.3498, -6.2603],
            6
        );

        document.getElementById('searchInput').value = '';
        document.getElementById('results').innerHTML = '';

        addMarkersToMap(citiesData);
    }
);


// Loading indicator
function showLoading(show) {

    document.getElementById('loading').style.display =
        show ? 'block' : 'none';
}


// Start the map
document.addEventListener(
    'DOMContentLoaded',
    function() {
        initMap();
    }
);
