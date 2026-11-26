import * as servicioSolicitudes from '../services/solicitudes.service.js';

export const crearSolicitud = async (solicitudHttp, respuestaHttp) => {
    if (solicitudHttp.body === null || typeof solicitudHttp.body !== 'object' || Array.isArray(solicitudHttp.body)) {
        return respuestaHttp.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    const solicitud = await servicioSolicitudes.crearSolicitud(solicitudHttp.body, 'password');
    respuestaHttp.status(201).json({
        mensaje: 'Solicitud enviada para revisión del administrador',
        email: solicitud.email
    });
};

export const listarSolicitudes = async (solicitudHttp, respuestaHttp) => {
    respuestaHttp.status(200).json(await servicioSolicitudes.listarSolicitudes());
};

export const aprobarSolicitud = async (solicitudHttp, respuestaHttp) => {
    const usuario = await servicioSolicitudes.aprobarSolicitud(solicitudHttp.params.id);
    respuestaHttp.status(201).json({ mensaje: 'Solicitud aprobada', usuario });
};

export const rechazarSolicitud = async (solicitudHttp, respuestaHttp) => {
    await servicioSolicitudes.rechazarSolicitud(solicitudHttp.params.id);
    respuestaHttp.status(204).end();
};
