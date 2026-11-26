<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../services/api.js';
import { sesionActiva } from '../router/index.js';
import { useNotifications } from '../composables/useNotifications.js';
import { solicitudesPendientes } from '../composables/useSolicitudesPendientes.js';

defineProps({
  sesion: {
    type: Object,
    required: true
  }
});

const enrutador = useRouter();
const { mostrarAviso } = useNotifications();
const cerrandoSesion = ref(false);

onMounted(async () => {
  if (sesionActiva.value?.rol !== 'admin') return;

  try {
    solicitudesPendientes.value = (await api.listAccountRequests()).length;
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
});

async function cerrarSesion() {
  cerrandoSesion.value = true;
  try {
    await api.logout();
    sesionActiva.value = null;
    await enrutador.replace({ name: 'login' });
    mostrarAviso('Sesión cerrada correctamente.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    cerrandoSesion.value = false;
  }
}
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
          <img src="/Icono4.png" alt="" class="sidebar-icon section-icon-image" /><span>Solicitudes</span><span v-if="solicitudesPendientes" class="sidebar-count">{{ solicitudesPendientes }}</span>
        </RouterLink>
      </nav>
      <nav v-else class="sidebar-nav" aria-label="Secciones">
        <RouterLink class="sidebar-item" active-class="active" :to="{ name: 'grupo-jugador' }">
          <img src="/Icono2.png" alt="" class="sidebar-icon section-icon-image" /><span>Mi grupo</span>
        </RouterLink>
      </nav>
      <div class="sidebar-account">
        <img v-if="sesion.avatar_url" :src="sesion.avatar_url" alt="" class="profile-avatar profile-avatar-image" referrerpolicy="no-referrer" />
        <span v-else class="profile-avatar">{{ (sesion.display_name || sesion.email?.split('@')[0])?.slice(0, 1).toUpperCase() }}</span>
        <span class="sidebar-name">{{ sesion.display_name || sesion.email?.split('@')[0] }}</span>
        <button class="sidebar-logout" :disabled="cerrandoSesion" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </aside>

    <div class="workspace-main">
      <section class="main-panel">
        <div class="content-area">
          <slot />
        </div>
        <footer class="workspace-footer"><span>Gestión de rosters</span></footer>
      </section>
    </div>
  </main>
</template>
