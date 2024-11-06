import { createPublicKey } from "crypto";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";
import { jwtVerify, errors, decodeJwt } from 'jose';

export class IdentifyOperation implements IUtf8Operation {

    private type: 'name' | 'jwt';

    private message: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== '~') {
            throw new Error('Unexpected command symbol.');
        }

        const type = command.substring(1);
        if (type.length > 0) {
            if (type === 'jwt' || type === 'name') {
                this.type = type;
            } else {
                throw new Error('Invalid identification type.');
            }
        } else {
            this.type = 'name';
        }

        this.message = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.name) {
            return;
        }

        if (this.type === 'name') {
            senderUser.name = this.message;
            return;
        }

        if (this.type === 'jwt') {
            const jwtConfig = manager.getConfig().jwt;
            if (!jwtConfig) {
                throw new Error('JWT config is not defined.');
            }

            const publicKey = createPublicKey(jwtConfig.publicKey);

            const jwt = decodeJwt(this.message);

            (async () => {
                try {
                    await jwtVerify(this.message, publicKey, {
                        issuer: jwtConfig.issuer,
                        audience: jwtConfig.audience
                    });
                } catch (error) {
                    if (error instanceof errors.JWTExpired && jwtConfig.ignoreExpiredTokens) {
                        // Ignore
                    } else {
                        console.error(`[Error] {Validating JWT} ${error}`);
                    }
                } finally {
                    senderUser.jwt = jwt;
                    senderUser.name = jwtConfig.nameClaim ? <string>jwt[jwtConfig.nameClaim] : jwt.sub;
                }
            })();

        }

    }

}