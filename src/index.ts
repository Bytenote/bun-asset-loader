import path from 'path';
import type { BunPlugin } from 'bun';
import type { AssetOptions } from './types.js';
import {
    getFilePaths,
    handleContent,
    handlePaths,
    loadFile,
    writeFile,
} from './utils.js';

/**
 * Bun plugin for copying, minifying and transforming assets, like images, CSS
 * files, JSON files, etc. that are not handled by the build process directly
 * due to not being imported in the source code, yet are required to be included
 * in the output directory.
 *
 * @param options Plugin options
 *
 * @returns Bun plugin
 */
const assetLoader = ({ assets }: AssetOptions): BunPlugin => ({
    name: 'assetLoader',
    async setup(build) {
        if (!assets) {
            throw new Error("'assets' option not provided");
        }

        for (const asset of assets) {
            const to = await handlePaths(
                asset.from,
                asset.to ?? build.config.outdir
            );
            const filePaths = await getFilePaths(asset.from, asset.filter);

            for (const filePath of filePaths) {
                const outPath = path.join(
                    to,
                    asset.name ?? path.basename(filePath)
                );

                const { content, fileRef } = await loadFile(filePath);
                const transformedContent = handleContent(
                    content,
                    fileRef,
                    asset
                );

                await writeFile(outPath, transformedContent);
            }
        }
    },
});

export default assetLoader;
