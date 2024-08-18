import { relations, sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const Projects = sqliteTable(
	"projects",
	{
		// Autogen
		id: integer<"id", "number">("id", { mode: "number" }).primaryKey({
			autoIncrement: true,
		}),
		bucketPrefix: text("bucket_prefix")
			.unique()
			.$defaultFn(() => `project-${Date.now()}`)
			.notNull(),
		// Config
		name: text("name").notNull(),
		videoFile: text("video_file"),
		isPublic: integer("is_public", { mode: "boolean" }).default(0 as never),
		// Video Information
		maxWidth: integer("max_width", { mode: "number" }),
		maxHeight: integer("max_height", { mode: "number" }),
		maxFrameRate: integer("max_frame_rate", { mode: "number" }),
		duration: integer("duration", { mode: "number" }),
		// Metadata
		processingJobId: integer("processing_job_id", {
			mode: "number",
		}).references(() => ProcessingJobs.id, { onDelete: "set null" }),
	},
	(table) => ({
		nameIdx: uniqueIndex("projectName_idx").on(table.name),
	}),
);

export const ImageStacks = sqliteTable(
	"image_stacks",
	{
		// Autogen
		id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
		bucketPrefix: text("bucket_prefix")
			.unique()
			.$defaultFn(() => `image-stack-${Date.now()}`),
		// Config
		name: text("name").notNull(),
		fromTimestamp: text("from_timestamp"),
		toTimestamp: text("to_timestamp"),
		frameRate: integer("frame_rate", { mode: "number" }),
		scale: integer("scale", { mode: "number" }),
		// Metadata
		projectId: integer("project_id", { mode: "number" }).references(
			() => Projects.id,
			{ onDelete: "cascade" },
		),
		processingJobId: integer("processing_job_id", {
			mode: "number",
		}).references(() => ProcessingJobs.id, { onDelete: "set null" }),
	},
	(table) => ({
		nameIdx: uniqueIndex("imageName_idx").on(table.name, table.projectId),
	}),
);

export const ResultImages = sqliteTable("result_images", {
	// Autogen
	id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
	// Config
	filename: text("filename").notNull(),
	frames: text("frames", { mode: "json" }),
	weights: text("weights", { mode: "json" }),
	// Metadata
	imageStackId: integer("image_stack_id", { mode: "number" }).references(
		() => ImageStacks.id,
		{ onDelete: "cascade" },
	),
	processingJobId: integer("processing_job_id", { mode: "number" }).references(
		() => ProcessingJobs.id,
		{ onDelete: "set null" },
	),
});

export const ProcessingJobs = sqliteTable("processing_jobs", {
	// Autogen
	id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
	// Config
	type: text("type", {
		enum: ["createStack", "generateImage", "processProject"],
	}).notNull(),
	status: text("status", {
		enum: ["queued", "processing", "done", "error"],
	}).default("queued"),
	statusMessage: text("status_message"),
	totalSteps: integer("total_steps", { mode: "number" }),
	currentStep: integer("current_step", { mode: "number" }),
	stepTimestamps: text("step_timestamps", { mode: "json" }).default(
		sql`(json_array())`,
	),
});
export type ProcessingJobSelect = typeof ProcessingJobs.$inferSelect;

export const ProjectRelations = relations(Projects, ({ one, many }) => ({
	imageStacks: many(ImageStacks),
	processingJob: one(ProcessingJobs, {
		fields: [Projects.processingJobId],
		references: [ProcessingJobs.id],
	}),
}));

export const ImageStackRelations = relations(ImageStacks, ({ one, many }) => ({
	project: one(Projects, {
		fields: [ImageStacks.projectId],
		references: [Projects.id],
	}),
	resultImages: many(ResultImages),
	processingJob: one(ProcessingJobs, {
		fields: [ImageStacks.processingJobId],
		references: [ProcessingJobs.id],
	}),
}));

export const ResultImageRelations = relations(ResultImages, ({ one }) => ({
	imageStack: one(ImageStacks, {
		fields: [ResultImages.imageStackId],
		references: [ImageStacks.id],
	}),
	processingJob: one(ProcessingJobs, {
		fields: [ResultImages.processingJobId],
		references: [ProcessingJobs.id],
	}),
}));
