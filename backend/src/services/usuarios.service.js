import bcrypt from 'bcryptjs';
import db from '../../models/index.js';

const { Usuario } = db;
const ROLES = ['admin', 'entrenador', 'jugador'];
const ESTADOS = ['activo', 'inactivo'];
const ROLES_JUGADOR = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

export class UsuarioServiceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const exponerUsuario = ({ id, email, rol, estado, id_jugador, auth_method, display_name, avatar_url, createdAt, updatedAt }, jugador = null) => ({
    id,
    email,
    rol,
    estado,
    id_jugador,
    auth_method,
    display_name,
    avatar_url,
    jugador: jugador ? { id: jugador.id, nickname: jugador.nickname } : null,
    createdAt,
    updatedAt
});

const normalizarDatosJugador = (jugador) => {
    if (jugador === null || typeof jugador !== 'object' || Array.isArray(jugador)) {
        throw new UsuarioServiceError(400, 'Debes enviar los datos del perfil de jugador');
    }
    for (const campo of ['nickname', 'nombre_real', 'pais']) {
        if (typeof jugador[campo] !== 'string' || jugador[campo].trim() === '' ||
            jugador[campo].trim().length > 255) {
            throw new UsuarioServiceError(400, `El campo "${campo}" del jugador es obligatorio y no debe superar 255 caracteres`);
        }
    }
    if (typeof jugador.rol !== 'string' || !ROLES_JUGADOR.includes(jugador.rol)) {
        throw new UsuarioServiceError(400, `El rol del jugador debe ser uno de estos valores: ${ROLES_JUGADOR.join(', ')}`);
    }
    return {
        nickname: jugador.nickname.trim(),
        nombre_real: jugador.nombre_real.trim(),
        pais: jugador.pais.trim(),
        rol: jugador.rol
    };
};

export const listarUsuarios = async () => {
    const usuarios = await Usuario.findAll({
        attributes: ['id', 'email', 'rol', 'estado', 'id_jugador', 'auth_method', 'display_name', 'avatar_url', 'createdAt', 'updatedAt'],
        order: [['email', 'ASC']]
    });
    const jugadorIds = usuarios.map((usuario) => usuario.id_jugador).filter(Boolean);
    const jugadores = jugadorIds.length
        ? await db.Jugador.findAll({
            where: { id: jugadorIds },
            attributes: ['id', 'nickname']
        })
        : [];
    const jugadoresPorId = new Map(jugadores.map((jugador) => [jugador.id, jugador]));

    return usuarios.map((usuario) => exponerUsuario(
        usuario,
        jugadoresPorId.get(usuario.id_jugador)
    ));
};

export const crearUsuario = async ({
    email,
    password,
    auth_method = 'password',
    rol = 'entrenador',
    id_jugador,
    display_name,
    jugador
}) => {
    if (typeof email !== 'string' || email.trim() === '' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new UsuarioServiceError(400, 'Ingresa un correo electronico valido');
    }
    if (!['password', 'google'].includes(auth_method)) {
        throw new UsuarioServiceError(400, 'El método de autenticación debe ser password o google');
    }
    if (auth_method === 'password' &&
        (typeof password !== 'string' || password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72)) {
        throw new UsuarioServiceError(400, 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes');
    }
    if (auth_method === 'google' && password !== undefined && password !== '') {
        throw new UsuarioServiceError(400, 'Las cuentas Google no deben incluir una contraseña local');
    }
    if (!ROLES.includes(rol)) {
        throw new UsuarioServiceError(400, 'El rol debe ser admin, entrenador o jugador');
    }
    if (rol !== 'jugador' && auth_method === 'password' &&
        (typeof display_name !== 'string' || display_name.trim() === '' ||
        display_name.trim().length > 255)) {
        throw new UsuarioServiceError(400, 'Ingresa el nombre de la persona (máximo 255 caracteres)');
    }
    if (display_name !== undefined && display_name !== null &&
        (typeof display_name !== 'string' || display_name.trim().length > 255)) {
        throw new UsuarioServiceError(400, 'El nombre no puede superar 255 caracteres');
    }
    if (id_jugador !== undefined) {
        throw new UsuarioServiceError(400, 'Ya no se puede vincular un perfil existente al crear una cuenta');
    }
    let datosPerfilJugador = null;
    if (rol === 'jugador') {
        datosPerfilJugador = normalizarDatosJugador(jugador);
    } else if (jugador !== undefined) {
        throw new UsuarioServiceError(400, 'Los datos del jugador solo se envían cuando el rol de la cuenta es jugador');
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        return await db.sequelize.transaction(async (transaction) => {
            const existente = await Usuario.findOne({
                where: { email: normalizedEmail },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (existente) {
                throw new UsuarioServiceError(409, 'Ya existe una cuenta con ese correo');
            }

            let perfilJugador = null;
            if (rol === 'jugador') {
                const nickname = datosPerfilJugador.nickname;
                const jugadorExistente = await db.Jugador.findOne({
                    where: { nickname },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (jugadorExistente) {
                    throw new UsuarioServiceError(409, `El nickname "${nickname}" ya está registrado. Elige otro.`);
                }

                perfilJugador = await db.Jugador.create({
                    nickname,
                    nombre_real: datosPerfilJugador.nombre_real,
                    pais: datosPerfilJugador.pais,
                    rol: datosPerfilJugador.rol,
                    estado: 'activo'
                }, { transaction });
            }

            const password_hash = auth_method === 'password'
                ? await bcrypt.hash(password, 12)
                : null;
            const usuario = await Usuario.create({
                email: normalizedEmail,
                password_hash,
                auth_method,
                display_name: typeof display_name === 'string' && display_name.trim()
                    ? display_name.trim()
                    : null,
                id_jugador: perfilJugador?.id ?? null,
                rol,
                estado: 'activo'
            }, { transaction });
            return exponerUsuario(usuario, perfilJugador);
        });
    } catch (error) {
        if (error instanceof UsuarioServiceError) throw error;
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            const nicknameDuplicado = error.errors?.some(({ path }) => path === 'nickname') ||
                Object.prototype.hasOwnProperty.call(error.fields || {}, 'nickname');
            if (nicknameDuplicado) {
                throw new UsuarioServiceError(409, `El nickname "${datosPerfilJugador.nickname}" ya está registrado. Elige otro.`);
            }
            throw new UsuarioServiceError(409, 'Ya existe una cuenta con ese correo');
        }
        throw error;
    }
};

export const actualizarUsuario = async (id, cambios, idAdmin) => {
    const usuarioId = Number(id);
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        throw new UsuarioServiceError(400, 'El ID debe ser un entero positivo');
    }

    const { rol, estado, display_name, jugador } = cambios;
    if (Object.prototype.hasOwnProperty.call(cambios, 'id_jugador')) {
        throw new UsuarioServiceError(400, 'El perfil del jugador no se puede asignar o cambiar desde la edición de cuentas');
    }
    if (rol !== undefined && !ROLES.includes(rol)) {
        throw new UsuarioServiceError(400, 'El rol debe ser admin, entrenador o jugador');
    }
    if (estado !== undefined && !ESTADOS.includes(estado)) {
        throw new UsuarioServiceError(400, 'El estado debe ser activo o inactivo');
    }
    if (display_name !== undefined && display_name !== null &&
        (typeof display_name !== 'string' || display_name.trim().length > 255)) {
        throw new UsuarioServiceError(400, 'El nombre no puede superar 255 caracteres');
    }
    if (jugador !== undefined && rol !== 'jugador') {
        throw new UsuarioServiceError(400, 'Los datos del jugador solo se envían al cambiar una cuenta a jugador');
    }
    const datosPerfilJugador = jugador === undefined ? null : normalizarDatosJugador(jugador);
    if (rol === undefined && estado === undefined && display_name === undefined) {
        throw new UsuarioServiceError(400, 'Indica el nombre, rol o estado que deseas actualizar');
    }
    try {
        return await db.sequelize.transaction(async (transaction) => {
            const usuario = await Usuario.findByPk(usuarioId, { transaction });
            if (!usuario) throw new UsuarioServiceError(404, 'Usuario no encontrado');

            const nuevoRol = rol ?? usuario.rol;
            const nuevoEstado = estado ?? usuario.estado;
            if (usuario.rol === 'admin' && nuevoRol !== 'admin') {
                throw new UsuarioServiceError(409, 'El rol de una cuenta admin no se puede cambiar');
            }
            if (usuario.rol !== 'admin' && nuevoRol === 'admin') {
                throw new UsuarioServiceError(409, 'No se puede cambiar una cuenta existente al rol admin');
            }
            if (nuevoRol === 'jugador' && usuario.rol !== 'jugador' && !datosPerfilJugador) {
                throw new UsuarioServiceError(400, 'Debes completar los datos del perfil para cambiar la cuenta a jugador');
            }
            if (datosPerfilJugador && usuario.rol === 'jugador') {
                throw new UsuarioServiceError(400, 'El perfil de una cuenta jugador no se puede reemplazar desde la edición de cuentas');
            }
            let perfilJugadorCreado = null;
            if (nuevoRol === 'jugador' && usuario.rol !== 'jugador') {
                const jugadorExistente = await db.Jugador.findOne({
                    where: { nickname: datosPerfilJugador.nickname },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (jugadorExistente) {
                    throw new UsuarioServiceError(409, `El nickname "${datosPerfilJugador.nickname}" ya está registrado. Elige otro.`);
                }
                perfilJugadorCreado = await db.Jugador.create({
                    ...datosPerfilJugador,
                    estado: 'activo'
                }, { transaction });
            }
            const nuevoJugadorId = nuevoRol === 'jugador'
                ? (perfilJugadorCreado?.id ?? usuario.id_jugador)
                : null;
            if (usuarioId === Number(idAdmin) &&
                (nuevoRol !== usuario.rol ||
                nuevoEstado !== usuario.estado ||
                (nuevoJugadorId ?? null) !== (usuario.id_jugador ?? null))) {
                throw new UsuarioServiceError(409, 'No puedes cambiar tu propio rol o estado');
            }
            if (nuevoRol === 'jugador' && (!Number.isSafeInteger(nuevoJugadorId) || nuevoJugadorId <= 0)) {
                throw new UsuarioServiceError(409, 'La cuenta de jugador no tiene un perfil asociado');
            }
            if (nuevoJugadorId) {
                const jugador = await db.Jugador.findByPk(nuevoJugadorId, { transaction });
                if (!jugador) throw new UsuarioServiceError(409, 'El perfil asociado a esta cuenta ya no existe');
            }
            const pierdeAccesoAdmin = usuario.rol === 'admin' &&
                usuario.estado === 'activo' &&
                (nuevoRol !== 'admin' || nuevoEstado !== 'activo');

            if (pierdeAccesoAdmin) {
                const adminsActivos = await Usuario.findAll({
                    where: { rol: 'admin', estado: 'activo' },
                    attributes: ['id'],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (adminsActivos.length <= 1) {
                    throw new UsuarioServiceError(409, 'Debe permanecer al menos un admin activo');
                }
            }

            await usuario.update({
                rol: nuevoRol,
                estado: nuevoEstado,
                id_jugador: nuevoJugadorId,
                ...(display_name !== undefined && {
                    display_name: typeof display_name === 'string' && display_name.trim()
                        ? display_name.trim()
                        : null
                })
            }, { transaction });
            const jugador = nuevoJugadorId
                ? await db.Jugador.findByPk(nuevoJugadorId, { transaction })
                : null;
            return exponerUsuario(usuario, jugador);
        });
    } catch (error) {
        if (error instanceof UsuarioServiceError) throw error;
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            const nicknameDuplicado = error.errors?.some(({ path }) => path === 'nickname') ||
                Object.prototype.hasOwnProperty.call(error.fields || {}, 'nickname');
            if (nicknameDuplicado && datosPerfilJugador) {
                throw new UsuarioServiceError(409, `El nickname "${datosPerfilJugador.nickname}" ya está registrado. Elige otro.`);
            }
            throw new UsuarioServiceError(409, 'Ese perfil ya tiene una cuenta vinculada');
        }
        throw error;
    }
};
