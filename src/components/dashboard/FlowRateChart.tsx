import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface DataChunk {
	label: string;
	year: number;
	data: FlowRateData[];
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
	const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

	const fetchFlowRateData = useCallback(async () => {
		if (!flowRateUrl) return;
		setLoading(true);
		setError(null);

		try {
			// Build the XLSX export URL from the known edit URL format:
			// From: .../edit?gid=903116877#gid=903116877
			// To:   .../export?format=xlsx&gid=903116877
			const xlsxUrl = flowRateUrl
				.replace('/edit', '/export')
				.replace(/#.*$/, '')
				.replace('?gid=', '?format=xlsx&gid=');

			const response = await fetch(xlsxUrl);

			if (!response.ok) {
				throw new Error(`Failed to fetch spreadsheet data (HTTP ${response.status}). Ensure the sheet is publicly shared ("Anyone with the link → Viewer").`);
			}

			// Google Sheets returns an XLSX binary — read it as an ArrayBuffer
			// and parse with SheetJS.
			const arrayBuffer = await response.arrayBuffer();
			const workbook = XLSX.read(arrayBuffer, { type: 'array' });

			// Use the first sheet in the workbook
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];

			// Convert to JSON rows (first row becomes keys)
			const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

			if (rows.length === 0) {
				setError('No data rows found in the spreadsheet.');
				return;
			}

			// Dynamically find the date and flow-rate columns by checking header names
			const headers = Object.keys(rows[0]);
			const dateKey = headers.find((h) =>
				/date|time|day|timestamp/i.test(h)
			);
			const flowKey = headers.find((h) =>
				/flow|rate|discharge|volume/i.test(h)
			);

			if (!dateKey || !flowKey) {
				throw new Error(`Could not find date/flow columns. Found: ${headers.join(', ')}`);
			}

			const parsed: FlowRateData[] = rows
				.map((row) => {
					const rawDate = row[dateKey];
					const rawFlow = row[flowKey];

					// Robust date parser: handles multiple formats consistently.
					const parseDate = (val: unknown): Date | null => {
						// 1. Excel numeric serial date (SheetJS may return numbers for date cells)
						if (typeof val === 'number') {
							return new Date(XLSX.SSF.parse_date_code(val).y,
								XLSX.SSF.parse_date_code(val).m - 1,
								XLSX.SSF.parse_date_code(val).d);
						}
						const s = String(val).trim();
						if (!s) return null;

						// 2. ISO format: YYYY-MM-DD
						if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
							const [y, mo, d] = s.split('-').map(Number);
							return new Date(y, mo - 1, d);
						}

						// 3. M/D/YYYY or MM/DD/YYYY  (e.g. 1/1/2025, 01/31/2025)
						if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
							const [mo, d, y] = s.split('/').map(Number);
							return new Date(y, mo - 1, d);
						}

						// 4. M/D/YY  (e.g. 1/1/25 → 2025)
						if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(s)) {
							const [mo, d, y] = s.split('/').map(Number);
							return new Date(2000 + y, mo - 1, d);
						}

						// 5. D-Mon-YYYY  (e.g. 1-Jan-2025)
						if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(s)) {
							return new Date(s);
						}

						// 6. Last resort — native constructor
						const d = new Date(s);
						return isNaN(d.getTime()) ? null : d;
					};

					const date = parseDate(rawDate);
					const flowRate = parseFloat(String(rawFlow));


						if (!date || isNaN(date.getTime()) || isNaN(flowRate) || flowRate < 0) return null;

					return {
						date: date.toISOString().split('T')[0],
						flowRate: Math.round(flowRate * 10) / 10,
					};
				})
				.filter((d): d is FlowRateData => d !== null)
				.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

			if (parsed.length === 0) {
				setError('No valid flow rate data found in the spreadsheet.');
			} else {
				setData(parsed);
			}
		} catch (err) {
			console.error('Error fetching flow rate data:', err);
			setError('Failed to load flow rate data.');
		} finally {
			setLoading(false);
		}
	}, [flowRateUrl]);

	useEffect(() => {
		if (open && flowRateUrl) {
			fetchFlowRateData();
		}
	}, [open, flowRateUrl, fetchFlowRateData]);


	// Chunk data by 6-month periods
	const chunks = useMemo(() => {
		if (data.length === 0) return [];
		const chunkMap = new Map<string, DataChunk>();

		console.log('[CHUNK-MAP]:  ', data);
		data.forEach((item) => {
			const d = new Date(item.date);
			const year = d.getFullYear();

			// console.log('[CHUNK-FULL-YEAR]:  ', year, item.date);

			const isFirstHalf = d.getMonth() < 6;
			const label = isFirstHalf ? 'Jan - Jun' : 'Jul - Dec';
			const key = `${year}-${isFirstHalf ? 'H1' : 'H2'}`;

			if (!chunkMap.has(key)) {
				chunkMap.set(key, { label, year, data: [] });
			}
			chunkMap.get(key)!.data.push(item);
		});

		const sortedChunks = Array.from(chunkMap.values()).sort((a, b) => {
			if (a.year !== b.year) return a.year - b.year;
			return a.label === 'Jan - Jun' ? -1 : 1;
		});

		return sortedChunks;
	}, [data]);

	useEffect(() => {
		if (chunks.length > 0) {
			setCurrentChunkIndex(chunks.length - 1);
		}
	}, [chunks]);

	const currentChunk = chunks[currentChunkIndex];
	const chunkData = currentChunk ? currentChunk.data : [];

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	const averageFlowRate = chunkData.length > 0
		? Math.round((chunkData.reduce((sum, item) => sum + item.flowRate, 0) / chunkData.length) * 10) / 10
		: 0;

	const maxFlowRate = chunkData.length > 0 ? Math.max(...chunkData.map((d) => d.flowRate)) : 0;
	const minFlowRate = chunkData.length > 0 ? Math.min(...chunkData.map((d) => d.flowRate)) : 0;

	const handlePrev = () => setCurrentChunkIndex((prev) => Math.max(0, prev - 1));
	const handleNext = () => setCurrentChunkIndex((prev) => Math.min(chunks.length - 1, prev + 1));

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[800px] md:max-w-[90%] bg-white'>
				<DialogHeader>
					<div className='flex items-center justify-between'>
						<DialogTitle className='flex items-center gap-2'>
							<TrendingUp className='w-5 h-5 text-blue-600' />
							Flow Rate Analysis - {siteName}
						</DialogTitle>
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
							<Button onClick={fetchFlowRateData} variant='outline'>
								Retry
							</Button>
						</div>
					)}

					{!loading && !error && chunks.length > 0 && currentChunk && (
						<>
							{/* Carousel Controls */}
							<div className='flex items-center justify-between bg-dashboard-panelElevated border rounded-xl p-3 shadow-sm'>
								<Button
									variant="ghost"
									size="icon"
									onClick={handlePrev}
									disabled={currentChunkIndex === 0}
									className="rounded-full hover:bg-blue-50 hover:text-blue-600"
								>
									<ChevronLeft className="w-5 h-5" />
								</Button>

								<div className="text-center flex flex-col items-center">
									<h3 className="text-2xl tracking-tight font-extrabold text-blue-900 border-b-2 border-blue-200 pb-1 px-4 mb-1">
										{currentChunk.year}
									</h3>
									<p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
										{currentChunk.label}
									</p>
								</div>

								<Button
									variant="ghost"
									size="icon"
									onClick={handleNext}
									disabled={currentChunkIndex === chunks.length - 1}
									className="rounded-full hover:bg-blue-50 hover:text-blue-600"
								>
									<ChevronRight className="w-5 h-5" />
								</Button>
							</div>

							{/* Summary Stats relative to chunk */}
							<div className='grid grid-cols-3 gap-4'>
								<div className='bg-blue-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Average</div>
									<div className='text-xl md:text-2xl font-bold text-blue-600'>
										{averageFlowRate} <span className="text-sm font-normal text-blue-600/70">L/min</span>
									</div>
								</div>
								<div className='bg-green-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Maximum</div>
									<div className='text-xl md:text-2xl font-bold text-green-600'>
										{maxFlowRate} <span className="text-sm font-normal text-green-600/70">L/min</span>
									</div>
								</div>
								<div className='bg-orange-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Minimum</div>
									<div className='text-xl md:text-2xl font-bold text-orange-600'>
										{minFlowRate} <span className="text-sm font-normal text-orange-600/70">L/min</span>
									</div>
								</div>
							</div>

							{/* Chart */}
							<div className='h-64 mt-2'>
								<ResponsiveContainer width='100%' height='100%'>
									<LineChart data={chunkData}>
										<CartesianGrid strokeDasharray='3 3' vertical={false} />
										<XAxis
											dataKey='date'
											tickFormatter={formatDate}
											tick={{ fontSize: 12 }}
											tickMargin={10}
											minTickGap={30}
										/>
										<YAxis
											tick={{ fontSize: 12 }}
											tickMargin={10}
											domain={['auto', 'auto']}
										/>
										<Tooltip
											labelFormatter={(value) =>
												`Date: ${formatDate(value as string)}`
											}
											formatter={(value) => [
												`${value} L/min`,
												'Flow Rate',
											]}
											contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
										/>
										<Line
											type='monotone'
											dataKey='flowRate'
											stroke='#2563eb'
											strokeWidth={2}
											dot={{
												fill: '#2564eb',
												strokeWidth: 2,
												r: 0,
											}}
											activeDot={{
												r: 6,
												stroke: '#fff',
												strokeWidth: 2,
												fill: '#2563eb'
											}}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>

							{/* Data Source Info */}
							<div className='text-xs text-muted-foreground bg-gray-50 p-2 rounded flex justify-between'>
								<span><strong>Data Source:</strong> GeoTek Monitor System</span>
								<span>{chunkData.length} active logs</span>
							</div>

							{/* Footer Actions */}
							<div className='flex justify-between items-center pt-2 border-t'>
								<Button
									variant='outline'
									onClick={onClose}
									className='flex items-center gap-2'
								>
									← Close Viewer
								</Button>
							</div>
						</>
					)}

					{!loading && !error && chunks.length === 0 && (
						<div className='text-center py-10'>
							<p className="text-muted-foreground">No log data found for this site.</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FlowRateChart;
