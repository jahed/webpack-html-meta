# webpack-html-meta

[![Travis](https://img.shields.io/travis/jahed/webpack-html-meta.svg)](https://travis-ci.org/jahed/webpack-html-meta)
[![npm](https://img.shields.io/npm/v/@jahed/webpack-html-meta.svg)](https://www.npmjs.com/package/@jahed/webpack-html-meta)
[![Patreon](https://img.shields.io/badge/patreon-donate-f96854.svg)](https://www.patreon.com/jahed)
[![Liberapay](https://img.shields.io/badge/liberapay-donate-d9b113.svg)](https://liberapay.com/jahed)

Generate Meta tags and Favicons for your HTML as part of your Webpack build.

The Favicons are generated using [`favicons`](https://github.com/evilebottnawi/favicons) which takes one icon and
generates icons relevant to individual platforms (Android, iOS, Windows, Chrome, etc.).

## Installation

Installation depends on your package manager of choice. Ensure you have also
installed the peer dependencies. If you haven't, you'll see a warning.

### Yarn

```bash
yarn add --dev @jahed/webpack-html-meta
```


### NPM

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
