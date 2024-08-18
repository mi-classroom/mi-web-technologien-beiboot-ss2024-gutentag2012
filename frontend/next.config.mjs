const url = new URL(process.env.NEXT_PUBLIC_API_URL);
const urlServer = new URL(process.env.SERVER_API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				port: url.port,
				hostname: url.hostname,
				protocol: url.protocol.replace(":", ""),
				pathname: `${url.pathname}/file-upload/get/**`,
			},
			{
				port: urlServer.port,
				hostname: urlServer.hostname,
				protocol: urlServer.protocol.replace(":", ""),
				pathname: `${urlServer.pathname}/file-upload/get/**`,
			},
		],
	},
	async rewrites() {
		return [
			{
				source: "/media/:path*",
				destination: `${urlServer.href}/:path*`,
			},
		];
	},
	experimental: {
		swcPlugins: [
			[
				"@preact-signals/safe-react/swc",
				{
					// you should use `auto` mode to track only components which uses `.value` access.
					// Can be useful to avoid tracking of server side components
					mode: "auto",
				} /* plugin options here */,
			],
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
