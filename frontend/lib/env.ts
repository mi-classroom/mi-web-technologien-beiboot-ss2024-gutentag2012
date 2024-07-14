const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const serverApiUrl = process.env.SERVER_API_URL;

export function getServerApiUrl() {
	if(typeof window !== 'undefined') return apiUrl;
	return serverApiUrl;
}

export function getPublicApiUrl() {
	return apiUrl;
}
