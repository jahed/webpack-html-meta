declare namespace Favicons {
  type Color = string
  type URL = string
  type HTML = string

  /**
   * Platform Options:
   * - offset - offset in percentage
   * - shadow - drop shadow for Android icons, available online only
   * - background:
   *   * false - use default
   *   * true - force use default, e.g. set background for Android icons
   *   * color - set background for the specified icons
   */
  interface Icons {
    /**
     * Create Android homescreen icon. `boolean` or `{ offset, background, shadow }`
     */
    android?: boolean | {
      offset?: number,
      background?: Color,
      shadow?: boolean
    },

    /**
     * Create Apple touch icons. `boolean` or `{ offset, background }`
     */
    appleIcon?: boolean | {
      offset?: number,
      background?: Color
    },

    /**
     * Create Apple startup images. `boolean` or `{ offset, background }`
     */
    appleStartup?: boolean | {
      offset?: number,
      background?: Color
    },

    /**
     * Create Opera Coast icon with offset 25%. `boolean` or `{ offset, background }`
     */
    coast?: boolean | {
      offset?: number,
      background?: Color
    },

    /**
     * Create regular favicons. `boolean`
     */
    favicons?: boolean

    /**
     * Create Firefox OS icons. `boolean` or `{ offset, background }`
     */
    firefox?: boolean | {
      offset?: number,
      background?: Color
    },

    /**
     * Create Windows 8 tile icons. `boolean` or `{ background }`
     */
    windows?: boolean | {
      background?: Color
    },

    /**
     * Create Yandex browser icon. `boolean` or `{ background }`
     */
    yandex?: boolean | {
      background?: Color
    },
  }

  interface Configuration {
    /**
     * Your application's name. `string`
     */
    appName?: string,

    /**
     * Your application's description. `string`
     */
    appDescription?: string,

    /**
     * Your (or your developer's) name. `string`
     */
    developerName?: string,

    /**
     * Your (or your developer's) URL. `string`
     */
    developerURL?: URL,

    /**
     * Background colour for flattened icons. `string`
     */
    background?: Color,

    /**
     * Theme color for browser chrome. `string`
     */
    theme_color?: Color,

    /**
     * Path for overriding default icons path. `string`
     */
    path?: string,

    /**
     * Android display?: "browser" or "standalone". `string`
     */
    display?: 'browser' | 'standalone',

    /**
     * Android orientation?: "portrait" or "landscape". `string`
     */
    orientation?: 'portrait' | 'landscape',

    /**
     * Android start application's URL. `string`
     */
    start_url?: string,

    /**
     * Your application's version number. `number`
     */
    version?: string,

    /**
     * Print logs to console? `boolean`
     */
    logging?: boolean,

    /**
     * Use RealFaviconGenerator to create favicons? `boolean`
     */
    online?: boolean,

    /**
     * Use offline generation, if online generation has failed. `boolean`
     */
    preferOnline?: boolean,

    icons?: Icons
  }

  interface Error {
    /**
     * HTTP error code (e.g. `200`) or `null`
     */
    status?: number,
    /**
     * Error name e.g. "API Error"
     */
    name: string,
    /**
     * Error description e.g. "An unknown error has occurred"
     */
    message: string
  }

  interface Image {
    name: string,
    contents: Buffer
  }

  interface File {
    name: string,
    contents: string
  }

  interface Response {
    images: Image[],
    files: File[],
    html: HTML[]
  }

  interface HTMLTemplateOptions extends Configuration {
    relative: (filename: string) => string
  }

  type HTMLTemplate = (options: HTMLTemplateOptions) => string

  interface ConfigDefaults {
    defaults: Configuration,
    files: any,
    html: { [platform: string]: HTMLTemplate[] },
    icons: any,
    'platform-options': any,
    rfg: any
  }

  type Stream = (params: any, handleHtml: any) => any
}

declare module 'favicons' {
  const favicons: {
    (
      source: Buffer | string | string[],
      configuration: Favicons.Configuration,
      callback: (error: Favicons.Error, response: Favicons.Response) => void
    ): void,
    stream: Favicons.Stream
    config: Favicons.ConfigDefaults
  }

  export default favicons
}
