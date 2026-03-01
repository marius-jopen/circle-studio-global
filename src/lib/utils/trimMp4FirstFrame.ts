/**
 * Trims the first frame from an MP4 blob using ffmpeg.wasm.
 * Addresses encoder/decoder black first-frame artifacts.
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

/** Call when recording starts (MP4) to pre-load ffmpeg for faster trim when recording stops */
export function preloadTrimMp4(): void {
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
 * Returns a new Blob with the first frame removed from the MP4.
 * Falls back to the original blob if trimming fails.
 */
export async function trimMp4FirstFrame(blob: Blob): Promise<Blob> {
	try {
		const ffmpeg = await getFFmpeg();
		const inputData = await fetchFile(blob);
		await ffmpeg.writeFile('input.mp4', inputData);

		// select=gte(n,1) keeps frames where frame index >= 1, dropping frame 0
		await ffmpeg.exec([
			'-i',
			'input.mp4',
			'-vf',
			'select=gte(n\\,1)',
			'-vsync',
			'vfr',
			'-an',
			'output.mp4'
		]);

		const outputData = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
		await ffmpeg.deleteFile('input.mp4');
		await ffmpeg.deleteFile('output.mp4');

		return new Blob([outputData], { type: 'video/mp4' });
	} catch (error) {
		console.warn('Failed to trim first frame from MP4, using original:', error);
		return blob;
	}
}
