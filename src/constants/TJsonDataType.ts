export type JsonPrimitive = string | number | boolean | null
export type JsonObject = Record<string, JsonPrimitive>
export type JsonDataType = JsonPrimitive | JsonObject | JsonArray
export interface JsonArray extends Array<JsonDataType> {}