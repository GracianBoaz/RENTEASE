export const getLeafletMapHTML = (
  lat: number,
  lng: number,
  zoom: number = 15,
  markerTitle: string = 'Location',
  markerColor: string = '#10B981'
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    const icon = L.divIcon({
      html: '<div style="background:${markerColor};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      className: ''
    });
    L.marker([${lat}, ${lng}], { icon })
      .addTo(map)
      .bindPopup('${markerTitle}')
      .openPopup();
  </script>
</body>
</html>
`;

export const getRouteMapHTML = (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${originLat}, ${originLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Emerald green origin marker (renter)
    const originIcon = L.divIcon({
      html: '<div style="background:#10B981;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10], className: ''
    });
    // Red destination marker (owner/item)
    const destIcon = L.divIcon({
      html: '<div style="background:#EF4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10], className: ''
    });

    L.marker([${originLat}, ${originLng}], { icon: originIcon }).addTo(map).bindPopup('Your Location');
    L.marker([${destLat}, ${destLng}], { icon: destIcon }).addTo(map).bindPopup('Item Location');

    // Draw route using OSRM (free routing)
    fetch('https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson')
      .then(r => r.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const route = L.geoJSON(data.routes[0].geometry, {
            style: { color: '#10B981', weight: 5, opacity: 0.8 }
          }).addTo(map);
          map.fitBounds(route.getBounds(), { padding: [20, 20] });
        }
      });
  </script>
</body>
</html>
`;

export const getMultiMarkerLeafletHTML = (
  userLat: number,
  userLng: number,
  items: Array<{ lat: number, lng: number, title: string }>
) => {
  const itemsJson = JSON.stringify(items);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${userLat}, ${userLng}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const userIcon = L.divIcon({
      html: '<div style="background:#10B981;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10], className: ''
    });

    const itemIcon = L.divIcon({
      html: '<div style="background:#10B981;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16], iconAnchor: [8, 8], className: ''
    });

    L.marker([${userLat}, ${userLng}], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('You are here');

    const items = ${itemsJson};
    items.forEach(item => {
      if (item.lat && item.lng) {
        L.marker([item.lat, item.lng], { icon: itemIcon })
          .addTo(map)
          .bindPopup(item.title);
      }
    });
  </script>
</body>
</html>
`;
};
