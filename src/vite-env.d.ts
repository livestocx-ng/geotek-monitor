/// <reference types="vite/client" />
/// <reference types="google.maps" />

interface ImportMetaEnv {
	readonly VITE_GOOGLE_MAPS_API_KEY: string;
	readonly VITE_GEOTEK_MONITOR_DATA_SET_URL: string;
	readonly VITE_DISABLE_DEVTOOLS_GUARD?: "true" | "false";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
