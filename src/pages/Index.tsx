import {useState} from 'react';
import StateNavigator from '@/components/dashboard/StateNavigator';
import MapPanel from '@/components/dashboard/MapPanel';
import AIInsights from '@/components/dashboard/AIInsights';
import KPIRibbon from '@/components/dashboard/KPIRibbon';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Index = () => {
	const [selectedState, setSelectedState] = useState<string | null>(null);
	const [activeLayer, setActiveLayer] = useState<string>('infrastructure');
	const [showStateNav, setShowStateNav] = useState(false);

	return (
		<div className='min-h-scree overflow-hidden bg-dashboard-bg text-foreground flex flex-col relative'>
			<DashboardHeader
				showStateNav={showStateNav}
				onToggleStateNav={() => setShowStateNav(!showStateNav)}
				selectedState={selectedState}
			/>

			<div className='flex-1 flex overflow-hidden relativ'>
				{/* Left Sidebar - State Navigator */}
				<StateNavigator
					selectedState={selectedState}
					onSelectState={(state) => {
						setSelectedState(state);
						setShowStateNav(false); // Auto-close on mobile after selection
					}}
					showStateNav={showStateNav}
				/>

				{/* Mobile Overlay */}
				{showStateNav && (
					<div
						className='md:hidden absolute inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300'
						onClick={() => setShowStateNav(false)}
					/>
				)}

				{/* Center - Map Panel */}
				<MapPanel
					selectedState={selectedState}
					activeLayer={activeLayer}
					onLayerChange={setActiveLayer}
					onSelectState={setSelectedState}
				/>

				{/* Right Panel - AI Insights - Hidden on mobile */}
				<div className='hidden md:block'>
					<AIInsights selectedState={selectedState} />
				</div>
			</div>

			{/* Bottom - KPI Ribbon */}
			<div className='hidden md:block'>
				<KPIRibbon />
			</div>
		</div>
	);
};

export default Index;
