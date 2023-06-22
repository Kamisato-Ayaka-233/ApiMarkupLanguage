import { ErrorMessage } from "./constants/EErrorMessage"

function constructErrorMessage(msg: string, startPos?: number, endPos?: number, ...other: string[]): string {
  return `${msg} ${other.join(' ')} ${startPos ?? '*'}:${endPos ?? '*'}`
}

class AmlSyntaxError extends Error {
  constructor(startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.syxtaxError, startPos, endPos))
  }
}

class AmlMissingField extends Error {
  constructor(field?: string, startPos?: number, endPos?: number) {
    super(constructErrorMessage(ErrorMessage.missingField, startPos, endPos, field ?? '*'))
  }
}

export {
  AmlSyntaxError,
  AmlMissingField,
  constructErrorMessage
}