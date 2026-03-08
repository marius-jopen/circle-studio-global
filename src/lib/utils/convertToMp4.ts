/**
 * Converts any video blob (WebM, Matroska, etc.) to a universally compatible MP4.
 * Uses ffmpeg.wasm to re-encode with H.264 + yuv420p + faststart.
 * This ensures playback in QuickTime, VLC, WhatsApp, and all major players.
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

/** Pre-load ffmpeg when recording starts so conversion is faster when it stops */
export function preloadFFmpeg(): void {
	if (ffmpegInstance) return;
	(async () => {
		try {
			ffmpegInstance = new FFmpeg();
			await ffmpegInstance.load();
		} catch {
			ffmpegInstance = null;
		}
	})();
}

async function getFFmpeg(): Promise<FFmpeg> {
	if (!ffmpegInstance) {
		ffmpegInstance = new FFmpeg();
		await ffmpegInstance.load();
	}
	return ffmpegInstance;
}

/**
 * Converts a video blob to a compatible MP4 file.
 * H.264 baseline + yuv420p = plays everywhere (QuickTime, VLC, WhatsApp, browsers).
 * Falls back to the original blob if conversion fails.
 */
export async function convertToMp4(
	blob: Blob,
	onProgress?: (ratio: number) => void
): Promise<Blob> {
	try {
		const ffmpeg = await getFFmpeg();

		if (onProgress) {
			ffmpeg.on('progress', ({ progress }) => {
				onProgress(Math.max(0, Math.min(1, progress)));
			});
		}

		// Detect input format from blob type
		const mime = (blob.type || '').toLowerCase();
		const inputExt = mime.includes('mp4') ? 'mp4'
			: mime.includes('matroska') || mime.includes('x-mkv') ? 'mkv'
			: 'webm';

		const inputFile = `input.${inputExt}`;
		const outputFile = 'output.mp4';

		const inputData = await fetchFile(blob);
		await ffmpeg.writeFile(inputFile, inputData);

		await ffmpeg.exec([
			'-i', inputFile,
			'-c:v', 'libx264',
			'-pix_fmt', 'yuv420p',
			'-preset', 'fast',
			'-crf', '18',
			'-movflags', '+faststart',
			'-an',
			outputFile
		]);

		const outputData = (await ffmpeg.readFile(outputFile)) as Uint8Array;
		await ffmpeg.deleteFile(inputFile);
		await ffmpeg.deleteFile(outputFile);

		// Clean up progress listener
		if (onProgress) {
			ffmpeg.off('progress');
		}

		if (outputData.length < 100) {
			console.warn('FFmpeg output too small, using original blob');
			return blob;
		}

		return new Blob([outputData], { type: 'video/mp4' });
	} catch (error) {
		console.warn('MP4 conversion failed, using original blob:', error);
		return blob;
	}
}
