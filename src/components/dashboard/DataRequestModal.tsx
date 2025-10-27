import {useState} from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {MapPin, CheckCircle} from 'lucide-react';
import {APIProvider, Map, AdvancedMarker} from '@vis.gl/react-google-maps';

interface DataRequestModalProps {
	open: boolean;
	onClose: () => void;
}

interface FormData {
	organizationName: string;
	projectType: string;
	surveyTypes: string[];
	latitude: string;
	longitude: string;
	additionalNotes: string;
	urgencyLevel: string;
	contactName: string;
	email: string;
	phoneNumber: string;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const DataRequestModal = ({open, onClose}: DataRequestModalProps) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [mapCenter, setMapCenter] = useState({lat: 9.082, lng: 8.6753});
	const [selectedLocation, setSelectedLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const [formData, setFormData] = useState<FormData>({
		organizationName: '',
		projectType: '',
		surveyTypes: [],
		latitude: '',
		longitude: '',
		additionalNotes: '',
		urgencyLevel: '',
		contactName: '',
		email: '',
		phoneNumber: '',
	});

	const projectTypes = [
		'Water borehole drilling',
		'Groundwater mapping',
		'Aquifer survey',
		'Hydrogeological survey',
	];

	const surveyTypeOptions = [
		'Geophysical survey data',
		'Hydrogeological data',
		'Groundwater potential data',
		'Aquifer mapping',
		'Hydrological survey data',
	];

	const urgencyLevels = [
		{value: 'high', label: 'High (Immediate need)'},
		{value: 'medium', label: 'Medium (Next 1–2 weeks)'},
		{value: 'low', label: 'Low (Flexible timing)'},
	];

	const handleMapClick = (event: google.maps.MapMouseEvent) => {
		if (event.latLng) {
			const lat = event.latLng.lat();
			const lng = event.latLng.lng();
			setSelectedLocation({lat, lng});
			setFormData({
				...formData,
				latitude: lat.toFixed(6),
				longitude: lng.toFixed(6),
			});
		}
	};

	const handleSurveyTypeChange = (surveyType: string, checked: boolean) => {
		if (checked) {
			setFormData({
				...formData,
				surveyTypes: [...formData.surveyTypes, surveyType],
			});
		} else {
			setFormData({
				...formData,
				surveyTypes: formData.surveyTypes.filter(
					(t) => t !== surveyType
				),
			});
		}
	};

	const handleSubmit = () => {
		// Here you would typically send the data to your backend API
		console.log('Submitting form data:', formData);
		setIsSubmitted(true);
	};

	const resetForm = () => {
		setFormData({
			organizationName: '',
			projectType: '',
			surveyTypes: [],
			latitude: '',
			longitude: '',
			additionalNotes: '',
			urgencyLevel: '',
			contactName: '',
			email: '',
			phoneNumber: '',
		});
		setSelectedLocation(null);
		setCurrentStep(1);
		setIsSubmitted(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (isSubmitted) {
		return (
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className='sm:max-w-[500px] bg-white'>
					<div className='text-center py-8'>
						<CheckCircle className='w-16 h-16 text-metric-success mx-auto mb-4' />
						<h2 className='text-2xl font-bold mb-2'>
							Request Submitted!
						</h2>
						<p className='text-muted-foreground mb-6'>
							Thank you! Your data request has been submitted. We
							will get back to you shortly.
						</p>
						<Button onClick={handleClose} className='w-full bg-blue-800'>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white'>
				<DialogHeader className='bg-blue-80 text-hite p-6 -m-6 -6 rounded-t-lg'>
					<DialogTitle className='text-xl font-bold'>
						Water Resource Data Request
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{currentStep === 1 && (
						<Card>
							<CardHeader className='bg-blue-00 text-black'>
								<CardTitle className='text-lg'>
									Section 1: Basic Information
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<Label htmlFor='organizationName'>
										Organization Name *
									</Label>
									<Input
										id='organizationName'
										value={formData.organizationName}
										onChange={(e) =>
											setFormData({
												...formData,
												organizationName:
													e.target.value,
											})
										}
										placeholder='Enter organization name'
									/>
								</div>

								<div>
									<Label htmlFor='projectType'>
										Project Type *
									</Label>
									<Select
										value={formData.projectType}
										onValueChange={(value) =>
											setFormData({
												...formData,
												projectType: value,
											})
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Select project type' />
										</SelectTrigger>
										<SelectContent>
											{projectTypes.map((type) => (
												<SelectItem
													key={type}
													value={type}
												>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label>
										Survey Type * (Select all that apply)
									</Label>
									<div className='grid grid-cols-1 gap-3 mt-2'>
										{surveyTypeOptions.map((option) => (
											<div
												key={option}
												className='flex items-center space-x-2'
											>
												<Checkbox
													id={option}
													checked={formData.surveyTypes.includes(
														option
													)}
													onCheckedChange={(
														checked
													) =>
														handleSurveyTypeChange(
															option,
															checked as boolean
														)
													}
												/>
												<Label
													htmlFor={option}
													className='text-sm'
												>
													{option}
												</Label>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{currentStep === 2 && (
						<Card>
							<CardHeader className='bg-blue-00 text-black'>
								<CardTitle className='text-lg'>
									Section 2: Location Information
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								{/* <div>
									<Label>Interactive Map</Label>
									<p className='text-sm text-muted-foreground mb-2'>
										Click on the map to select location and
										auto-fill coordinates
									</p>
									<div className='h-64 border rounded-lg overflow-hidden'>
										<APIProvider apiKey={MAPS_API_KEY}>
											<Map
												center={mapCenter}
												zoom={6}
												onClick={handleMapClick}
												style={{
													width: '100%',
													height: '100%',
												}}
											>
												{selectedLocation && (
													<AdvancedMarker
														position={
															selectedLocation
														}
													>
														<div className='w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg' />
													</AdvancedMarker>
												)}
											</Map>
										</APIProvider>
									</div>
								</div> */}

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label htmlFor='latitude'>
											Latitude *
										</Label>
										<Input
											id='latitude'
											value={formData.latitude}
											onChange={(e) =>
												setFormData({
													...formData,
													latitude: e.target.value,
												})
											}
											placeholder='Latitude'
										/>
									</div>
									<div>
										<Label htmlFor='longitude'>
											Longitude *
										</Label>
										<Input
											id='longitude'
											value={formData.longitude}
											onChange={(e) =>
												setFormData({
													...formData,
													longitude: e.target.value,
												})
											}
											placeholder='Longitude'
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{currentStep === 3 && (
						<Card>
							<CardHeader className='bg-blue-00 text-wite'>
								<CardTitle className='text-lg'>
									Section 3: Additional Information
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<Label htmlFor='additionalNotes'>
										Additional Notes (Optional)
									</Label>
									<Textarea
										id='additionalNotes'
										value={formData.additionalNotes}
										onChange={(e) =>
											setFormData({
												...formData,
												additionalNotes: e.target.value,
											})
										}
										placeholder='Any additional information or specific requirements'
										rows={4}
									/>
								</div>

								<div>
									<Label htmlFor='urgencyLevel'>
										Urgency Level *
									</Label>
									<Select
										value={formData.urgencyLevel}
										onValueChange={(value) =>
											setFormData({
												...formData,
												urgencyLevel: value,
											})
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Select urgency level' />
										</SelectTrigger>
										<SelectContent>
											{urgencyLevels.map((level) => (
												<SelectItem
													key={level.value}
													value={level.value}
												>
													{level.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>
					)}

					{currentStep === 4 && (
						<Card>
							<CardHeader className='bg-blue-00 txt-white'>
								<CardTitle className='text-lg'>
									Section 4: Contact Information
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<Label htmlFor='contactName'>Name *</Label>
									<Input
										id='contactName'
										value={formData.contactName}
										onChange={(e) =>
											setFormData({
												...formData,
												contactName: e.target.value,
											})
										}
										placeholder='Enter your full name'
									/>
								</div>

								<div>
									<Label htmlFor='email'>Email *</Label>
									<Input
										id='email'
										type='email'
										value={formData.email}
										onChange={(e) =>
											setFormData({
												...formData,
												email: e.target.value,
											})
										}
										placeholder='Enter your email address'
									/>
								</div>

								<div>
									<Label htmlFor='phoneNumber'>
										Phone Number (Optional)
									</Label>
									<Input
										id='phoneNumber'
										value={formData.phoneNumber}
										onChange={(e) =>
											setFormData({
												...formData,
												phoneNumber: e.target.value,
											})
										}
										placeholder='Enter your phone number'
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{currentStep === 5 && (
						<Card>
							<CardHeader className='bg-blue-800 text-white'>
								<CardTitle className='text-lg'>
									Section 5: Submit Request
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-3'>
									<h4 className='font-semibold'>
										Summary View
									</h4>
									<div className='bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2'>
										<p>
											<strong>Organization:</strong>{' '}
											{formData.organizationName}
										</p>
										<p>
											<strong>Project Type:</strong>{' '}
											{formData.projectType}
										</p>
										<p>
											<strong>Survey Types:</strong>{' '}
											{formData.surveyTypes.join(', ')}
										</p>
										<p>
											<strong>Location:</strong>{' '}
											{formData.latitude},{' '}
											{formData.longitude}
										</p>
										<p>
											<strong>Contact:</strong>{' '}
											{formData.contactName} (
											{formData.email})
										</p>
										<p>
											<strong>Urgency:</strong>{' '}
											{
												urgencyLevels.find(
													(l) =>
														l.value ===
														formData.urgencyLevel
												)?.label
											}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					<Separator />

					<div className='flex justify-between'>
						<Button
							variant='outline'
							onClick={() =>
								setCurrentStep(Math.max(1, currentStep - 1))
							}
							disabled={currentStep === 1}
						>
							Previous
						</Button>

						<div className='flex gap-2'>
							{currentStep < 5 ? (
								<Button
									className='bg-blue-800 hover:bg-blue-800'
									onClick={() =>
										setCurrentStep(currentStep + 1)
									}
									disabled={
										(currentStep === 1 &&
											(!formData.organizationName ||
												!formData.projectType ||
												formData.surveyTypes.length ===
													0)) ||
										(currentStep === 2 &&
											(!formData.latitude ||
												!formData.longitude)) ||
										(currentStep === 3 &&
											!formData.urgencyLevel) ||
										(currentStep === 4 &&
											(!formData.contactName ||
												!formData.email))
									}
								>
									Next
								</Button>
							) : (
								<Button
									className='bg-blue-800 hover:bg-blue-800'
									onClick={handleSubmit}
								>
									Submit Request
								</Button>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DataRequestModal;
