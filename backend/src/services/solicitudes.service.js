import bcrypt from 'bcryptjs';
import db from '../../models/index.js';

const { SolicitudUsuario, Usuario, Jugador } = db;
const TIPOS_ROL_JUGADOR = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ErrorSolicitud extends Error {
    constructor(statusCode, mensaje) {
        super(mensaje);
        this.statusCode = statusCode;
    }
}

export const validarDatosSolicitud = (datos, metodoAutenticacion = datos.auth_method) => {
    const { email, display_name, password, rol, nickname, nombre_real, pais, rol_jugador } = datos;

    if (!['password', 'google'].includes(metodoAutenticacion)) {
        throw new ErrorSolicitud(400, 'Selecciona Google o correo y contraseña');
    }
    if (!['entrenador', 'jugador'].includes(rol)) {
        throw new ErrorSolicitud(400, 'El rol solicitado debe ser entrenador o jugador');
    }
    if (typeof email !== 'string' || !PATRON_CORREO.test(email.trim())) {
        throw new ErrorSolicitud(400, 'Ingresa un correo electrónico válido');
    }
    if (metodoAutenticacion === 'password' &&
        (typeof password !== 'string' || password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72)) {
        throw new ErrorSolicitud(400, 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes');
    }
    if (metodoAutenticacion === 'google' && password !== undefined && password !== '') {
        throw new ErrorSolicitud(400, 'Las solicitudes con Google no deben incluir contraseña');
    }

    if (rol === 'entrenador' && metodoAutenticacion === 'password' &&
        (typeof display_name !== 'string' || display_name.trim() === '' ||
        display_name.trim().length > 255)) {
        throw new ErrorSolicitud(400, 'Ingresa el nombre del entrenador');
    }
    if (rol === 'jugador') {
        if (typeof nickname !== 'string' || nickname.trim() === '' || nickname.trim().length > 255) {
            throw new ErrorSolicitud(400, 'Ingresa un nickname válido');
        }
        if (typeof nombre_real !== 'string' || nombre_real.trim() === '' || nombre_real.trim().length > 255) {
            throw new ErrorSolicitud(400, 'Ingresa el nombre real del jugador');
        }
        if (typeof pais !== 'string' || pais.trim() === '' || pais.trim().length > 255) {
            throw new ErrorSolicitud(400, 'Ingresa el país del jugador');
        }
        if (!TIPOS_ROL_JUGADOR.includes(rol_jugador)) {
            throw new ErrorSolicitud(400, 'Selecciona un rol de juego válido');
        }
    }

    return {
        email: email.trim().toLowerCase(),
        auth_method: metodoAutenticacion,
        password,
        display_name: typeof display_name === 'string' && display_name.trim()
            ? display_name.trim()
            : null,
        rol,
        nickname: rol === 'jugador' ? nickname.trim() : null,
        nombre_real: rol === 'jugador' ? nombre_real.trim() : null,
        pais: rol === 'jugador' ? pais.trim() : null,
        rol_jugador: rol === 'jugador' ? rol_jugador : null,
        avatar_url: null
    };
};

export const crearSolicitud = async (datos, metodoAutenticacion = datos.auth_method) => {
    const solicitudDatos = validarDatosSolicitud(datos, metodoAutenticacion);
    if (await Usuario.findOne({ where: { email: solicitudDatos.email } })) {
        throw new ErrorSolicitud(409, 'Ya existe una cuenta con ese correo');
    }
    if (await SolicitudUsuario.findOne({ where: { email: solicitudDatos.email } })) {
        throw new ErrorSolicitud(409, 'Ya existe una solicitud pendiente para ese correo');
    }
    if (solicitudDatos.nickname &&
        await Jugador.findOne({ where: { nickname: solicitudDatos.nickname } })) {
        throw new ErrorSolicitud(409, 'El nickname ya está en uso');
    }

    const password_hash = metodoAutenticacion === 'password'
        ? await bcrypt.hash(solicitudDatos.password, 12)
        : null;
    delete solicitudDatos.password;

    try {
        return await SolicitudUsuario.create({ ...solicitudDatos, password_hash });
    } catch (error) {
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw new ErrorSolicitud(409, 'Ya existe una solicitud con ese correo o nickname');
        }
        throw error;
    }
};

export const listarSolicitudes = () => SolicitudUsuario.findAll({
    attributes: [
        'id', 'email', 'auth_method', 'display_name', 'rol', 'nickname',
        'nombre_real', 'pais', 'rol_jugador', 'avatar_url', 'createdAt'
    ],
    order: [['createdAt', 'ASC']]
});

export const aprobarSolicitud = async (id) => {
    const idSolicitud = Number(id);
    if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
        throw new ErrorSolicitud(400, 'El ID de solicitud no es válido');
    }

    try {
        return await db.sequelize.transaction(async (transaccion) => {
            const solicitud = await SolicitudUsuario.findByPk(idSolicitud, {
                transaction: transaccion,
                lock: transaccion.LOCK.UPDATE
            });
            if (!solicitud) throw new ErrorSolicitud(404, 'Solicitud no encontrada');

            const cuentaExistente = await Usuario.findOne({
                where: { email: solicitud.email },
                transaction: transaccion,
                lock: transaccion.LOCK.UPDATE
            });
            if (cuentaExistente) {
                throw new ErrorSolicitud(409, 'Ya existe una cuenta con ese correo');
            }

            let id_jugador = null;
            if (solicitud.rol === 'jugador') {
                const nicknameExistente = await Jugador.findOne({
                    where: { nickname: solicitud.nickname },
                    transaction: transaccion,
                    lock: transaccion.LOCK.UPDATE
                });
                if (nicknameExistente) {
                    throw new ErrorSolicitud(409, 'El nickname ya está en uso; rechaza esta solicitud o libera el nickname');
                }

                const jugador = await Jugador.create({
                    nickname: solicitud.nickname,
                    nombre_real: solicitud.nombre_real,
                    pais: solicitud.pais,
                    rol: solicitud.rol_jugador,
                    estado: 'activo'
                }, { transaction: transaccion });
                id_jugador = jugador.id;
            }

            const usuario = await Usuario.create({
                email: solicitud.email,
                password_hash: solicitud.password_hash,
                auth_method: solicitud.auth_method,
                display_name: solicitud.display_name,
                avatar_url: solicitud.avatar_url,
                rol: solicitud.rol,
                id_jugador,
                estado: 'activo'
            }, { transaction: transaccion });

            await solicitud.destroy({ transaction: transaccion });
            return {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol,
                estado: usuario.estado,
                id_jugador: usuario.id_jugador,
                auth_method: usuario.auth_method,
                display_name: usuario.display_name,
                avatar_url: usuario.avatar_url
            };
        });
    } catch (error) {
        if (error instanceof ErrorSolicitud) throw error;
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw new ErrorSolicitud(409, 'El correo o nickname ya está en uso');
        }
        throw error;
    }
};

export const rechazarSolicitud = async (id) => {
    const idSolicitud = Number(id);
    if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
        throw new ErrorSolicitud(400, 'El ID de solicitud no es válido');
    }

    const eliminadas = await SolicitudUsuario.destroy({ where: { id: idSolicitud } });
    if (!eliminadas) throw new ErrorSolicitud(404, 'Solicitud no encontrada');
};
