import * as tokens from "./token"
import { ParserOptions } from "./constants/IParserOption"
import { Dict } from "./constants/TDict"
import { DataType } from "./constants/EDataType"
import * as exceptions from './exception'
import { isInObject } from "./utils"
import { TypeType } from "./constants/ETypeType"

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

  public pythonHttpx(): string {
    let result: string = "import httpx\n\n"

    const rootValue = <Dict>this.root.tokenValue
    const types: Record<string, tokens.Type> = {}
    for (let i = 0; i < rootValue.tokens.length; i++) {
      const token: tokens.Token = rootValue.tokens[i];
      
      if (token instanceof tokens.Type) {
        types[token.tokenValue.name] = token
      }
      else if (token instanceof tokens.Interface) {
        result += this.generatePythonCodeHttpx(token, types)
      }
    }

    return result
  }

  private isJsonDataType(dataType: tokens.ParameterDataType): boolean {
    return isInObject(dataType.tokenValue.name, DataType)
  }

  private parseParameterGenericityTargets(parameter: tokens.Parameter, types: Record<string, tokens.Type>): tokens.Parameter | undefined {
    const parameterDataTypeValue = parameter.tokenValue.dataType.tokenValue

    return undefined
  }

  private indent(str: string, indent: number = 4): string {
    const strArr: string[] = str.trim().replaceAll('\r', '').split('\n')
    let result: string = ''

    strArr.forEach((s: string) => {
      for (let i = 0; i < indent; i++) {
        result += ' '
      }

      result += s + '\n'
    })
    
    return result
  }

  private generatePythonCodeHttpx(api: tokens.Interface, types: Record<string, tokens.Type> = {}): string {
    const apiValue = api.tokenValue
    let result: string = `\ndef ${apiValue.name}(`

    result += ') -> httpx.Response:\n'
    result += this.indent('"""')
    if (apiValue.hint) {
      result += this.indent(apiValue.hint)
    }
    if (apiValue.notice) {
      result += '\n'
      result += this.indent(String(apiValue.notice.tokenValue.defaultValue))
    }
    result += this.indent('"""')

    if (apiValue.url?.tokenValue.defaultValue) {
      result += this.indent(`return httpx.request("${apiValue.method}", "${apiValue.url.tokenValue.defaultValue}")`)
    }
    else {
      result += this.indent('pass')
    }

    // if (api.tokenValue.query) {
    //   const queryValue = api.tokenValue.query.tokenValue
    //   if (queryValue.dataType.tokenValue.name != DataType.auto) {
    //     if (this.isJsonDataType(queryValue.dataType)) {
    //       const queryDataType = queryValue.dataType.tokenValue.name
    //       if ([DataType.unknown, DataType.auto, DataType.obj].includes(<DataType>queryDataType) && queryValue.defaultValue instanceof tokens.Type) {
    //         const queryDefaultValue = queryValue.defaultValue.tokenValue
    //       }
    //       else {
    //         throw new exceptions.AmlTypeError(queryDataType, queryValue.name)
    //       }
    //     }
    //     else if (types[queryValue.dataType.tokenValue.name]) {
    //       const queryDataType = queryValue.dataType.tokenValue.name
    //       let queryDefaultValue: Dict | undefined
    //       if (queryValue.defaultValue instanceof tokens.Type) {
    //         queryDefaultValue = queryValue.defaultValue.tokenValue
    //       }


    //     }
    //     else {
    //       throw new exceptions.AmlMissingType(queryValue.dataType.tokenValue.name)
    //     }
    //   }
    // }

    return result
  }
}

export default Parser