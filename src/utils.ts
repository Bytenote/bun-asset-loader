import { mkdir, stat } from 'node:fs/promises';
import path from 'path';
import { string } from '@tdewolff/minify';
import { Glob, type BunFile } from 'bun';
import type { Asset } from './types.js';

/**
 * Validates existence of 'from' and 'to' paths, and creates 'to' path if it
 * doesn't exist. Returns final output path.
 *
 * @param from Source path
 * @param to Either 'to' in Asset type or 'outdir' in Bun.build() options
 *
 * @returns Output path
 */
export async function handlePaths(from: string, to?: string): Promise<string> {
    const fromExists = await stat(from).catch(() => false);
    if (!from || !fromExists) {
        throw new Error(`Invalid 'from' path: ${from}`);
    }

    if (!to) {
        throw new Error(`Invalid 'to' path: ${to}`);
    }

    const toExists = await stat(to).catch(() => false);
    if (!toExists) {
        await mkdir(to, { recursive: true }).catch((err: Error) => {
            throw new Error(`Error creating 'to' path: ${to} - ${err.message}`);
        });
    }

    return to;
}

/**
 * Checks if 'from' is a file or directory, and returns an array of all file
 * paths, optionally filtered by a regex or glob pattern. Returns an array of
 * file paths.
 *
 * @param from Source path
 * @param filter File filter
 *
 * @returns Array of file paths
 */
export async function getFilePaths(
    from: string,
    filter?: RegExp | string
): Promise<string[]> {
    let filePaths: string[] = [];

    const fsStats = await stat(from);
    if (fsStats.isDirectory()) {
        filePaths = await _getFilteredFilePaths(from, filter);
    } else if (fsStats.isFile()) {
        filePaths = [from];
    }

    return filePaths;
}

/**
 * Loads file content and returns it along with a file reference.
 *
 * @param filePath File path
 *
 * @returns File content and bun file reference
 */
export async function loadFile(
    filePath: string
): Promise<{ content: string; fileRef: BunFile }> {
    const fileRef = Bun.file(filePath);
    const content = await fileRef.text();

    return { content, fileRef };
}

/**
 * Copies or transforms content based on file type and options and returns it.
 *
 * Images are copied as-is, while other file types are minified and/or
 * transformed based on options.
 *
 * @param content File content
 * @param fileRef Bun file reference
 * @param options Options: minify, transform
 *
 * @returns Transformed content or Bun file reference
 */
export function handleContent(
    content: string,
    fileRef: BunFile,
    options: Asset
): string | BunFile {
    let transformedContent: string | BunFile | null = null;
    const isImage = fileRef.type.includes('image');
    if (isImage) {
        // images are copied as-is per fileRef
        transformedContent = fileRef;
    } else {
        transformedContent = _transformContent(content, fileRef.type, options);
    }

    return transformedContent;
}

/**
 * Writes content to file system.
 *
 * @param outPath Output path
 * @param content Content to write
 */
export async function writeFile(
    outPath: string,
    content: string | BunFile
): Promise<void> {
    await Bun.write(outPath, content);
}

/**
 * Minifies and/or transforms content based on options.
 *
 * @private
 * @param content Content to transform
 * @param type File type
 * @param options Options
 *
 * @returns Transformed content
 */
function _transformContent(
    content: string,
    type: string,
    options: Asset
): string {
    if (options.minify) {
        content = string(type, content);
    }

    if (options.transform) {
        content = options.transform(content);
    }

    return content;
}

/**
 * Returns an array of file paths filtered by a regex or glob pattern.
 *
 * @private
 * @param from Source path
 * @param filter Optional file filter
 *
 * @returns Array of file paths
 */
async function _getFilteredFilePaths(
    from: string,
    filter?: RegExp | string
): Promise<string[]> {
    const filePaths: string[] = [];

    if (filter) {
        if (filter instanceof RegExp) {
            // use bun glob to load all dir contents
            const glob = new Glob('*.*');
            for await (const file of glob.scan(from)) {
                if (filter.test(file)) {
                    filePaths.push(path.join(from, file));
                }
            }
        } else if (typeof filter === 'string') {
            const glob = new Glob(filter);
            for await (const file of glob.scan(from)) {
                filePaths.push(path.join(from, file));
            }
        } else {
            throw new Error('Invalid filter provided');
        }
    } else {
        const glob = new Glob('*.*');
        for await (const file of glob.scan(from)) {
            filePaths.push(path.join(from, file));
        }
    }

    return filePaths;
}
