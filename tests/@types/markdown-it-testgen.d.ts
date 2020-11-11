declare module 'markdown-it-testgen' {
  import MarkdownIt from 'markdown-it'

  /**
   * `markdown-it-testgen` parses fixtures in commonmark spec format and generates tests for markdown-it parser and plugins.
   * @param path file or directory name
   * @param options
   *   - header - Default `false.` Set `true` to use heaters for test names<br>
   *   - sep - array of allowed separators for samples, `['.']` by default<br>
   *   - custom assertion package, `require('chai').assert` by default.<br>
   * @param md `markdown-it` instance to parse and compare samples
   */
  function testgen(path: string, options: { header?: boolean; sep?: string[]; assert?: any }, md: MarkdownIt): void

  export default testgen
}
