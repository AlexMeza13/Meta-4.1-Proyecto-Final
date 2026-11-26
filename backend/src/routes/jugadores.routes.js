import express from 'express';
import {
    crearJugador,
    listarJugadores,
    obtenerJugador,
    actualizarJugador,
    eliminarJugador
} from '../controllers/jugadores.controller.js';
import {
    requerirRol,
    verificarCsrf,
    verificarToken,
    verificarTokenOpcional
} from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verificarTokenOpcional, listarJugadores);
router.get('/:id', verificarTokenOpcional, obtenerJugador);
router.post('/', verificarToken, verificarCsrf, requerirRol('admin'), crearJugador);
router.put('/:id', verificarToken, verificarCsrf, requerirRol('admin'), actualizarJugador);
router.delete('/:id', verificarToken, verificarCsrf, requerirRol('admin'), eliminarJugador);

export default router;