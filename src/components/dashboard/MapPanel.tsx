import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Layers, MapPin, Droplets, Activity, AlertCircle, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { waterSites, WaterSite } from "@/data/water-sites";
import SiteDetailModal from "./SiteDetailModal";
import nigeriaStates from "@/data/nigeria-states.json";

interface MapPanelProps {
  selectedState: string | null;
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const layers = [
  { id: "infrastructure", label: "Infrastructure", icon: MapPin },
  { id: "quality", label: "Water Quality", icon: Droplets },
  { id: "scarcity", label: "Scarcity Risk", icon: AlertCircle },
  { id: "activity", label: "Real-time Activity", icon: Activity },
];

const MapPanel = ({ selectedState, activeLayer, onLayerChange }: MapPanelProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedSite, setSelectedSite] = useState<WaterSite | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [8.0, 9.0],
      zoom: 5.5,
      minZoom: 5,
      maxZoom: 12,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add Nigeria states layer
      map.current.addSource('nigeria-states', {
        type: 'geojson',
        data: nigeriaStates as any,
      });

      // Add state fill layer
      map.current.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'nigeria-states',
        paint: {
          'fill-color': [
            'match',
            ['get', 'riskLevel'],
            'low', '#10b981',
            'medium', '#f59e0b',
            'high', '#ef4444',
            '#6b7280'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.3,
            0.15
          ],
        },
      });

      // Add state border layer
      map.current.addLayer({
        id: 'states-border',
        type: 'line',
        source: 'nigeria-states',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#3b82f6',
            '#94a3b8'
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1
          ],
        },
      });

      // Add hover effect
      let hoveredStateId: string | number | null = null;

      map.current.on('mousemove', 'states-fill', (e) => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.current.setFeatureState(
              { source: 'nigeria-states', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id as string | number;
          map.current.setFeatureState(
            { source: 'nigeria-states', id: hoveredStateId },
            { hover: true }
          );
          setHoveredState(e.features[0].properties?.name || null);
        }
      });

      map.current.on('mouseleave', 'states-fill', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (hoveredStateId !== null) {
          map.current.setFeatureState(
            { source: 'nigeria-states', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        setHoveredState(null);
      });

      // Add water site markers
      addWaterSiteMarkers();
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-home';
    resetButton.innerHTML = '⌂';
    resetButton.style.fontSize = '18px';
    resetButton.onclick = () => {
      map.current?.flyTo({ center: [8.0, 9.0], zoom: 5.5, duration: 1500 });
    };

    const resetControl = document.createElement('div');
    resetControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    resetControl.appendChild(resetButton);
    map.current.getContainer().querySelector('.mapboxgl-ctrl-top-right')?.appendChild(resetControl);

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  const addWaterSiteMarkers = () => {
    if (!map.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const filteredSites = activeLayer === 'infrastructure' ? waterSites :
                          activeLayer === 'quality' ? waterSites.filter(s => s.status !== 'optimal') :
                          activeLayer === 'scarcity' ? waterSites.filter(s => s.uptime < 90) :
                          waterSites.filter(s => s.status === 'critical');

    filteredSites.forEach(site => {
      const el = document.createElement('div');
      el.className = 'water-site-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      
      const color = site.status === 'optimal' ? '#10b981' : 
                    site.status === 'warning' ? '#f59e0b' : '#ef4444';
      el.style.backgroundColor = color;

      if (site.status === 'critical') {
        el.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(site.coordinates)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedSite(site);
        map.current?.flyTo({
          center: site.coordinates,
          zoom: 8,
          duration: 1500,
        });
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    addWaterSiteMarkers();
  }, [activeLayer]);

  useEffect(() => {
    if (!map.current || !selectedState) return;

    const stateFeature = (nigeriaStates as any).features.find(
      (f: any) => f.properties.name === selectedState
    );

    if (stateFeature) {
      const [lng, lat] = stateFeature.geometry.coordinates[0][0];
      map.current.flyTo({
        center: [lng + 0.2, lat + 0.2],
        zoom: 7,
        duration: 1500,
      });
    }
  }, [selectedState]);

  return (
    <main className="flex-1 flex flex-col relative">
      {/* Layer Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 transition-all",
                "backdrop-blur-sm border",
                activeLayer === layer.id
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-dashboard-panel/80 border-border hover:bg-dashboard-elevated"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Hover Tooltip */}
        {hoveredState && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-dashboard-panel/95 backdrop-blur-lg border border-primary/30 rounded-lg px-4 py-2 pointer-events-none z-10">
            <div className="text-sm font-semibold">{hoveredState}</div>
            <div className="text-xs text-muted-foreground">Click to view details</div>
          </div>
        )}
      </div>

      {/* State Info Card (when state is selected) */}
      {selectedState && (
        <Card className="absolute bottom-6 left-1/2 -translate-x-1/2 w-96 p-4 bg-dashboard-panel/95 backdrop-blur-lg border-primary/30 z-10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedState} State</h3>
              <Badge className="bg-metric-success/20 text-metric-success border-metric-success/30">
                Active
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Quality Score</div>
                <div className="text-2xl font-bold text-water-primary">89/100</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Active Sites</div>
                <div className="text-2xl font-bold">
                  {waterSites.filter(s => s.state === selectedState).length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              Last updated: 2 minutes ago
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-dashboard-panel/80 backdrop-blur-sm rounded-lg p-4 border border-border z-10">
        <div className="text-xs font-semibold mb-2">LEGEND</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-metric-success" />
            <span className="text-muted-foreground">Optimal Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-metric-warning" />
            <span className="text-muted-foreground">Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-metric-danger animate-pulse" />
            <span className="text-muted-foreground">High Risk</span>
          </div>
        </div>
      </div>

      <SiteDetailModal 
        site={selectedSite}
        open={!!selectedSite}
        onClose={() => setSelectedSite(null)}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.3);
          }
        }
      `}</style>
    </main>
  );
};

export default MapPanel;
