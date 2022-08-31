
export const requireObject = (object: any, message: string = `must be object, was ${object}`) => {
    if (!object || typeof object !== 'object') throw new Error(message)
    return object;
}

export function requireString(value: any, message: string) {
    if (!!value && typeof value === 'string') {
        return value;
    }
    throw new Error(`requireString: ${message}`)
}

export const isString = (value: any) => (typeof value === 'string')

export function requireDefined(env: any, message = 'must be defined') {
    if (typeof env === 'undefined') {
        throw new Error(message)
    }
}
