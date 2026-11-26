<script setup>
import { computed, onMounted, ref } from 'vue';
import { sesionActiva } from '../router/index.js';
import { api } from '../services/api.js';
import { useNotifications } from '../composables/useNotifications.js';

const { mostrarAviso } = useNotifications();
const rosters = ref([]);
const rosterSeleccionado = ref(null);
const jugadoresRoster = ref([]);
const nombreJugador = computed(() =>
  jugadoresRoster.value.find((jugador) => jugador.id === sesionActiva.value?.id_jugador)?.nickname ||
  sesionActiva.value?.display_name ||
  sesionActiva.value?.email?.split('@')[0] ||
  'Jugador'
);
const rolJugador = ref('');
const asignacionJugador = ref('');
const jugadoresRosterFiltrados = computed(() => jugadoresRoster.value.filter((jugador) =>
  (!rolJugador.value || jugador.rol === rolJugador.value) &&
  (!asignacionJugador.value || jugador.rol_en_roster === asignacionJugador.value)
));

onMounted(async () => {
  try {
    rosters.value = await api.listRosters();
    if (rosters.value.length) {
      await cargarDetalleRoster(rosters.value[0].id);
    }
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
});

async function cargarDetalleRoster(id) {
  const [roster, integrantes] = await Promise.all([
    api.getRoster(id),
    api.getRosterPlayers(id)
  ]);
  rosterSeleccionado.value = roster;
  jugadoresRoster.value = integrantes;
}

async function abrirRoster(id) {
  try {
    await cargarDetalleRoster(id);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}
</script>

<template>
  <div class="player-page-heading">
    <h1>Bienvenido, {{ nombreJugador }}</h1>
    <p>Esta es la organización de tu roster.</p>
  </div>
  <section v-if="rosters.length" class="data-card player-group-card">
    <nav v-if="rosters.length > 1" class="player-roster-tabs" aria-label="Seleccionar roster">
      <button v-for="(roster, indice) in rosters" :key="roster.id" type="button" class="player-roster-tab" :class="{ activo: rosterSeleccionado?.id === roster.id }" :aria-pressed="rosterSeleccionado?.id === roster.id" @click="abrirRoster(roster.id)">
        <span class="roster-symbol">R{{ indice + 1 }}</span>
        <span class="player-roster-tab-label"><strong>{{ roster.nombre }}</strong><small>{{ roster.tipo }} · Temporada {{ roster.temporada }}</small></span>
      </button>
    </nav>
    <template v-if="rosterSeleccionado">
      <div class="player-group-heading">
        <h2>{{ rosterSeleccionado.nombre }}</h2>
        <p>{{ rosterSeleccionado.tipo }} · Temporada {{ rosterSeleccionado.temporada }}</p>
      </div>
      <div v-if="jugadoresRoster.length" class="list-filters" aria-label="Filtros de la alineación">
        <label>Posición
          <select v-model="rolJugador">
            <option value="">Todas</option>
            <option v-for="rol in [...new Set(jugadoresRoster.map((jugador) => jugador.rol))]" :key="rol" :value="rol">{{ rol }}</option>
          </select>
        </label>
        <label>Asignación
          <select v-model="asignacionJugador">
            <option value="">Todas</option>
            <option value="Titular">Titular</option>
            <option value="Suplente">Suplente</option>
          </select>
        </label>
        <span class="list-filter-count" aria-live="polite">{{ jugadoresRosterFiltrados.length }} de {{ jugadoresRoster.length }}</span>
      </div>
      <div v-if="jugadoresRosterFiltrados.length" class="table-wrap">
        <table class="player-lineup-table">
          <thead><tr><th>JUGADOR</th><th>POSICIÓN</th><th>ASIGNACIÓN</th></tr></thead>
          <tbody>
            <tr v-for="jugador in jugadoresRosterFiltrados" :key="jugador.id">
              <td><div class="player-cell"><span class="player-avatar">{{ jugador.nickname?.slice(0, 2).toUpperCase() }}</span><strong>{{ jugador.nickname }}</strong></div></td>
              <td><span class="role-pill">{{ jugador.rol }}</span></td>
              <td><span class="lineup-status">{{ jugador.rol_en_roster }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="jugadoresRoster.length" class="empty-lineup player-empty-lineup">No hay jugadores que coincidan con los filtros.</div>
      <div v-else class="empty-lineup player-empty-lineup">Este grupo aún no tiene jugadores asignados.</div>
    </template>
  </section>
  <section v-else class="data-card player-empty-card">
    <div class="empty-state"><strong>Aún no tienes un roster asignado</strong><p>Pide al administrador que vincule tu perfil a un roster.</p></div>
  </section>
</template>
