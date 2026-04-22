import React, { useState } from 'react';
import {
	ShieldAlert,
	Droplets,
	Activity,
	Database,
	HardDrive,
	Key,
	Radio,
	Thermometer,
	AlertTriangle,
	Search,
	BookOpen,
	Clock,
	ArrowDown,
	TrendingDown,
	RefreshCw,
	BarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface LoggEntry {
	id: string;
	keyword: string;
	// category: 'Environment Secret' | 'Domain Metric' | 'Infrastructure' | 'Alerting';
	category: string;
	meaning: string;
	icon: React.ElementType;
	sensitivity: 'Critical' | 'High' | 'Normal';
}
const appendixData: LoggEntry[] = [
    // --- WATER QUALITY (Chemical, Physical & Biological) ---
    {
        id: 'wq_1',
        keyword: 'WQI (Water Quality Index)',
        category: 'Water Quality',
        meaning: 'A composite score derived from multiple parameters (pH, turbidity, chlorine). It provides a simplified 0-100 rating of how safe water is for human consumption.',
        icon: Activity,
        sensitivity: 'High'
    },
    {
        id: 'wq_2',
        keyword: 'Turbidity (NTU)',
        category: 'Water Quality',
        meaning: 'A measure of water cloudiness caused by suspended solids. High turbidity can shield viruses and bacteria from disinfection processes.',
        icon: Droplets,
        sensitivity: 'High'
    },
    {
        id: 'wq_3',
        keyword: 'Free Residual Chlorine',
        category: 'Water Quality',
        meaning: 'The amount of chlorine remaining in the water after the initial disinfection. It protects against re-contamination as water moves through the distribution system.',
        icon: Thermometer,
        sensitivity: 'Normal'
    },
    {
        id: 'wq_4',
        keyword: 'pH Level',
        category: 'Water Quality',
        meaning: 'Indicates how acidic or alkaline the water is. Levels outside the 6.5–8.5 range can cause pipe corrosion or a bitter metallic taste.',
        icon: Thermometer,
        sensitivity: 'High'
    },
    {
        id: 'wq_5',
        keyword: 'TDS (Total Dissolved Solids)',
        category: 'Water Quality',
        meaning: 'The total concentration of dissolved substances (salts, minerals, metals) in the water. High TDS often correlates with poor taste and "hard" water.',
        icon: Droplets,
        sensitivity: 'Normal'
    },
    {
        id: 'wq_6',
        keyword: 'E. Coli / Coliforms',
        category: 'Water Quality',
        meaning: 'Biological indicators of fecal contamination. Their presence indicates a high risk of waterborne pathogens like Cholera or Typhoid.',
        icon: ShieldAlert,
        sensitivity: 'Critical'
    },
    {
        id: 'wq_7',
        keyword: 'Specific Conductance',
        category: 'Water Quality',
        meaning: 'Measures the water’s ability to conduct electricity, which increases with the concentration of dissolved ions (salinity).',
        icon: Activity,
        sensitivity: 'Normal'
    },
    {
        id: 'wq_8',
        keyword: 'Dissolved Oxygen (DO)',
        category: 'Water Quality',
        meaning: 'The amount of oxygen available in the water. Low levels in source water can indicate organic pollution or stagnant conditions.',
        icon: Droplets,
        sensitivity: 'High'
    },
    {
        id: 'wq_9',
        keyword: 'Fluoride Concentration',
        category: 'Water Quality',
        meaning: 'Naturally occurring minerals in groundwater. While small amounts prevent tooth decay, high levels in deep boreholes can cause skeletal fluorosis.',
        icon: Activity,
        sensitivity: 'Normal'
    },

    // --- WATER AVAILABILITY (Yield, Source & Supply) ---
    {
        id: 'wa_1',
        keyword: 'Flow Rate (L/s)',
        category: 'Water Availability',
        meaning: 'The volume of water being delivered by a pump per second. Drops in flow rate may indicate mechanical failure or a depleting water source.',
        icon: Activity,
        sensitivity: 'Normal'
    },
    {
        id: 'wa_2',
        keyword: 'Static Water Level (SWL)',
        category: 'Water Availability',
        meaning: 'The depth from the ground surface to the water table when the pump is idle. This is the primary baseline for measuring aquifer health.',
        icon: ArrowDown,
        sensitivity: 'High'
    },
    {
        id: 'wa_3',
        keyword: 'Drawdown',
        category: 'Water Availability',
        meaning: 'The drop in water level that occurs during active pumping. Excessive drawdown can lead to the pump "running dry," damaging the motor.',
        icon: TrendingDown,
        sensitivity: 'High'
    },
    {
        id: 'wa_4',
        keyword: 'Aquifer Recharge Rate',
        category: 'Water Availability',
        meaning: 'The speed at which an underground water source refills after extraction. Essential for determining the sustainable "safe yield" of a borehole.',
        icon: RefreshCw,
        sensitivity: 'Normal'
    },
    {
        id: 'wa_5',
        keyword: 'Daily Water Production',
        category: 'Water Availability',
        meaning: 'The total cumulative volume (typically in m³ or Liters) extracted over a 24-hour period to meet community demand.',
        icon: Database,
        sensitivity: 'Normal'
    },
    {
        id: 'wa_6',
        keyword: 'Groundwater Depletion',
        category: 'Water Availability',
        meaning: 'An alert state triggered when the rate of extraction consistently exceeds the natural recharge of the borehole source.',
        icon: AlertTriangle,
        sensitivity: 'High'
    },
    {
        id: 'wa_7',
        keyword: 'Scarcity Flag',
        category: 'Water Availability',
        meaning: 'A system-level alert indicating that the available water supply has dropped below the minimum required volume for the served population.',
        icon: ShieldAlert,
        sensitivity: 'Critical'
    },
    {
        id: 'wa_8',
        keyword: 'Well Recovery Time',
        category: 'Water Availability',
        meaning: 'The time required for the water level to return to its static state after the pump is turned off.',
        icon: Clock,
        sensitivity: 'Normal'
    },
    {
        id: 'wa_9',
        keyword: 'Stage (Gage Height)',
        category: 'Water Availability',
        meaning: 'The vertical height of the water surface above a zero-reference point. Used to monitor water levels in surface reservoirs or open-well systems.',
        icon: BarChart,
        sensitivity: 'Normal'
    }
];

const Appendix = () => {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredLogs = appendixData.filter(
		(entry) =>
			entry.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entry.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entry.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className='min-h-scree overflow-hidden bg-dashboard-bg text-foreground flex flex-col relative'>
			<DashboardHeader
				showStateNav={false}
				onToggleStateNav={() => {}}
				selectedState={''}
			/>
			<div className="max-w-7xl mx-auto space-y-8 pt-20 pb-10">

				{/* Header Section */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-8">
					<div className="space-y-4">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
							Appendix
						</h1>
						<p className="text-black/80 max-w-2xl text-lg leading-relaxed">
							A comprehensive log of sensitive environment variables, diagnostic metrics, and specialized infrastructure terminology used throughout the Geotek Monitor ecosystem.
						</p>
					</div>

					<div className="relative w-full md:w-80 group">
						<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-black/60 group-focus-within:text-black transition-colors">
							<Search className="w-5 h-5" />
						</div>
						<Input
							type="text"
							placeholder="Search keywords, meanings..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 h-12 bg-black/5 border-black/10 focus-visible:ring-black focus-visible:border-black/50 text-black text-base rounded-xl backdrop-blur-md transition-all placeholder:text-black/50"
						/>
					</div>
				</div>

				{/* Glossary Grid */}
				{filteredLogs.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-black/5 border border-black/10 rounded-3xl backdrop-blur-md">
						<div className="p-4 bg-black/10 rounded-full mb-2">
							<Search className="w-8 h-8 text-black/50" />
						</div>
						<h3 className="text-xl font-semibold text-black">No matches found</h3>
						<p className="text-black/70">Try adjusting your search terms to find what you're looking for.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredLogs.map((entry, idx) => {
							const Icon = entry.icon;
							return (
								<div
									key={entry.id}
									className="group relative flex flex-col justify-between p-6 rounded-3xl bg-black/5 border border-black/10 hover:border-black/30 hover:bg-black/10 transition-all duration-500 overflow-hidden"
									style={{ animationDelay: `${idx * 50}ms` }}
								>
									{/* Subtle Gradient Glow on Hover */}
									<div className="absolute -inset-px bg-gradient-to-b from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />

									<div className="relative z-10 space-y-5">
										<div className="flex justify-between items-start">
											<div className="p-3 rounded-2xl bg-black/10 text-black ring-1 ring-black/5 group-hover:ring-black/30 group-hover:bg-black/20 transition-all duration-300">
												<Icon className="w-6 h-6" />
											</div>

											<Badge
												variant="outline"
												className={`
                          px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border
                          ${entry.sensitivity === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                          ${entry.sensitivity === 'High' ? 'bg-metric-warning/10 text-metric-warning border-metric-warning/20' : ''}
                          ${entry.sensitivity === 'Normal' ? 'bg-black/5 text-black border-black/10' : ''}
                        `}
											>
												{entry.sensitivity}
											</Badge>
										</div>

										<div className="space-y-2">
											{/* <div className="inline-block text-xs font-medium tracking-widest text-black/60 uppercase">
												{entry.category}
											</div> */}
											<h3 className="text-xl font-bold tracking-tight text-black group-hover:text-black transition-colors duration-300">
												{entry.keyword}
											</h3>
										</div>

										<p className="text-sm leading-relaxed text-black/80 group-hover:text-black transition-colors">
											{entry.meaning}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default Appendix;