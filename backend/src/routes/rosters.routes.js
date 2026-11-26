import express from 'express';
import {
    crearRoster,
    listarRosters,
    obtenerRoster,
    actualizarRoster,
    eliminarRoster,
    asignarJugador,
    quitarJugador,
    obtenerJugadoresDeRoster,
    actualizarRolEnRoster
} from '../controllers/rosters.controller.js';
import {
    requerirAccesoRoster,
    requerirRol,
    verificarCsrf,
    verificarToken,
    verificarTokenOpcional
} from '../middleware/auth.middleware.js';
const router = express.Router();

router.get('/', verificarTokenOpcional, listarRosters);
router.get('/:id', verificarTokenOpcional, requerirAccesoRoster, obtenerRoster);
router.get('/:id/jugadores', verificarTokenOpcional, requerirAccesoRoster, obtenerJugadoresDeRoster);
router.post('/', verificarToken, verificarCsrf, requerirRol('admin'), crearRoster);
router.put('/:id', verificarToken, verificarCsrf, requerirRol('admin'), actualizarRoster);
router.delete('/:id', verificarToken, verificarCsrf, requerirRol('admin'), eliminarRoster);
router.post('/:id/jugadores', verificarToken, verificarCsrf, requerirRol('admin'), asignarJugador);
router.put('/:id/jugadores/:id_jugador', verificarToken, verificarCsrf, requerirRol('admin'), actualizarRolEnRoster);
router.delete('/:id/jugadores/:id_jugador', verificarToken, verificarCsrf, requerirRol('admin'), quitarJugador);

export default router;