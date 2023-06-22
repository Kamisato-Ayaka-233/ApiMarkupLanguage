import * as tokens from './token'
import { Keyword } from './constants/EKeyword'
import { Dict } from './constants/TDict'
import { Symbol } from './constants/ESymbol'
import { DataType } from './constants/EDataType'
import * as JsonDataType from './constants/TJsonDataType'
import * as exceptions from './exception'
import { HttpRequestMethod } from './constants/EHttpRequestMethod'

class Tokenizer {
  public source: string

  private char: string // 这个变量也可能为undefined，但这是为了避免麻烦而骗过TypeScript类型检查，所以只设置string
  private pos: number
  private advanced: number
  private caughtError: boolean
  private types: tokens.Type[]

  constructor(source: string) {
    this.source = source

    this.char = ''
    this.pos = -1
    this.advanced = 0
    this.caughtError = false
    this.types = []
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
    let value: JsonDataType.JsonPrimitive | JsonDataType.JsonArray | tokens.Type = null

    if (this.char == Symbol.equalTo) {
      this.advance()
      this.skipBlanks()

      if (this.char == `${Symbol.openBrace}`) {
        value = new tokens.Type('', [], this.tokenizeParameter())
      }
      else if (this.char == `${Symbol.openSquareBracket}`) {

      }
      else {
        value = this.collectString(false, ['}'])
      }
    }

    return value
  }

  collectNumber(): number {
    let str: string = ''

    while (this.char && "0123456789.".includes(str)) {
      str += this.char
      this.advance()
    }

    const num: number = Number(str)

    return num
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
        while (this.char && !this.isBlank(this.char) && ![Symbol.equalTo, Symbol.openBrace, Symbol.closeBrace].includes(this.char)) {
          hint += this.char
          this.advance()
        }
      }

      hint = hint.trim()
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
      while (this.char && !this.isBlank(this.char) && !unclosedSymbols?.includes(this.char)) {
        str += this.char
        this.advance()
      }
    }

    return str
  }

  tokenizeParameter(): tokens.Parameter[] {
    const parameters: tokens.Parameter[] = []

    if (this.char == Symbol.openBrace) {
      let currentType: string = ''
      let currentName: string = ''
      let currentHint: string = ''
      let currentValue: JsonDataType.JsonPrimitive | JsonDataType.JsonArray | tokens.Token = null

      this.advance()
      this.skipBlanks()
      while (this.char) {
        if (this.char == `${Symbol.closeBrace}`) {
          this.advance()
          break
        }
        else if (!this.isBlank(this.char)) {
          let identifier: string = ''
          while (this.char && !this.isBlank(this.char) && ![Symbol.colon, Symbol.closeBrace, Symbol.equalTo].includes(this.char)) {
            identifier += this.char
            this.advance()
          }

          this.skipBlanks()
          if ([Symbol.colon, Symbol.closeBrace, Symbol.equalTo].includes(this.char)) {
            currentType = DataType.auto
            currentName = identifier
            currentHint = this.collectHint()
          }
          else {
            currentType = identifier
            while (this.char && !this.isBlank(this.char) && ![Symbol.colon, Symbol.closeBrace, Symbol.equalTo].includes(this.char)) {
              currentName += this.char
              this.advance()
            }
            this.skipBlanks()
            currentHint = this.collectHint()
          }

          this.skipBlanks(false)

          if (this.char == `${Symbol.equalTo}`) {
            currentValue = this.collectParameterValue()
          }

          parameters.push(new tokens.Parameter(currentType, currentName, currentHint, currentValue))
          currentType = ''
          currentName = ''
          currentHint = '' 
          currentValue = null
        }
        else {
          this.advance()
        }
      }
    }

    return parameters
  }

  tokenize() {
    const root = new tokens.Root('Title')
    
    this.advance()
    while (this.char) {
      if (!this.isBlank(this.char)) {
        const identifier: string = this.collectChar()
        const id = identifier.toLowerCase()
        
        if (id == Keyword.type) {
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
              const parameters: tokens.Parameter[] = this.tokenizeParameter()

              root.push(new tokens.Type(name, genericities, parameters))
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

        else if (id == Keyword.get) {
          let name: string = ''
          let hint: string = ''

          this.skipBlanks()
          while (this.char && !this.isBlank(this.char) && ![Symbol.lessThan, Symbol.equalTo, Symbol.colon, '::'].includes(this.char)) {
            name += this.char
            this.advance()
          }

          this.skipBlanks()
          if (this.char == Symbol.colon) {
            hint = this.collectHint()
          }

          this.skipBlanks()
          if (this.char == Symbol.equalTo) {
            this.advance()
            this.skipBlanks()
            if (this.char == `${Symbol.openBrace}`) {
              const parameters: tokens.Parameter[] = this.tokenizeParameter()

              const url = this.findParameter('url', parameters)
              const query = this.findParameter('query', parameters)
              const data = this.findParameter('data', parameters)
              const response = this.findParameter('response', parameters)
              const notice = this.findParameter('notice', parameters)

              if (!url) {
                throw new exceptions.AmlMissingField('url', this.getStartPos(), this.pos)
              }
              else if (!response) {
                throw new exceptions.AmlMissingField('response', this.getStartPos(), this.pos)
              }

              root.push(new tokens.Interface(name, hint, HttpRequestMethod.get, url, response, data, query, notice))
            }
            else {
              throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
            }
          }
          else {
            throw new exceptions.AmlSyntaxError(this.getStartPos(), this.pos)
          }
        }
      }

      this.advance()
      this.cycle()
    }

    return root
  }
}

export default Tokenizer