import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Droplets, Activity, Calendar, Users, AlertCircle} from 'lucide-react';
import {WaterSite} from '@/data/water-sites';
import {cn} from '@/lib/utils';

interface SiteDetailModalProps {
	site: WaterSite | null;
	open: boolean;
	onClose: () => void;
}

const SiteDetailModal = ({site, open, onClose}: SiteDetailModalProps) => {
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
			<DialogContent className='sm:max-w-[600px] bg-white border-primary/30'>
				<DialogHeader>
					<div className='flex items-start justify-between'>
						<div>
							<DialogTitle className='text-xl font-bold mb-2'>
								{site.name}
							</DialogTitle>
							<DialogDescription className='text-muted-foreground'>
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

				<div className='space-y-6 mt-4'>
					{/* Water Quality Metrics */}
					<div>
						<h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
							<Droplets className='w-4 h-4 text-water-primary' />
							Water Quality Metrics
						</h4>
						<div className='grid grid-cols-3 gap-3'>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									pH Level
								</div>
								<div
									className={cn(
										'text-2xl font-bold',
										getQualityStatus(
											site.quality.ph,
											'ph'
										) === 'optimal'
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
								<div className='text-xs text-muted-foreground mt-1'>
									6.5-8.5 optimal
								</div>
							</div>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									Turbidity
								</div>
								<div
									className={cn(
										'text-2xl font-bold',
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
								<div className='text-xs text-muted-foreground mt-1'>
									NTU
								</div>
							</div>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									Chlorine
								</div>
								<div
									className={cn(
										'text-2xl font-bold',
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
								<div className='text-xs text-muted-foreground mt-1'>
									mg/L
								</div>
							</div>
						</div>
					</div>

					{/* Operational Metrics */}
					<div>
						<h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
							<Activity className='w-4 h-4 text-primary' />
							Operational Status
						</h4>
						<div className='grid grid-cols-2 gap-3'>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									System Uptime
								</div>
								<div className='text-lg font-bold'>
									{site.uptime}%
								</div>
							</div>
							<div className='bg-background/50 rounded-lg p-3'>
								<div className='text-xs text-muted-foreground mb-1'>
									People Served
								</div>
								<div className='text-lg font-bold'>
									{site.peopleServed.toLocaleString()}
								</div>
							</div>
							{site.pumpType && (
								<div className='bg-background/50 rounded-lg p-3'>
									<div className='text-xs text-muted-foreground mb-1'>
										Pump Type
									</div>
									<div className='text-sm font-bold'>
										{site.pumpType}
									</div>
								</div>
							)}
							{site.contamination !== undefined && (
								<div className='bg-background/50 rounded-lg p-3'>
									<div className='text-xs text-muted-foreground mb-1'>
										Contamination
									</div>
									<div className='text-lg font-bold'>
										{site.contamination}
									</div>
								</div>
							)}
							{site.healthRisk && (
								<div className='bg-background/50 rounded-lg p-3'>
									<div className='text-xs text-muted-foreground mb-1'>
										Health Risk
									</div>
									<Badge
										className={cn(
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
							)}
							{site.scarcity !== undefined && (
								<div className='bg-background/50 rounded-lg p-3'>
									<div className='text-xs text-muted-foreground mb-1'>
										Water Scarcity
									</div>
									<Badge
										className={cn(
											site.scarcity
												? 'bg-metric-danger/20 text-metric-danger'
												: 'bg-metric-success/20 text-metric-success'
										)}
									>
										{site.scarcity ? 'Yes' : 'No'}
									</Badge>
								</div>
							)}
							<div className='bg-background/50 rounded-lg p-3'>
								<Calendar className='w-4 h-4 text-muted-foreground inline mr-2' />
								<div>
									<div className='text-xs text-muted-foreground'>
										Last Maintenance
									</div>
									<div className='text-sm font-bold'>
										{new Date(
											site.lastMaintenance
										).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</div>
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

					{/* Action Buttons */}
					<div className='flex gap-2 pt-2'>
						<Button className='flex-1'>Schedule Maintenance</Button>
						<Button variant='outline' className='flex-1'>
							View Full Report
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SiteDetailModal;
