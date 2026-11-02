import express from 'express';
import {
    actualizarUsuario,
    crearUsuario,
    listarUsuarios
} from '../controllers/usuarios.controller.js';
import {
    aprobarSolicitud,
    listarSolicitudes,
    rechazarSolicitud
} from '../controllers/solicitudes.controller.js';
import { requerirRol } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requerirRol('admin'));
router.get('/solicitudes', listarSolicitudes);
router.post('/solicitudes/:id/aprobar', aprobarSolicitud);
router.delete('/solicitudes/:id', rechazarSolicitud);
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);

export default router;
