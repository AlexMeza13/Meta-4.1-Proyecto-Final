<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from './services/api.js';
import { sesionActiva, sesionLista } from './router/index.js';
import { useNotifications } from './composables/useNotifications.js';
import PanelLayout from './components/PanelLayout.vue';

const enrutador = useRouter();
const rutaActual = useRoute();
const { aviso, tipoAviso, mostrarAviso } = useNotifications();

onMounted(async () => {
  const estadoGoogle = new URLSearchParams(window.location.search).get('google');

  try {
    const respuesta = await api.verifySession();
    sesionActiva.value = respuesta.usuario;
  } catch (error) {
    if (!error.message.includes('(401)') && !error.message.includes('Autenticacion requerida')) {
      mostrarAviso(error.message, 'error');
    }
  } finally {
    if (sesionActiva.value && !rutaActual.meta.notFound) {
      if (rutaActual.name === 'login' ||
        (rutaActual.meta.roles && !rutaActual.meta.roles.includes(sesionActiva.value.rol))) {
        await enrutador.replace(sesionActiva.value.rol === 'jugador'
          ? { name: 'grupo-jugador' }
          : { name: 'jugadores' });
      }
    } else if (!sesionActiva.value && !rutaActual.meta.publico && !rutaActual.meta.notFound) {
      await enrutador.replace({ name: 'login' });
    }

    if (estadoGoogle === 'success' && sesionActiva.value) {
      mostrarAviso('Inicio de sesión con Google exitoso.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    sesionLista.value = true;
  }
});
</script>

<template>
  <RouterView v-if="sesionLista" v-slot="{ Component, route }">
    <PanelLayout v-if="route.meta.panel && sesionActiva" :sesion="sesionActiva">
      <component :is="Component" />
    </PanelLayout>
    <component :is="Component" v-else-if="!route.meta.panel" />
  </RouterView>
  <div v-else class="app-loading" role="status">Cargando...</div>
  <div v-if="aviso" class="toast" :class="`toast-${tipoAviso}`" role="status">{{ aviso }}</div>
</template>
