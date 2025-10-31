import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

const NigeriaBorders = ({ selectedState, onStateClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Clear previous layers
    map.data.forEach((feature) => map.data.remove(feature));

    // Load GeoJSON
    fetch('/ng-geo.json')
      .then((res) => res.json())
      .then((geojson) => {
        map.data.addGeoJson(geojson);

        // Style for all states
        map.data.setStyle({
          fillColor: '#e0e0e0',
          strokeColor: '#666',
          strokeWeight: 1,
          fillOpacity: 0.1,
        });

        // Highlight selected state
        if (selectedState) {
          map.data.forEach((feature) => {
            const name = feature?.getProperty('name') || feature?.getProperty('state');
            if (name?.toLowerCase() === selectedState.toLowerCase()) {
              map.data.overrideStyle(feature, {
                fillColor: '#2196f3',
                fillOpacity: 0.4,
                strokeColor: '#1565c0',
                strokeWeight: 2,
              });
            }
          });
        }

        // Add interactivity (click)
        map.data.addListener('click', (event) => {
          const name = event.feature.getProperty('name') || event.feature.getProperty('state');
          onStateClick?.(name);
        });
      });
  }, [map, selectedState, onStateClick]);

  return null;
};

export default NigeriaBorders;
