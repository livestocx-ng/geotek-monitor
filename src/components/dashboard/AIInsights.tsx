import {Brain, AlertTriangle, TrendingUp, Wrench} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';

interface AIInsightsProps {
	selectedState: string | null;
}

const insights = [
	{
		type: 'alert',
		severity: 'high',
		title: 'Turbidity Spike Detected',
		description:
			'Kaduna: 3 sites showing increasing turbidity. High contamination risk predicted within 48h.',
		timestamp: '12 minutes ago',
	},
	{
		type: 'prediction',
		severity: 'medium',
		title: 'Water Scarcity Forecast',
		description:
			'North-West region showing declining groundwater levels. Recommend immediate intervention.',
		timestamp: '1 hour ago',
	},
	{
		type: 'maintenance',
		severity: 'low',
		title: 'Scheduled Maintenance Queue',
		description:
			'5 sites due for maintenance in next 7 days. Auto-scheduling recommended.',
		timestamp: '3 hours ago',
	},
	{
		type: 'impact',
		severity: 'low',
		title: 'Community Impact Summary',
		description:
			'Lagos: 2,400 additional people gained water access this week.',
		timestamp: '5 hours ago',
	},
];

const AIInsights = ({selectedState}: AIInsightsProps) => {
	const getIcon = (type: string) => {
		switch (type) {
			case 'alert':
				return <AlertTriangle className='w-4 h-4' />;
			case 'prediction':
				return <TrendingUp className='w-4 h-4' />;
			case 'maintenance':
				return <Wrench className='w-4 h-4' />;
			default:
				return <Brain className='w-4 h-4' />;
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'high':
				return 'text-metric-danger';
			case 'medium':
				return 'text-metric-warning';
			default:
				return 'text-metric-info';
		}
	};

	return (
		<aside className='absolute top-16 right-0 w-96 bg-dashboard-panel border-l border-border flex flex-col overflow-auto h-full pb-60'>
			<div className='p-4 border-b border-border'>
				<div className='flex items-center gap-2 mb-2'>
					<Brain className='w-7 h-7 text-blue-900 animate-pulse-glow' />
					<h2 className='text-lg font-semibold text-blue-900'>
						AI Insights
					</h2>
				</div>
				<p className='text-xs text-muted-foreground'>
					Real-time predictions and alerts powered by machine learning
				</p>
			</div>

			<div className='flex-1'>
				<div className='p-4 space-y-3'>
					{insights.map((insight, index) => (
						<Card
							key={index}
							className='p-4 bg-dashboard-elevated hover:bg-dashboard-panel transition-colors cursor-pointer border-l-2'
							style={{
								borderLeftColor: `hsl(var(--metric-${
									insight.severity === 'high'
										? 'danger'
										: insight.severity === 'medium'
										? 'warning'
										: 'info'
								}))`,
							}}
						>
							<div className='flex items-start gap-3'>
								<div
									className={getSeverityColor(
										insight.severity
									)}
								>
									{getIcon(insight.type)}
								</div>
								<div className='flex-1 min-w-0'>
									<div className='flex items-start justify-between gap-2 mb-1'>
										<h3 className='text-sm font-semibold leading-tight text-blue-900'>
											{insight.title}
										</h3>
										<Badge
											variant='outline'
											className='text-[10px] shrink-0'
										>
											{insight.severity.toUpperCase()}
										</Badge>
									</div>
									<p className='text-xs text-muted-foreground mb-2'>
										{insight.description}
									</p>
									<div className='text-[10px] text-muted-foreground'>
										{insight.timestamp}
									</div>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>

			<div className='p-4 border-t border-border'>
				<Card className='p-3 bg-primary/10 border-primary/30'>
					<div className='flex items-start gap-2'>
						<TrendingUp className='w-4 h-4 text-primary shrink-0 mt-0.5' />
						<div className='text-xs'>
							<div className='font-semibold text-primary mb-1'>
								Predictive Analytics Active
							</div>
							<div className='text-muted-foreground'>
								Monitoring 156 sites across Nigeria with 94%
								accuracy rate
							</div>
						</div>
					</div>
				</Card>
			</div>
		</aside>
	);
};

export default AIInsights;
