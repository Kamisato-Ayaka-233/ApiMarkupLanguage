export function isInObject(value: any, enumeration: object): boolean {
  return Object.values(enumeration).includes(value)
}