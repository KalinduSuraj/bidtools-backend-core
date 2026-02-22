import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

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

    async validate(payload: any) {
        // Cognito access tokens have token_use = 'access'
        // The payload contains sub, email, cognito:groups, custom:role, etc.
        return {
            userId: payload.sub,
            email: payload.email,
            username: payload.username || payload['cognito:username'],
            'cognito:groups': payload['cognito:groups'] || [],
            'custom:role': payload['custom:role'] || '',
        };
    }
}
