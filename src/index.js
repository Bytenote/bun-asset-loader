import path from 'path';
import {
	handlePaths,
	getFilePaths,
	loadFile,
	handleContent,
	writeFile,
} from './utils.js';

/**
 * Bun plugin for copying, minifying and transforming
 * assets, like images, CSS files, JSON files, etc. that
 * are not handled by the build process directly due to
 * not being imported in the source code, yet are required
 * to be included in the output directory.
 *
 * @param {Object} options						- Plugin options
 * @param {Object[]} options.assets				- Array of asset configurations
 * @param {string} options.assets[].from		- Source path
 * @param {string} options.assets[].to			- Destination path
 * @param {string} options.assets[].name		- Output file name
 * @param {string} options.assets[].filter		- Glob pattern or RegExp for filtering files
 * @param {Function} options.assets[].transform	- Function for transforming file content
 * @param {boolean} options.assets[].minify		- Flag for minifying content
 * @returns {Object}
 */
const assetLoader = ({ assets = {} }) => ({
	name: 'assetLoader',
	async setup(build) {
		if (!assets) {
			throw new Error("'assets' option not provided");
		}

		for (const asset of assets) {
			const to = await handlePaths(
				asset.from,
				asset.to,
				build.config.outdir
			);
			const filePaths = await getFilePaths(asset.from, asset.filter);

			for (const filePath of filePaths) {
				const outPath = path.join(
					to,
					asset.name ?? path.basename(filePath)
				);

				const { content, fileRef } = await loadFile(filePath);
				const { transformedContent, isImage } = handleContent(
					content,
					fileRef,
					asset
				);
				await writeFile(outPath, transformedContent, isImage);
			}
		}
	},
});

export default assetLoader;
