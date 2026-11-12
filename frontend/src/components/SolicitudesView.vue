<script setup>
import { computed, onMounted, ref } from 'vue';

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

const dialogoRechazar = ref(null);
const solicitudARechazar = ref(null);
const busquedaSolicitud = ref('');
const rolSolicitud = ref('');
const accesoSolicitud = ref('');
const solicitudesFiltradas = computed(() => {
  const busqueda = busquedaSolicitud.value.trim().toLocaleLowerCase();
  return solicitudesCuenta.value.filter((solicitud) =>
    (!busqueda || [solicitud.display_name, solicitud.nombre_real, solicitud.email, solicitud.nickname]
      .some((dato) => dato?.toLocaleLowerCase().includes(busqueda))) &&
    (!rolSolicitud.value || solicitud.rol === rolSolicitud.value) &&
    (!accesoSolicitud.value || solicitud.auth_method === accesoSolicitud.value)
  );
});

onMounted(() => actualizarDatos(cargarSolicitudes));

function confirmarRechazo(solicitud) {
  solicitudARechazar.value = solicitud;
  dialogoRechazar.value.showModal();
}

async function rechazarSolicitudConfirmada() {
  const solicitud = solicitudARechazar.value;
  dialogoRechazar.value.close();
  if (solicitud) await rechazarSolicitudCuenta(solicitud);
}
</script>

<template>
  <section class="data-card account-list-card">
    <div class="section-heading"><div><h1>Solicitudes de acceso</h1><p>{{ solicitudesFiltradas.length }} de {{ solicitudesCuenta.length }} pendientes de revisión</p></div></div>
    <div v-if="solicitudesCuenta.length" class="list-filters" aria-label="Filtros de solicitudes">
      <label class="list-filter-search">Buscar
        <input v-model="busquedaSolicitud" type="search" placeholder="Nombre, correo o nickname" />
      </label>
      <label>Tipo de cuenta
        <select v-model="rolSolicitud">
          <option value="">Todos</option>
          <option value="jugador">Jugador</option>
          <option value="entrenador">Entrenador</option>
        </select>
      </label>
      <label>Acceso
        <select v-model="accesoSolicitud">
          <option value="">Todos</option>
          <option value="google">Google</option>
          <option value="password">Correo y contraseña</option>
        </select>
      </label>
    </div>
    <div v-if="solicitudesFiltradas.length" class="table-wrap">
      <table>
        <thead><tr><th>SOLICITANTE</th><th>ACCESO</th><th>TIPO</th><th>DATOS</th><th>FECHA</th><th>ACCIONES</th></tr></thead>
        <tbody>
          <tr v-for="solicitud in solicitudesFiltradas" :key="solicitud.id">
            <td><strong>{{ solicitud.display_name || solicitud.nombre_real || solicitud.email }}</strong><br /><small>{{ solicitud.email }}</small></td>
            <td>{{ solicitud.auth_method === 'google' ? 'Google' : 'Correo y contraseña' }}</td>
            <td>{{ solicitud.rol === 'jugador' ? 'Jugador' : 'Entrenador' }}</td>
            <td>{{ solicitud.rol === 'jugador' ? `${solicitud.nickname} · ${solicitud.rol_jugador} · ${solicitud.pais}` : '—' }}</td>
            <td>{{ new Date(solicitud.createdAt).toLocaleDateString() }}</td>
            <td class="request-actions">
              <button class="row-action-button" @click="aprobarSolicitudCuenta(solicitud)">Aceptar</button>
              <button class="row-action-button row-action-danger" @click="confirmarRechazo(solicitud)">Rechazar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="solicitudesCuenta.length" class="empty-state"><strong>No hay solicitudes que coincidan</strong><p>Prueba cambiando o limpiando los filtros.</p></div>
    <div v-else class="empty-state"><strong>No hay solicitudes pendientes</strong><p>Las nuevas solicitudes aparecerán aquí.</p></div>
  </section>
  <dialog
    ref="dialogoRechazar"
    class="confirmation-dialog"
    aria-labelledby="rechazar-solicitud-title"
    aria-describedby="rechazar-solicitud-message"
    @click.self="dialogoRechazar.close()"
    @close="solicitudARechazar = null"
  >
    <div class="confirmation-content">
      <h2 id="rechazar-solicitud-title">Rechazar solicitud</h2>
      <p id="rechazar-solicitud-message">Se eliminará la solicitud de {{ solicitudARechazar?.email }}. Esta acción no se puede deshacer.</p>
      <div class="dialog-actions">
        <button type="button" class="secondary-button" autofocus @click="dialogoRechazar.close()">Cancelar</button>
        <button type="button" class="primary-button confirmation-danger" @click="rechazarSolicitudConfirmada">Rechazar solicitud</button>
      </div>
    </div>
  </dialog>
</template>
