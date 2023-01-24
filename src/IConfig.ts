interface IConfig {

    port: number;

    acceptedOrigins: string[];

    acceptedProtocols: string[];

    publicRealmCount: number;

    entityPath: string;

    logIncoming: boolean;

    logOutgoing: boolean;

}