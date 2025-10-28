import {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
	APIProvider,
	Map,
	AdvancedMarker,
	useMap,
} from '@vis.gl/react-google-maps';
import {MapPin, Droplets, Activity, AlertCircle} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {WaterSite} from '@/data/water-sites';
import SiteDetailModal from './SiteDetailModal';
import nigeriaStates from '@/data/nigeria-states.json';

interface StateFeature {
	type: string;
	properties: {
		name: string;
		uptime: number;
		peopleServed: number;
		riskLevel: string;
		alerts: number;
	};
	geometry: {
		type: string;
		coordinates: number[][][];
	};
}

interface StatesGeoJSON {
	type: string;
	features: StateFeature[];
}

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

// Google Maps API Key from environment
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Function to parse CSV data and convert to WaterSite format
const parseCSVToWaterSites = (csvText: string): WaterSite[] => {
	const lines = csvText.trim().split('\n');
	const headers = lines[0].split(',');

	return lines.slice(1).map((line, index) => {
		const values = line.split(',');
		const data: Record<string, string> = {};

		headers.forEach((header, i) => {
			data[header.trim()] = values[i]?.trim() || '';
		});

		// Determine status based on health risk level
		let status: 'optimal' | 'warning' | 'critical' = 'optimal';
		if (data['HEALTH RISK LEVEL'] === 'High') status = 'critical';
		else if (data['HEALTH RISK LEVEL'] === 'Moderate') status = 'warning';

		// Generate uptime based on status and scarcity
		let uptime = 98;
		if (status === 'critical') uptime = Math.random() * 20 + 70; // 70-90%
		else if (status === 'warning')
			uptime = Math.random() * 10 + 85; // 85-95%
		else uptime = Math.random() * 5 + 95; // 95-100%

		return {
			id: `${data['STATES']?.substring(0, 2).toUpperCase()}-${String(
				index + 1
			).padStart(3, '0')}`,
			name: `${data['STATES']} ${data['WATER INFRASTRUCTURE POINTS']} ${
				index + 1
			}`,
			type: 'borehole' as const,
			state: data['STATES'] || '',
			coordinates: [
				parseFloat(data['LONGTITUDE']) || 0,
				parseFloat(data['LATITUDE']) || 0,
			] as [number, number],
			quality: {
				ph: parseFloat(data['pH LEVEL']) || 7,
				turbidity: parseFloat(data['WATER TURBIDITY']) || 0,
				chlorine: parseFloat(data['CHLORINE LEVEL']) || 0,
			},
			uptime: Math.round(uptime * 10) / 10,
			status,
			lastMaintenance: new Date(
				Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
			)
				.toISOString()
				.split('T')[0],
			peopleServed: Math.floor(Math.random() * 5000) + 2000,
			pumpType: data['PUMP TYPE'] || 'Motorized',
			contamination: parseFloat(data['CONTAMINATION']) || 0,
			healthRisk: data['HEALTH RISK LEVEL'] || 'Low',
			scarcity: data['SCARCITY'] === 'TRUE',
			flowRate: data['FLOW_RATE'] || '',
		};
	});
};

// Inner map component that uses the useMap hook
const MapContent = ({
	selectedState,
	activeLayer,
	filteredSites,
	setHoveredState,
	setSelectedSite,
	mapRef,
}: {
	selectedState: string | null;
	activeLayer: string;
	filteredSites: WaterSite[];
	setHoveredState: (state: string | null) => void;
	setSelectedSite: (site: WaterSite | null) => void;
	mapRef: React.MutableRefObject<google.maps.Map | null>;
}) => {
	const map = useMap();

	// Set map reference when map loads
	useEffect(() => {
		if (map) {
			mapRef.current = map;
		}
	}, [map, mapRef]);

	// No longer adding state polygons to the map
	// The state focusing functionality is handled through the selectedState prop
	// and the getStateCenter function in the parent component

	return null;
};

const MapPanel = ({
	selectedState,
	activeLayer,
	onLayerChange,
}: MapPanelProps) => {
	const [selectedSite, setSelectedSite] = useState<WaterSite | null>(null);
	const [hoveredState, setHoveredState] = useState<string | null>(null);
	const [waterSites, setWaterSites] = useState<WaterSite[]>([]);
	const [loading, setLoading] = useState(true);
	const mapRef = useRef<google.maps.Map | null>(null);

	// Function to calculate the center of a polygon
	const calculatePolygonCenter = (coordinates: number[][][]) => {
		let totalLat = 0;
		let totalLng = 0;
		let pointCount = 0;

		coordinates.forEach((ring) => {
			ring.forEach((point) => {
				totalLng += point[0];
				totalLat += point[1];
				pointCount++;
			});
		});

		return {
			lat: totalLat / pointCount,
			lng: totalLng / pointCount,
		};
	};

	// Function to get state center coordinates
	const getStateCenter = useCallback((stateName: string) => {
		const statesData = nigeriaStates as StatesGeoJSON;

		// Try exact match first
		let feature = statesData.features.find(
			(f) => f.properties.name === stateName
		);

		// Try alternative names for common mismatches
		if (!feature) {
			const alternativeName =
				stateName === 'Abuja FCT'
					? 'Abuja'
					: stateName === 'Abuja'
					? 'Abuja FCT'
					: stateName;
			feature = statesData.features.find(
				(f) => f.properties.name === alternativeName
			);
		}

		// if (feature && feature.geometry.type === 'Polygon') {
		// 	return calculatePolygonCenter(feature.geometry.coordinates);
		// }

		// Fallback coordinates for states not in GeoJSON
		const stateCoordinates: Record<string, {lat: number; lng: number}> = {
			Abia: {lat: 5.4527, lng: 7.5248},
			Adamawa: {lat: 9.3265, lng: 12.3984},
			'Akwa Ibom': {lat: 5.0077, lng: 7.8536},
			Anambra: {lat: 6.2209, lng: 6.9326},
			Bauchi: {lat: 10.3158, lng: 9.8442},
			Bayelsa: {lat: 4.7719, lng: 6.0699},
			Benue: {lat: 7.3298, lng: 8.7343},
			Borno: {lat: 11.8846, lng: 13.1571},
			'Cross River': {lat: 5.9631, lng: 8.325},
			Delta: {lat: 5.6037, lng: 5.7793},
			Ebonyi: {lat: 6.2649, lng: 8.0137},
			Edo: {lat: 6.335, lng: 5.6037},
			Ekiti: {lat: 7.7193, lng: 5.311},
			Enugu: {lat: 6.5244, lng: 7.5086},
			Gombe: {lat: 10.2904, lng: 11.1671},
			Imo: {lat: 5.4951, lng: 7.0255},
			Jigawa: {lat: 12.23, lng: 9.35},
			Katsina: {lat: 12.9908, lng: 7.6018},
			Kebbi: {lat: 12.4539, lng: 4.1975},
			Kogi: {lat: 7.7323, lng: 6.74},
			Kwara: {lat: 8.9669, lng: 4.581},
			Nasarawa: {lat: 8.5378, lng: 8.3206},
			Niger: {lat: 10.4806, lng: 6.5056},
			Ogun: {lat: 7.1608, lng: 3.3566},
			Ondo: {lat: 7.2527, lng: 5.2066},
			Osun: {lat: 7.5629, lng: 4.52},
			Plateau: {lat: 9.2182, lng: 9.5179},
			Sokoto: {lat: 13.0059, lng: 5.2476},
			Taraba: {lat: 8.8932, lng: 11.3568},
			Yobe: {lat: 12.2939, lng: 11.9668},
			Zamfara: {lat: 12.1704, lng: 6.6599},
		};

		// Use fallback coordinates if available
		if (stateCoordinates[stateName]) {
			return stateCoordinates[stateName];
		}

		// Final fallback to Nigeria center
		console.warn(`State coordinates not found for: ${stateName}`);
		return {lat: 9.082, lng: 8.6753};
	}, []);

	// Focus map on selected state
	useEffect(() => {
		if (selectedState && mapRef.current) {
			console.log(`Focusing on state: ${selectedState}`);
			const stateCenter = getStateCenter(selectedState);
			console.log(`State center coordinates:`, stateCenter);
			mapRef.current.setCenter(stateCenter);
			mapRef.current.setZoom(8); // Zoom in to state level
		}
	}, [selectedState, getStateCenter]);

	// Load CSV data on component mount
	useEffect(() => {
		const loadCSVData = async () => {
			try {
				const response = await fetch('/dataset.csv');
				const csvText = await response.text();
				const sites = parseCSVToWaterSites(csvText);
				setWaterSites(sites);
			} catch (error) {
				console.error('Error loading CSV data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadCSVData();
	}, []);

	// Filter sites based on active layer
	const filteredSites = useMemo(() => {
		if (activeLayer === 'infrastructure') return waterSites;
		if (activeLayer === 'quality')
			return waterSites.filter((s) => s.status !== 'optimal');
		if (activeLayer === 'scarcity')
			return waterSites.filter((s) => s.scarcity === true);
		return waterSites.filter((s) => s.status === 'critical');
	}, [activeLayer, waterSites]);

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

	if (loading) {
		return (
			<main
				className='flex-1 flex flex-col relative overflow-auto items-center justify-center'
				style={{maxHeight: 'calc(100vh - 7rem)'}}
			>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
					<p className='text-muted-foreground'>
						Loading water site data...
					</p>
				</div>
			</main>
		);
	}

	return (
		<main
			className='flex-1 flex flex-col relative overflow-auto'
			style={{maxHeight: 'calc(100vh - 7rem)'}}
		>
			{/* Layer Controls */}
			{/* <div className='absolute top-4 left-4 z-10 flex gap-2'>
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
			</div> */}

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
							mapRef={mapRef}
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
								<div className='text-2xl font-bold text-blue-900'>
									89/100
								</div>
							</div>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									Active Sites
								</div>
								<div className='text-2xl font-bold text-blue-900'>
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
