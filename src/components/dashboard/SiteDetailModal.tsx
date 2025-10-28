import {useState} from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
	Droplets,
	Activity,
	Calendar,
	Users,
	AlertCircle,
	TrendingUp,
} from 'lucide-react';
import {WaterSite} from '@/data/water-sites';
import {cn} from '@/lib/utils';
import FlowRateChart from './FlowRateChart';

interface SiteDetailModalProps {
	site: WaterSite | null;
	open: boolean;
	onClose: () => void;
}

const SiteDetailModal = ({site, open, onClose}: SiteDetailModalProps) => {
	const [showFlowChart, setShowFlowChart] = useState(false);

	if (!site) return null;

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'optimal':
				return 'bg-metric-success/20 text-metric-success border-metric-success/30';
			case 'warning':
				return 'bg-metric-warning/20 text-metric-warning border-metric-warning/30';
			case 'critical':
				return 'bg-metric-danger/20 text-metric-danger border-metric-danger/30';
			default:
				return 'bg-muted text-muted-foreground border-border';
		}
	};

	const getQualityStatus = (value: number, param: string) => {
		if (param === 'ph') {
			return value >= 6.5 && value <= 8.5
				? 'optimal'
				: value < 6.0 || value > 9.0
				? 'critical'
				: 'warning';
		}
		if (param === 'turbidity') {
			return value <= 5 ? 'optimal' : value > 10 ? 'critical' : 'warning';
		}
		if (param === 'chlorine') {
			return value >= 0.2 && value <= 0.5
				? 'optimal'
				: value < 0.1 || value > 1.0
				? 'critical'
				: 'warning';
		}
		return 'optimal';
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[500px] bg-white border-primary/30'>
				<DialogHeader>
					<div className='flex items-start justify-between mt-5'>
						<div>
							{/* <DialogTitle className='text-lg font-bold mb-2'>
								{site.name}
							</DialogTitle> */}
							<DialogDescription className='text-muted-forground font-bold'>
								{site.type.charAt(0).toUpperCase() +
									site.type.slice(1)}{' '}
								• {site.state} State
							</DialogDescription>
						</div>
						<Badge
							className={cn('ml-4', getStatusColor(site.status))}
						>
							{site.status.toUpperCase()}
						</Badge>
					</div>
				</DialogHeader>

				<div className='space-y-4 mt-4'>
					{/* Compact Water Quality & Status Grid */}
					<div className='grid grid-cols-4 gap-2'>
						<div className='bg-background/50 rounded-lg p-2 text-center'>
							<div className='text-xs text-muted-foreground'>
								pH
							</div>
							<div
								className={cn(
									'text-lg font-bold',
									getQualityStatus(site.quality.ph, 'ph') ===
										'optimal'
										? 'text-metric-success'
										: getQualityStatus(
												site.quality.ph,
												'ph'
										  ) === 'critical'
										? 'text-metric-danger'
										: 'text-metric-warning'
								)}
							>
								{site.quality.ph}
							</div>
						</div>
						<div className='bg-background/50 rounded-lg p-2 text-center'>
							<div className='text-xs text-muted-foreground'>
								Turbidity
							</div>
							<div
								className={cn(
									'text-lg font-bold',
									getQualityStatus(
										site.quality.turbidity,
										'turbidity'
									) === 'optimal'
										? 'text-metric-success'
										: getQualityStatus(
												site.quality.turbidity,
												'turbidity'
										  ) === 'critical'
										? 'text-metric-danger'
										: 'text-metric-warning'
								)}
							>
								{site.quality.turbidity}
							</div>
						</div>
						<div className='bg-background/50 rounded-lg p-2 text-center'>
							<div className='text-xs text-muted-foreground'>
								Chlorine
							</div>
							<div
								className={cn(
									'text-lg font-bold',
									getQualityStatus(
										site.quality.chlorine,
										'chlorine'
									) === 'optimal'
										? 'text-metric-success'
										: getQualityStatus(
												site.quality.chlorine,
												'chlorine'
										  ) === 'critical'
										? 'text-metric-danger'
										: 'text-metric-warning'
								)}
							>
								{site.quality.chlorine}
							</div>
						</div>
						<div className='bg-background/50 rounded-lg p-2 text-center'>
							<div className='text-xs text-muted-foreground'>
								Uptime
							</div>
							<div className='text-lg font-bold text-blue-600'>
								{site.uptime}%
							</div>
						</div>
					</div>

					{/* Key Information Grid */}
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									Pump Type:
								</span>
								<span className='text-sm font-medium'>
									{site.pumpType}
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									Contamination:
								</span>
								<span className='text-sm font-medium'>
									{site.contamination}
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									People Served:
								</span>
								<span className='text-sm font-medium'>
									{site.peopleServed.toLocaleString()}
								</span>
							</div>
						</div>
						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									Health Risk:
								</span>
								<Badge
									className={cn(
										'text-xs',
										site.healthRisk === 'High'
											? 'bg-metric-danger/20 text-metric-danger'
											: site.healthRisk === 'Moderate'
											? 'bg-metric-warning/20 text-metric-warning'
											: 'bg-metric-success/20 text-metric-success'
									)}
								>
									{site.healthRisk}
								</Badge>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									Water Scarcity:
								</span>
								<Badge
									className={cn(
										'text-xs',
										site.scarcity
											? 'bg-metric-danger/20 text-metric-danger'
											: 'bg-metric-success/20 text-metric-success'
									)}
								>
									{site.scarcity ? 'Yes' : 'No'}
								</Badge>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-xs text-muted-foreground'>
									Last Maintenance:
								</span>
								<span className='text-sm font-medium'>
									{new Date(
										site.lastMaintenance
									).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
									})}
								</span>
							</div>
						</div>
					</div>

					{/* Location Information */}
					<div className='bg-blue-50 rounded-lg p-3'>
						<div className='flex items-center gap-2 mb-2'>
							<Activity className='w-4 h-4 text-blue-600' />
							<span className='text-sm font-semibold text-blue-900'>
								Location & Infrastructure
							</span>
						</div>
						<div className='grid grid-cols-2 gap-2 text-xs'>
							<div>
								<span className='text-muted-foreground'>
									Coordinates:
								</span>
								<div className='font-mono text-xs'>
									{site.coordinates[1].toFixed(4)},{' '}
									{site.coordinates[0].toFixed(4)}
								</div>
							</div>
							<div>
								<span className='text-muted-foreground'>
									Infrastructure:
								</span>
								<div className='font-medium'>
									{site.type.charAt(0).toUpperCase() +
										site.type.slice(1)}
								</div>
							</div>
						</div>
					</div>

					{/* AI Recommendations */}
					{site.status !== 'optimal' && (
						<div className='bg-metric-warning/10 border border-metric-warning/30 rounded-lg p-4'>
							<div className='flex items-start gap-3'>
								<AlertCircle className='w-5 h-5 text-metric-warning flex-shrink-0 mt-0.5' />
								<div>
									<h4 className='text-sm font-semibold mb-1'>
										AI Recommendation
									</h4>
									<p className='text-sm text-muted-foreground'>
										{site.status === 'critical'
											? 'Immediate maintenance required. Water quality parameters outside safe ranges. Schedule inspection within 24 hours.'
											: 'Monitor water quality closely. Consider preventive maintenance within the next week to avoid further degradation.'}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Flow Rate Button */}
					{site.flowRate && (
						<div className='pt-2'>
							<Button
								onClick={() => setShowFlowChart(true)}
								className='w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2'
							>
								<TrendingUp className='w-4 h-4' />
								Show Flow Rate Analysis
							</Button>
						</div>
					)}
				</div>
			</DialogContent>

			{/* Flow Rate Chart Modal */}
			<FlowRateChart
				open={showFlowChart}
				onClose={() => setShowFlowChart(false)}
				flowRateUrl={site.flowRate || ''}
				siteName={site.name}
			/>
		</Dialog>
	);
};

export default SiteDetailModal;
