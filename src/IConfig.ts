interface IConfig {

    port: number;

    acceptedOrigins: string[];

    acceptedProtocols: string[];

    publicRealmCount: number;

    entityPath: string;

    fsePath?: string;

    fseMaxSize?: number;

    logIncoming: boolean;

    logOutgoing: boolean;

    jwt?: {
        issuer: string;
        audience: string;
        publicKey: string;
        nameClaim?: string;
        rolesClaim?: string;
        ignoreExpiredTokens?: boolean;
        adminRoleName?: string;
    }

}