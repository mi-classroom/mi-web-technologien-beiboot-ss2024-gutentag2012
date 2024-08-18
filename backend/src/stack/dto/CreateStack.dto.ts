import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateStackSchema = z
	.object({
		projectId: z.number(),
		scale: z.number().min(-1).optional().default(-1),
		name: z.string().min(1),
		from: z.string().time().or(z.literal("")),
		to: z.string().time().or(z.literal("")),
		frameRate: z.number().min(-1).optional().default(-1),
	})
	.strict()
	.refine((data) => {
		const [hoursCompare, minutesCompare, secondsCompare] = data.to
			.split(":")
			.map((v) => Number.parseInt(v));
		const [hours, minutes, seconds] = data.from
			.split(":")
			.map((v) => Number.parseInt(v));

		if (hours > hoursCompare) return false;
		if (hours === hoursCompare && minutes > minutesCompare) return false;
		return !(
			hours === hoursCompare &&
			minutes === minutesCompare &&
			seconds > secondsCompare
		);
	}, "The to timestamp must be greater than from timestamp.");

export class CreateStackDto extends createZodDto(CreateStackSchema) {}
