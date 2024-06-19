import path from 'path';
import { stat, mkdir } from 'fs/promises';
import { string } from '@tdewolff/minify';
import { Glob } from 'bun';

/**
 * Validates existence of 'from' and 'to' paths,
 * and creates 'to' path if it doesn't exist.
 * Returns final output path.
 *
 * @param {string} from		- Source path
 * @param {string} to		- Destination path
 * @param {string} outdir	- Outdir from build config
 * @returns {Promise<string>}
 */
export async function handlePaths(from, to, outdir) {
	const fromExists = await stat(from).catch(() => false);
	if (!from || !fromExists) {
		throw new Error(`Invalid 'from' path: ${from}`);
	}

	if (!to) {
		throw new Error(`Invalid 'to' path: ${to}`);
	}

	const toExists = await stat(to).catch(() => false);
	if (!toExists) {
		await mkdir(to, { recursive: true }).catch((err) => {
			throw new Error(`Error creating 'to' path: ${to} - ${err}`);
		});
	}

	return to ?? outdir;
}

/**
 * Checks if 'from' is a file or directory,
 * and returns an array of all file paths,
 * optionally filtered by a regex or glob pattern.
 * Returns an array of file paths.
 *
 * @param {string} from				- Source path
 * @param {RegExp|string} [filter]	- File filter
 * @returns {Promise<string[]>}
 */
export async function getFilePaths(from, filter) {
	let files = [];

	const fsStats = await stat(from);
	if (fsStats.isDirectory()) {
		files = await _getFilteredFiles(from, filter);
	} else if (fsStats.isFile()) {
		files = [from];
	}

	return files;
}

/**
 * Loads file content and returns it along with
 * a file reference.
 *
 * @param {string} filePath	- File path
 * @returns {Promise<{ content: string, fileRef: Object}>}
 */
export async function loadFile(filePath) {
	const fileRef = Bun.file(filePath);
	const content = await fileRef.text();

	return { content, fileRef };
}

/**
 * Copies or transforms content based on file type
 * and options.
 * Returns transformed content and a boolean flag
 * indicating if the content is an image.
 *
 * Images are copied as-is, while other file types
 * are minified and/or transformed based on options.
 *
 * @param {string} content	- File content
 * @param {Object} fileRef	- File reference
 * @param {Object} options	- Options
 * @returns {{ transformedContent: string, isImage: boolean}}
 */
export function handleContent(content, fileRef, options) {
	let transformedContent = null;
	const isImage = fileRef.type.includes('image');
	if (isImage) {
		// images are copied as-is per fileRef
		transformedContent = fileRef;
	} else {
		transformedContent = _transformContent(content, fileRef.type, options);
	}

	return { transformedContent, isImage };
}

/**
 * Writes content to file system.
 *
 * @param {string} outPath	- Output path
 * @param {string} content	- Content to write
 */
export async function writeFile(outPath, content) {
	await Bun.write(outPath, content);
}

/**
 * Minifies and/or transforms content based on
 * options.
 *
 * @param {string} content	- Content to transform
 * @param {string} type		- File type
 * @param {Object} options	- Options
 * @returns {string}
 */
function _transformContent(content, type, options) {
	if (options.minify) {
		content = string(type, content);
	}

	if (options.transform) {
		content = options.transform(content);
	}

	return content;
}

/**
 * Returns an array of file paths filtered by
 * a regex or glob pattern.
 *
 * @param {string} from				- Source path
 * @param {RegExp|string} [filter]	- File filter
 * @returns {Promise<string[]>}
 */
async function _getFilteredFiles(from, filter) {
	const files = [];

	if (filter) {
		if (filter instanceof RegExp) {
			// use bun glob to load all dir contents
			const glob = new Glob('*.*');
			for await (const file of glob.scan(from)) {
				if (filter.test(file)) {
					files.push(path.join(from, file));
				}
			}
		} else if (typeof filter === 'string') {
			const glob = new Glob(filter);
			for await (const file of glob.scan(from)) {
				files.push(path.join(from, file));
			}
		} else {
			throw new Error('Invalid filter provided');
		}
	} else {
		const glob = new Glob('*.*');
		for await (const file of glob.scan(from)) {
			files.push(path.join(from, file));
		}
	}

	return files;
}
