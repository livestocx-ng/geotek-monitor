import {
	APIProvider,
	Map,
	AdvancedMarker,
	useMap,
} from '@vis.gl/react-google-maps';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {WaterSite} from '@/data/water-sites';
import SiteDetailModal from './SiteDetailModal';
import nigeriaStates from '@/data/nigeria-states.json';
import {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
	MapPin,
	Droplets,
	Activity,
	AlertCircle,
	LocateFixed,
} from 'lucide-react';
import NigeriaBorders from './NigeriaBoarder';

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
	onSelectState?: (state: string | null) => void;
}

const layers = [
	{id: 'infrastructure', label: 'Infrastructure', icon: MapPin},
	{id: 'quality', label: 'Water Quality', icon: Droplets},
	{id: 'scarcity', label: 'Scarcity Risk', icon: AlertCircle},
	{id: 'activity', label: 'Real-time Activity', icon: Activity},
];

// Google Maps API Key from environment
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Utility function to convert Google Sheets URL to CSV export format
const getGoogleSheetsCSVUrl = (spreadsheetId: string, gid: string) => {
	return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
};

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
	onSelectState,
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
				// Convert Google Sheets URL to CSV export format
				const spreadsheetId =
					'15LMgzFVHCQOkEQId_gCNOoXyck7klAZ63eaGpstKrNc';
				const gid = '662475054';
				const csvUrl = getGoogleSheetsCSVUrl(spreadsheetId, gid);

				const response = await fetch(csvUrl);

				if (!response.ok) {
					throw new Error(
						`Failed to fetch data: ${response.status} ${response.statusText}`
					);
				}

				const csvText = await response.text();

				if (!csvText || csvText.trim().length === 0) {
					throw new Error('Empty CSV data received');
				}

				const sites = parseCSVToWaterSites(csvText);

				if (sites.length === 0) {
					console.warn('No water sites parsed from CSV data');
				}

				setWaterSites(sites);
			} catch (error) {
				console.error('Error loading CSV data:', error);

				// Fallback to local dataset if Google Sheets fails
				try {
					console.log(
						'Attempting to load local dataset as fallback...'
					);
					const fallbackResponse = await fetch('/dataset.csv');
					const fallbackCsvText = await fallbackResponse.text();
					const fallbackSites = parseCSVToWaterSites(fallbackCsvText);
					setWaterSites(fallbackSites);
					console.log(
						'Successfully loaded local dataset as fallback'
					);
				} catch (fallbackError) {
					console.error(
						'Fallback to local dataset also failed:',
						fallbackError
					);
				}
			} finally {
				setTimeout(() => {
					setLoading(false);
				}, 2500);
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
			<main className='md:pr-[380px] flex-1 flex flex-col relative overflow-auto items-center justify-center h-screen md:max-h-[calc(100vh-7rem)]'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4'></div>
					<p className='text-muted-foreground'>
						Loading site data...
					</p>
				</div>
			</main>
		);
	}

	return (
		<main className='top-16 md:pr-[380px] flex-1 flex flex-col relative overflow-auto h-screen md:max-h-[calc(100vh-7rem)]'>
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
						minZoom={5}
						maxZoom={18}
						defaultZoom={6}
						mapId='nigeria-map'
						gestureHandling='greedy'
						// fullscreenControl={false}
						style={{width: '100%', height: '100%'}}
						defaultCenter={{lat: 9.082, lng: 8.6753}}
						// mapTypeId='hybrid' //FOR SATELLITE VIEW
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

						<NigeriaBorders
							selectedState={selectedState}
							onStateClick={(name) => onSelectState?.(name)}
						/>
					</Map>
				</APIProvider>

				{/* Reset Button */}
				<button
					onClick={handleReset}
					className='absolute top-14 right-2 p-3 bg-white rounded-s shadow-md hover:shadow-lg hover:bg-gray-50 z-10 flex items-center justify-center border border-gray-200'
					title='Reset view'
				>
					{/* ⌂ */}
					<LocateFixed size={16} />
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
			{selectedState &&
				(() => {
					const stateSites = waterSites.filter(
						(s) => s.state === selectedState
					);

					// Calculate dynamic quality score based on water parameters
					const calculateQualityScore = () => {
						if (stateSites.length === 0) return 0;

						let totalScore = 0;
						stateSites.forEach((site) => {
							let siteScore = 0;

							// pH Score (0-30 points) - optimal range 6.5-8.5
							const ph = site.quality.ph;
							if (ph >= 6.5 && ph <= 8.5) siteScore += 30;
							else if (ph >= 6.0 && ph <= 9.0) siteScore += 20;
							else siteScore += 10;

							// Turbidity Score (0-25 points) - lower is better
							const turbidity = site.quality.turbidity;
							if (turbidity <= 5) siteScore += 25;
							else if (turbidity <= 10) siteScore += 15;
							else siteScore += 5;

							// Chlorine Score (0-25 points) - optimal range 0.2-0.5
							const chlorine = site.quality.chlorine;
							if (chlorine >= 0.2 && chlorine <= 0.5)
								siteScore += 25;
							else if (chlorine >= 0.1 && chlorine <= 1.0)
								siteScore += 15;
							else siteScore += 5;

							// Contamination Score (0-20 points) - lower is better
							const contamination = site.contamination || 0;
							if (contamination <= 0.2) siteScore += 20;
							else if (contamination <= 0.5) siteScore += 15;
							else siteScore += 5;

							totalScore += siteScore;
						});

						return Math.round(totalScore / stateSites.length);
					};

					// Count sites by status
					const statusCounts = {
						optimal: stateSites.filter(
							(s) => s.status === 'optimal'
						).length,
						warning: stateSites.filter(
							(s) => s.status === 'warning'
						).length,
						critical: stateSites.filter(
							(s) => s.status === 'critical'
						).length,
					};

					// Determine overall state status
					const getStateStatus = () => {
						const criticalRatio =
							statusCounts.critical / stateSites.length;
						const warningRatio =
							statusCounts.warning / stateSites.length;

						if (criticalRatio > 0.3)
							return {
								status: 'Critical',
								color: 'bg-metric-danger/20 text-metric-danger border-metric-danger/30',
							};
						if (warningRatio > 0.4 || criticalRatio > 0.1)
							return {
								status: 'Warning',
								color: 'bg-metric-warning/20 text-metric-warning border-metric-warning/30',
							};
						return {
							status: 'Good',
							color: 'bg-metric-success/20 text-metric-success border-metric-success/30',
						};
					};

					const qualityScore = calculateQualityScore();
					const stateStatus = getStateStatus();
					const averageUptime =
						stateSites.length > 0
							? Math.round(
									(stateSites.reduce(
										(sum, site) => sum + site.uptime,
										0
									) /
										stateSites.length) *
										10
							  ) / 10
							: 0;
					const totalPeopleServed = stateSites.reduce(
						(sum, site) => sum + site.peopleServed,
						0
					);

					return (
						<Card className='absolute bottom-12 md:bottom-10 left-2 -translate-y-6 w-auto mo-w-6xl p-2 bg-white border-primary/30 z-10 shadow-lg'>
							<div className='flex flex-col items-center justify-between gap-4'>
								{/* Title and Status */}
								<div className='flex items-center justify-between gap-3 w-full'>
									<h3 className='text-base font-bold'>
										{selectedState} State
									</h3>
									{/* <Badge
										className={stateStatus.color}
										size='sm'
									>
										{stateStatus.status}
									</Badge> */}
								</div>

								<div className='flex items-center justify-between w-full'>
									{/* Status Counts */}
									<div className='bg-metric-success/10 rounded px-2 py-1 text-center min-w-[40px]'>
										<div className='text-[10px] text-muted-foreground font-semibold'>
											Optimal
										</div>
										<div className='text-sm font-bold text-metric-success'>
											{statusCounts.optimal}
										</div>
									</div>
									<div className='bg-metric-warning/10 rounded px-2 py-1 text-center min-w-[40px]'>
										<div className='text-[10px] text-muted-foreground font-semibold'>
											Warning
										</div>
										<div className='text-sm font-bold text-metric-warning'>
											{statusCounts.warning}
										</div>
									</div>
									<div className='bg-metric-danger/10 rounded px-2 py-1 text-center min-w-[40px]'>
										<div className='text-[10px] text-muted-foreground font-semibold'>
											Critical
										</div>
										<div className='text-sm font-bold text-metric-danger'>
											{statusCounts.critical}
										</div>
									</div>
								</div>

								{/* Metrics */}
								<div className='flex items-center gap-3'>
									{/* Quality Score */}
									<div className='bg-background/50 rounded px-2 py-1 text-center min-w-[60px]'>
										<div className='text-[10px] text-muted-foreground'>
											Quality
										</div>
										<div
											className={`text-sm font-bold ${
												qualityScore >= 80
													? 'text-metric-success'
													: qualityScore >= 60
													? 'text-metric-warning'
													: 'text-metric-danger'
											}`}
										>
											{qualityScore}/100
										</div>
									</div>

									{/* Active Sites */}
									<div className='bg-background/50 rounded px-2 py-1 text-center min-w-[50px]'>
										<div className='text-[10px] text-muted-foreground'>
											Sites
										</div>
										<div className='text-sm font-bold text-blue-900'>
											{stateSites.length}
										</div>
									</div>

									{/* Uptime */}
									<div className='bg-background/50 rounded px-2 py-1 text-center min-w-[50px]'>
										<div className='text-[10px] text-muted-foreground'>
											Uptime
										</div>
										<div className='text-sm font-bold text-blue-600'>
											{averageUptime}%
										</div>
									</div>

									{/* People Served */}
									<div className='bg-background/50 rounded px-2 py-1 text-center min-w-[60px]'>
										<div className='text-[10px] text-muted-foreground'>
											Served
										</div>
										<div className='text-xs font-bold text-blue-600'>
											{totalPeopleServed > 1000
												? `${Math.round(
														totalPeopleServed / 1000
												  )}k`
												: totalPeopleServed.toLocaleString()}
										</div>
									</div>
								</div>
							</div>
						</Card>
					);
				})()}

			{/* Legend */}
			<div className='absolute top-14 left-2 bg-white rounded-lg p-4 border border-border shadow-lg z-10'>
				<div className='text-xs font-semibold mb-2'>LEGEND</div>
				<div className='space-y-2 text-xs'>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-success border-2 border-slate-200 animate-pulse delay-300' />
						<span className='text-muted-foreground'>
							Optimal Quality
						</span>
					</div>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-warning border-2 border-slate-200 animate-pulse delay-700' />
						<span className='text-muted-foreground'>
							Moderate Risk
						</span>
					</div>
					<div className='flex items-center gap-2'>
						<div className='w-3 h-3 rounded-full bg-metric-danger border-2 border-slate-200 animate-pulse' />
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
