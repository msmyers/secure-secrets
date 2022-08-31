export type ProcessEnv = { [key: string]: any } & {
    SECRETS_SALT: string // store this in ProcessEnv
}

export type CloudEnv = { [key: string]: any } & {
    STAGE: string
}

// bundled within codebase
export type CompiledEnv = { [key: string]: any } & {
    APP: string
    APP_VERSION: string
}

// Where your encrypted secrets are stored.
export type SecretsEnv = { [key: string]: any } & {
    SECRETS_KEY: string
}
////

const APP = 'APP'
const STAGE = 'STAGE'
const SECRETS_KEY = 'SECRETS_KEY'
const SECRETS_SALT = 'SECRETS_SALT'

export const ENV_KEYS = {
    SECRETS_SALT,
    SECRETS_KEY,
    STAGE,
    APP
}

export const ENV_LOCS = {
    APP: 'compiledEnv',
    SECRETS_SALT: 'processEnv',
    STAGE: 'cloudEnv',
}

////

export type IAPP = { [APP]: string } | string
export type ISECRETS_SALT = ProcessEnv | { [SECRETS_SALT]: string } | string
export type ISECRETS_KEY = SecretsEnv | { [SECRETS_KEY]: string } | string
export type ISTAGE = CloudEnv | { [STAGE]: string } | string

export type ENV_APP = EnvKey<CompiledEnv, IAPP>
export type ENV_KEY = EnvKey<SecretsEnv, ISECRETS_KEY>
export type ENV_SECRETS_SALT = EnvKey<ProcessEnv, ISECRETS_SALT>
export type ENV_STAGE = EnvKey<CloudEnv, ISTAGE>

////

export type EnvKey<TScope, TKey> = SecretsRuntime | TScope | TKey | ILazyEnv<TKey> | string

export type AnyEnv = { [key: string]: any }
export type FlatEnv = ProcessEnv & CloudEnv & CompiledEnv & SecretsEnv & AnyEnv
export type LazyEnv = FlatEnv & AnyEnv

export type ILazyEnv<T> = { lazyEnv: LazyEnv | T }
export type ISecretsEnv = { secretsEnv: SecretsEnv }
export type ICompiledEnv = { compiledEnv: CompiledEnv }
export type ICloudEnv = { cloudEnv: CloudEnv }
export type IProcessEnv = { processEnv: ProcessEnv }

export type SecretsRuntime =
    AnyEnv
    & IProcessEnv
    & ICloudEnv
    & ICompiledEnv
    & ISecretsEnv
    & ILazyEnv<AnyEnv>
