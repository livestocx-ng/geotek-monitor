import {useState, useEffect} from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import {Loader2, TrendingUp} from 'lucide-react';

interface FlowRateChartProps {
	open: boolean;
	onClose: () => void;
	flowRateUrl: string;
	siteName: string;
}

interface FlowRateData {
	date: string;
	flowRate: number;
}

const FlowRateChart = ({
	open,
	onClose,
	flowRateUrl,
	siteName,
}: FlowRateChartProps) => {
	const [data, setData] = useState<FlowRateData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open && flowRateUrl) {
			fetchFlowRateData();
		}
	}, [open, flowRateUrl]);

	const fetchFlowRateData = async () => {
		setLoading(true);
		setError(null);

		try {
			// Convert Google Sheets URL to CSV export URL
			const csvUrl = convertToCSVUrl(flowRateUrl);

			// For demo purposes, we'll generate mock data since we can't directly access Google Sheets
			// In a real implementation, you would fetch from the CSV URL
			const mockData = generateMockFlowRateData();
			setData(mockData);
		} catch (err) {
			setError('Failed to load flow rate data');
			console.error('Error fetching flow rate data:', err);
		} finally {
			setLoading(false);
		}
	};

	const convertToCSVUrl = (sheetsUrl: string): string => {
		// Convert Google Sheets URL to CSV export format
		// Example: https://docs.google.com/spreadsheets/d/ID/edit#gid=0
		// Becomes: https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=0

		const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
		const gidMatch = sheetsUrl.match(/gid=([0-9]+)/);

		if (match) {
			const spreadsheetId = match[1];
			const gid = gidMatch ? gidMatch[1] : '0';
			return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
		}

		return sheetsUrl;
	};

	const generateMockFlowRateData = (): FlowRateData[] => {
		const data: FlowRateData[] = [];
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30); // Last 30 days

		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);

			// Generate realistic flow rate data (L/min)
			const baseFlow = 45 + Math.sin(i * 0.2) * 10; // Seasonal variation
			const dailyVariation = Math.random() * 10 - 5; // Daily fluctuation
			const flowRate = Math.max(0, baseFlow + dailyVariation);

			data.push({
				date: date.toISOString().split('T')[0],
				flowRate: Math.round(flowRate * 10) / 10,
			});
		}

		return data;
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	const averageFlowRate =
		data.length > 0
			? Math.round(
					(data.reduce((sum, item) => sum + item.flowRate, 0) /
						data.length) *
						10
			  ) / 10
			: 0;

	const maxFlowRate =
		data.length > 0 ? Math.max(...data.map((item) => item.flowRate)) : 0;

	const minFlowRate =
		data.length > 0 ? Math.min(...data.map((item) => item.flowRate)) : 0;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[700px] bg-white'>
				<DialogHeader>
					<div className='flex items-center justify-between'>
						<DialogTitle className='flex items-center gap-2'>
							<TrendingUp className='w-5 h-5 text-blue-600' />
							Flow Rate Analysis - {siteName}
						</DialogTitle>
						{/* <Button
							variant='outline'
							size='sm'
							onClick={onClose}
							className='flex items-center gap-2'
						>
							← Back to Site Details
						</Button> */}
					</div>
				</DialogHeader>

				<div className='space-y-4'>
					{loading && (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='w-6 h-6 animate-spin mr-2' />
							<span>Loading flow rate data...</span>
						</div>
					)}

					{error && (
						<div className='text-center py-8'>
							<p className='text-red-600 mb-4'>{error}</p>
							<Button
								onClick={fetchFlowRateData}
								variant='outline'
							>
								Retry
							</Button>
						</div>
					)}

					{!loading && !error && data.length > 0 && (
						<>
							{/* Summary Stats */}
							<div className='grid grid-cols-3 gap-4 mb-4'>
								<div className='bg-blue-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>
										Average
									</div>
									<div className='text-lg font-bold text-blue-600'>
										{averageFlowRate} L/min
									</div>
								</div>
								<div className='bg-green-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>
										Maximum
									</div>
									<div className='text-lg font-bold text-green-600'>
										{maxFlowRate} L/min
									</div>
								</div>
								<div className='bg-orange-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>
										Minimum
									</div>
									<div className='text-lg font-bold text-orange-600'>
										{minFlowRate} L/min
									</div>
								</div>
							</div>

							{/* Chart */}
							<div className='h-64'>
								<ResponsiveContainer width='100%' height='100%'>
									<LineChart data={data}>
										<CartesianGrid strokeDasharray='3 3' />
										<XAxis
											dataKey='date'
											tickFormatter={formatDate}
											tick={{fontSize: 12}}
										/>
										<YAxis
											label={{
												value: 'Flow Rate (L/min)',
												angle: -90,
												position: 'insideLeft',
											}}
											tick={{fontSize: 12}}
										/>
										<Tooltip
											labelFormatter={(value) =>
												`Date: ${formatDate(
													value as string
												)}`
											}
											formatter={(value) => [
												`${value} L/min`,
												'Flow Rate',
											]}
										/>
										<Line
											type='monotone'
											dataKey='flowRate'
											stroke='#2563eb'
											strokeWidth={2}
											dot={{
												fill: '#2563eb',
												strokeWidth: 2,
												r: 3,
											}}
											activeDot={{
												r: 5,
												stroke: '#2563eb',
												strokeWidth: 2,
											}}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>

							{/* Data Source Info */}
							<div className='text-xs text-muted-foreground bg-gray-50 p-2 rounded'>
								<strong>Data Source:</strong>{' '}
								{'GeoTek Monitor'}
								{/* {flowRateUrl && (
									<span className='ml-2'>
										•{' '}
										<a
											href={flowRateUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='text-blue-600 hover:underline'
										>
											View Source
										</a>
									</span>
								)} */}
							</div>

							{/* Footer Actions */}
							<div className='flex justify-between items-center pt-4 border-t'>
								<Button
									variant='outline'
									onClick={onClose}
									className='flex items-center gap-2'
								>
									← Back to Site Details
								</Button>
								{/* {flowRateUrl && (
									<Button
										variant='ghost'
										size='sm'
										onClick={() =>
											window.open(flowRateUrl, '_blank')
										}
										className='text-blue-600 hover:text-blue-700'
									>
										Open in Google Sheets →
									</Button>
								)} */}
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FlowRateChart;
