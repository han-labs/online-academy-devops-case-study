// middlewares/google.oauth.js
import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../utils/db.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl =
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

const isGoogleOAuthConfigured = Boolean(googleClientId && googleClientSecret);

if (isGoogleOAuthConfigured) {
    passport.use(new GoogleStrategy(
        {
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: googleCallbackUrl
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile?.emails?.[0]?.value;
                const fullName = profile?.displayName || 'Google User';
                const avatar = profile?.photos?.[0]?.value || null;

                if (!email) {
                    return done(null, false, {
                        message: 'Unable to get email from Google account.'
                    });
                }

                let user = await db('users').where({ email }).first();

                if (!user) {
                    const randomPassword = crypto.randomBytes(16).toString('hex');
                    const passwordHash = await bcrypt.hash(randomPassword, 10);

                    const [created] = await db('users')
                        .insert({
                            full_name: fullName,
                            email,
                            password_hash: passwordHash,
                            role: 'student',
                            profile_picture_url: avatar,
                            auth_provider: 'google',
                            created_at: new Date()
                        })
                        .returning([
                            'id',
                            'full_name',
                            'email',
                            'role',
                            'auth_provider'
                        ]);

                    user = created;
                }

                return done(null, {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    role: user.role,
                    auth_provider: user.auth_provider || 'google'
                });
            } catch (err) {
                return done(err);
            }
        }
    ));
} else {
    console.warn(
        'Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.'
    );
}

export function mountGoogleAuth(app) {
    app.use(passport.initialize());

    app.get('/auth/google', (req, res, next) => {
        if (!isGoogleOAuthConfigured) {
            return res.status(503).send(
                'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
            );
        }

        return passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false
        })(req, res, next);
    });

    app.get(
        '/auth/google/callback',
        (req, res, next) => {
            if (!isGoogleOAuthConfigured) {
                return res.redirect('/account/login');
            }

            return passport.authenticate('google', {
                failureRedirect: '/account/login',
                session: false
            })(req, res, next);
        },
        (req, res) => {
            const u = req.user;

            req.session.user = {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                auth_provider: u.auth_provider || 'google',
                permission: u.role === 'admin' ? 1 : 0
            };

            return res.redirect('/');
        }
    );
}