import {useState} from 'react';
import {Search, AlertTriangle, CheckCircle2, AlertCircle} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';

interface StateData {
	name: string;
	uptime: number;
	peopleServed: number;
	riskLevel: 'low' | 'medium' | 'high';
}

const mockStates: StateData[] = [
	{name: 'Abia', uptime: 89, peopleServed: 12500, riskLevel: 'medium'},
	{name: 'Adamawa', uptime: 76, peopleServed: 11200, riskLevel: 'high'},
	{name: 'Akwa Ibom', uptime: 93, peopleServed: 18700, riskLevel: 'low'},
	{name: 'Anambra', uptime: 95, peopleServed: 19800, riskLevel: 'low'},
	{name: 'Bauchi', uptime: 81, peopleServed: 14300, riskLevel: 'medium'},
	{name: 'Bayelsa', uptime: 87, peopleServed: 8900, riskLevel: 'medium'},
	{name: 'Benue', uptime: 84, peopleServed: 16400, riskLevel: 'medium'},
	{name: 'Borno', uptime: 72, peopleServed: 9800, riskLevel: 'high'},
	{name: 'Cross River', uptime: 90, peopleServed: 13600, riskLevel: 'low'},
	{name: 'Delta', uptime: 92, peopleServed: 17200, riskLevel: 'low'},
	{name: 'Ebonyi', uptime: 86, peopleServed: 10800, riskLevel: 'medium'},
	{name: 'Edo', uptime: 91, peopleServed: 15900, riskLevel: 'low'},
	{name: 'Ekiti', uptime: 88, peopleServed: 11700, riskLevel: 'medium'},
	{name: 'Enugu', uptime: 94, peopleServed: 14300, riskLevel: 'low'},
	{name: 'Abuja FCT', uptime: 99, peopleServed: 28000, riskLevel: 'low'},
	{name: 'Gombe', uptime: 79, peopleServed: 12100, riskLevel: 'high'},
	{name: 'Imo', uptime: 90, peopleServed: 16800, riskLevel: 'low'},
	{name: 'Jigawa', uptime: 77, peopleServed: 13400, riskLevel: 'high'},
	{name: 'Kaduna', uptime: 92, peopleServed: 15200, riskLevel: 'medium'},
	{name: 'Kano', uptime: 85, peopleServed: 18500, riskLevel: 'high'},
	{name: 'Katsina', uptime: 80, peopleServed: 14700, riskLevel: 'medium'},
	{name: 'Kebbi', uptime: 75, peopleServed: 11900, riskLevel: 'high'},
	{name: 'Kogi', uptime: 87, peopleServed: 13800, riskLevel: 'medium'},
	{name: 'Kwara', uptime: 89, peopleServed: 12900, riskLevel: 'medium'},
	{name: 'Lagos', uptime: 98, peopleServed: 25000, riskLevel: 'low'},
	{name: 'Nasarawa', uptime: 83, peopleServed: 11600, riskLevel: 'medium'},
	{name: 'Niger', uptime: 82, peopleServed: 15300, riskLevel: 'medium'},
	{name: 'Ogun', uptime: 93, peopleServed: 17500, riskLevel: 'low'},
	{name: 'Ondo', uptime: 91, peopleServed: 14800, riskLevel: 'low'},
	{name: 'Osun', uptime: 89, peopleServed: 13200, riskLevel: 'medium'},
	{name: 'Oyo', uptime: 88, peopleServed: 16800, riskLevel: 'medium'},
	{name: 'Plateau', uptime: 91, peopleServed: 13700, riskLevel: 'medium'},
	{name: 'Rivers', uptime: 96, peopleServed: 21000, riskLevel: 'low'},
	{name: 'Sokoto', uptime: 78, peopleServed: 12400, riskLevel: 'high'},
	{name: 'Taraba', uptime: 74, peopleServed: 10500, riskLevel: 'high'},
	{name: 'Yobe', uptime: 73, peopleServed: 9200, riskLevel: 'high'},
	{name: 'Zamfara', uptime: 76, peopleServed: 10900, riskLevel: 'high'},
];

interface StateNavigatorProps {
	selectedState: string | null;
	onSelectState: (state: string) => void;
}

const StateNavigator = ({
	selectedState,
	onSelectState,
}: StateNavigatorProps) => {
	const [searchTerm, setSearchTerm] = useState('');

	const filteredStates = mockStates.filter((state) =>
		state.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getRiskIcon = (level: string) => {
		switch (level) {
			case 'low':
				return <CheckCircle2 className='w-4 h-4 text-metric-success' />;
			case 'medium':
				return <AlertCircle className='w-4 h-4 text-metric-warning' />;
			case 'high':
				return <AlertTriangle className='w-4 h-4 text-metric-danger' />;
			default:
				return null;
		}
	};

	const getRiskColor = (level: string) => {
		switch (level) {
			case 'low':
				return 'bg-metric-success/10 text-metric-success border-metric-success/20';
			case 'medium':
				return 'bg-metric-warning/10 text-metric-warning border-metric-warning/20';
			case 'high':
				return 'bg-metric-danger/10 text-metric-danger border-metric-danger/20';
			default:
				return '';
		}
	};

	return (
		<aside className='w-80 bg-dashboard-panel border-r border-border flex flex-col h-[calc(100vh-3.5rem)]'>
			{/* Header */}
			<div className='p-4 border-b border-border'>
				<h2 className='text-lg font-semibold mb-3'>State Navigator</h2>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
					<Input
						placeholder='Search states...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='pl-9 bg-background/50'
					/>
				</div>
			</div>

			{/* Scrollbar added here oh */}
			<ScrollArea className='flex-1'>
				<div className='p-2 space-y-1 pb-24'>
					{filteredStates.map((state) => (
						<button
							key={state.name}
							onClick={() => onSelectState(state.name)}
							className={cn(
								'w-full p-3 rounded-lg transition-all hover:bg-dashboard-elevated text-left',
								selectedState === state.name &&
									'bg-dashboard-elevated ring-1 ring-primary/50'
							)}
						>
							<div className='flex items-start justify-between mb-2'>
								<span className='font-medium'>
									{state.name}
								</span>
								{getRiskIcon(state.riskLevel)}
							</div>

							<div className='space-y-1.5'>
								<div className='flex items-center justify-between text-xs'>
									<span className='text-muted-foreground'>
										Uptime
									</span>
									<span className='font-medium'>
										{state.uptime}%
									</span>
								</div>
								<div className='flex items-center justify-between text-xs'>
									<span className='text-muted-foreground'>
										People Served
									</span>
									<span className='font-medium'>
										{state.peopleServed.toLocaleString()}
									</span>
								</div>
							</div>

							<Badge
								variant='outline'
								className={cn(
									'mt-2 text-[10px]',
									getRiskColor(state.riskLevel)
								)}
							>
								{state.riskLevel.toUpperCase()} RISK
							</Badge>
						</button>
					))}
				</div>
			</ScrollArea>
		</aside>
	);
};

export default StateNavigator;
