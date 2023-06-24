import { ErrorMessage } from "./constants/EErrorMessage"

function constructErrorMessage(msg: string, startPos?: number, endPos?: number, ...other: string[]): string {
  return `${msg} ${other.join(' ')} ${startPos ?? '*'}:${endPos ?? '*'}`
}

class AmlSyntaxError extends Error {
  constructor(startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.syxtaxError, startPos, endPos))
  }
}

class AmlTypeError extends Error {
  constructor(type?: string, field?: string, startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.typeError, startPos, endPos, `${field ?? '*'}-${type ?? '*'}`))
  }
}

class AmlValueError extends Error {
  constructor(value?: string, startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.valueError, startPos, endPos, value ?? '*'))
  }
}

class AmlImportError extends Error {
  constructor(file?: string, imports?: string[], startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.importError, startPos, endPos, `${file ?? '*'}-${imports?.join(', ') ?? '*'}`))
  }
}

class AmlMissingField extends Error {
  constructor(field?: string, startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.missingField, startPos, endPos, field ?? '*'))
  }
}

class AmlMissingType extends Error {
  constructor(type?: string, startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.missingType, startPos, endPos, type ?? '*'))
  }
}

export {
  AmlSyntaxError,
  AmlTypeError,
  AmlMissingField,
  AmlMissingType,
  AmlValueError,
  AmlImportError,
  constructErrorMessage
}