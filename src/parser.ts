import * as tokens from "./token"
import { ParserOptions } from "./constants/IParserOption"

class Parser {
  public root: tokens.Root
  public options: ParserOptions | Partial<ParserOptions>

  constructor(root: tokens.Root, options: ParserOptions | Partial<ParserOptions> = {}) {
    this.root = root
    this.options = options
  }

  public html(): string {
    let result: string = ""

    return result
  }

  public markdown(): string {
    let result: string = ""

    return result
  }

  public python(): string {
  }
}

export default Parser