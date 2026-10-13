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
let selectedOrigin = null;
let proximityMarkers = L.layerGroup().addTo(map);
let radiusCircle = null;
let heatLayer = null;

// API endpoints
const API_URL = '/api/cities/';
const NEAREST_URL = '/api/cities/nearest/';
const RADIUS_URL = '/api/cities/radius/';

// Heatmap gradients
const defaultGradient = {
    0.2: 'blue',
    0.5: 'lime',
    0.8: 'orange',
    1.0: 'red'
};

const nearestGradient = {
    0.2: '#74add1',
    0.5: '#ffffbf',
    0.8: '#f46d43',
    1.0: '#a50026'
};

const radiusGradient = {
    0.2: '#2c7bb6',
    0.5: '#abd9e9',
    0.8: '#fdae61',
    1.0: '#d7191c'
};


// Load cities from the API
async function initMap() {
    showLoading(true);

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        citiesData = data.results || data;

        document.getElementById('cityCount').textContent =
            citiesData.length;

        addMarkersToMap(citiesData);
        updateHeatmap(defaultGradient, citiesData);

    } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities data. Make sure the API is running.');
    } finally {
        showLoading(false);
    }
}


// Add city markers to the map
function addMarkersToMap(cities) {
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

        // Clicking a city marker selects the search origin
        marker.on('click', function () {
            selectOrigin(city);
        });

        markers[city.id] = marker;
    });
}


// Select a city as the proximity search origin
function selectOrigin(city) {
    selectedOrigin = city;

    document.getElementById('originStatus').textContent =
        `Origin: ${city.name}, ${city.country}`;

    document.getElementById('nearestBtn').disabled = false;
    document.getElementById('radiusBtn').disabled = false;

    document.getElementById('proximityStatus').textContent =
        'Origin selected. Choose a proximity search.';

    Object.values(markers).forEach(marker => {
        marker.setStyle({
            fillColor: '#007bff',
            color: '#0056b3'
        });
    });

    if (markers[city.id]) {
        markers[city.id].setStyle({
            fillColor: '#ffcc00',
            color: '#cc6600',
            radius: 10
        });
    }
}


// Create popup content
function createPopupContent(city) {
    return `
        <div class="city-popup">
            <h3>${city.name}</h3>
            <p><strong>Country:</strong> ${city.country}</p>
            ${city.region ? `<p><strong>Region:</strong> ${city.region}</p>` : ''}
            <p><strong>Population:</strong> ${formatNumber(city.population)}</p>
            <p><strong>Coordinates:</strong>
                ${Number(city.latitude).toFixed(4)},
                ${Number(city.longitude).toFixed(4)}
            </p>
            ${city.founded_year ? `<p><strong>Founded:</strong> ${city.founded_year}</p>` : ''}
            ${city.timezone ? `<p><strong>Timezone:</strong> ${city.timezone}</p>` : ''}
            <p><em>Click this marker to select it as the search origin.</em></p>
        </div>
    `;
}


// Format population numbers
function formatNumber(number) {
    return Number(number || 0).toLocaleString();
}


// Update the heatmap
function updateHeatmap(gradient, cities) {
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    if (typeof L.heatLayer !== 'function' || !cities.length) {
        return;
    }

    const points = cities.map(city => [
        Number(city.latitude ?? city.coordinates?.lat),
        Number(city.longitude ?? city.coordinates?.lng),
        0.8
    ]).filter(point =>
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    );

    if (points.length) {
        heatLayer = L.heatLayer(points, {
            radius: 45,
            blur: 25,
            maxZoom: 10,
            minOpacity: 0.6,
            max: 1.0,
            gradient: gradient
        }).addTo(map);
    }
}


// Clear previous proximity overlays
function clearProximityOverlays() {
    proximityMarkers.clearLayers();

    if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
    }

    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    updateHeatmap(defaultGradient, citiesData);
}


// Send a proximity search request
async function runProximitySearch(url, payload, mode) {
    if (!selectedOrigin) {
        return;
    }

    showLoading(true);
    clearProximityOverlays();

    document.getElementById('proximityResults').innerHTML = '';
    document.getElementById('proximityStatus').textContent =
        'Searching...';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.error || data.detail ||
                'The proximity search failed.';
            throw new Error(message);
        }

        const results = data.results || data;

        if (!Array.isArray(results)) {
            throw new Error('Unexpected API response.');
        }

        document.getElementById('proximityStatus').textContent =
            `${results.length} cities found.`;

        displayProximityResults(results, mode);

        const gradient = mode === 'nearest'
            ? nearestGradient
            : radiusGradient;

        updateHeatmap(gradient, results);

        if (mode === 'radius') {
            const radiusKm = Number(payload.radius_km);

            radiusCircle = L.circle(
                [payload.lat, payload.lng],
                {
                    radius: radiusKm * 1000,
                    color: '#e67e22',
                    weight: 2,
                    fillColor: '#f39c12',
                    fillOpacity: 0.08
                }
            ).addTo(map);

            map.fitBounds(radiusCircle.getBounds(), {
                padding: [30, 30]
            });
        } else if (proximityMarkers.getLayers().length > 0) {
            const bounds = L.featureGroup(proximityMarkers.getLayers()).getBounds();

            if (bounds.isValid()) {
                map.fitBounds(bounds, {
                    padding: [30, 30],
                    maxZoom: 10
                });
            }
        }

    } catch (error) {
        console.error('Proximity search error:', error);

        document.getElementById('proximityStatus').textContent =
            error.message;
    } finally {
        showLoading(false);
    }
}


// Display proximity results and add separate map markers
function displayProximityResults(results, mode) {
    const resultsDiv = document.getElementById('proximityResults');

    if (!results.length) {
        resultsDiv.innerHTML = '<p>No cities found for this search.</p>';
        return;
    }

    resultsDiv.innerHTML = results.map((city, index) => {
        const latitude = Number(
            city.coordinates?.lat ?? city.latitude
        );

        const longitude = Number(
            city.coordinates?.lng ?? city.longitude
        );

        const distance = Number(city.distance_km);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return '';
        }

        const marker = L.circleMarker(
            [latitude, longitude],
            {
                radius: 9,
                color: mode === 'nearest' ? '#6a1b9a' : '#c0392b',
                weight: 2,
                fillColor: mode === 'nearest' ? '#9b59b6' : '#e74c3c',
                fillOpacity: 0.9
            }
        );

        marker.bindPopup(`
            <strong>${city.name}</strong><br>
            ${city.country}<br>
            Distance: ${Number.isFinite(distance) ? distance.toFixed(2) + ' km' : 'N/A'}
        `);

        marker.addTo(proximityMarkers);

        const rank = city.rank ?? index + 1;

        return `
            <div class="result-item"
                onclick="goToProximityCity(${latitude}, ${longitude}, ${index})">
                <strong>${mode === 'nearest' ? rank + '. ' : ''}${city.name}</strong>,
                ${city.country}
                <br>
                <span>${Number.isFinite(distance) ? distance.toFixed(2) + ' km away' : 'Distance unavailable'}</span>
            </div>
        `;
    }).join('');
}


// Move to a proximity result
function goToProximityCity(latitude, longitude, index) {
    map.setView([latitude, longitude], 9);

    const resultMarkers = proximityMarkers.getLayers();
    if (resultMarkers[index]) {
        resultMarkers[index].openPopup();
    }
}


// Search for the 10 nearest cities
document.getElementById('nearestBtn').addEventListener(
    'click',
    function () {
        if (!selectedOrigin) {
            return;
        }

        runProximitySearch(
            NEAREST_URL,
            {
                lat: Number(selectedOrigin.latitude),
                lng: Number(selectedOrigin.longitude)
            },
            'nearest'
        );
    }
);


// Search within a radius
document.getElementById('radiusBtn').addEventListener(
    'click',
    function () {
        if (!selectedOrigin) {
            return;
        }

        const radiusKm = Number(
            document.getElementById('radiusInput').value
        );

        if (
            !Number.isFinite(radiusKm) ||
            radiusKm <= 0 ||
            radiusKm > 20000
        ) {
            document.getElementById('proximityStatus').textContent =
                'Enter a radius greater than 0 and no more than 20,000 km.';
            return;
        }

        runProximitySearch(
            RADIUS_URL,
            {
                lat: Number(selectedOrigin.latitude),
                lng: Number(selectedOrigin.longitude),
                radius_km: radiusKm
            },
            'radius'
        );
    }
);


// Search cities by name or country
document.getElementById('searchInput').addEventListener(
    'input',
    function (event) {
        const query = event.target.value.toLowerCase().trim();
        const resultsDiv = document.getElementById('results');

        if (!query) {
            resultsDiv.innerHTML = '';
            addMarkersToMap(citiesData);
            return;
        }

        const filteredCities = citiesData.filter(city =>
            city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)
        );

        if (!filteredCities.length) {
            resultsDiv.innerHTML = '<p>No cities found</p>';
            addMarkersToMap([]);
            return;
        }

        addMarkersToMap(filteredCities);

        resultsDiv.innerHTML = filteredCities.map(city => `
            <div class="result-item" onclick="goToCity(${city.id})">
                <strong>${city.name}</strong>, ${city.country}
            </div>
        `).join('');
    }
);


// Move map to a selected city
function goToCity(cityId) {
    const city = citiesData.find(city => city.id === cityId);

    if (!city) {
        return;
    }

    map.setView(
        [Number(city.latitude), Number(city.longitude)],
        10
    );

    if (markers[cityId]) {
        markers[cityId].openPopup();
    }
}


// Reset map and proximity search
document.getElementById('resetBtn').addEventListener(
    'click',
    function () {
        selectedOrigin = null;

        document.getElementById('searchInput').value = '';
        document.getElementById('results').innerHTML = '';
        document.getElementById('proximityResults').innerHTML = '';
        document.getElementById('proximityStatus').textContent = '';
        document.getElementById('originStatus').textContent =
            'Select a city marker to choose a search origin.';

        document.getElementById('nearestBtn').disabled = true;
        document.getElementById('radiusBtn').disabled = true;

        clearProximityOverlays();
        addMarkersToMap(citiesData);

        map.setView([53.3498, -6.2603], 6);
    }
);


// Loading indicator
function showLoading(show) {
    document.getElementById('loading').style.display =
        show ? 'block' : 'none';
}


// Start the map
document.addEventListener('DOMContentLoaded', initMap);
