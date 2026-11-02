<script setup>
import { RouterLink } from 'vue-router';

const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  sesion,
  solicitudesCuenta,
  procesando,
  aviso,
  tipoAviso,
  cerrarSesion,
  dialogoJugador,
  dialogoRoster,
  idJugadorEditado,
  idRosterEditado,
  formularioJugador,
  formularioRoster,
  roles,
  estados,
  tiposRoster,
  guardarJugador,
  guardarRoster
} = app;
</script>

<template>
  <main class="workspace">
    <aside class="app-sidebar">
      <div class="sidebar-heading">GESTIÓN DEL EQUIPO</div>
      <nav v-if="sesion.rol !== 'jugador'" class="sidebar-nav" aria-label="Secciones">
        <RouterLink class="sidebar-item" active-class="active" :to="{ name: 'jugadores' }">
          <img src="/Icono1.png" alt="" class="sidebar-icon section-icon-image" /><span>Jugadores</span>
        </RouterLink>
        <RouterLink class="sidebar-item" active-class="active" :to="{ name: 'rosters' }">
          <img src="/Icono2.png" alt="" class="sidebar-icon section-icon-image" /><span>Rosters</span>
        </RouterLink>
        <RouterLink v-if="sesion.rol === 'admin'" class="sidebar-item" active-class="active" :to="{ name: 'cuentas' }">
          <img src="/Icono3.png" alt="" class="sidebar-icon section-icon-image" /><span>Cuentas</span>
        </RouterLink>
        <RouterLink v-if="sesion.rol === 'admin'" class="sidebar-item" active-class="active" :to="{ name: 'solicitudes' }">
          <img src="/Icono4.png" alt="" class="sidebar-icon section-icon-image" /><span>Solicitudes</span><span v-if="solicitudesCuenta.length" class="sidebar-count">{{ solicitudesCuenta.length }}</span>
        </RouterLink>
      </nav>
      <nav v-else class="sidebar-nav" aria-label="Secciones">
        <RouterLink class="sidebar-item" active-class="active" :to="{ name: 'grupo-jugador' }">
          <span class="sidebar-icon">G</span><span>Mi grupo</span>
        </RouterLink>
      </nav>
      <div class="sidebar-account">
        <img v-if="sesion.avatar_url" :src="sesion.avatar_url" alt="" class="profile-avatar profile-avatar-image" referrerpolicy="no-referrer" />
        <span v-else class="profile-avatar">{{ (sesion.display_name || sesion.email?.split('@')[0])?.slice(0, 1).toUpperCase() }}</span>
        <span class="sidebar-name">{{ sesion.display_name || sesion.email?.split('@')[0] }}</span>
        <button class="sidebar-logout" :disabled="procesando" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </aside>

    <div class="workspace-main">
      <section class="main-panel">
        <div class="content-area">
          <div v-if="aviso" class="toast" :class="`toast-${tipoAviso}`" role="status">{{ aviso }}</div>
          <slot />
        </div>
        <footer class="workspace-footer"><span>Gestión de rosters</span></footer>
      </section>
    </div>
    <div v-if="dialogoJugador" class="modal-backdrop" @click.self="dialogoJugador = false">
      <form class="dialog" @submit.prevent="guardarJugador">
        <div class="dialog-heading"><div><h2>{{ idJugadorEditado ? 'Editar jugador' : 'Nuevo jugador' }}</h2></div><button type="button" class="close-detail" aria-label="Cerrar" @click="dialogoJugador = false">×</button></div>
        <label>Nickname<input v-model.trim="formularioJugador.nickname" required maxlength="255" /></label>
        <label>Nombre real<input v-model.trim="formularioJugador.nombre_real" required maxlength="255" /></label>
        <div class="form-row"><label>País<input v-model.trim="formularioJugador.pais" required maxlength="255" placeholder="MX" /></label><label>Rol<select v-model="formularioJugador.rol"><option v-for="rol in roles" :key="rol">{{ rol }}</option></select></label></div>
        <label>Estado<select v-model="formularioJugador.estado"><option v-for="estado in estados" :key="estado">{{ estado }}</option></select></label>
        <div class="dialog-actions"><button type="button" class="secondary-button" @click="dialogoJugador = false">Cancelar</button><button class="primary-button" :disabled="procesando">{{ procesando ? 'Guardando…' : 'Guardar jugador' }}</button></div>
      </form>
    </div>

    <div v-if="dialogoRoster" class="modal-backdrop" @click.self="dialogoRoster = false">
      <form class="dialog" @submit.prevent="guardarRoster">
        <div class="dialog-heading"><div><h2>{{ idRosterEditado ? 'Editar roster' : 'Nuevo roster' }}</h2></div><button type="button" class="close-detail" aria-label="Cerrar" @click="dialogoRoster = false">×</button></div>
        <label>Nombre del roster<input v-model.trim="formularioRoster.nombre" required maxlength="255" placeholder="EA Main Squad" /></label>
        <div class="form-row"><label>Tipo<select v-model="formularioRoster.tipo"><option v-for="tipo in tiposRoster" :key="tipo">{{ tipo }}</option></select></label><label>Temporada<input v-model.trim="formularioRoster.temporada" required maxlength="255" /></label></div>
        <div class="dialog-actions"><button type="button" class="secondary-button" @click="dialogoRoster = false">Cancelar</button><button class="primary-button" :disabled="procesando">{{ procesando ? 'Guardando…' : 'Guardar roster' }}</button></div>
      </form>
    </div>
  </main>
</template>
