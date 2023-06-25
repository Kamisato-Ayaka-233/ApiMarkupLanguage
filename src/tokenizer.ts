import * as tokens from './token'
import { Keyword } from './constants/EKeyword'
import { Dict } from './constants/TDict'
import { Symbol } from './constants/ESymbol'
import { DataType } from './constants/EDataType'
import * as JsonDataType from './constants/TJsonDataType'
import * as exceptions from './exception'
import { HttpRequestMethod } from './constants/EHttpRequestMethod'
import { TypeType } from './constants/ETypeType'
import { ParameterOption } from './constants/EParameterOption'
import { isInObject } from './utils'
import axios from 'axios'

class Tokenizer {
  public source: string

  private char: string // 这个变量也可能为undefined，但这是为了避免麻烦而骗过TypeScript类型检查，所以只设置string
  private pos: number
  private advanced: number

  constructor(source: string) {
    this.source = source

    this.char = ''
    this.pos = -1
    this.advanced = 0
  }

  advance() {
    this.pos++
    this.char = this.source[this.pos]
  }

  cycle() {
    this.advanced = 0
  }

  getStartPos() {
    return this.pos - this.advanced
  }

  isBlank(str: string): boolean {
    return ['\t', '\r', '\n', ' '].includes(str)
  }

  skipBlanks(skipNewLine: boolean = true) {
    while (this.char && this.isBlank(this.char)) {
      if (this.char == '\n' && !skipNewLine) {
        break
      }
      this.advance()
    }
  }

  findParameter(name: string, parameters: tokens.Parameter[]): tokens.Parameter | undefined {
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];

      if (typeof param.tokenValue == 'object' && param.tokenValue.name.toLowerCase() == name.toLowerCase()) {
        return param
      }
    }

    return undefined
  }

  async importTypesFromUrl(url: string, items: string[] = [Symbol.asterisk]): Promise<tokens.Type[]> {
    let types: tokens.Type[] = []

    const res = await axios.get(url, {
      responseType: 'text'
    })

    if ([200, 201].includes(res.status)) {
      const imports = await new Tokenizer(res.data).tokenize()

      imports.tokenValue.tokens.forEach(token => {
        if (token instanceof tokens.Type && (items.includes(Symbol.asterisk) || items.includes(token.tokenValue.name))) {
          types.push(token)
        }
      });
    }
    else {
      throw new exceptions.AmlImportError(url, items)
    }

    return types
  }

  collectChar(): string {
    let str: string = ''

    while (this.char && !this.isBlank(this.char)) {
      str += this.char
      this.advance()
    }

    return str
  }

  colletTypeGenericity(): string[] {
    const genericities: string[] = []

    if (this.char == Symbol.lessThan) {
      let currentName: string = ''

      this.advance()
      while (this.char) {
        if (this.char == `${Symbol.comma}`) {
          genericities.push(currentName)
          currentName = ''
        }
        else if (this.char == `${Symbol.greaterThan}`) {
          genericities.push(currentName)
          this.advance()
          return genericities
        }
        else if (!this.isBlank(this.char)) {
          currentName += this.char
        }
        
        this.advance()
      }

      throw new exceptions.AmlSyntaxError(this.getStartPos())
    }

    return genericities
  }

  collectParameterValue(): JsonDataType.JsonPrimitive | JsonDataType.JsonArray | tokens.Type {
    let value: JsonDataType.JsonPrimitive | JsonDataType.JsonArray | tokens.Type | undefined = null

    if (this.char == Symbol.equalTo) {
      this.advance()
      this.skipBlanks()

      if (this.char == `${Symbol.openBrace}`) {
        value = new tokens.Type('', [], this.tokenizeParameter(), 0, TypeType.object)
      }
      else if (this.char == `${Symbol.openSquareBracket}`) {
        value = this.tokenizeArray() ?? null
      }
      else {
        if ([Symbol.doubleQuotation, Symbol.singleQuotation].includes(this.char)) {
          value = this.collectString(true)
        }
        else {
          value = this.collectNumber()
          if (!value) {
            value = this.collectString(false, [Symbol.closeBrace, Symbol.closeSquareBracket, '\n'])
            if ([DataType.null, DataType.none].includes(<DataType>value)) {
              value = null
            }
          }
        }
      }
    }

    return value
  }

  collectNumber(onlyIntegers: boolean = false, onlyPositiveNumber: boolean = false): number | undefined {
    if ('0123456789'.includes(this.char)) {
      let str: string = ''
      let isFloat: boolean = false
      let isNegativeNumber: boolean = false

      while (this.char && `0123456789${onlyIntegers ? '' : '.'}${onlyPositiveNumber ? '' : '-'}`.includes(this.char)) {
        if (this.char == Symbol.dot) {
          if (isFloat) {
            throw new exceptions.AmlValueError(str, this.getStartPos(), this.pos)
          }

          isFloat = true
        }
        if (this.char == Symbol.minus) {
          if (isNegativeNumber) {
            throw new exceptions.AmlValueError(str, this.getStartPos(), this.pos)
          }

          isNegativeNumber = true
        }

        str += this.char
        this.advance()
      }

      const num: number = Number(str)

      return num
    }

    return undefined
  }

  collectHint(): string {
    let hint: string = ''

    if (this.char == Symbol.colon) {
      this.advance()
      this.skipBlanks()

      if ([Symbol.doubleQuotation, Symbol.singleQuotation, '""'].includes(this.char)) {
        hint = this.collectString(true)
      }
      else {
        while (this.char && ![Symbol.equalTo, Symbol.closeBrace, Symbol.closeSquareBracket, '\n'].includes(this.char)) {
          hint += this.char
          this.advance()
        }
        hint = hint.trim()
      }
    }

    return hint
  }

  collectString(mustBeIncluded: boolean = false, unclosedSymbols?: string[]): string {
    let str: string = ''
    let closedSymbol: string

    // 使用1个不可能被匹配到的字符串来骗过TypeScript的类型检查
    if ([Symbol.doubleQuotation, Symbol.singleQuotation, '""'].includes(this.char)) {
      closedSymbol = this.char

      this.advance()
      while (this.char && this.char != `${closedSymbol}`) {
        str += this.char
        this.advance()
      }

      if (!this.char) {
        throw new exceptions.AmlSyntaxError(this.getStartPos())
      }

      this.advance()
    }
    else if (!mustBeIncluded) {
      while (this.char && !unclosedSymbols?.includes(this.char)) {
        str += this.char
        this.advance()
      }
      str = str.trim()
    }

    return str
  }

  tokenizeParameterDataTypeGenericityTargets(): tokens.ParameterDataType[] {
    if (this.char == Symbol.lessThan) {
      const genericityTargets: tokens.ParameterDataType[] = []
      let currentGenericityTargets: tokens.ParameterDataType[] = []
      let currentName: string = ''

      this.advance()
      while (this.char) {
        if (this.char == `${Symbol.comma}`) {
          genericityTargets.push(new tokens.ParameterDataType(currentName, currentGenericityTargets))
          currentName = ''
          currentGenericityTargets = []
        }
        else if (this.char == `${Symbol.lessThan}`) {
          currentGenericityTargets.push(...this.tokenizeParameterDataTypeGenericityTargets())
        }
        else if (this.char == `${Symbol.greaterThan}`) {
          genericityTargets.push(new tokens.ParameterDataType(currentName, currentGenericityTargets))
          break
        }
        else if (!this.isBlank(this.char)) {
          currentName += this.char
        }

        this.advance()
      }

      // console.log(JSON.stringify(genericityTargets, undefined, 2))

      return genericityTargets
    }

    return []
  }
  tokenizeParameterDataType(): tokens.ParameterDataType | undefined {
    if (!this.isBlank(this.char)) {
      let name: string = ''
      let genericityTargets: tokens.ParameterDataType[] = []

      while (this.char) {
        if (this.char == Symbol.lessThan) {
          genericityTargets.push(...this.tokenizeParameterDataTypeGenericityTargets())
          if (this.char == `${Symbol.greaterThan}`) {
            this.advance()
          }
        }
        else if (this.isBlank(this.char) || [Symbol.colon, Symbol.closeBrace, Symbol.closeSquareBracket, Symbol.colon, '::'].includes(this.char)) {
          break
        }
        else {
          name += this.char
          this.advance()
        }
      }

      return new tokens.ParameterDataType(name, genericityTargets)
    }

    return undefined
  }

  tokenizeArray(name: string = '', genericities: string[] = []): tokens.Type | undefined {
    if (this.char == Symbol.openSquareBracket) {
      this.advance()
      this.skipBlanks()
      const length: number = this.collectNumber(true) ?? 0

      this.skipBlanks()
      if (this.char == `${Symbol.closeSquareBracket}`) {
        this.advance()
        if (this.char == `${Symbol.openBrace}`) {
          const parameters: tokens.Parameter[] = this.tokenizeParameter()

          return new tokens.Type(name, genericities, [new tokens.Type('', [], parameters, 0, TypeType.object)], length, TypeType.singleTypeArray)
        }
        else if (!this.isBlank(this.char)) {
          return new tokens.Type(name, genericities, [new tokens.Parameter(<tokens.ParameterDataType>this.tokenizeParameterDataType(), '')], length, TypeType.singleTypeArray)
        }
      }
      else {
        const parameters: tokens.Parameter[] = []
        while (this.char && this.char != `${Symbol.closeSquareBracket}`) {
          const maybeParameter = this.tokenizeSingleParameter()
          if (maybeParameter) {
            parameters.push(maybeParameter)
          }
          else {
            this.advance()
          }
        }

        return new tokens.Type(name, genericities, parameters, length, TypeType.multiTypeArray)
      }
    }

    return undefined
  }

  tokenizeSingleParameter(): tokens.Parameter | undefined {
    if (!this.isBlank(this.char) && ![Symbol.openBrace, Symbol.openSquareBracket, Symbol.closeBrace, Symbol.closeSquareBracket, '[{}]'].includes(this.char)) {
      let type: tokens.ParameterDataType = new tokens.ParameterDataType(DataType.auto)
      let name: string = ''
      let hint: string = ''
      let value: JsonDataType.JsonPrimitive | JsonDataType.JsonArray | tokens.Type = null
      let option: ParameterOption = ParameterOption.undefined

      let maybeType: tokens.ParameterDataType = <tokens.ParameterDataType>this.tokenizeParameterDataType()

      this.skipBlanks()
      if (isInObject(maybeType.tokenValue.name, ParameterOption)) {
        option = <ParameterOption>maybeType.tokenValue.name
        maybeType = <tokens.ParameterDataType>this.tokenizeParameterDataType()
      }

      this.skipBlanks()
      if ([Symbol.colon, Symbol.closeBrace, Symbol.closeSquareBracket, Symbol.equalTo, '=='].includes(this.char)) {
        name = maybeType.tokenValue.name
      }
      else {
        type = maybeType
        while (this.char && !this.isBlank(this.char) && ![Symbol.colon, Symbol.closeBrace, Symbol.closeSquareBracket, Symbol.equalTo, '=='].includes(this.char)) {
          name += this.char
          this.advance()
        }
      }

      this.skipBlanks()
      hint = this.collectHint()
      this.skipBlanks()
      value = this.collectParameterValue()

      return new tokens.Parameter(type, name, hint, value, option)
    }

    return undefined
  }

  tokenizeParameter(): tokens.Parameter[] {
    const parameters: tokens.Parameter[] = []

    if (this.char == Symbol.openBrace) {
      this.advance()
      while (this.char && this.char != `${Symbol.closeBrace}`) {
        const maybeParameter = this.tokenizeSingleParameter()
        if (maybeParameter) {
          parameters.push(maybeParameter)
        }
        else {
          this.advance()
        }
      }
      this.advance()
    }

    return parameters
  }

  public async tokenize() {
    const root = new tokens.Root('Title')
    
    this.advance()
    while (this.char) {
      if (!this.isBlank(this.char)) {
        const identifier: string = this.collectChar()
        const id = identifier.toLowerCase()
        
        if (id == Keyword.type) {
          let name: string = ''

          this.skipBlanks()
          while (this.char && !this.isBlank(this.char) && ![Symbol.lessThan, Symbol.equalTo, '<='].includes(this.char)) {
            name += this.char
            this.advance()
          }

          const genericities: string[] = this.colletTypeGenericity()

          this.skipBlanks()
          if (this.char == Symbol.equalTo) {
            this.advance()
            this.skipBlanks()
            if (this.char == `${Symbol.openBrace}`) {
              const parameters: tokens.Parameter[] = this.tokenizeParameter()

              root.push(new tokens.Type(name, genericities, parameters, 0, TypeType.object))
            }
            else if (this.char == `${Symbol.openSquareBracket}`) {
              root.push(<tokens.Type>this.tokenizeArray(name, genericities))
            }
            else {
              throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
            }
          }
          else {
            throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
          }
        }

        else if (id == Keyword.enum) {
          let name: string = ''

          this.skipBlanks()
          while (this.char && !this.isBlank(this.char) && ![Symbol.lessThan, Symbol.equalTo, '::'].includes(this.char)) {
            name += this.char
            this.advance()
          }

          const genericities: string[] = this.colletTypeGenericity()

          this.skipBlanks()
          if (this.char == Symbol.equalTo) {
            this.advance()
            this.skipBlanks()
            if (this.char == `${Symbol.openBrace}`) {
              // TODO：标签化枚举
            }
            else {
              throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
            }
          }
          else {
            throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
          }
        }

        else if (isInObject(id, HttpRequestMethod)) {
          let name: string = ''
          let hint: string = ''

          this.skipBlanks()
          while (this.char && !this.isBlank(this.char) && ![Symbol.lessThan, Symbol.equalTo, Symbol.colon, '::'].includes(this.char)) {
            name += this.char
            this.advance()
          }

          this.skipBlanks()
          hint = this.collectHint()

          this.skipBlanks()
          if (this.char == Symbol.equalTo) {
            this.advance()
            this.skipBlanks()
            if (this.char == `${Symbol.openBrace}`) {
              const parameters: tokens.Parameter[] = this.tokenizeParameter()

              const url = this.findParameter('url', parameters)
              const query = this.findParameter('query', parameters)
              const body = this.findParameter('body', parameters)
              const response = this.findParameter('response', parameters)
              const notice = this.findParameter('notice', parameters)
              const header = this.findParameter('header', parameters)
              const cookie = this.findParameter('cookie', parameters)

              root.push(new tokens.Interface(name, hint, <HttpRequestMethod>id, url, response, query, body, header, cookie, notice))
            }
            else {
              throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
            }
          }
          else {
            throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
          }
        }

        else if (id == Keyword.from) {
          this.skipBlanks()
          const file = this.collectString(false, [' ', '\n'])
          const targets: string[] = []

          this.skipBlanks()
          const currentId = this.collectChar().toLowerCase()
          if (currentId == Keyword.import) {
            let currentTarget: string = ''

            this.skipBlanks()
            while (this.char) {
              if (this.char == Symbol.comma) {
                this.advance()
                targets.push(currentTarget)
                currentTarget = ''
              }
              else if (this.char == '\n') {
                targets.push(currentTarget)
                break
              }
              else if (!this.isBlank(this.char)) {
                currentTarget += this.char
              }

              this.advance()
            }
          }

          if (file.toLowerCase().startsWith('http')) {
            (await this.importTypesFromUrl(file, targets)).forEach(type => root.push(type))
          }
        }

        else if (id == Symbol.commet) {
          while (this.char && this.char != '\n') {
            this.advance()
          }
          this.advance()
        }
      }

      this.advance()
      this.cycle()
    }

    return root
  }
}

export default Tokenizer