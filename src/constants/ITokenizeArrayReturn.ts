import * as tokens from 'src/token'
import { TypeType } from './ETypeType'
import { JsonArray } from './TJsonDataType'

export interface TokenizeArrayReturn {
  items: (tokens.Type | tokens.Parameter)[] | JsonArray,
  length: number,
  type: TypeType.multiTypeArray | TypeType.singleTypeArray
}