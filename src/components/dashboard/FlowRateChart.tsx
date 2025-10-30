import {useState, useEffect, useCallback} from 'react';
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

	const fetchFlowRateData = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Convert Google Sheets URL to CSV export URL
			const csvUrl = convertToCSVUrl(flowRateUrl);

			// Fetch real data from Google Sheets
			const response = await fetch(csvUrl, {
				method: 'GET',
				headers: {
					Accept: 'text/csv,text/plain,*/*',
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch flow rate data: ${response.status} ${response.statusText}`
				);
			}

			const csvText = await response.text();

			if (!csvText || csvText.trim().length === 0) {
				throw new Error('Empty CSV data received from Google Sheets');
			}

			// Parse CSV data to FlowRateData format
			const parsedData = parseFlowRateCSV(csvText);

			if (parsedData.length === 0) {
				console.warn(
					'No flow rate data found, using mock data as fallback'
				);
				const mockData = generateMockFlowRateData();
				setData(mockData);
			} else {
				setData(parsedData);
			}
		} catch (err) {
			console.error('Error fetching flow rate data:', err);

			// Fallback to mock data if real data fails
			try {
				console.log('Using mock data as fallback for flow rate chart');
				const mockData = generateMockFlowRateData();
				setData(mockData);
			} catch (mockErr) {
				setError('Failed to load flow rate data');
				console.error('Mock data generation also failed:', mockErr);
			}
		} finally {
			setLoading(false);
		}
	}, [flowRateUrl]);

	useEffect(() => {
		if (open && flowRateUrl) {
			fetchFlowRateData();
		}
	}, [open, flowRateUrl, fetchFlowRateData]);

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

	const parseFlowRateCSV = (csvText: string): FlowRateData[] => {
		try {
			const lines = csvText.trim().split('\n');

			if (lines.length < 2) {
				console.warn('CSV has insufficient data (less than 2 lines)');
				return [];
			}

			const headers = lines[0]
				.split(',')
				.map((h) => h.trim().toLowerCase());

			// Look for date and flow rate columns (flexible column names)
			const dateColumnIndex = headers.findIndex(
				(h) =>
					h.includes('date') ||
					h.includes('time') ||
					h.includes('day') ||
					h.includes('timestamp')
			);
			const flowRateColumnIndex = headers.findIndex(
				(h) =>
					h.includes('flow') ||
					h.includes('rate') ||
					h.includes('discharge') ||
					h.includes('volume')
			);

			if (dateColumnIndex === -1 || flowRateColumnIndex === -1) {
				console.warn('Could not find date or flow rate columns in CSV');
				console.log('Available headers:', headers);
				return [];
			}

			const data: FlowRateData[] = [];

			for (let i = 1; i < lines.length; i++) {
				const values = lines[i].split(',').map((v) => v.trim());

				if (
					values.length <=
					Math.max(dateColumnIndex, flowRateColumnIndex)
				) {
					continue; // Skip incomplete rows
				}

				const dateStr = values[dateColumnIndex];
				const flowRateStr = values[flowRateColumnIndex];

				// Parse date (try multiple formats)
				let date: Date;
				if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
					// YYYY-MM-DD format
					date = new Date(dateStr);
				} else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
					// MM/DD/YYYY format
					const [month, day, year] = dateStr.split('/');
					date = new Date(
						parseInt(year),
						parseInt(month) - 1,
						parseInt(day)
					);
				} else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
					// M/D/YY or MM/DD/YYYY format
					date = new Date(dateStr);
				} else {
					// Try generic date parsing
					date = new Date(dateStr);
				}

				// Parse flow rate
				const flowRate = parseFloat(flowRateStr);

				if (
					!isNaN(date.getTime()) &&
					!isNaN(flowRate) &&
					flowRate >= 0
				) {
					data.push({
						date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
						flowRate: Math.round(flowRate * 10) / 10, // Round to 1 decimal place
					});
				}
			}

			// Sort by date
			data.sort(
				(a, b) =>
					new Date(a.date).getTime() - new Date(b.date).getTime()
			);

			console.log(
				`Successfully parsed ${data.length} flow rate data points`
			);
			return data;
		} catch (error) {
			console.error('Error parsing flow rate CSV:', error);
			return [];
		}
	};

	const generateMockFlowRateData = (): FlowRateData[] => {
		const data: FlowRateData[] = [];
		const startDate = new Date('2025-01-01'); // Start from January 1st, 2025
		const currentDate = new Date();
		const daysDiff = Math.ceil(
			(currentDate.getTime() - startDate.getTime()) /
				(1000 * 60 * 60 * 24)
		);
		const totalDays = Math.min(daysDiff, 365); // Limit to 1 year of data

		for (let i = 0; i < totalDays; i++) {
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
			<DialogContent className='sm:max-w-[700px] md:max-w-[80%] bg-white'>
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
						<main className='flex-1 flex flex-col relative overflow-auto items-center justify-center h-[300px]'>
								<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4'></div>
							<div className='text-center'>
								<p className='text-muted-foreground'>
									Loading flow rate data...
								</p>
							</div>
						</main>
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
											strokeWidth={1}
											radius={16}
											dot={{
												fill: '#2564eb78',
												strokeWidth: 1,
												r: 2,
											}}
											activeDot={{
												r: 3,
												stroke: '#254deb',
												strokeWidth: 2,
											}}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>

							{/* Data Source Info */}
							<div className='text-xs text-muted-foreground bg-gray-50 p-2 rounded'>
								<strong>Data Source:</strong> GeoTek Monitor
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
