<script setup>
const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  formularioInicioSesion,
  errorInicioSesion,
  mensajeSolicitudInicioSesion,
  procesando,
  dialogoSolicitudCuenta,
  procesandoSolicitudCuenta,
  errorSolicitudCuenta,
  formularioSolicitudCuenta,
  roles,
  iniciarSesion,
  iniciarSesionGoogle,
  abrirSolicitudCuenta,
  cambiarMetodoSolicitud,
  enviarSolicitudCuenta
} = app;
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
    </form>

    <div v-if="dialogoSolicitudCuenta" class="modal-backdrop" @click.self="dialogoSolicitudCuenta = false">
      <form class="dialog request-dialog" @submit.prevent="enviarSolicitudCuenta">
        <div class="request-dialog-image" role="img" aria-label="Ilustración de League of Legends"></div>
        <div class="request-dialog-content">
          <div class="dialog-heading">
            <div><h2>Crear cuenta</h2><p class="request-dialog-intro">El administrador revisará tus datos antes de crear la cuenta.</p></div>
            <button type="button" class="close-detail" aria-label="Cerrar" @click="dialogoSolicitudCuenta = false">×</button>
          </div>
          <label>Tipo de cuenta<select v-model="formularioSolicitudCuenta.rol"><option value="entrenador">Entrenador</option><option value="jugador">Jugador</option></select></label>
          <label>Método de inicio<select v-model="formularioSolicitudCuenta.auth_method" @change="cambiarMetodoSolicitud"><option value="password">Correo y contraseña</option><option value="google">Google</option></select></label>
          <template v-if="formularioSolicitudCuenta.auth_method === 'password'">
            <label>Correo electrónico<input v-model.trim="formularioSolicitudCuenta.email" type="email" autocomplete="email" required maxlength="254" /></label>
            <label v-if="formularioSolicitudCuenta.rol === 'entrenador'">Nombre completo<input v-model.trim="formularioSolicitudCuenta.display_name" type="text" autocomplete="name" required maxlength="255" /></label>
            <label>Contraseña<input v-model="formularioSolicitudCuenta.password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>
          </template>
          <p v-else class="request-dialog-intro">Google verificará tu correo y nombre. No se creará la cuenta hasta que un administrador apruebe la solicitud.</p>
          <template v-if="formularioSolicitudCuenta.rol === 'jugador'">
            <div class="form-row">
              <label>Nickname<input v-model.trim="formularioSolicitudCuenta.nickname" required maxlength="255" /></label>
              <label>Nombre real<input v-model.trim="formularioSolicitudCuenta.nombre_real" required maxlength="255" /></label>
            </div>
            <div class="form-row">
              <label>País<input v-model.trim="formularioSolicitudCuenta.pais" required maxlength="255" /></label>
              <label>Rol en el juego<select v-model="formularioSolicitudCuenta.rol_jugador"><option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option></select></label>
            </div>
          </template>
          <p v-if="errorSolicitudCuenta" class="form-error" role="alert">{{ errorSolicitudCuenta }}</p>
          <div class="dialog-actions">
            <button type="button" class="secondary-button" :disabled="procesandoSolicitudCuenta" @click="dialogoSolicitudCuenta = false">Cancelar</button>
            <button class="primary-button" :disabled="procesandoSolicitudCuenta">{{ procesandoSolicitudCuenta ? 'Enviando…' : 'Enviar solicitud' }}</button>
          </div>
        </div>
      </form>
    </div>
  </main>
</template>
