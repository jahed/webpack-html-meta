import assert from 'assert'
import path from 'path'
import { forEach, merge } from 'lodash'
import { load as loadHtml } from 'cheerio'
import favicons from 'favicons'
import { Compiler, Plugin, compilation } from 'webpack'
import { AsyncSeriesHook } from 'tapable'

forEach(favicons.config.icons["android"], icon => {
  icon.transparent = false
})

// Add a generic higher quality favicon for Open Graph.
favicons.config.icons.favicons["favicon.png"] = {
  "width": 256,
  "height": 256,
  "transparent": true,
  "rotate": false,
  "mask": false
}

favicons.config.html["opengraph"] = {
  "meta[property='og:site_name']": "<meta content='application-name' property='og:site_name'>",
  "meta[property='og:title']": "<meta content='application-name' property='og:title'>",
  "meta[property='og:image'][content$='favicon.png']": "<meta content='favicon.png' property='og:image'>"
}

favicons.config.html["standard"] = {
  "meta[name='title']": "<meta content='application-name' name='title'>"
}

favicons.config.html["twitter"] = {
  "meta[name='twitter:title']": "<meta content='application-name' name='twitter:title'>",
  "meta[name='twitter:image'][content$='favicon.png']": "<meta content='favicon.png' name='twitter:image'>"
}

export interface ExtendedIcons extends Favicons.Icons {
  opengraph?: boolean,
  standard?: boolean,
  twitter?: boolean
}

export interface Manifest extends Favicons.Configuration {
  icons?: ExtendedIcons
}

export interface UserOptions {
  faviconSource: string,
  manifest?: Manifest
}

export interface PluginOptions {
  faviconSource: string,
  manifest: { path: string } & Manifest
}

interface HtmlWebpackPluginEventData {
  html: string
}

type HtmlWebpackPluginEventCallback = (error?: Error, data?: HtmlWebpackPluginEventData) => void

interface CustomCompilationHooks extends compilation.CompilationHooks {
  htmlWebpackPluginBeforeHtmlProcessing?: AsyncSeriesHook<HtmlWebpackPluginEventData>
}

interface Compilation extends compilation.Compilation {
  hooks: CustomCompilationHooks
}

const defaultOptions = {
  manifest: {
    path: '/meta/',
    icons: {
      opengraph: true,
      standard: true,
      twitter: true
    }
  }
}

class HtmlMetaPlugin implements Plugin {
  private _options: PluginOptions
  private _assets: Favicons.Response
  private _done: boolean

  constructor(userOptions: UserOptions) {
    assert.ok(userOptions.faviconSource, 'options.faviconSource is required. e.g. "./images/favicon.png"')
    this._options = merge({}, defaultOptions, userOptions)
    this._done = false
  }

  apply(compiler: Compiler) {
    compiler.hooks.make.tapAsync('HtmlMetaPlugin', (_: Compilation, callback: Function) => {
      this._createAssets()
        .then(() => callback())
        .catch(error => callback(error))
    })

    compiler.hooks.emit.tap('HtmlMetaPlugin', (compilation: Compilation) => {
      if (compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
        // Always add the html-webpack-plugin hook in case the html changes
        compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
          'HtmlMetaPlugin',
          (htmlData: HtmlWebpackPluginEventData, htmlCallback: HtmlWebpackPluginEventCallback) => {
            const $ = loadHtml(htmlData.html)
            const $head = $('head')
            const [htmlFirst, ...htmlRest] = this._assets.html

            $head.append('<!-- <MetaPlugin> -->')
            $head.append(`<title>${this._options.manifest.appName}</title>`)
            $head.append(htmlFirst, ...htmlRest)
            $head.append('<!-- </MetaPlugin> -->')

            htmlData.html = $.html()
            htmlCallback(undefined, htmlData)
          }
        )
      }

      if (this._done) {
        // Only emit the first time.
        return
      }

      this._emitAssets(compilation, this._assets.files)
      this._emitAssets(compilation, this._assets.images)
      this._done = true
    })
  }

  private _createAssets(): Promise<Favicons.Response> {
    return new Promise((resolve, reject) => {
      const source = this._options.faviconSource
      const configuration = this._options.manifest

      favicons(source, configuration, (error, assets) => {
        if (error) {
          reject(error)
          return
        }
        this._assets = assets
        resolve(assets)
      })
    })
  }

  private _emitAssets(compilation: Compilation, assetGroup: Array<Favicons.File | Favicons.Image>): void {
    forEach(assetGroup, asset => {
      const assetPath = path
        .join(this._options.manifest.path, asset.name)
        .replace(/^\//, '')

      compilation.assets[assetPath] = {
        source: () => asset.contents,
        size: () => asset.contents.length
      }
    })
  }
}

export { HtmlMetaPlugin }
