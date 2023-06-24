import { TokenValue } from "./constants/TTokenValue"
import { DataType } from "./constants/EDataType"
import { JsonArray, JsonDataType, JsonPrimitive } from "./constants/TJsonDataType"
import { HttpRequestMethod } from "./constants/EHttpRequestMethod"
import { Dict } from "./constants/TDict"
import * as TkValue from "./constants/IToken"
import { TypeType } from "./constants/ETypeType"
import { ParameterOption } from "./constants/EParameterOption"

class Token {
  protected name: string = 'token'
  protected value: TokenValue

  constructor(name: string, value: TokenValue) {
    this.name = name
    this.value = value
  }

  public pushToObj(key: string, ...values: unknown[]): boolean {
    if (typeof this.value == 'object') {
      if (Array.isArray(this.value[key])) {
        this.value[key] = this.value[key].concat(...values)
        return true
      }

      this.value[key] = values
      return true
    }

    return false
  }

  
  public get tokenName(): string {
    return this.name
  }
  public get tokenValue(): TokenValue {
    return this.value
  }
}

class Root extends Token {
  constructor(title: string = 'API', tokens: Token[] = []) {
    super('root', {
      title,
      tokens
    })
  }

  public push(token: Token): boolean {
    if (typeof this.value == 'object' && token instanceof Token) {
      this.value.tokens.push(token)
      return true
    }
    return false
  }

  public get tokenValue(): TkValue.Root {
    return <TkValue.Root>this.value
  }
}

class ParameterDataType extends Token {
  constructor(name: string, genericityTargets: ParameterDataType[] = []) {
    super('parameter_data_type', {
      name,
      genericityTargets
    })
  }

  public get tokenValue(): TkValue.ParameterDataType {
    return <TkValue.ParameterDataType>this.value
  }
}

class Parameter extends Token {
  constructor(dataType: ParameterDataType, name: string, hint: string = '', defaultValue: JsonPrimitive | JsonArray | Type = null, option: ParameterOption = ParameterOption.undefined) {
    super('parameter', {
      name,
      dataType,
      hint,
      defaultValue,
      option
    })
  }

  public get tokenValue(): TkValue.Parameter {
    return <TkValue.Parameter>this.value
  }
}

class Enumeration extends Token {
  constructor(name: string, items: Dict) {
    super('enum', {
      name,
      items
    })
  }

  public get tokenValue(): TkValue.Enumeration {
    return <TkValue.Enumeration>this.value
  }
}

class Type extends Token {
  constructor(name: string, genericities: string[], items: (Parameter | Type)[] | JsonArray, length: number, type: TypeType) {
    super('type', {
      name,
      genericities,
      items,
      length,
      type
    })
  }

  public get tokenValue(): TkValue.Type {
    return <TkValue.Type>this.value
  }
}

class Interface extends Token {
  constructor(name: string, hint: string = '', method: HttpRequestMethod, url?: Parameter, response?: Parameter, query?: Parameter, body?: Parameter, header?: Parameter, cookie?: Parameter, notice?: Parameter) {
    super('interface', {
      name,
      hint,
      method,
      url,
      query,
      body,
      header,
      cookie,
      response,
      notice
    })
  }

  public get tokenValue(): TkValue.Interface {
    return <TkValue.Interface>this.value
  }
}

export {
  Token,
  Root,
  Type,
  Interface,
  Parameter,
  ParameterDataType,
  Enumeration,
}