<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { sesionActiva } from '../router/index.js';
import { api } from '../services/api.js';
import CrearCuentaDialog from '../components/CrearCuentaDialog.vue';

const enrutador = useRouter();
const formularioInicioSesion = reactive({ email: '', password: '' });
const errorInicioSesion = ref('');
const mensajeSolicitudInicioSesion = ref('');
const procesando = ref(false);
const dialogoSolicitudCuenta = ref(false);
const procesandoSolicitudCuenta = ref(false);
const errorSolicitudCuenta = ref('');
const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const formularioSolicitudCuenta = reactive({
  auth_method: 'password',
  email: '',
  password: '',
  display_name: '',
  rol: 'jugador',
  nickname: '',
  nombre_real: '',
  pais: '',
  rol_jugador: 'Top'
});

onMounted(() => {
  const parametros = new URLSearchParams(window.location.search);
  const estadoGoogle = parametros.get('google');
  const estadoSolicitud = parametros.get('request');

  if (estadoGoogle) {
    const erroresGoogle = {
      cancelled: 'Cancelaste el inicio de sesión con Google.',
      invalid_response: 'Google no devolvió una respuesta válida. Intenta de nuevo.',
      invalid_state: 'No se pudo validar la sesión de Google. Intenta de nuevo.',
      unverified_email: 'Google no pudo verificar tu correo electrónico.',
      google_not_enabled: 'Esta cuenta está configurada para iniciar sesión con correo y contraseña.',
      account_not_available: 'No hay una cuenta activa de EA Sports asociada a ese correo.',
      failed: 'No se pudo completar el inicio de sesión con Google. Intenta de nuevo.'
    };
    if (estadoGoogle !== 'success') {
      errorInicioSesion.value = erroresGoogle[estadoGoogle] || 'No se pudo iniciar sesión con Google.';
    } else if (!sesionActiva.value) {
      errorInicioSesion.value = 'Google autenticó tu cuenta, pero no se pudo verificar la sesión de EA Sports.';
    }
  }

  if (estadoSolicitud) {
    const mensajesSolicitud = {
      success: 'Tu solicitud fue enviada y está pendiente de aprobación.',
      cancelled: 'Cancelaste la solicitud con Google.',
      already_exists: 'Ya existe una cuenta o una solicitud con ese correo.',
      invalid_response: 'Google no devolvió una respuesta válida. Intenta de nuevo.',
      invalid_state: 'No se pudo validar la solicitud de Google. Intenta de nuevo.',
      unverified_email: 'Google no pudo verificar tu correo y nombre.',
      failed: 'No se pudo enviar la solicitud con Google. Intenta de nuevo.'
    };
    if (estadoSolicitud === 'success') {
      mensajeSolicitudInicioSesion.value = mensajesSolicitud.success;
    } else {
      errorInicioSesion.value = mensajesSolicitud[estadoSolicitud] || 'No se pudo enviar la solicitud.';
    }
  }

  if (estadoGoogle || estadoSolicitud) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

async function iniciarSesion() {
  errorInicioSesion.value = '';
  procesando.value = true;
  try {
    const respuesta = await api.login(formularioInicioSesion.email, formularioInicioSesion.password);
    sesionActiva.value = respuesta.usuario;
    formularioInicioSesion.password = '';
    await enrutador.push(respuesta.usuario.rol === 'jugador'
      ? { name: 'grupo-jugador' }
      : { name: 'jugadores' });
  } catch (error) {
    errorInicioSesion.value = error.message;
  } finally {
    procesando.value = false;
  }
}

function iniciarSesionGoogle() {
  window.location.assign('/api/v1/auth/google');
}

function abrirSolicitudCuenta() {
  errorSolicitudCuenta.value = '';
  formularioSolicitudCuenta.rol = 'jugador';
  dialogoSolicitudCuenta.value = true;
}

function cambiarMetodoSolicitud() {
  errorSolicitudCuenta.value = '';
  if (formularioSolicitudCuenta.auth_method === 'google') {
    formularioSolicitudCuenta.email = '';
    formularioSolicitudCuenta.password = '';
    formularioSolicitudCuenta.display_name = '';
  }
}

async function enviarSolicitudCuenta() {
  errorSolicitudCuenta.value = '';
  procesandoSolicitudCuenta.value = true;
  const datosSolicitud = {
    rol: formularioSolicitudCuenta.rol,
    ...(formularioSolicitudCuenta.rol === 'jugador' && {
      nickname: formularioSolicitudCuenta.nickname,
      nombre_real: formularioSolicitudCuenta.nombre_real,
      pais: formularioSolicitudCuenta.pais,
      rol_jugador: formularioSolicitudCuenta.rol_jugador
    })
  };

  try {
    if (formularioSolicitudCuenta.auth_method === 'google') {
      const { url } = await api.startGoogleAccountRequest(datosSolicitud);
      window.location.assign(url);
      return;
    }

    await api.createAccountRequest({
      ...datosSolicitud,
      auth_method: 'password',
      email: formularioSolicitudCuenta.email,
      password: formularioSolicitudCuenta.password,
      ...(formularioSolicitudCuenta.rol === 'entrenador' && {
        display_name: formularioSolicitudCuenta.display_name
      })
    });
    dialogoSolicitudCuenta.value = false;
    mensajeSolicitudInicioSesion.value = 'Tu solicitud fue enviada y está pendiente de aprobación.';
    Object.assign(formularioSolicitudCuenta, {
      auth_method: 'password',
      email: '',
      password: '',
      display_name: '',
      rol: 'jugador',
      nickname: '',
      nombre_real: '',
      pais: '',
      rol_jugador: 'Top'
    });
  } catch (error) {
    errorSolicitudCuenta.value = error.message;
  } finally {
    procesandoSolicitudCuenta.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-banner" role="img" aria-label="Imagen de portada de EA Sports"></section>
    <form class="login-card" @submit.prevent="iniciarSesion">
      <h1>Inicia sesión</h1>
      <p v-if="mensajeSolicitudInicioSesion" class="form-success" role="status">{{ mensajeSolicitudInicioSesion }}</p>
      <label for="email">Correo electrónico</label>
      <input id="email" v-model="formularioInicioSesion.email" type="email" autocomplete="username" placeholder="nombre@equipo.com" required />
      <label for="password">Contraseña</label>
      <input id="password" v-model="formularioInicioSesion.password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required />
      <p v-if="errorInicioSesion" class="form-error" role="alert">{{ errorInicioSesion }}</p>
      <button class="primary-button login-button" type="submit" :disabled="procesando">
        {{ procesando ? 'Iniciando sesión…' : 'Iniciar sesión' }}
      </button>
      <button class="primary-button login-button" type="button" @click="abrirSolicitudCuenta">
        Crear cuenta
      </button>
      <button class="google-login-button login-button" type="button" @click="iniciarSesionGoogle">
        <span class="google-login-icon" aria-hidden="true">G</span>
        <span>Continuar con Google</span>
      </button>
      <nav class="login-secondary-links" aria-label="Información del proyecto">
        <RouterLink class="login-secondary-link" :to="{ name: 'acerca-de' }">About </RouterLink>
      </nav>
    </form>

    <CrearCuentaDialog
      :visible="dialogoSolicitudCuenta"
      mode="request"
      :form="formularioSolicitudCuenta"
      :roles="roles"
      :busy="procesandoSolicitudCuenta"
      :error="errorSolicitudCuenta"
      @submit="enviarSolicitudCuenta"
      @cancel="dialogoSolicitudCuenta = false"
      @method-change="cambiarMetodoSolicitud"
    />
  </main>
</template>
