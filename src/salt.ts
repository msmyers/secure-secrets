import urlcat from "urlcat/src";

export type ISaltFor = (salt: string, propertyName: string) => string

export function calcSalt(template: string, env: any) {
    return urlcat(template, env)
}

export const SALT_TEMPLATE = `:$salt::$propertyName`
export const saltFor = (salt: string, propertyName: string) =>
    `${salt}:${propertyName}`
// export const saltFor = (salt: string, propertyName: string) =>
//     calcSalt(SALT_TEMPLATE, {salt, propertyName})
