const map = L.map('map').setView([20, 78], 5); // Default view
const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const socket = io();
let marker = null;
let infoBox = null;
let lastLatitude = null;
let lastLongitude = null;
let lastTimestamp = null;
let firstUpdate = true;

// Custom marker icon (bigger size)
const customIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/684/684908.png', // Custom marker icon
    iconSize: [40, 40], // Bigger size
    iconAnchor: [20, 40] // Adjust anchor point
});

function updateLocation(position) {
    const { latitude, longitude, speed, timestamp } = position.coords;

    let calculatedSpeed = speed || 0;
    if (lastLatitude !== null && lastLongitude !== null && lastTimestamp !== null) {
        const distance = getDistanceFromLatLon(lastLatitude, lastLongitude, latitude, longitude);
        const timeDiff = (timestamp - lastTimestamp) / 1000;
        if (timeDiff > 0) {
            calculatedSpeed = distance / timeDiff;
        }
    }

    lastLatitude = latitude;
    lastLongitude = longitude;
    lastTimestamp = timestamp;

    if (!marker) {
        marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        infoBox = L.popup({
            autoClose: false,
            closeOnClick: false,
            className: 'info-popup'
        }).setLatLng([latitude, longitude])
        .setContent(`<p>Lat: ${latitude.toFixed(5)}</p>
                     <p>Lon: ${longitude.toFixed(5)}</p>
                     <p>Speed: ${calculatedSpeed.toFixed(2)} m/s</p>`)
        .openOn(map);
    } else {
        marker.setLatLng([latitude, longitude]);
        infoBox.setLatLng([latitude, longitude].map((val, i) => val + (i === 1 ? 0.0005 : 0))); // Move info box slightly below
        infoBox.setContent(`<p>Lat: ${latitude.toFixed(5)}</p>
                            <p>Lon: ${longitude.toFixed(5)}</p>
                            <p>Speed: ${calculatedSpeed.toFixed(2)} m/s</p>`);
    }

    if (firstUpdate) {
        map.setView([latitude, longitude], 15);
        firstUpdate = false;
    }

    socket.emit("locationUpdate", { latitude, longitude, speed: calculatedSpeed });
}

function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function showError(error) {
    alert(`Error: ${error.message}`);
}

function trackLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateLocation, showError, {
            enableHighAccuracy: true,
            maximumAge: 2000,
            timeout: 5000
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Recenter Button
document.getElementById("recenter-btn").addEventListener("click", () => {
    if (marker) {
        map.setView(marker.getLatLng(), 15);
    }
});

// Share Location Button
document.getElementById("share-btn").addEventListener("click", () => {
    if (lastLatitude !== null && lastLongitude !== null) {
        const shareText = `I'm at Latitude: ${lastLatitude.toFixed(5)}, Longitude: ${lastLongitude.toFixed(5)}`;
        navigator.clipboard.writeText(shareText);
        alert("Location copied to clipboard!");
    } else {
        alert("Location not available yet.");
    }
});

socket.on("updateLocation", (data) => {
    console.log("Updated Location from Server:", data);
});

trackLocation();
