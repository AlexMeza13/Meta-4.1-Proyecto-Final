<script setup>
import { computed, onMounted, ref } from 'vue';

const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  sesion,
  jugadores,
  roles,
  abrirDialogoJugador,
  eliminarJugador,
  actualizarDatos,
  cargarJugadores
} = app;

const dialogoEliminar = ref(null);
const jugadorAEliminar = ref(null);
const busquedaJugador = ref('');
const rolJugador = ref('');
const paisJugador = ref('');
const estadoJugador = ref('');
const paises = computed(() => [...new Set(jugadores.value.map((jugador) => jugador.pais).filter(Boolean))].sort());
const jugadoresFiltrados = computed(() => {
  const busqueda = busquedaJugador.value.trim().toLocaleLowerCase();
  return jugadores.value.filter((jugador) => {
    const coincideBusqueda = !busqueda ||
      [jugador.nickname, jugador.nombre_real].some((dato) => dato?.toLocaleLowerCase().includes(busqueda));
    return coincideBusqueda &&
      (!rolJugador.value || jugador.rol === rolJugador.value) &&
      (!paisJugador.value || jugador.pais === paisJugador.value) &&
      (!estadoJugador.value || jugador.estado === estadoJugador.value);
  });
});

onMounted(() => actualizarDatos(cargarJugadores));

function confirmarEliminar(jugador) {
  jugadorAEliminar.value = jugador;
  dialogoEliminar.value.showModal();
}

async function eliminarJugadorConfirmado() {
  const jugador = jugadorAEliminar.value;
  dialogoEliminar.value.close();
  if (jugador) await eliminarJugador(jugador);
}
</script>

<template>
  <div v-if="sesion.rol === 'admin'" class="page-heading player-admin-heading">
    <button class="primary-button" @click="abrirDialogoJugador()">＋ Añadir jugador</button>
  </div>
  <div v-else class="page-heading player-directory-heading">
    <div>
      <h1>Jugadores</h1>
      <p class="page-subtitle">Perfiles disponibles para integrar a tus rosters.</p>
    </div>
  </div>
  <section class="data-card">
    <div class="section-heading">
      <div>
        <h2>{{ sesion.rol === 'admin' ? 'Todos los jugadores' : 'Perfiles disponibles' }}</h2>
        <p>{{ sesion.rol === 'admin' ? 'Perfiles del equipo.' : 'Selecciona uno al administrar la alineación de un roster.' }}</p>
      </div>
    </div>
    <div v-if="jugadores.length" class="list-filters" aria-label="Filtros de jugadores">
      <label class="list-filter-search">Buscar
        <input v-model="busquedaJugador" type="search" placeholder="Nickname o nombre" />
      </label>
      <label>Rol
        <select v-model="rolJugador">
          <option value="">Todos</option>
          <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
        </select>
      </label>
      <label>País
        <select v-model="paisJugador">
          <option value="">Todos</option>
          <option v-for="pais in paises" :key="pais" :value="pais">{{ pais }}</option>
        </select>
      </label>
      <label>Estado
        <select v-model="estadoJugador">
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>
      <span class="list-filter-count" aria-live="polite">{{ jugadoresFiltrados.length }} de {{ jugadores.length }}</span>
    </div>
    <div v-if="jugadoresFiltrados.length" class="table-wrap">
      <table>
        <thead><tr><th>JUGADOR</th><th>ROL</th><th>PAÍS</th><th>ESTADO</th><th v-if="sesion.rol === 'admin'"></th></tr></thead>
        <tbody>
          <tr v-for="jugador in jugadoresFiltrados" :key="jugador.id">
            <td><div class="player-cell"><span class="player-avatar">{{ jugador.nickname?.slice(0, 2).toUpperCase() }}</span><span><strong>{{ jugador.nickname }}</strong><small>{{ jugador.nombre_real }}</small></span></div></td>
            <td><span class="role-pill">{{ jugador.rol }}</span></td>
            <td>{{ jugador.pais }}</td>
            <td><span class="state-pill" :class="jugador.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'"><i></i>{{ jugador.estado }}</span></td>
            <td v-if="sesion.rol === 'admin'">
              <div class="row-actions">
                <button class="row-action-button" aria-label="Editar jugador" title="Editar" @click="abrirDialogoJugador(jugador)">Editar</button>
                <button class="row-action-button row-action-danger" :aria-label="`Eliminar jugador ${jugador.nickname}`" title="Eliminar" @click="confirmarEliminar(jugador)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="jugadores.length" class="empty-state"><strong>No hay jugadores que coincidan</strong><p>Prueba cambiando o limpiando los filtros.</p></div>
    <div v-else class="empty-state">
      <strong>Aún no hay jugadores</strong>
      <p>{{ sesion.rol === 'admin' ? 'Agrega el primer perfil para comenzar.' : 'Pide al administrador que registre los perfiles de jugadores.' }}</p>
      <button v-if="sesion.rol === 'admin'" class="text-button" @click="abrirDialogoJugador()">＋ Añadir jugador</button>
    </div>
  </section>
  <dialog
    ref="dialogoEliminar"
    class="confirmation-dialog"
    aria-labelledby="eliminar-jugador-title"
    aria-describedby="eliminar-jugador-message"
    @click.self="dialogoEliminar.close()"
    @close="jugadorAEliminar = null"
  >
    <div class="confirmation-content">
      <h2 id="eliminar-jugador-title">Eliminar jugador</h2>
      <p id="eliminar-jugador-message">Se eliminará el perfil de {{ jugadorAEliminar?.nickname }}. Esta acción no se puede deshacer.</p>
      <div class="dialog-actions">
        <button type="button" class="secondary-button" autofocus @click="dialogoEliminar.close()">Cancelar</button>
        <button type="button" class="primary-button confirmation-danger" @click="eliminarJugadorConfirmado">Eliminar jugador</button>
      </div>
    </div>
  </dialog>
</template>
