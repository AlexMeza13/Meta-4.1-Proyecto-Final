<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const vistaSeleccionada = ref('');
const jugadores = ref([]);
const rosters = ref([]);
const cargando = ref(false);
const errorCarga = ref('');

watch(() => route.query.vista, (vista) => {
  if (vista === 'jugador' || vista === 'entrenador') {
    cargarVista(vista);
  } else {
    vistaSeleccionada.value = '';
  }
}, { immediate: true });

function seleccionarVista(vista) {
  router.replace({ name: 'vistas-publicas', query: { vista } });
}

async function cargarVista(vista) {
  vistaSeleccionada.value = vista;
  cargando.value = true;
  errorCarga.value = '';

  try {
    if (vista === 'jugador') {
      jugadores.value = await api.listPlayers();
    } else {
      const listaRosters = await api.listRosters();
      rosters.value = await Promise.all(listaRosters.map(async (roster) => ({
        ...roster,
        jugadores: await api.getRosterPlayers(roster.id)
      })));
    }
  } catch (error) {
    errorCarga.value = error.message;
  } finally {
    cargando.value = false;
  }
}

</script>

<template>
  <main class="public-views-page">
    <header class="public-views-header">
      <div class="public-views-header-inner">
        <span class="about-brand">EA SPORTS <i></i> VISTAS PÚBLICAS</span>
        <RouterLink class="public-back-link" :to="{ name: 'acerca-de' }">← Acerca de</RouterLink>
      </div>
    </header>

    <section class="public-view-hero">
      <div
        class="public-view-hero-image"
        :class="{
          'public-view-hero-image-player': vistaSeleccionada === 'jugador',
          'public-view-hero-image-rosters': vistaSeleccionada === 'entrenador'
        }"
        aria-hidden="true"
      />
      <div class="public-view-hero-copy">
        <p class="public-view-hero-kicker">
          {{ vistaSeleccionada ? (vistaSeleccionada === 'jugador' ? 'VISTA DE JUGADOR' : 'VISTA DE ENTRENADOR') : 'EA SPORTS · TEAM MANAGEMENT' }}
        </p>
        <h1>
          {{ vistaSeleccionada === 'jugador' ? 'Cada jugador suma.' : vistaSeleccionada === 'entrenador' ? 'Planifica cada alineación.' : 'El talento se organiza en equipo.' }}
        </h1>
        <p>
          {{ vistaSeleccionada === 'jugador'
            ? 'Conoce los perfiles y las posiciones de quienes integran el equipo.'
            : vistaSeleccionada === 'entrenador'
              ? 'Consulta los rosters, sus temporadas y la distribución de titulares y suplentes.'
              : 'Perfiles, posiciones y alineaciones desde una sola plataforma.' }}
        </p>
      </div>
      <nav class="public-view-nav" aria-label="Cambiar vista pública">
        <button :class="{ active: vistaSeleccionada === 'jugador' }" :aria-pressed="vistaSeleccionada === 'jugador'" type="button" @click="seleccionarVista('jugador')">
          <img src="/Icono1.png" alt="" />
          <span>Jugadores</span>
        </button>
        <button :class="{ active: vistaSeleccionada === 'entrenador' }" :aria-pressed="vistaSeleccionada === 'entrenador'" type="button" @click="seleccionarVista('entrenador')">
          <img src="/Icono2.png" alt="" />
          <span>Rosters</span>
        </button>
      </nav>
    </section>

    <section class="public-view-content" aria-live="polite">
      <header class="public-view-content-heading">
        <div>
          <p class="public-view-content-kicker">{{ vistaSeleccionada ? 'CONSULTA PÚBLICA' : 'EXPLORA EL EQUIPO' }}</p>
          <h2>{{ vistaSeleccionada === 'jugador' ? 'Plantilla pública' : vistaSeleccionada === 'entrenador' ? 'Rosters y alineaciones' : 'Elige qué quieres consultar' }}</h2>
          <p>{{ vistaSeleccionada === 'jugador' ? `${jugadores.length} perfiles disponibles` : vistaSeleccionada === 'entrenador' ? `${rosters.length} rosters disponibles` : 'Selecciona Jugadores o Rosters para comenzar.' }}</p>
        </div>
        <span v-if="vistaSeleccionada" class="public-view-readonly">Solo lectura</span>
      </header>

      <p v-if="cargando" class="public-view-message" role="status">Cargando información pública…</p>
      <p v-else-if="errorCarga" class="public-view-error" role="alert">{{ errorCarga }}</p>
      <p v-else-if="!vistaSeleccionada" class="public-view-message">Estas vistas están disponibles sin iniciar sesión.</p>

      <template v-else-if="vistaSeleccionada === 'jugador'">
        <p v-if="!jugadores.length && !cargando" class="public-view-message">Aún no hay jugadores para mostrar.</p>
        <div v-else class="public-player-list">
          <article v-for="jugador in jugadores" :key="jugador.id" class="public-player">
            <span class="public-player-avatar" aria-hidden="true">{{ jugador.nickname?.slice(0, 2).toUpperCase() }}</span>
            <div>
              <h3>{{ jugador.nickname }}</h3>
              <p>{{ jugador.rol }} <span aria-hidden="true">·</span> {{ jugador.pais || 'País no especificado' }}</p>
            </div>
          </article>
        </div>
      </template>

      <template v-else>
        <p v-if="!rosters.length && !cargando" class="public-view-message">Aún no hay rosters para mostrar.</p>
        <div v-else class="public-roster-list">
          <article v-for="roster in rosters" :key="roster.id" class="public-roster">
            <header class="public-roster-heading">
              <h3>{{ roster.nombre }}</h3>
              <p>{{ roster.tipo }} <span aria-hidden="true">·</span> Temporada {{ roster.temporada }}</p>
            </header>
            <ul v-if="roster.jugadores.length" class="public-lineup">
              <li v-for="jugador in roster.jugadores" :key="jugador.id">
                <strong>{{ jugador.nickname }}</strong>
                <span>{{ jugador.rol }}</span>
                <span>{{ jugador.rol_en_roster }}</span>
              </li>
            </ul>
            <p v-else class="public-view-message">Este roster aún no tiene jugadores asignados.</p>
          </article>
        </div>
      </template>
    </section>
  </main>
</template>
