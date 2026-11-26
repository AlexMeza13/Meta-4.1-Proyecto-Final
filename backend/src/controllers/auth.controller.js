import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import db from '../../models/index.js';
import * as solicitudesService from '../services/solicitudes.service.js';

const COOKIE_MAX_AGE = 60 * 60 * 1000;
const jwtOptions = {
    issuer: 'eaSports-api',
    audience: 'eaSports-client'
};

const cookieOptions = (httpOnly) => ({
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
});

const googleStateCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/'
};

const crearSesion = async (res, usuario) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const token = jwt.sign(
        { csrfToken },
        process.env.JWT_SECRET,
        { ...jwtOptions, subject: String(usuario.id), expiresIn: '1h' }
    );

    res.cookie('jwt_token', token, cookieOptions(true));
    res.cookie('csrf_token', csrfToken, cookieOptions(false));

    const jugador = usuario.rol === 'jugador' && usuario.id_jugador
        ? await db.Jugador.findByPk(usuario.id_jugador, { attributes: ['nickname'] })
        : null;
    return {
        usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            id_jugador: usuario.id_jugador,
            avatar_url: usuario.avatar_url,
            display_name: usuario.rol === 'jugador'
                ? jugador?.nickname
                : usuario.display_name
        },
        csrfToken
    };
};

export const iniciarLoginGoogle = (req, res) => {
    res.clearCookie('google_request_intent', googleStateCookieOptions);
    const state = crypto.randomBytes(32).toString('hex');
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: ['openid', 'email', 'profile'],
        state
    });

    res.cookie('google_oauth_state', state, googleStateCookieOptions);
    res.redirect(url);
};

export const iniciarSolicitudGoogle = async (req, res) => {
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    res.clearCookie('google_oauth_state', googleStateCookieOptions);
    const requestData = solicitudesService.validarDatosSolicitud({
        ...req.body,
        email: 'google-pending@example.invalid',
        auth_method: 'google'
    }, 'google');
    delete requestData.email;

    const state = crypto.randomBytes(32).toString('hex');
    const intent = jwt.sign(
        { ...requestData, state },
        process.env.JWT_SECRET,
        {
            issuer: 'eaSports-api',
            audience: 'eaSports-google-registration',
            expiresIn: '10m'
        }
    );
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: ['openid', 'email', 'profile'],
        state
    });

    res.cookie('google_request_intent', intent, googleStateCookieOptions);
    res.json({ url });
};

const completarSolicitudGoogle = async (req, res) => {
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const redirectFrontend = (status) => {
        const url = new URL('/', frontendUrl);
        url.searchParams.set('request', status);
        return res.redirect(url.toString());
    };
    const intentToken = req.cookies.google_request_intent;
    res.clearCookie('google_request_intent', googleStateCookieOptions);

    let intent;
    try {
        intent = jwt.verify(intentToken, process.env.JWT_SECRET, {
            issuer: 'eaSports-api',
            audience: 'eaSports-google-registration'
        });
    } catch {
        return redirectFrontend(req.query.error === 'access_denied' ? 'cancelled' : 'invalid_state');
    }

    if (req.query.error === 'access_denied') {
        return redirectFrontend('cancelled');
    }
    if (typeof req.query.code !== 'string' || typeof req.query.state !== 'string' ||
        typeof intent.state !== 'string') {
        return redirectFrontend('invalid_response');
    }

    const receivedState = Buffer.from(req.query.state);
    const expectedState = Buffer.from(intent.state);
    if (receivedState.length !== expectedState.length ||
        !crypto.timingSafeEqual(receivedState, expectedState)) {
        return redirectFrontend('invalid_state');
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        if (data.verified_email !== true || typeof data.email !== 'string' ||
            typeof data.name !== 'string' || data.name.trim() === '') {
            return redirectFrontend('unverified_email');
        }

        const solicitud = await solicitudesService.crearSolicitud({
            ...intent,
            email: data.email,
            display_name: data.name.trim().slice(0, 255)
        }, 'google');
        const avatarUrl = typeof data.picture === 'string' &&
            URL.canParse(data.picture) &&
            new URL(data.picture).protocol === 'https:'
            ? data.picture
            : null;
        await solicitud.update({ avatar_url: avatarUrl });
        return redirectFrontend('success');
    } catch (callbackError) {
        if (callbackError.statusCode === 409) {
            return redirectFrontend('already_exists');
        }
        console.error('Error al crear solicitud con Google:', callbackError);
        return redirectFrontend('failed');
    }
};

export const completarLoginGoogle = async (req, res) => {
    if (req.cookies.google_request_intent) {
        return completarSolicitudGoogle(req, res);
    }

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const redirectFrontend = (status) => {
        const url = new URL('/', frontendUrl);
        url.searchParams.set('google', status);
        return res.redirect(url.toString());
    };
    const { code, state, error } = req.query;
    const stateCookie = req.cookies.google_oauth_state;
    res.clearCookie('google_oauth_state', googleStateCookieOptions);

    if (error === 'access_denied') {
        return redirectFrontend('cancelled');
    }

    if (typeof code !== 'string' || typeof state !== 'string' ||
        typeof stateCookie !== 'string') {
        return redirectFrontend('invalid_response');
    }

    const stateBuffer = Buffer.from(state);
    const stateCookieBuffer = Buffer.from(stateCookie);
    if (stateBuffer.length !== stateCookieBuffer.length ||
        !crypto.timingSafeEqual(stateBuffer, stateCookieBuffer)) {
        return redirectFrontend('invalid_state');
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();
        if (data.verified_email !== true || typeof data.email !== 'string') {
            return redirectFrontend('unverified_email');
        }

        const usuario = await db.Usuario.findOne({
            where: { email: data.email.trim().toLowerCase() }
        });
        if (!usuario || usuario.estado !== 'activo' ||
            (usuario.rol === 'jugador' && !usuario.id_jugador)) {
            return redirectFrontend('account_not_available');
        }
        if (usuario.auth_method !== 'google') {
            return redirectFrontend('google_not_enabled');
        }

        const avatarUrl = typeof data.picture === 'string' &&
            URL.canParse(data.picture) &&
            new URL(data.picture).protocol === 'https:'
            ? data.picture
            : null;
        const displayName = typeof data.name === 'string' && data.name.trim()
            ? data.name.trim().slice(0, 255)
            : usuario.display_name;
        await usuario.update({ avatar_url: avatarUrl, display_name: displayName });
        await crearSesion(res, usuario);
        return redirectFrontend('success');
    } catch (callbackError) {
        console.error('Error al completar el inicio de sesión con Google:', callbackError);
        return redirectFrontend('failed');
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' ||
        email.trim() === '' || password === '') {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'La contraseña excede el limite permitido' });
    }

    const usuario = await db.Usuario.findOne({
        where: { email: email.trim().toLowerCase() }
    });
    const credencialesValidas = usuario &&
        usuario.auth_method === 'password' &&
        typeof usuario.password_hash === 'string' &&
        await bcrypt.compare(password, usuario.password_hash);

    if (!credencialesValidas || usuario.estado !== 'activo') {
        return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    if (usuario.rol === 'jugador' && !usuario.id_jugador) {
        return res.status(403).json({ error: 'La cuenta jugador necesita un perfil vinculado' });
    }

    res.json({
        mensaje: 'Inicio de sesion exitoso',
        ...await crearSesion(res, usuario)
    });
};

export const logout = (req, res) => {
    const options = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    };
    res.clearCookie('jwt_token', { ...options, httpOnly: true });
    res.clearCookie('csrf_token', options);
    res.status(200).json({ mensaje: 'Sesion cerrada exitosamente' });
};

export const verificarSesion = (req, res) => {
    res.json({ autenticado: true, usuario: req.usuario });
};
