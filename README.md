<p>
<h1 align="center">Bun Asset Loader</h1>
<div align="center">
<p align="center"><i>Bun plugin for loading non-imported assets</i></p>
	
	bun i bun-asset-loader
</div>
</p>

# About

This plugin incorporates custom filtered assets into the output directory by copying and optionally modifying them.  
It is designed for files that are not imported in any source files.

<b>Please note:</b> <i>Only works on non-Windows based operating systems.</i>

# How-To

```js
import assetLoader from 'bun-asset-loader';

const options = {
    assets: [
        {
            from: 'path/to/css/file',
            to: 'path/to/outdir',
            minify: true, // minify CSS, HTML, JSON, etc.
        },
        {
            from: 'path/to/dir',
            to: 'path/to/outdir/subdir',
            filter: /\.(png|jpe?g)$/i, // accepts RegEx and glob patterns
        },
        {
            from: 'path/to/dir',
            // 'to' can be omitted - uses Bun.build 'outdir' as fallback
            filter: '*.json',
            name: 'newName.json',
            transform: (content) => {
                // make the needed changes to the content
                const transformedContent = ... // transform content

                return JSON.stringify(transformedContent);
            },
        },
    ],
};

await Bun.build({
    // ...
    plugins: [
        // ...
        assetLoader(options),
    ],
});
```

# License

Distributed under the MIT License. See [MIT License](https://opensource.org/license/MIT) for more information.
