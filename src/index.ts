import Tokenizer from './tokenizer'
import Parser from './parser'
import * as tokens from './token'

class ApiMarkupLanguage {
  private static async tokenize(source: string): Promise<tokens.Root> {
    const tokenizer = new Tokenizer(source)
    return tokenizer.tokenize()
  }
  public static async parseToHtml(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    return parser.html()
  }
  public static async parseToMarkdown(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    return parser.markdown()
  }
  public static async parseToPythonHttpx(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    console.log(JSON.stringify(tokens, undefined, 2))

    return ''
  }
}

ApiMarkupLanguage.parseToPythonHttpx(`
type getGenshinItemIdsQuery = {
  optional str lang: 语言 = "chs"
}

type getGenshinItemIdsRes<T> = {
  version: 项目ID与项目名称 = [1145141919810]num
}

GET getGenshinItemIds: Get both item ids and item names of Genshin Impact = {
  url = "https://api.21cnt.cn/genshin/itemId"
  getGenshinItemIdsQuery query
  getGenshinItemIdsRes response
}

`)

export default ApiMarkupLanguage