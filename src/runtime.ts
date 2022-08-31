import {
    CompiledEnv, ENV_APP,
    ENV_KEYS,
    ENV_LOCS,
    ENV_STAGE,
    IAPP,
    ISECRETS_SALT,
    ISTAGE,
    EnvKey,
    ProcessEnv,
    SecretsRuntime, ENV_KEY
} from "./env";
import {isString, requireString} from "./util";

export const RUNTIME_DEFAULTS: SecretsRuntime = {
    processEnv: {
        SECRETS_SALT: undefined
    },
    cloudEnv: {
        STAGE: 'dev'
    },
    secretsEnv: {
        SECRETS_KEY: undefined
    },
    compiledEnv: {
        APP: undefined,
        APP_VERSION: undefined
    },
    lazyEnv: {}
}

export const RuntimeReader = {
    loc(key: string) {
        return requireString(ENV_LOCS[key], `ENV_LOCS[${key}]`)
    },
    tryIt(env: any, key: string, defaultValue?: string) {
        return isString(env) ? env : defaultValue
    },
    tryEnv(env: any, key: string, defaultValue?: string) {
        return !!env && (env[key]) || defaultValue
    },
    tryLoc(env: any, key: string, defaultValue?: string) {
        return this.tryEnv(env[this.loc(key)], key, defaultValue)
    },
    tryLazy(env: any, key: string, defaultValue?: string) {
        return this.tryEnv(env.lazyEnv, key, defaultValue)
    },
    unsafeAll(env: any, key: string, defaultValue?: string) {
        return this.tryAll(env, key, true, defaultValue)
    },
    tryAll(env: any, key: string, allowIt = false, defaultValue?: string) {
        return this.tryLoc(env, key) ||
            this.tryLazy(env, key) ||
            this.tryEnv(env, key) ||
            (allowIt && this.tryIt(env, key)) ||
            defaultValue
    },

    SECRETS_KEY(runtime: ENV_KEY, allowIt = false, defaultValue?: string): string {
        return this.tryAll(runtime, ENV_KEYS.SECRETS_KEY, allowIt, defaultValue)
    },

    SECRETS_SALT(runtime: EnvKey<ProcessEnv, ISECRETS_SALT>, allowIt = false, defaultValue?: string): string {
        return this.tryAll(runtime, ENV_KEYS.SECRETS_SALT, allowIt, defaultValue)
    },

    APP(runtime: ENV_APP, allowIt: boolean = false, defaultValue?: string) {
        return this.tryAll(runtime, ENV_KEYS.APP, allowIt, defaultValue)
    },

    STAGE(STAGE: ENV_STAGE, allowIt = false, defaultValue?: string) {
        return this.tryAll(STAGE, ENV_KEYS.STAGE, allowIt, defaultValue)
    }
}
