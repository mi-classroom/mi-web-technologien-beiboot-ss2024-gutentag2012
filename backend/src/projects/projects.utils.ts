export type Stack = {
	name: string;
	project: string;
	scale: number;
	frameRate: number;
	from: string;
	to: string;
};

export function getStackFromStackName(name: string) {
	const [projectName, stackName] = name.split("/");

	const [_, scale, frameRate, from, to] = stackName
		.split("--")
		.map((part) => part.split("=")[1]);

	return {
		name: stackName,
		project: projectName,
		scale: Number.parseFloat(scale),
		frameRate: Number.parseFloat(frameRate),
		from: from?.replaceAll("-", ":"),
		to: to?.replaceAll("-", ":"),
	};
}

export type ResultImage = {
	name: string;
	project: string;
	stack: string;
	frames: number[];
	date?: number;
};

export function getResultImageFromName(name: string, lastModified?: Date) {
	const [projectName, stackName, _outputs, imageName] = name.split("/");

	const frames = imageName.split("-").map((part) => Number.parseInt(part));

	return {
		name: imageName,
		project: projectName,
		stack: stackName,
		frames,
		lastModified: lastModified?.getTime(),
	};
}
