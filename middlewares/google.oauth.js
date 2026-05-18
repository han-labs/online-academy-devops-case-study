// middlewares/google.oauth.js  (ESM)
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../utils/db.js';

//  Thông tin từ Google Cloud Console

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

// Cấu hình Strategy
passport.use(new GoogleStrategy(
    { clientID: GOOGLE_OAUTH.clientID, clientSecret: GOOGLE_OAUTH.clientSecret, callbackURL: GOOGLE_OAUTH.callbackURL },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile?.emails?.[0]?.value;
            const fullName = profile?.displayName || 'Google User';
            const avatar = profile?.photos?.[0]?.value || null;
            if (!email) return done(null, false, { message: 'Không lấy được email từ Google' });

            let user = await db('users').where({ email }).first();

            if (!user) {
                const randomPwd = (await import('crypto')).default.randomBytes(16).toString('hex');
                const password_hash = await (await import('bcrypt')).default.hash(randomPwd, 10);

                const [created] = await db('users')
                    .insert({
                        full_name: fullName,
                        email,
                        password_hash,
                        role: 'student',
                        profile_picture_url: avatar,
                        auth_provider: 'google',          // 👈 thêm dòng này
                        created_at: new Date()
                    })
                    .returning(['id', 'full_name', 'email', 'role', 'auth_provider']);
                user = created;
            }

            return done(null, {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                auth_provider: user.auth_provider || 'google' // 👈 đưa vào user object
            });
        } catch (err) { return done(err); }
    }
));

export function mountGoogleAuth(app) {
    app.use(passport.initialize());

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/account/login', session: false }),
        (req, res) => {
            const u = req.user;
            req.session.user = {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                auth_provider: u.auth_provider || 'google',      // 👈 lưu vào session
                permission: u.role === 'admin' ? 1 : 0
            };
            return res.redirect('/');
        }
    );
}