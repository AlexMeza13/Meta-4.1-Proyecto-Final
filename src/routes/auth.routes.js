import express from 'express';
import {
    completarLoginGoogle,
    iniciarLoginGoogle,
    iniciarSolicitudGoogle,
    login,
    logout,
    verificarSesion
} from '../controllers/auth.controller.js';
import { crearSolicitud } from '../controllers/solicitudes.controller.js';
import { verificarToken, verificarCsrf } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/google', iniciarLoginGoogle);
router.post('/google/solicitud', iniciarSolicitudGoogle);
router.get('/google/callback', completarLoginGoogle);
router.post('/solicitudes', crearSolicitud);
router.post('/login', login);
router.post('/logout', verificarToken, verificarCsrf, logout);
router.get('/verify', verificarToken, verificarSesion);

export default router;
