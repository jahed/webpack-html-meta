import { ok } from 'assert'
import { join as joinPath } from 'path'
import { forEach, merge } from 'lodash'
import { load as loadHtml } from 'cheerio'
import * as favicons from 'favicons'
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

export interface PluginOptions {
  faviconSource: string,
  manifest?: Manifest
}

interface HtmlWebpackPluginEventData {
  html: string
}

type HtmlWebpackPluginEventCallback = (error?: Error, data?: HtmlWebpackPluginEventData) => void

interface CustomCompilationHooks extends compilation.CompilationHooks {
  htmlWebpackPluginBeforeHtmlProcessing: AsyncSeriesHook<HtmlWebpackPluginEventData>
}

interface Compilation extends compilation.Compilation {
  hooks: CustomCompilationHooks
}

const defaultOptions: PluginOptions = {
  faviconSource: undefined,
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
  private _result: Favicons.Response

  constructor(userOptions: PluginOptions) {
    this._options = merge({}, defaultOptions, userOptions)

    ok(this._options.faviconSource, 'options.faviconSource is required. e.g. ./images/favicon.png')
  }

  apply(compiler: Compiler) {
    compiler.hooks.make.tapAsync('HtmlMetaPlugin', (_: Compilation, callback: Function) => {
      this._createFiles()
        .then(() => callback())
        .catch(error => callback(error))
    })

    compiler.hooks.emit.tapAsync('HtmlMetaPlugin', (compilation: Compilation, emitCallback: Function) => {
      this._createFiles()
        .then(({ files, images, html: [htmlFirst, ...htmlRest] }) => {
          this._addFilesToAssets(compilation, files)
          this._addFilesToAssets(compilation, images)

          compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
            'HtmlMetaPlugin',
            (htmlData: HtmlWebpackPluginEventData, htmlCallback: HtmlWebpackPluginEventCallback) => {
              const { manifest } = this._options
              const $ = loadHtml(htmlData.html)
              const $head = $('head')

              $head.append('<!-- <MetaPlugin> -->')
              $head.append(`<title>${manifest.appName}</title>`)
              $head.append(htmlFirst, ...htmlRest)
              $head.append('<!-- </MetaPlugin> -->')

              htmlData.html = $.html()
              htmlCallback(undefined, htmlData)
            }
          )
        })
        .then(() => emitCallback())
        .catch(error => emitCallback(error))
    })
  }

  private _createFiles(): Promise<Favicons.Response> {
    if (this._result) {
      return Promise.resolve(this._result)
    }

    return new Promise((resolve, reject) => {
      const source = this._options.faviconSource
      const configuration = this._options.manifest

      favicons(source, configuration, (error, result) => {
        if (error) {
          reject(error)
          return
        }
        this._result = result
        resolve(result)
      })
    })
  }

  private _addFilesToAssets(compilation: Compilation, files: Array<Favicons.File | Favicons.Image>): void {
    forEach(files, file => {
      const assetPath = joinPath(this._options.manifest.path, file.name)
      compilation.assets[assetPath] = {
        source() {
          return file.contents
        },
        size() {
          return file.contents.length
        }
      }
    })
  }
}

export { HtmlMetaPlugin }
