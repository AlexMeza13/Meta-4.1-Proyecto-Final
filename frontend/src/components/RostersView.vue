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
  procesandoAlineacion,
  formularioAsignacion,
  jugadoresDisponiblesParaRoster,
  actualizarDatos,
  cargarJugadores,
  cargarRosters,
  abrirDialogoRoster,
  abrirRoster,
  eliminarRoster,
  cambiarRolJugadorEnRoster,
  quitarJugadorDeRoster,
  asignarJugadorARoster
} = app;

onMounted(() => {
  actualizarDatos(cargarRosters);
  actualizarDatos(cargarJugadores);
});
</script>

<template>
  <div class="page-heading">
    <div><h1>Rosters</h1></div>
    <button class="primary-button" @click="abrirDialogoRoster()">＋ Crear roster</button>
  </div>
  <div class="roster-layout">
    <section class="data-card roster-list-card">
      <div class="section-heading">
        <div><h2>Rosters</h2><p>Rosters activos y en preparación.</p></div>
      </div>
      <div v-if="rosters.length" class="table-wrap roster-table-wrap">
        <table class="roster-table">
          <thead><tr><th>ROSTER</th><th>TIPO</th><th>TEMPORADA</th><th class="roster-actions-heading">ACCIONES</th></tr></thead>
          <tbody>
            <tr v-for="(roster, indice) in rosters" :key="roster.id" :class="{ seleccionado: rosterSeleccionado?.id === roster.id }" @click="abrirRoster(roster.id)">
              <td>
                <button type="button" class="roster-name-button" @click.stop="abrirRoster(roster.id)">
                  <span class="roster-symbol">R{{ indice + 1 }}</span>
                  <strong>{{ roster.nombre }}</strong>
                </button>
              </td>
              <td>{{ roster.tipo }}</td>
              <td>{{ roster.temporada }}</td>
              <td>
                <div class="row-actions roster-row-actions">
                  <button class="row-action-button" :aria-label="`Editar roster ${roster.nombre}`" @click.stop="abrirDialogoRoster(roster)">Editar</button>
                  <button class="row-action-button row-action-danger" :aria-label="`Eliminar roster ${roster.nombre}`" @click.stop="eliminarRoster(roster)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><strong>Aún no hay rosters</strong><p>Crea un roster para organizar la alineación.</p><button class="text-button" @click="abrirDialogoRoster()">＋ Crear roster</button></div>
    </section>
    <section class="data-card roster-detail-card">
      <template v-if="rosterSeleccionado">
        <div class="section-heading"><div><h2>{{ rosterSeleccionado.nombre }}</h2><p>{{ rosterSeleccionado.tipo }} · Temporada {{ rosterSeleccionado.temporada }}</p></div><button class="close-detail" aria-label="Cerrar detalle" @click="rosterSeleccionado = null">×</button></div>
        <div class="lineup-label"><span>ALINEACIÓN</span><span>{{ jugadoresRoster.length }} JUGADORES</span></div>
        <div v-if="jugadoresRoster.length" class="lineup-list">
          <div v-for="jugador in jugadoresRoster" :key="jugador.id" class="lineup-row">
            <span class="lineup-position">{{ jugador.rol }}</span>
            <strong>{{ jugador.nickname }}</strong>
            <select class="lineup-role-select" :value="jugador.rol_en_roster" :disabled="procesandoAlineacion" :aria-label="`Rol de ${jugador.nickname} en el roster`" @change="cambiarRolJugadorEnRoster(jugador, $event.target.value)">
              <option value="Titular">Titular</option>
              <option value="Suplente">Suplente</option>
            </select>
            <button type="button" class="lineup-remove" :disabled="procesandoAlineacion" :aria-label="`Quitar a ${jugador.nickname} del roster`" @click="quitarJugadorDeRoster(jugador)">Quitar</button>
          </div>
        </div>
        <div v-else class="empty-lineup">Este roster aún no tiene jugadores asignados.</div>
        <form class="assignment-form" @submit.prevent="asignarJugadorARoster">
          <label class="assignment-field" for="roster-player">
            <span>Añadir jugador</span>
            <select id="roster-player" v-model.number="formularioAsignacion.idJugador" :disabled="!jugadoresDisponiblesParaRoster.length || procesandoAlineacion">
              <option :value="0" disabled>Selecciona un jugador</option>
              <option v-for="jugador in jugadoresDisponiblesParaRoster" :key="jugador.id" :value="jugador.id">{{ jugador.nickname }} · {{ jugador.rol }}</option>
            </select>
          </label>
          <label class="assignment-field" for="roster-player-role">
            <span>Asignación</span>
            <select id="roster-player-role" v-model="formularioAsignacion.rol" :disabled="procesandoAlineacion">
              <option value="Titular">Titular</option>
              <option value="Suplente">Suplente</option>
            </select>
          </label>
          <button class="primary-button assignment-button" :disabled="!jugadoresDisponiblesParaRoster.length || procesandoAlineacion">
            {{ procesandoAlineacion ? 'Guardando…' : 'Añadir al roster' }}
          </button>
          <p v-if="!jugadoresDisponiblesParaRoster.length" class="assignment-help">Todos los jugadores disponibles ya están asignados.</p>
        </form>
      </template>
      <div v-else class="detail-placeholder"><strong>Selecciona un roster</strong><p>Consulta aquí su alineación.</p></div>
    </section>
  </div>
</template>
