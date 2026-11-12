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
  rosters,
  rosterSeleccionado,
  jugadoresRoster,
  procesandoAlineacion,
  formularioAsignacion,
  jugadoresDisponiblesParaRoster,
  errorAsignacionRoster,
  obtenerErrorCambioRolRoster,
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

const esAdmin = computed(() => sesion.value?.rol === 'admin');
const dialogoEliminarRoster = ref(null);
const dialogoQuitarJugador = ref(null);
const rosterAEliminar = ref(null);
const jugadorAQuitar = ref(null);
const titularesRoster = computed(() =>
  jugadoresRoster.value.filter((jugador) => jugador.rol_en_roster === 'Titular')
);
const suplentesRoster = computed(() =>
  jugadoresRoster.value.filter((jugador) => jugador.rol_en_roster === 'Suplente')
);
const busquedaRoster = ref('');
const tipoRoster = ref('');
const temporadaRoster = ref('');
const tiposRoster = computed(() => [...new Set(rosters.value.map((roster) => roster.tipo).filter(Boolean))].sort());
const temporadasRoster = computed(() => [...new Set(rosters.value.map((roster) => String(roster.temporada)).filter(Boolean))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true })));
const rostersFiltrados = computed(() => {
  const busqueda = busquedaRoster.value.trim().toLocaleLowerCase();
  return rosters.value.filter((roster) =>
    (!busqueda || roster.nombre?.toLocaleLowerCase().includes(busqueda)) &&
    (!tipoRoster.value || roster.tipo === tipoRoster.value) &&
    (!temporadaRoster.value || String(roster.temporada) === temporadaRoster.value)
  );
});

onMounted(() => {
  actualizarDatos(cargarRosters);
  actualizarDatos(cargarJugadores);
});

function confirmarEliminarRoster(roster) {
  rosterAEliminar.value = roster;
  dialogoEliminarRoster.value.showModal();
}

async function eliminarRosterConfirmado() {
  const roster = rosterAEliminar.value;
  dialogoEliminarRoster.value.close();
  if (roster) await eliminarRoster(roster);
}

function confirmarQuitarJugador(jugador) {
  jugadorAQuitar.value = jugador;
  dialogoQuitarJugador.value.showModal();
}

async function quitarJugadorConfirmado() {
  const jugador = jugadorAQuitar.value;
  dialogoQuitarJugador.value.close();
  if (jugador) await quitarJugadorDeRoster(jugador);
}
</script>

<template>
  <div class="page-heading">
    <div><h1>Rosters</h1></div>
    <button v-if="esAdmin" class="primary-button" @click="abrirDialogoRoster()">＋ Crear roster</button>
  </div>
  <div class="roster-layout">
    <section class="data-card roster-list-card">
      <div class="section-heading">
        <div><h2>Rosters</h2><p>{{ esAdmin ? 'Rosters activos y en preparación.' : 'Consulta los rosters y sus alineaciones.' }}</p></div>
        <p v-if="!esAdmin" class="roster-readonly-note">Modo lectura: solo Admin puede modificar rosters y alineaciones.</p>
      </div>
      <div v-if="rosters.length" class="list-filters" aria-label="Filtros de rosters">
        <label class="list-filter-search">Buscar
          <input v-model="busquedaRoster" type="search" placeholder="Nombre del roster" />
        </label>
        <label>Tipo
          <select v-model="tipoRoster">
            <option value="">Todos</option>
            <option v-for="tipo in tiposRoster" :key="tipo" :value="tipo">{{ tipo }}</option>
          </select>
        </label>
        <label>Temporada
          <select v-model="temporadaRoster">
            <option value="">Todas</option>
            <option v-for="temporada in temporadasRoster" :key="temporada" :value="temporada">{{ temporada }}</option>
          </select>
        </label>
        <span class="list-filter-count" aria-live="polite">{{ rostersFiltrados.length }} de {{ rosters.length }}</span>
      </div>
      <div v-if="rostersFiltrados.length" class="table-wrap roster-table-wrap">
        <table class="roster-table">
          <thead><tr><th>ROSTER</th><th>TIPO</th><th>TEMPORADA</th><th v-if="esAdmin" class="roster-actions-heading">ACCIONES</th></tr></thead>
          <tbody>
            <tr v-for="(roster, indice) in rostersFiltrados" :key="roster.id" :class="{ seleccionado: rosterSeleccionado?.id === roster.id }" @click="abrirRoster(roster.id)">
              <td>
                <button type="button" class="roster-name-button" @click.stop="abrirRoster(roster.id)">
                  <span class="roster-symbol">R{{ indice + 1 }}</span>
                  <strong>{{ roster.nombre }}</strong>
                </button>
              </td>
              <td>{{ roster.tipo }}</td>
              <td>{{ roster.temporada }}</td>
              <td v-if="esAdmin">
                <div class="row-actions roster-row-actions">
                  <button class="row-action-button" :aria-label="`Editar roster ${roster.nombre}`" @click.stop="abrirDialogoRoster(roster)">Editar</button>
                  <button class="row-action-button row-action-danger" :aria-label="`Eliminar roster ${roster.nombre}`" @click.stop="confirmarEliminarRoster(roster)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="rosters.length" class="empty-state"><strong>No hay rosters que coincidan</strong><p>Prueba cambiando o limpiando los filtros.</p></div>
      <div v-else class="empty-state"><strong>Aún no hay rosters</strong><p>{{ esAdmin ? 'Crea un roster para organizar la alineación.' : 'No hay rosters disponibles para consultar.' }}</p><button v-if="esAdmin" class="text-button" @click="abrirDialogoRoster()">＋ Crear roster</button></div>
    </section>
    <section class="data-card roster-detail-card">
      <template v-if="rosterSeleccionado">
        <div class="section-heading"><div><h2>{{ rosterSeleccionado.nombre }}</h2><p>{{ rosterSeleccionado.tipo }} · Temporada {{ rosterSeleccionado.temporada }}</p></div><button class="close-detail" aria-label="Cerrar detalle" @click="rosterSeleccionado = null">×</button></div>
        <div class="lineup-label">
          <span>ALINEACIÓN</span>
          <span class="lineup-counts" aria-label="Jugadores titulares y suplentes">
            <span class="lineup-count">{{ jugadoresRoster.length }} JUGADORES</span>
            <span class="lineup-count lineup-count-starters">{{ titularesRoster.length }} TITULARES</span>
            <span class="lineup-count lineup-count-subs">{{ suplentesRoster.length }} SUPLENTES</span>
          </span>
        </div>
        <div v-if="jugadoresRoster.length" class="lineup-list">
          <div v-for="jugador in jugadoresRoster" :key="jugador.id" class="lineup-row" :class="{ 'lineup-row-readonly': !esAdmin }">
            <span class="lineup-position">{{ jugador.rol }}</span>
            <strong>{{ jugador.nickname }}</strong>
            <span v-if="!esAdmin" class="lineup-status">{{ jugador.rol_en_roster }}</span>
            <select v-else class="lineup-role-select" :value="jugador.rol_en_roster" :disabled="procesandoAlineacion" :aria-label="`Rol de ${jugador.nickname} en el roster`" :aria-describedby="obtenerErrorCambioRolRoster(jugador) ? `lineup-validation-${jugador.id}` : undefined" @change="cambiarRolJugadorEnRoster(jugador, $event.target.value)">
              <option value="Titular" :disabled="jugador.rol_en_roster !== 'Titular' && Boolean(obtenerErrorCambioRolRoster(jugador))" :title="jugador.rol_en_roster !== 'Titular' ? obtenerErrorCambioRolRoster(jugador) : undefined">Titular</option>
              <option value="Suplente">Suplente</option>
            </select>
            <button v-if="esAdmin" type="button" class="lineup-remove" :disabled="procesandoAlineacion" :aria-label="`Quitar a ${jugador.nickname} del roster`" @click="confirmarQuitarJugador(jugador)">Quitar</button>
            <small v-if="esAdmin && obtenerErrorCambioRolRoster(jugador)" :id="`lineup-validation-${jugador.id}`" class="assignment-help lineup-validation-help">{{ obtenerErrorCambioRolRoster(jugador) }}</small>
          </div>
        </div>
        <div v-else class="empty-lineup">Este roster aún no tiene jugadores asignados.</div>
        <form v-if="esAdmin" class="assignment-form" @submit.prevent="asignarJugadorARoster">
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
          <button class="primary-button assignment-button" :disabled="!jugadoresDisponiblesParaRoster.length || procesandoAlineacion || Boolean(errorAsignacionRoster)">
            {{ procesandoAlineacion ? 'Guardando…' : 'Añadir al roster' }}
          </button>
          <p v-if="errorAsignacionRoster" class="assignment-help assignment-validation-error" role="alert">{{ errorAsignacionRoster }}</p>
          <p v-if="!jugadoresDisponiblesParaRoster.length" class="assignment-help">Todos los jugadores disponibles ya están asignados.</p>
        </form>
      </template>
      <div v-else class="detail-placeholder"><strong>Selecciona un roster</strong><p>Consulta aquí su alineación.</p></div>
    </section>
  </div>
  <dialog
    ref="dialogoEliminarRoster"
    class="confirmation-dialog"
    aria-labelledby="eliminar-roster-title"
    aria-describedby="eliminar-roster-message"
    @click.self="dialogoEliminarRoster.close()"
    @close="rosterAEliminar = null"
  >
    <div class="confirmation-content">
      <h2 id="eliminar-roster-title">Eliminar roster</h2>
      <p id="eliminar-roster-message">Se eliminará el roster {{ rosterAEliminar?.nombre }} y su alineación. Los perfiles de jugador se conservarán.</p>
      <div class="dialog-actions">
        <button type="button" class="secondary-button" autofocus @click="dialogoEliminarRoster.close()">Cancelar</button>
        <button type="button" class="primary-button confirmation-danger" @click="eliminarRosterConfirmado">Eliminar roster</button>
      </div>
    </div>
  </dialog>
  <dialog
    ref="dialogoQuitarJugador"
    class="confirmation-dialog"
    aria-labelledby="quitar-jugador-title"
    aria-describedby="quitar-jugador-message"
    @click.self="dialogoQuitarJugador.close()"
    @close="jugadorAQuitar = null"
  >
    <div class="confirmation-content">
      <h2 id="quitar-jugador-title">Quitar jugador del roster</h2>
      <p id="quitar-jugador-message">Se quitará a {{ jugadorAQuitar?.nickname }} de {{ rosterSeleccionado?.nombre }}. Su perfil de jugador no se eliminará.</p>
      <div class="dialog-actions">
        <button type="button" class="secondary-button" autofocus @click="dialogoQuitarJugador.close()">Cancelar</button>
        <button type="button" class="primary-button confirmation-danger" @click="quitarJugadorConfirmado">Quitar del roster</button>
      </div>
    </div>
  </dialog>
</template>
