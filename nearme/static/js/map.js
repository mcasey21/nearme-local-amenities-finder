// Create the Leaflet map
const map = L.map('map').setView([54.0066, -6.4042], 14);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 2,
    referrerPolicy: 'strict-origin-when-cross-origin'
}).addTo(map);

// Allow users to select a search location by clicking the map
map.on('click', function (event) {
    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;

    // Select a location for a new amenity
    if (amenityFormPanel && amenityFormPanel.style.display !== 'none') {
        newAmenityLocation = {
            lat: latitude,
            lng: longitude
        };

        amenityFormStatus.textContent =
            `Location selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        return;
    }

    const location = {
        name: 'Custom Location',
        category: 'Selected Location',
        latitude: latitude,
        longitude: longitude
    };

    selectOrigin(location);

    if (locationMarker) {
        locationMarker.setLatLng(event.latlng);
    } else {
        locationMarker = L.marker(event.latlng, {
            draggable: true
        }).addTo(map);

        locationMarker.bindPopup('Search origin').openPopup();

        locationMarker.on('dragend', function () {
            const position = locationMarker.getLatLng();

            const updatedLocation = {
                name: 'Custom Location',
                category: 'Selected Location',
                latitude: position.lat,
                longitude: position.lng
            };

            selectOrigin(updatedLocation);
        });
    }
});

// Store city data and markers
let citiesData = [];
let markers = {};
let selectedOrigin = null;
let proximityMarkers = L.layerGroup().addTo(map);
let radiusCircle = null;
let locationMarker = null;

// API endpoints
const API_URL = '/api/amenities/';
const NEAREST_URL = '/api/amenities/nearest/';
const RADIUS_URL = '/api/amenities/radius/';

// Load amenities from the API
async function initMap() {
    showLoading(true);

    try {
        let allAmenities = [];
        let nextUrl = API_URL;

        // Fetch every page of amenities
        while (nextUrl) {
            const response = await fetch(nextUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            allAmenities = allAmenities.concat(data.results || data);

            nextUrl = data.next;
        }

        citiesData = allAmenities;

        document.getElementById('cityCount').textContent =
            citiesData.length;

        addMarkersToMap(citiesData);

    } catch (error) {
        console.error('Error fetching amenities:', error);
        alert('Failed to load amenities. Make sure the API is running.');
    } finally {
        showLoading(false);
    }
}


// Add amenity markers to the map
function addMarkersToMap(amenities) {
    Object.values(markers).forEach(marker => {
        map.removeLayer(marker);
    });

    markers = {};

    amenities.forEach(amenity => {
        const latitude = parseFloat(amenity.latitude);
        const longitude = parseFloat(amenity.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Invalid coordinates for ${amenity.name}`);
            return;
        }

        const categoryColours = {
            cafe: '#e67e22',
            restaurant: '#e74c3c',
            supermarket: '#2ecc71',
            park: '#27ae60',
            pharmacy: '#9b59b6',
            transport: '#3498db'
        };

        const markerColour = categoryColours[amenity.category] || '#007bff';

        const marker = L.circleMarker(
            [latitude, longitude],
            {
                radius: 7,
                fillColor: markerColour,
                color: markerColour,
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }
        ).addTo(map);

        marker.amenityCategory = amenity.category;

        marker.bindPopup(createPopupContent(amenity));

        // Clicking an amenity marker selects the search origin
        marker.on('click', function () {
            selectOrigin(amenity);
        });

        markers[amenity.id] = marker;
    });
}


// Select an amenity as the proximity search origin
function selectOrigin(amenity) {
    selectedOrigin = amenity;

    document.getElementById('originStatus').textContent =
        `Origin: ${amenity.name} (${amenity.category})`;

    document.getElementById('nearestBtn').disabled = false;
    document.getElementById('radiusBtn').disabled = false;

    document.getElementById('proximityStatus').textContent =
        'Origin selected. Choose a proximity search.';

    const categoryColours = {
        cafe: '#e67e22',
        restaurant: '#e74c3c',
        supermarket: '#2ecc71',
        park: '#27ae60',
        pharmacy: '#9b59b6',
        transport: '#3498db'
    };

    Object.values(markers).forEach(marker => {
        const category = marker.amenityCategory;
        const colour = categoryColours[category] || '#007bff';

        marker.setStyle({
            fillColor: colour,
            color: colour
        });
    });

    if (markers[amenity.id]) {
        markers[amenity.id].setStyle({
            fillColor: '#ffcc00',
            color: '#cc6600',
            radius: 10
        });
    }
}


// Create popup content
function createPopupContent(amenity) {
    return `
        <div class="amenity-popup">
            <h3>${amenity.name}</h3>
            <p><strong>Category:</strong> ${amenity.category}</p>
            ${amenity.address ? `<p><strong>Address:</strong> ${amenity.address}</p>` : ''}
            ${amenity.description ? `<p>${amenity.description}</p>` : ''}
            ${amenity.rating ? `<p><strong>Rating:</strong> ${amenity.rating}/5</p>` : ''}
            <p><strong>Coordinates:</strong>
                ${Number(amenity.latitude).toFixed(4)},
                ${Number(amenity.longitude).toFixed(4)}
            </p>
            <p><em>Click this marker to select it as the search origin.</em></p>
        </div>
    `;
}


// Format population numbers
function formatNumber(number) {
    return Number(number || 0).toLocaleString();
}

// Clear previous proximity overlays
function clearProximityOverlays() {
    proximityMarkers.clearLayers();

    if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
    }

}


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
        let response;

        if (mode === 'nearest') {
            const csrfToken = document.querySelector(
                '[name=csrfmiddlewaretoken]'
            ).value;

            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
            });
        } else {
            const params = new URLSearchParams({
                longitude: payload.lng,
                latitude: payload.lat,
                radius: payload.radius_km
            });

            response = await fetch(`${url}?${params}`);
        }

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
            `${results.length} amenities found.`;

        displayProximityResults(results, mode);

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
            const bounds = L.featureGroup(
                proximityMarkers.getLayers()
            ).getBounds();

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
        resultsDiv.innerHTML = '<p>No amenities found for this search.</p>';
        return;
    }

    resultsDiv.innerHTML = results.map((amenity, index) => {
        const latitude = Number(
            amenity.coordinates?.lat ?? amenity.latitude
        );

        const longitude = Number(
            amenity.coordinates?.lng ?? amenity.longitude
        );

        const distance = Number(amenity.distance_km);

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
            <strong>${amenity.name}</strong><br>
            Category: ${amenity.category}<br>
            ${amenity.address || ''}
            ${Number.isFinite(distance)
                ? `<br>Distance: ${distance.toFixed(2)} km`
                : ''}
        `);

        marker.addTo(proximityMarkers);

        const rank = amenity.rank ?? index + 1;

        return `
            <div class="result-item"
                onclick="goToProximityCity(${latitude}, ${longitude}, ${index})">
                <strong>${mode === 'nearest' ? rank + '. ' : ''}${amenity.name}</strong>
                <br>
                <span>${amenity.category}</span>
                ${amenity.address ? `<br><span>${amenity.address}</span>` : ''}
                ${Number.isFinite(distance)
                    ? `<br><span>${distance.toFixed(2)} km away</span>`
                    : ''}
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


// Search for the 10 nearest amenities
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


// Search amenities by name, category or address
// Get selected categories
function getSelectedCategories() {
    return Array.from(
        document.querySelectorAll('.category-filter:checked')
    ).map(checkbox => checkbox.value);
}

// Filter amenities by search text and category
function filterAmenities() {
    const query = document.getElementById('searchInput')
        .value.toLowerCase().trim();

    const selectedCategories = getSelectedCategories();

    const filteredAmenities = citiesData.filter(amenity => {
        const matchesCategory =
            selectedCategories.includes(amenity.category);

        const matchesSearch =
            amenity.name.toLowerCase().includes(query) ||
            amenity.category.toLowerCase().includes(query) ||
            (amenity.address || '').toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    addMarkersToMap(filteredAmenities);

    const resultsDiv = document.getElementById('results');

    if (query) {
        resultsDiv.innerHTML = filteredAmenities.map(amenity => `
            <div class="result-item"
                onclick="goToAmenity(${amenity.id})">
                <strong>${amenity.name}</strong>
                <br>
                <span>${amenity.category}</span>
                ${amenity.address ? `<br><span>${amenity.address}</span>` : ''}
            </div>
        `).join('');

        if (!filteredAmenities.length) {
            resultsDiv.innerHTML = '<p>No amenities found</p>';
        }
    } else {
        resultsDiv.innerHTML = '';
    }
}

// Search input
document.getElementById('searchInput').addEventListener(
    'input',
    filterAmenities
);

// Category checkboxes
document.querySelectorAll('.category-filter').forEach(checkbox => {
    checkbox.addEventListener('change', filterAmenities);
});

// Move map to a selected amenity
function goToAmenity(amenityId) {
    const amenity = citiesData.find(item => item.id === amenityId);

    if (!amenity) {
        return;
    }

    map.setView(
        [Number(amenity.latitude), Number(amenity.longitude)],
        15
    );

    if (markers[amenityId]) {
        markers[amenityId].openPopup();
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
            'Select an amenity marker to choose a search origin.';
        document.getElementById('nearestBtn').disabled = true;
        document.getElementById('radiusBtn').disabled = true;

        clearProximityOverlays();
        addMarkersToMap(citiesData);

        map.setView([54.0066, -6.4042], 14);
    }
);


// Loading indicator
function showLoading(show) {
    document.getElementById('loading').style.display =
        show ? 'block' : 'none';
}


const addAmenityBtn = document.getElementById('addAmenityBtn');
const amenityFormPanel = document.getElementById('amenityFormPanel');
const amenityForm = document.getElementById('amenityForm');
const cancelAmenityBtn = document.getElementById('cancelAmenityBtn');
const amenityFormStatus = document.getElementById('amenityFormStatus');

let newAmenityLocation = null;

if (addAmenityBtn) {
    addAmenityBtn.addEventListener('click', () => {
        amenityFormPanel.style.display = 'block';
        amenityFormStatus.textContent =
            'Click on the map to choose the amenity location.';
    });
}

if (cancelAmenityBtn) {
    cancelAmenityBtn.addEventListener('click', () => {
        amenityFormPanel.style.display = 'none';
        amenityForm.reset();
        newAmenityLocation = null;
    });
}

if (amenityForm) {
    amenityForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!newAmenityLocation) {
            amenityFormStatus.textContent =
                'Please click on the map to select a location first.';
            return;
        }

        const csrfToken = document.querySelector(
            '[name=csrfmiddlewaretoken]'
        ).value;

        const amenityData = {
            name: document.getElementById('amenityName').value,
            category: document.getElementById('amenityCategory').value,
            address: document.getElementById('amenityAddress').value,
            description: document.getElementById('amenityDescription').value,
            location: {
                type: 'Point',
                coordinates: [
                    newAmenityLocation.lng,
                    newAmenityLocation.lat
                ]
            }
        };

        try {
            const response = await fetch('/api/amenities/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(amenityData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                amenityFormStatus.textContent =
                    'Error: ' + JSON.stringify(errorData);
                return;
            }

            amenityFormStatus.textContent = 'Amenity added successfully!';

            amenityForm.reset();
            amenityFormPanel.style.display = 'none';

            location.reload();

        } catch (error) {
            amenityFormStatus.textContent =
                'Could not connect to the server.';
            console.error(error);
        }
    });
}


const legendToggle = document.getElementById('legendToggle');
const legendContent = document.getElementById('legendContent');
const legendArrow = document.getElementById('legendArrow');

if (legendToggle) {
    legendToggle.addEventListener('click', () => {
        legendContent.classList.toggle('collapsed');

        if (legendContent.classList.contains('collapsed')) {
            legendArrow.textContent = '▶';
        } else {
            legendArrow.textContent = '▼';
        }
    });
}


// Start the map
document.addEventListener('DOMContentLoaded', initMap);

