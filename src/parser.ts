import * as tokens from "./token"
import { ParserOptions } from "./constants/IParserOption"
import { Dict } from "./constants/TDict"
import { DataType } from "./constants/EDataType"
import * as exceptions from './exception'
import { isInObject } from "./utils"

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

  public pythonHttpx(): string | undefined {
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
    return isInObject(<DataType>dataType.tokenValue.name, DataType)
  }

  private parseParameterGenericityTargets(parameter: tokens.Parameter, types: Record<string, tokens.Type>): tokens.Type | void {
    // const dataTypeValue = parameter.tokenValue.dataType.tokenValue
    // const genericityTargets = dataTypeValue.genericityTargets
    // let parsedType: tokens.Type

    // if (this.isJsonDataType(parameter.tokenValue.dataType)) {
    //   throw new exceptions.AmlTypeError(dataTypeValue.name)
    // }

    // genericityTargets.forEach(genericityTarget => {
    //   const genericityTargetValue = genericityTarget.tokenValue

    //   if (!this.isJsonDataType(genericityTarget) && types[genericityTargetValue.name]) {
    //     const targetTypeValue = types[genericityTargetValue.name].tokenValue
    //     if ()
    //   }
    //   else {
    //     throw new exceptions.AmlTypeError(genericityTargetValue.name)
    //   }
    // });

    // return parsedParameterDataType
  }

  private generatePythonCodeHttpx(api: tokens.Interface, types: Record<string, tokens.Type> = {}): string {
    let result: string = `\ndef ${api.tokenValue.name}(`

    if (api.tokenValue.query) {
      const queryValue = api.tokenValue.query.tokenValue
      if (queryValue.dataType.tokenValue.name != `${DataType.auto}`) {
        if (this.isJsonDataType(queryValue.dataType)) {
          const queryDataType = queryValue.dataType.tokenValue.name
          if ([DataType.unknown, DataType.auto, DataType.obj, 'dataType'].includes(queryDataType) && queryValue.defaultValue instanceof tokens.Type) {
            const queryDefaultValue = queryValue.defaultValue.tokenValue
          }
          else {
            throw new exceptions.AmlTypeError(queryDataType, queryValue.name)
          }
        }
        else if (types[queryValue.dataType.tokenValue.name]) {
          const queryDataType = queryValue.dataType.tokenValue.name
          let queryDefaultValue: Dict | undefined
          if (queryValue.defaultValue instanceof tokens.Type) {
            queryDefaultValue = queryValue.defaultValue.tokenValue
          }


        }
        else {
          throw new exceptions.AmlMissingType(queryValue.dataType.tokenValue.name)
        }
      }
    }

    return result
  }
}

export default Parser