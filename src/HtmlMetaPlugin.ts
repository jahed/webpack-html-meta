import favicons from '@jahed/favicons'
import type { HTMLTemplateOptions } from '@jahed/favicons'
import assert from 'assert'
import { load as loadHtml } from 'cheerio'
import type { default as HtmlWebpackPluginInstance } from 'html-webpack-plugin'
import { forEach, merge } from 'lodash'
import path from 'path'
import type { compilation, Compiler, Plugin } from 'webpack'

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

const absoluteOrRelative = (file: string, options: HTMLTemplateOptions): string => {
  const filePath = options.relative(file)
  try {
    return new URL(filePath, options.start_url).href
  } catch {
    return filePath
  }
}

favicons.config.html["opengraph"] = [
  ({ appName }) => `<meta content='${appName}' property='og:site_name'>`,
  ({ appName }) => `<meta content='${appName}' property='og:title'>`,
  ({ appDescription }) => `<meta content='${appDescription}' property='og:description'>`,
  options => `<meta content='${absoluteOrRelative('favicon.png', options)}' property='og:image'>`
]

favicons.config.html["standard"] = [
  ({ appName }) => `<meta content='${appName}' name='title'>`,
  ({ appDescription }) => `<meta content='${appDescription}' name='description'>`
]

export interface ExtendedIcons extends Favicons.Icons {
  opengraph?: boolean,
  standard?: boolean
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

type Compilation = compilation.Compilation

const defaultOptions = {
  manifest: {
    path: '/meta/',
    icons: {
      opengraph: true,
      standard: true
    }
  }
}

const extractHtmlWebpackPluginModule = (compiler: Compiler): typeof HtmlWebpackPluginInstance | null=> {
  const htmlWebpackPlugin = (compiler.options.plugins || []).find(
    (plugin) => {
      console.log(plugin.constructor.name)
      return plugin.constructor.name === 'HtmlWebpackPlugin'
    }
  ) as typeof HtmlWebpackPluginInstance | undefined
  if (!htmlWebpackPlugin) {
    return null
  }
  const HtmlWebpackPlugin = htmlWebpackPlugin.constructor
  if (!HtmlWebpackPlugin || !('getHooks' in HtmlWebpackPlugin)) {
    return null
  }
  return HtmlWebpackPlugin as typeof HtmlWebpackPluginInstance
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
    const HtmlWebpackPlugin = extractHtmlWebpackPluginModule(compiler)
    if (!HtmlWebpackPlugin) {
      throw new Error('HtmlMetaPlugin needs to be used with html-webpack-plugin@4')
    }

    compiler.hooks.make.tapAsync('HtmlMetaPlugin', (_: Compilation, callback: Function) => {
      this._createAssets()
        .then(() => callback())
        .catch(error => callback(error))
    })

    compiler.hooks.emit.tap('HtmlMetaPlugin', (compilation: Compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'HtmlMetaPlugin',
        (data, callback) => {
          const $ = loadHtml(data.html)
          const $head = $('head')
          const [htmlFirst, ...htmlRest] = this._assets.html

          $head.append('<!-- <MetaPlugin> -->')
          $head.append(`<title>${this._options.manifest.appName}</title>`)
          $head.append(htmlFirst, ...htmlRest)
          $head.append('<!-- </MetaPlugin> -->')

          data.html = $.html()
          callback(null, data)
        }
      )

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

