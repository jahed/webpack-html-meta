# webpack-html-meta

[![Patreon](https://img.shields.io/badge/patreon-donate-f96854.svg)](https://www.patreon.com/jahed)

Generate Meta tags and Favicons for your HTML as part of your Webpack build.

The Favicons are generated using [`favicons`](https://github.com/evilebottnawi/favicons) which takes one icon and
generates icons relevant to individual platforms (Android, iOS, Windows, Chrome, etc.).

## Installation

```bash
npm install --save-dev @jahed/webpack-html-meta
```

## Example

Here's how you might use this plugin in your `webpack.config.js`:

```js
import { HtmlMetaPlugin } from '@jahed/webpack-html-meta'

// ...
plugins: [
    //...
    new HtmlMetaPlugin({
        faviconSource: './favicon.png',
        manifest: { 
            appName: 'My App',
            icons: {
                android: false
            }
        })
    })
    //...
]
//...
```

For a full list of `manifest` options, see the docs for [`favicons`](https://github.com/evilebottnawi/favicons).
