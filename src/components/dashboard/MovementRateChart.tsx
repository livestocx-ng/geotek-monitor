import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Waves, ChevronLeft, ChevronRight } from 'lucide-react';

interface MovementRateChartProps {
	open: boolean;
	onClose: () => void;
	movementUrl: string;
	siteName: string;
}

interface MovementData {
	timestamp: number; // epoch ms — full date + time
	movementRate: number;
}

interface DayGroup {
	key: string;
	label: string;
	data: MovementData[];
}

// Build a CSV export URL from any Google Sheets share/edit URL.
const toCsvExportUrl = (url: string) => {
	const id = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? '';
	const gid = url.match(/[?#&]gid=(\d+)/)?.[1];
	const base = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
	return gid ? `${base}&gid=${gid}` : base;
};

// Parse a timestamp string such as "2026-06-17 6:30" or "1/5/2025 2:30 PM"
// into epoch milliseconds, preserving the time-of-day.
const parseTimestamp = (raw: string): number | null => {
	const s = raw.trim();
	if (!s) return null;

	const dtMatch = s.match(
		/^(.*?)[ T](\d{1,2}:\d{2}(?::\d{2})?)\s*([AaPp][Mm])?$/
	);
	const datePart = dtMatch ? dtMatch[1].trim() : s;
	const timePart = dtMatch ? dtMatch[2] : null;
	const meridiem = dtMatch ? dtMatch[3] : null;

	let base: Date | null = null;

	if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
		const [y, mo, d] = datePart.split('-').map(Number);
		base = new Date(y, mo - 1, d);
	} else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(datePart)) {
		const [mo, d, y] = datePart.split('/').map(Number);
		base = new Date(y < 100 ? 2000 + y : y, mo - 1, d);
	} else {
		const native = new Date(s);
		return isNaN(native.getTime()) ? null : native.getTime();
	}

	if (base && timePart) {
		const [hh, mm, ss] = timePart.split(':').map(Number);
		let hours = hh;
		if (meridiem) {
			const isPm = /p/i.test(meridiem);
			if (isPm && hours < 12) hours += 12;
			if (!isPm && hours === 12) hours = 0;
		}
		base.setHours(hours, mm || 0, ss || 0, 0);
	}

	return base ? base.getTime() : null;
};

const MovementRateChart = ({
	open,
	onClose,
	movementUrl,
	siteName,
}: MovementRateChartProps) => {
	const [data, setData] = useState<MovementData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentDayIndex, setCurrentDayIndex] = useState(0);

	const fetchMovementData = useCallback(async () => {
		if (!movementUrl) return;
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(toCsvExportUrl(movementUrl));

			if (!response.ok) {
				throw new Error(
					`Failed to fetch spreadsheet data (HTTP ${response.status}). Ensure the sheet is publicly shared ("Anyone with the link → Viewer").`
				);
			}

			const csvText = await response.text();
			const lines = csvText.trim().split('\n');

			if (lines.length < 2) {
				setError('No data rows found in the spreadsheet.');
				return;
			}

			const headers = lines[0].split(',').map((h) => h.trim());
			const tsIdx = headers.findIndex((h) =>
				/date|time|timestamp/i.test(h)
			);
			const valIdx = headers.findIndex((h) =>
				/movement|rate|value/i.test(h)
			);

			if (tsIdx === -1 || valIdx === -1) {
				throw new Error(
					`Could not find timestamp/movement columns. Found: ${headers.join(', ')}`
				);
			}

			const parsed: MovementData[] = lines
				.slice(1)
				.map((line) => {
					const cols = line.split(',');
					const timestamp = parseTimestamp(cols[tsIdx] ?? '');
					const movementRate = parseFloat(String(cols[valIdx] ?? ''));

					if (
						timestamp === null ||
						isNaN(movementRate) ||
						movementRate < 0
					) {
						return null;
					}

					return {
						timestamp,
						movementRate: Math.round(movementRate * 100) / 100,
					};
				})
				.filter((d): d is MovementData => d !== null)
				.sort((a, b) => a.timestamp - b.timestamp);

			if (parsed.length === 0) {
				setError('No valid movement rate data found in the spreadsheet.');
			} else {
				setData(parsed);
			}
		} catch (err) {
			console.error('Error fetching movement rate data:', err);
			setError('Failed to load movement rate data.');
		} finally {
			setLoading(false);
		}
	}, [movementUrl]);

	useEffect(() => {
		if (open && movementUrl) {
			fetchMovementData();
		}
	}, [open, movementUrl, fetchMovementData]);

	// Group readings by calendar day
	const days = useMemo(() => {
		if (data.length === 0) return [];
		const map = new Map<string, DayGroup>();

		data.forEach((item) => {
			const d = new Date(item.timestamp);
			const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
			if (!map.has(key)) {
				map.set(key, {
					key,
					label: d.toLocaleDateString('en-US', {
						weekday: 'short',
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}),
					data: [],
				});
			}
			map.get(key)!.data.push(item);
		});

		return Array.from(map.values()).sort(
			(a, b) => a.data[0].timestamp - b.data[0].timestamp
		);
	}, [data]);

	// Default to the most recent (current) day whenever the data changes.
	useEffect(() => {
		if (days.length > 0) {
			setCurrentDayIndex(days.length - 1);
		}
	}, [days]);

	const currentDay = days[currentDayIndex];
	const dayData = currentDay ? currentDay.data : [];

	const formatTime = (ts: number) =>
		new Date(ts).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});

	const formatTimestamp = (ts: number) =>
		new Date(ts).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	const handlePrev = () => setCurrentDayIndex((prev) => Math.max(0, prev - 1));
	const handleNext = () =>
		setCurrentDayIndex((prev) => Math.min(days.length - 1, prev + 1));

	const averageRate =
		dayData.length > 0
			? Math.round(
					(dayData.reduce((sum, item) => sum + item.movementRate, 0) /
						dayData.length) *
						100
			  ) / 100
			: 0;
	const maxRate =
		dayData.length > 0 ? Math.max(...dayData.map((d) => d.movementRate)) : 0;
	const minRate =
		dayData.length > 0 ? Math.min(...dayData.map((d) => d.movementRate)) : 0;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[800px] md:max-w-[90%] bg-white'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Waves className='w-5 h-5 text-blue-600' />
						Movement Rate Analysis - {siteName}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					{loading && (
						<main className='flex-1 flex flex-col relative overflow-auto items-center justify-center h-[300px]'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4'></div>
							<div className='text-center'>
								<p className='text-muted-foreground'>
									Loading movement rate data...
								</p>
							</div>
						</main>
					)}

					{error && (
						<div className='text-center py-8'>
							<p className='text-red-600 mb-4'>{error}</p>
							<Button onClick={fetchMovementData} variant='outline'>
								Retry
							</Button>
						</div>
					)}

					{!loading && !error && days.length > 0 && currentDay && (
						<>
							{/* Day navigation */}
							<div className='flex items-center justify-between bg-dashboard-panelElevated border rounded-xl p-3 shadow-sm'>
								<Button
									variant='ghost'
									size='icon'
									onClick={handlePrev}
									disabled={currentDayIndex === 0}
									className='rounded-full hover:bg-blue-50 hover:text-blue-600'
								>
									<ChevronLeft className='w-5 h-5' />
								</Button>

								<div className='text-center flex flex-col items-center'>
									<h3 className='text-lg md:text-xl tracking-tight font-extrabold text-blue-900 border-b-2 border-blue-200 pb-1 px-4 mb-1'>
										{currentDay.label}
									</h3>
								</div>

								<Button
									variant='ghost'
									size='icon'
									onClick={handleNext}
									disabled={currentDayIndex === days.length - 1}
									className='rounded-full hover:bg-blue-50 hover:text-blue-600'
								>
									<ChevronRight className='w-5 h-5' />
								</Button>
							</div>

							{/* Summary Stats */}
							{/* <div className='grid grid-cols-3 gap-4'>
								<div className='bg-blue-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Average</div>
									<div className='text-xl md:text-2xl font-bold text-blue-600'>
										{averageRate}
									</div>
								</div>
								<div className='bg-green-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Maximum</div>
									<div className='text-xl md:text-2xl font-bold text-green-600'>
										{maxRate}
									</div>
								</div>
								<div className='bg-orange-50 rounded-lg p-3 text-center'>
									<div className='text-xs text-muted-foreground'>Minimum</div>
									<div className='text-xl md:text-2xl font-bold text-orange-600'>
										{minRate}
									</div>
								</div>
							</div> */}

							{/* Chart — movement varies on the Y axis over a continuous time X */}
							<div className='h-64 mt-2'>
								<ResponsiveContainer width='100%' height='100%'>
									<LineChart data={dayData}>
										<CartesianGrid strokeDasharray='3 3' vertical={false} />
										<XAxis
											dataKey='timestamp'
											tickFormatter={formatTime}
											tick={{ fontSize: 12 }}
											tickMargin={10}
											minTickGap={40}
										/>
										<YAxis
											tick={{ fontSize: 12 }}
											tickMargin={10}
											domain={['auto', 'auto']}
											label={{
												value: 'Movement Rate',
												angle: -90,
												position: 'insideLeft',
												style: { fontSize: 12, fill: '#64748b' },
											}}
										/>
										<Tooltip
											labelFormatter={(value) =>
												`Timestamp: ${formatTimestamp(value as number)}`
											}
											formatter={(value) => [`${value}`, 'Movement Rate']}
											contentStyle={{
												borderRadius: '12px',
												border: 'none',
												boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
											}}
										/>
										<Line
											type='linear'
											dataKey='movementRate'
											stroke='#2563eb'
											strokeWidth={2}
											dot={false}
											activeDot={{
												r: 6,
												stroke: '#fff',
												strokeWidth: 2,
												fill: '#2563eb',
											}}
											isAnimationActive={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>

							{/* Data Source Info */}
							<div className='text-xs text-muted-foreground bg-gray-50 p-2 rounded flex justify-between'>
								<span><strong>Data Source:</strong> GeoTek Monitor System</span>
								<span>{dayData.length} active logs</span>
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

					{!loading && !error && days.length === 0 && (
						<div className='text-center py-10'>
							<p className='text-muted-foreground'>No movement data found for this site.</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default MovementRateChart;
