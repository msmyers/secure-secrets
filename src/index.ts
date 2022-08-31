//       https://github.com/xbaun/secure-string#readme
import {AES256, algorithm, SecureString} from "@xbaun/secure-string"
import {saltFor} from "./salt";
import {requireObject, requireString} from "./util";
import {AnyEnv, ENV_APP, ENV_KEYS, ENV_SECRETS_SALT, ENV_STAGE, ISECRETS_SALT, SecretsEnv, SecretsRuntime} from "./env";
import {RuntimeReader} from "./runtime";

const ALGS = {AES256,}
export const DEFAULT_ALG = ALGS.AES256

const toAlg = (alg: string | algorithm): algorithm =>
    ((alg as algorithm).algorithm) ? (alg as algorithm) : requireObject((ALGS as any)[alg as string], `ALGS[${alg}]`)

export type Lazy<T> = T | Promise<T>

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export function from(env: any, name: string, alg: string | algorithm = DEFAULT_ALG): SecretsKey {
    return new SecretsKey(SecretVal.from(env, name, toAlg(alg)))
}

export function withAccessor(accessor: string | undefined, salt: string) {
    return (!!accessor) ? (saltFor(salt, accessor)) : salt
}

//region export class SecretVal
export class SecretVal {

    public readonly name: string;
    public readonly value: Lazy<SecureString>;

    constructor(env: any, name: string, alg: algorithm = DEFAULT_ALG) {
        this.name = name
        // @ts-ignore
        this.value = Promise.resolve(env)
            .then((env) => env[name])
            .then((value) => new SecureString(value, alg))
    }

    async decrypt(password: string, salt: string): Promise<string> {
        return (await this.value)
            .decrypt(password, saltFor(salt, this.name))
    }

    static from(env: any, name: string, alg: algorithm = DEFAULT_ALG) {
        return new SecretVal(env[name], name, alg)
    }

    static take(env: any, name: string, alg: algorithm = DEFAULT_ALG) {
        try {
            return SecretVal.from(env, name, alg)
        } finally {
            delete env[name]
        }
    }
}

//endregion

export class ExposedKey {

    constructor(
        public readonly runtime: SecretsRuntime,
        private readonly secretsKey: SecretsKey) {

    }

}

// export class SecretsKey {
//
//     private key: Lazy<SecretsKeyHolder>;
//
//     constructor(
//         readonly app: string,
//         readonly stage: string,
//         readonly encryptedKey: Lazy<string>,
//         alg?: algorithm) {
//
//         this.key = new SecretsKeyHolder(
//             new SecretVal(
//                 {secretsKey: encryptedKey}, 'secretsKey', alg)
//         )
//     }
//
//     public read(salt: string, val: SecretVal) {
//         return this.key.readEnvs(this.app, this.stage, salt, val)
//     }
//
//     static ofPlain(secretsKey: string, alg: algorithm = DEFAULT_ALG) {
//         return new SecretsKey(
//             "app",
//             "stage",
//             SecureString.encrypt(secretsKey, "secret", "salt", alg),
//             alg,
//         )
//     }
// }

//region export class SecretsKey(key, alg)
export class SecretsKey {

    constructor(public readonly key: SecretVal) {
    }

    async reader(APP: ENV_APP, STAGE: ENV_STAGE, SECRETS_SALT: ENV_SECRETS_SALT) {
        const key = await this.leverageKey(APP, STAGE, SECRETS_SALT, true)
        const salt = SecretsKey.secretsKeySalt(SECRETS_SALT, true)
        return (value: SecretVal) => value.decrypt(key, salt)
    }

    async readRuntime(runtime: SecretsRuntime, value: SecretVal) {
        return this.readEnvs(
            runtime.compiledEnv,
            runtime.cloudEnv,
            runtime.processEnv,
            value)
    }

    async readEnv(env: AnyEnv, value: SecretVal) {
        return this.readEnvs(
            RuntimeReader.tryAll(env, ENV_KEYS.APP, false),
            RuntimeReader.tryAll(env, ENV_KEYS.STAGE, false),
            RuntimeReader.tryAll(env, ENV_KEYS.SECRETS_SALT, false),
            value)
    }

    // for the purposes of the wallet
    // pass =   '{CloudEnv.SECRETS_KEY}'
    // salt =   "{ProcessEnv.SECRETS_SALT}:PROPERTY_NAME"
    async readEnvs(APP: ENV_APP, STAGE: ENV_STAGE, SECRETS_SALT: ISECRETS_SALT, value: SecretVal) {
        return (await this.reader(APP, STAGE, SECRETS_SALT))(value)
    }

    // for the purposes of the wallet
    // pass =   '{CloudEnv.APP}:${CloudEnv.STAGE}'
    // salt =   "{ProcessEnv.SECRETS_SALT}:PROPERTY_NAME"
    protected leverageKey(APP: ENV_APP, STAGE: ENV_STAGE, SECRETS_SALT: ENV_SECRETS_SALT, allowIt = false) {
        return this.key.decrypt(
            SecretsKey.secretsKeyPassword(APP, STAGE, allowIt),
            SecretsKey.secretsKeySalt(SECRETS_SALT, allowIt))
    }

    //region static
    static fromRuntime(env: SecretsRuntime, alg: string | algorithm = DEFAULT_ALG): SecretsKey {
        return this.fromEnv(env.secretsEnv, alg)
    }

    static fromEnv(env: SecretsEnv, alg: string | algorithm = DEFAULT_ALG): SecretsKey {
        return from(
            env,
            env.SECRETS_KEY,
            alg);
    }

    // static fromRaw(env: SecretsRuntime, rawKey: string) {
    //
    // }

    static fromEncryptedSecretsKey(secretsKey: string, alg: string | algorithm = DEFAULT_ALG): SecretsKey {
        return from(
            {[ENV_KEYS.SECRETS_KEY]: secretsKey},
            ENV_KEYS.SECRETS_KEY,
            alg);
    }

    static secretsKeySalt(SECRETS_SALT: ENV_SECRETS_SALT, allowIt = false, defaultValue?: string) {
        return requireString(
            RuntimeReader.SECRETS_SALT(SECRETS_SALT, allowIt, defaultValue),
            'secretsKeySalt'
        )
    }

    static secretsKeyPassword(APP: ENV_APP, STAGE: ENV_STAGE, allowIt = false, defaultValue?: string) {
        return requireString(
            `${RuntimeReader.APP(APP, allowIt)}:${RuntimeReader.STAGE(STAGE, allowIt)}` || defaultValue,
            `secretsKeyPassword`
        )
    }

    //endregion
}

// export class MockSecretsKey extends SecretsKey {
//
//     private env: SecretsEnv;
//
//     constructor(public exposedKey: SecretVal, env?: SecretsEnv) {
//         super(exposedKey);
//         this.env = env;
//     }
//
//     public revealKey(APP: string, STAGE: string, SECRETS_SALT: string) {
//         return this.exposedKey.read(
//             SecretsKey.secretsKeyPassword(APP),
//             SecretsKey.secretsKeySalt())
//     }
// }

//endregion
