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
    console.log(JSON.stringify(tokens, undefined, 2))

    const parser = new Parser(tokens)

    return parser.html()
  }
  public static async parseToMarkdown(source: string): Promise<string> {
    const tokens = await this.tokenize(source)
    const parser = new Parser(tokens)

    return parser.markdown()
  }
}

ApiMarkupLanguage.parseToHtml('type typeExample = {str strExample: 字符串示例 ="fjioasjggjpo mfoiasjns" num numExample: 数字示例 = 12345 T genericityExample: 泛型示例}')
ApiMarkupLanguage.parseToHtml('GET getGenshinVersions: 获取《原神》所有版本号和版本主题 = {str url = "https://api.21cnt.cn/genshin/version" response: application/json = {str current: 当前版本 obj versions}}')

export default ApiMarkupLanguage