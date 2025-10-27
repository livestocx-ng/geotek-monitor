import {useEffect, useState} from 'react';
import {Droplet, Users, Activity, AlertCircle, TrendingUp} from 'lucide-react';
import {Card} from '@/components/ui/card';

interface MetricCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	change?: string;
	trend?: 'up' | 'down' | 'neutral';
}

const MetricCard = ({icon, label, value, change, trend}: MetricCardProps) => {
	const [displayValue, setDisplayValue] = useState(0);
	const targetValue = typeof value === 'number' ? value : parseFloat(value);

	useEffect(() => {
		if (isNaN(targetValue)) return;

		let start = 0;
		const duration = 1500;
		const increment = targetValue / (duration / 16);

		const timer = setInterval(() => {
			start += increment;
			if (start >= targetValue) {
				setDisplayValue(targetValue);
				clearInterval(timer);
			} else {
				setDisplayValue(Math.floor(start));
			}
		}, 16);

		return () => clearInterval(timer);
	}, [targetValue]);

	const formatValue = () => {
		if (typeof value === 'string' && value.includes('/')) {
			return value;
		}
		return displayValue.toLocaleString();
	};

	const getTrendColor = () => {
		switch (trend) {
			case 'up':
				return 'text-metric-success';
			case 'down':
				return 'text-metric-danger';
			default:
				return 'text-muted-foreground';
		}
	};

	return (
		<Card className='flex-1 p-4 bg-dashboard-panel hover:bg-dashboard-elevated transition-all group cursor-default'>
			<div className='flex items-start justify-between'>
				<div className='flex items-center gap-3'>
					<div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors'>
						{icon}
					</div>
					<div>
						<div className='text-xs text-muted-foreground mb-1'>
							{label}
						</div>
						<div className='text-1xl font-bold animate-counter-up'>
							{formatValue()}
						</div>
					</div>
				</div>
				{change && (
					<div className={`text-xs font-medium ${getTrendColor()}`}>
						{change}
					</div>
				)}
			</div>
		</Card>
	);
};

const KPIRibbon = () => {
	return (
		<footer className='fixed bottom-0 left-0 w-full h-28 bg-dashboard-panel border-t border-border px-6 py-3 z-50'>
			<div className='flex gap-3 h-full overflow-x-auto'>
				<MetricCard
					icon={<Droplet className='w-5 h-5' />}
					label='Water Quality Index'
					value='89/100'
					change='+2.3%'
					trend='up'
				/>
				<MetricCard
					icon={<Users className='w-5 h-5' />}
					label='People Served (7d)'
					value={142000}
					change='+8.1%'
					trend='up'
				/>
				<MetricCard
					icon={<Activity className='w-5 h-5' />}
					label='System Uptime'
					value='96.2%'
					change='-0.3%'
					trend='down'
				/>
				<MetricCard
					icon={<AlertCircle className='w-5 h-5' />}
					label='At-Risk Sites'
					value='8 Critical / 22 Warning'
					trend='neutral'
				/>
				<MetricCard
					icon={<TrendingUp className='w-5 h-5' />}
					label='Liters Delivered'
					value={612000}
					change='+12.4%'
					trend='up'
				/>
			</div>
		</footer>
	);
};

export default KPIRibbon;
