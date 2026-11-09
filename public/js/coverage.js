document.addEventListener('DOMContentLoaded', () => {
  const markers = [...document.querySelectorAll('.coverage-hotspot')];
  const areaButtons = [...document.querySelectorAll('.coverage-area-button')];
  const readoutTitle = document.getElementById('coverageReadoutTitle');
  const readoutText = document.getElementById('coverageReadoutText');
  const readout = document.getElementById('coverageMapReadout');

  if (!markers.length || !areaButtons.length || !readoutTitle || !readoutText || !readout) return;

  const markersByCity = new Map(markers.map((marker) => [marker.dataset.city, marker]));
  let selectedMarker = null;

  function showMarkerDetails(marker) {
    if (selectedMarker) selectedMarker.setAttribute('aria-pressed', 'false');
    selectedMarker = marker;
    selectedMarker.setAttribute('aria-pressed', 'true');

    areaButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.city === marker.dataset.city));
    });

    readoutTitle.textContent = marker.dataset.city;
    readoutText.textContent = marker.dataset.description;
    readout.hidden = false;
  }

  areaButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const marker = markersByCity.get(button.dataset.city);
      if (!marker) {
        throw new Error(`No coverage map marker found for ${button.dataset.city}.`);
      }
      showMarkerDetails(marker);
    });
  });

  markers.forEach((marker) => {
    marker.addEventListener('click', () => showMarkerDetails(marker));
    marker.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showMarkerDetails(marker);
      }
    });
  });
});
