import db from '../../models/index.js';

const { Jugador } = db;

class JugadorServiceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const errorNicknameDuplicado = (nickname) =>
    new JugadorServiceError(409, `El nickname "${nickname}" ya está registrado. Elige otro.`);

export const crearJugador = async (datos) => {
    const { nickname, nombre_real, pais, rol, estado } = datos;
    const jugadorExistente = await Jugador.findOne({ where: { nickname } });

    if (jugadorExistente) {
        throw errorNicknameDuplicado(nickname);
    }

    try {
        return await Jugador.create({ nickname, nombre_real, pais, rol, estado });
    } catch (error) {
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw errorNicknameDuplicado(nickname);
        }
        throw error;
    }
};

export const listarJugadores = () => Jugador.findAll();

export const listarJugadoresPublicos = () => Jugador.findAll({
    attributes: ['id', 'nickname', 'pais', 'rol']
});

export const obtenerJugador = async (id) => {
    const jugador = await Jugador.findByPk(id);
    if (!jugador) throw new JugadorServiceError(404, 'Jugador no encontrado');

    return jugador;
};

export const obtenerJugadorPublico = async (id) => {
    const jugador = await Jugador.findByPk(id, {
        attributes: ['id', 'nickname', 'pais', 'rol']
    });
    if (!jugador) throw new JugadorServiceError(404, 'Jugador no encontrado');

    return jugador;
};

export const actualizarJugador = async (id, datos) => {
    const jugador = await obtenerJugador(id);
    const { nickname, nombre_real, pais, rol, estado } = datos;

    if (nickname !== undefined) {
        const jugadorConNickname = await Jugador.findOne({ where: { nickname } });
        if (jugadorConNickname && jugadorConNickname.id !== jugador.id) {
            throw errorNicknameDuplicado(nickname);
        }
    }

    try {
        await jugador.update({ nickname, nombre_real, pais, rol, estado });
    } catch (error) {
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw errorNicknameDuplicado(nickname);
        }
        throw error;
    }
    return jugador;
};

export const eliminarJugador = async (id) => {
    const cuentaVinculada = await db.Usuario.findOne({ where: { id_jugador: id } });
    if (cuentaVinculada) {
        throw new JugadorServiceError(409, 'No se puede eliminar un perfil vinculado a una cuenta');
    }

    const eliminados = await Jugador.destroy({ where: { id } });
    if (!eliminados) throw new JugadorServiceError(404, 'Jugador no encontrado');
};
