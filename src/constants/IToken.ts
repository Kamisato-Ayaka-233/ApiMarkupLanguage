import * as tokens from "src/token";
import { JsonPrimitive, JsonArray } from "./TJsonDataType";
import { HttpRequestMethod } from "./EHttpRequestMethod";
import { Dict } from "./TDict";

export interface Root {
  title: string, 
  tokens: tokens.Token
}

export interface Parameter {
  dataType: tokens.ParameterDataType,
  name: string, 
  hint: string, 
  defaultValue: JsonPrimitive | JsonArray | tokens.Type
}

export interface ParameterDataType {
  name: string, 
  genericityTargets: tokens.ParameterDataType[]
}

export interface Import {
  file: string, 
  items: string[]
}

export interface Enumeration {
  name: string, 
  items: Dict
}

export interface Type {
  name: string, 
  genericities: string[], 
  items: tokens.Parameter[]
}

export interface Interface {
  name: string, 
  hint: string, 
  method: HttpRequestMethod, 
  url: tokens.Parameter, 
  response: tokens.Parameter, 
  data?: tokens.Parameter, 
  query?: tokens.Parameter, 
  notice?: tokens.Parameter
}