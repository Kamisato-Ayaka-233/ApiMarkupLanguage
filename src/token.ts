import { TokenValue } from "./constants/TTokenValue"
import { DataType } from "./constants/EDataType"
import { JsonArray, JsonDataType, JsonPrimitive } from "./constants/TJsonDataType"
import { HttpRequestMethod } from "./constants/EHttpRequestMethod"
import { Dict } from "./constants/TDict"

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
}

class Parameter extends Token {
  constructor(dataType: string = DataType.auto, name: string, hint: string = '', defaultValue: JsonPrimitive | JsonArray | Type = null) {
    super('parameter', {
      name,
      dataType,
      hint,
      defaultValue
    })
  }
}

class Import extends Token {
  constructor(file: string, items: string[]) {
    super('import', {
      file,
      items
    })
  }
}

class Enumeration extends Token {
  constructor(name: string, items: Dict) {
    super('enum', {
      name,
      items
    })
  }
}

class Type extends Token {
  constructor(name: string, genericities: string[], items: Parameter[]) {
    super('type', {
      name,
      genericities,
      items
    })
  }
}

class Interface extends Token {
  constructor(name: string, hint: string = '', method: HttpRequestMethod, url: Parameter, response: Parameter, data?: Parameter, query?: Parameter, notice?: Parameter) {
    super('interface', {
      name,
      hint,
      method,
      url,
      query,
      data,
      response,
      notice
    })
  }
}

export {
  Token,
  Root,
  Type,
  Interface,
  Parameter,
  Enumeration,
  Import
}