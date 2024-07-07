const url = new URL(process.env.NEXT_PUBLIC_API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				port: url.port,
				hostname: url.hostname,
				protocol: url.protocol.replace(":", ""),
				pathname: "/file-upload/get/**",
			},
		],
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
};

export default nextConfig;
