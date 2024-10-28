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

}