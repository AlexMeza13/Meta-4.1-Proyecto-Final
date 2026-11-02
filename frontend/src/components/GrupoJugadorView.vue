<script setup>
import { onMounted } from 'vue';

const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  rosters,
  rosterSeleccionado,
  jugadoresRoster,
  nombreJugador,
  actualizarDatos,
  cargarRosters,
  cargarDetalleRoster
} = app;

onMounted(() => actualizarDatos(async () => {
  await cargarRosters();
  if (rosters.value.length) {
    await cargarDetalleRoster(rosters.value[0].id);
  } else {
    rosterSeleccionado.value = null;
    jugadoresRoster.value = [];
  }
}));

function abrirRoster(id) {
  actualizarDatos(() => cargarDetalleRoster(id));
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
      <div v-if="jugadoresRoster.length" class="table-wrap">
        <table class="player-lineup-table">
          <thead><tr><th>JUGADOR</th><th>POSICIÓN</th><th>ASIGNACIÓN</th></tr></thead>
          <tbody>
            <tr v-for="jugador in jugadoresRoster" :key="jugador.id">
              <td><div class="player-cell"><span class="player-avatar">{{ jugador.nickname?.slice(0, 2).toUpperCase() }}</span><strong>{{ jugador.nickname }}</strong></div></td>
              <td><span class="role-pill">{{ jugador.rol }}</span></td>
              <td><span class="lineup-status">{{ jugador.rol_en_roster }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-lineup player-empty-lineup">Este grupo aún no tiene jugadores asignados.</div>
    </template>
  </section>
  <section v-else class="data-card player-empty-card">
    <div class="empty-state"><strong>Aún no tienes un roster asignado</strong><p>Pide al administrador que vincule tu perfil a un roster.</p></div>
  </section>
</template>
