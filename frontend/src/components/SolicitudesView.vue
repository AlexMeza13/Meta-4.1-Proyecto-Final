<script setup>
import { onMounted } from 'vue';

const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  solicitudesCuenta,
  actualizarDatos,
  cargarSolicitudes,
  aprobarSolicitudCuenta,
  rechazarSolicitudCuenta
} = app;

onMounted(() => actualizarDatos(cargarSolicitudes));
</script>

<template>
  <section class="data-card account-list-card">
    <div class="section-heading"><div><h1>Solicitudes de acceso</h1><p>{{ solicitudesCuenta.length }} pendientes de revisión</p></div></div>
    <div v-if="solicitudesCuenta.length" class="table-wrap">
      <table>
        <thead><tr><th>SOLICITANTE</th><th>ACCESO</th><th>TIPO</th><th>DATOS</th><th>FECHA</th><th>ACCIONES</th></tr></thead>
        <tbody>
          <tr v-for="solicitud in solicitudesCuenta" :key="solicitud.id">
            <td><strong>{{ solicitud.display_name || solicitud.nombre_real || solicitud.email }}</strong><br /><small>{{ solicitud.email }}</small></td>
            <td>{{ solicitud.auth_method === 'google' ? 'Google' : 'Correo y contraseña' }}</td>
            <td>{{ solicitud.rol === 'jugador' ? 'Jugador' : 'Entrenador' }}</td>
            <td>{{ solicitud.rol === 'jugador' ? `${solicitud.nickname} · ${solicitud.rol_jugador} · ${solicitud.pais}` : '—' }}</td>
            <td>{{ new Date(solicitud.createdAt).toLocaleDateString() }}</td>
            <td class="request-actions">
              <button class="row-action-button" @click="aprobarSolicitudCuenta(solicitud)">Aceptar</button>
              <button class="row-action-button row-action-danger" @click="rechazarSolicitudCuenta(solicitud)">Rechazar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state"><strong>No hay solicitudes pendientes</strong><p>Las nuevas solicitudes aparecerán aquí.</p></div>
  </section>
</template>
