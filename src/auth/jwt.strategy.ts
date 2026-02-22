import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { JwtPayload, AuthenticatedUser, UserRole } from '../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly configService: ConfigService) {
        const cognitoRegion =
            configService.get<string>('COGNITO_REGION') ||
            configService.get<string>('AWS_REGION') ||
            'us-east-1';
        const userPoolId = configService.get<string>('COGNITO_USER_POOL_ID')!;
        const issuer = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}`;

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['RS256'],
            issuer,
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
                jwksUri: `${issuer}/.well-known/jwks.json`,
            }),
        });
    }

    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        const groups = (payload['cognito:groups'] || []) as UserRole[];
        return {
            userId: payload.sub,
            email: payload.email || '',
            username: payload.username || payload['cognito:username'] || '',
            groups,
            role: groups.length > 0 ? groups[0] : '',
        };
    }
}
