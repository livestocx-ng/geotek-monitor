import {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
	APIProvider,
	Map,
	Marker,
	AdvancedMarker,
	InfoWindow,
	useMap,
} from '@vis.gl/react-google-maps';
import {Layers, MapPin, Droplets, Activity, AlertCircle} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {waterSites, WaterSite} from '@/data/water-sites';
import SiteDetailModal from './SiteDetailModal';
import nigeriaStates from '@/data/nigeria-states.json';

interface MapPanelProps {
  selectedState: string | null;
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const layers = [
	{id: 'infrastructure', label: 'Infrastructure', icon: MapPin},
	{id: 'quality', label: 'Water Quality', icon: Droplets},
	{id: 'scarcity', label: 'Scarcity Risk', icon: AlertCircle},
	{id: 'activity', label: 'Real-time Activity', icon: Activity},
];

// Google Maps API Key - Replace with your actual key
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

console.log('MAPS_KEY', MAPS_API_KEY);

// Inner map component that uses the useMap hook
const MapContent = ({
	selectedState,
	activeLayer,
	filteredSites,
	setHoveredState,
	setSelectedSite,
}: {
	selectedState: string | null;
	activeLayer: string;
	filteredSites: WaterSite[];
	setHoveredState: (state: string | null) => void;
	setSelectedSite: (site: WaterSite | null) => void;
}) => {
	const map = useMap();

  useEffect(() => {
		if (!map) return;

		// Add Nigeria states GeoJSON data
		const dataLayer = new google.maps.Data();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dataLayer.addGeoJson(nigeriaStates as any);
		dataLayer.setMap(map);

		// Style the polygons
		dataLayer.setStyle((feature) => {
			const riskLevel =
				(feature.getProperty('riskLevel') as string) || '';
			let fillColor = '#6b7280';
			if (riskLevel === 'low') fillColor = '#10b981';
			if (riskLevel === 'medium') fillColor = '#f59e0b';
			if (riskLevel === 'high') fillColor = '#ef4444';

			return {
				fillColor,
				fillOpacity: 0.15,
				strokeColor: '#6b7280',
				strokeWeight: 1.5,
				strokeOpacity: 1,
			};
      });

      // Add hover effect
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dataLayer.addListener('mouseover', (e: any) => {
			if (e.feature) {
				const stateName = e.feature.getProperty('name');
				if (stateName) {
					setHoveredState(stateName);
					map.getDiv().style.cursor = 'pointer';
				}
			}
		});

		dataLayer.addListener('mouseout', () => {
        setHoveredState(null);
			map.getDiv().style.cursor = '';
		});

		// Add click event
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dataLayer.addListener('click', (e: any) => {
			const stateName = e.feature?.getProperty('name');
			if (stateName) {
				setSelectedSite(null);
			}
		});
	}, [map, setHoveredState, setSelectedSite, selectedState]);

	return null;
};

const MapPanel = ({
	selectedState,
	activeLayer,
	onLayerChange,
}: MapPanelProps) => {
	const [selectedSite, setSelectedSite] = useState<WaterSite | null>(null);
	const [hoveredState, setHoveredState] = useState<string | null>(null);
	const mapRef = useRef<google.maps.Map | null>(null);

	// Filter sites based on active layer
	const filteredSites = useMemo(() => {
		if (activeLayer === 'infrastructure') return waterSites;
		if (activeLayer === 'quality')
			return waterSites.filter((s) => s.status !== 'optimal');
		if (activeLayer === 'scarcity')
			return waterSites.filter((s) => s.uptime < 90);
		return waterSites.filter((s) => s.status === 'critical');
	}, [activeLayer]);

	// Handle site click
	const handleSiteClick = useCallback((site: WaterSite) => {
		setSelectedSite(site);
		if (mapRef.current) {
			mapRef.current.setCenter({
				lat: site.coordinates[1],
				lng: site.coordinates[0],
			});
			mapRef.current.setZoom(8);
		}
  }, []);

	// Handle reset
	const handleReset = useCallback(() => {
		if (mapRef.current) {
			mapRef.current.setCenter({lat: 9.082, lng: 8.6753});
			mapRef.current.setZoom(6);
		}
	}, []);

	// Get marker color based on status
	const getMarkerColor = (status: string) => {
		if (status === 'optimal') return '#10b981';
		if (status === 'warning') return '#f59e0b';
		return '#ef4444';
	};

  return (
		<main className='flex-1 flex flex-col relative'>
      {/* Layer Controls */}
			<div className='absolute top-4 left-4 z-10 flex gap-2'>
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={cn(
							'px-4 py-2 rounded-lg flex items-center gap-2 transition-all',
							'border shadow-sm',
                activeLayer === layer.id
								? 'bg-primary/20 border-primary text-primary'
								: 'bg-white border-border hover:bg-gray-50'
						)}
						>
							<Icon className='w-4 h-4' />
							<span className='text-sm font-medium'>
								{layer.label}
							</span>
            </button>
          );
        })}
      </div>

      {/* Map Container */}
			<div className='flex-1 relative'>
				<APIProvider apiKey={MAPS_API_KEY}>
					<Map
						defaultCenter={{lat: 9.082, lng: 8.6753}}
						defaultZoom={6}
						mapId='nigeria-map'
						gestureHandling='greedy'
						style={{width: '100%', height: '100%'}}
						minZoom={5}
						maxZoom={18}
					>
						<MapContent
							selectedState={selectedState}
							activeLayer={activeLayer}
							filteredSites={filteredSites}
							setHoveredState={setHoveredState}
							setSelectedSite={setSelectedSite}
						/>
						{/* Water Site Markers */}
						{filteredSites.map((site) => (
							<AdvancedMarker
								key={site.id}
								position={{
									lat: site.coordinates[1],
									lng: site.coordinates[0],
								}}
								onClick={() => handleSiteClick(site)}
							>
								<div
									className='cursor-pointer'
									style={{
										width: '16px',
										height: '16px',
										borderRadius: '50%',
										backgroundColor: getMarkerColor(
											site.status
										),
										border: '2px solid white',
										boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
										animation:
											site.status === 'critical'
												? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
												: undefined,
									}}
								/>
							</AdvancedMarker>
						))}
					</Map>
				</APIProvider>

				{/* Reset Button */}
				<button
					onClick={handleReset}
					className='absolute top-14 right-4 p-3 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 z-10 flex items-center justify-center border border-gray-200'
					title='Reset view'
				>
					⌂
				</button>
        
        {/* Hover Tooltip */}
        {hoveredState && (
				<div className='absolute top-20 left-1/2 -translate-x-1/2 bg-white border border-primary/30 rounded-lg px-4 py-2 pointer-events-none z-10 shadow-lg'>
						<div className='text-sm font-semibold'>
							{hoveredState}
						</div>
						<div className='text-xs text-muted-foreground'>
							Click to view details
						</div>
          </div>
        )}
      </div>

      {/* State Info Card (when state is selected) */}
      {selectedState && (
				<Card className='absolute bottom-6 left-1/2 -translate-x-1/2 w-96 p-4 bg-white border-primary/30 z-10 shadow-lg'>
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-bold'>
								{selectedState} State
							</h3>
							<Badge className='bg-metric-success/20 text-metric-success border-metric-success/30'>
                Active
              </Badge>
            </div>
            
						<div className='grid grid-cols-2 gap-3'>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									Quality Score
								</div>
								<div className='text-2xl font-bold text-water-primary'>
									89/100
								</div>
							</div>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									Active Sites
              </div>
								<div className='text-2xl font-bold'>
									{
										waterSites.filter(
											(s) => s.state === selectedState
										).length
									}
                </div>
              </div>
            </div>

						<div className='flex items-center gap-2 text-xs text-muted-foreground'>
							<Activity className='w-3 h-3' />
              Last updated: 2 minutes ago
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
			<div className='absolute bottom-6 right-6 bg-white rounded-lg p-4 border border-border shadow-lg z-10'>
				<div className='text-xs font-semibold mb-2'>LEGEND</div>
				<div className='space-y-2 text-xs'>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-success' />
						<span className='text-muted-foreground'>
							Optimal Quality
						</span>
          </div>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-warning' />
						<span className='text-muted-foreground'>
							Moderate Risk
						</span>
          </div>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-danger animate-pulse' />
						<span className='text-muted-foreground'>High Risk</span>
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
