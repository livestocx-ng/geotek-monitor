import {Activity, Database} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useState} from 'react';
import DataRequestModal from './DataRequestModal';

const DashboardHeader = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<header className='h16 bg-dashboard-panel border-b border-border flex items-center justify-between px-6 py-4'>
			<div className='flex items-center gap-3'>
				<div className='w-15 h-15 rounded-xl bg-gradient-to-br from-water-primary to-water-secondary flex items-center justify-center'>
					<img
						src='/logo.jpg'
						alt='App Logo'
						className='w-12 h-12 object-contain rounded-lg'
					/>
				</div>
				<div>
					<h1 className='text-xl font-bold tracking-tight text-blue-900'>
						GEOTEK MONITOR
					</h1>
					<p className='text-xs text-muted-foreground'>
						National Water Intelligence System
					</p>
				</div>
			</div>

			<div className='flex items-center gap-4'>
				<div className='flex items-center gap-5'>
					<div className='flex flex-col items-end'>
						<p>For Community Members</p>
						<p className='text-xs italic'>2k downloads ⬇️</p>
					</div>
					<div className='flex flex-col items-center gap-2'>
						<Button
							onClick={() => {
								// Create a download link for the APK file
								const link = document.createElement('a');
								link.href = '/GeoTek-Monitor.apk'; // Assumes APK is in public folder
								link.download = 'GeoTek-Monitor.apk';
								document.body.appendChild(link);
								link.click();
								document.body.removeChild(link);
							}}
							variant='outline'
							className='flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50'
						>
							{/* Android Logo SVG */}
							<svg
								className='w-4 h-4'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M17.523 15.3414c-.5665 0-1.0253-.4588-1.0253-1.0253s.4588-1.0253 1.0253-1.0253 1.0253.4588 1.0253 1.0253-.4588 1.0253-1.0253 1.0253zm-11.046 0c-.5665 0-1.0253-.4588-1.0253-1.0253s.4588-1.0253 1.0253-1.0253 1.0253.4588 1.0253 1.0253-.4588 1.0253-1.0253 1.0253zm11.405-6.02l1.14-2.02c.08-.14.03-.32-.11-.4-.14-.08-.32-.03-.4.11l-1.15 2.05c-.99-.45-2.11-.7-3.35-.7-1.24 0-2.36.25-3.35.7L9.09 7.01c-.08-.14-.26-.19-.4-.11-.14.08-.19.26-.11.4l1.14 2.02C6.59 10.57 4.5 13.43 4.5 16.8h15c0-3.37-2.09-6.23-5.22-7.52zM12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z' />
							</svg>
							Download Android App
						</Button>
					</div>
				</div>

				<Button
					onClick={() => setIsModalOpen(true)}
					className='flex items-center gap-2 bg-blue-900 hover:bg-blue-800'
				>
					<Database className='w-4 h-4' />
					Request Data
				</Button>

				<DataRequestModal
					open={isModalOpen}
					onClose={() => setIsModalOpen(false)}
				/>
			</div>
		</header>
	);
};

export default DashboardHeader;
