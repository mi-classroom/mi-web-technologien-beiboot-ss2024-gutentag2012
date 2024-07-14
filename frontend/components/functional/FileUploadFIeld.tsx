import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Signal } from "@preact/signals-react";
import { FileUpIcon } from "lucide-react";

type UploadFieldProps = {
	file: Signal<File | null>;
	title?: string;
	description?: string;
	shouldPreview?: boolean;
	className?: string;
	onChange?: (file: File | null) => void;
};

export function FileUploadField({
	file,
	title,
	description,
	className,
	shouldPreview,
	onChange,
}: UploadFieldProps) {
	return (
		<Label
			className={cn(
				"relative w-full min-h-64 flex flex-col gap-2 items-center justify-center p-8 border-2 border-dashed border-muted-foreground cursor-pointer bg-muted/10 hover:bg-muted/20",
				className,
			)}
		>
			<Input
				className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				type="file"
				accept="video/quicktime,video/mp4"
				onChange={(e) => {
					const selectedFile = e.target.files?.[0] ?? null;

					if (onChange) return onChange(selectedFile);
					file.value = selectedFile;
				}}
			/>
			{shouldPreview && file?.value ? (
				<>
					{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
					<video
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						src={URL.createObjectURL(file.value!)}
						controls
						className="max-h-72 object-cover rounded-lg"
					/>
					<p className="text-sm text-foreground/80 font-semibold">
						Selected: {file.value?.name}
					</p>
					<p className="text-xs text-foreground/60">{title}</p>
				</>
			) : (
				<>
					<FileUpIcon className="h-8 w-8" />
					<div className="flex flex-col items-center">
						<p className="text-sm text-center text-foreground/80 font-semibold">
							{title}
						</p>
						<p className="text-xs text-center text-foreground/60">
							{description}
						</p>
					</div>
				</>
			)}
		</Label>
	);
}
