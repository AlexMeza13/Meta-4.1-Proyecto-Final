<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  form: {
    type: Object,
    required: true
  },
  roles: {
    type: Array,
    default: () => []
  },
  busy: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['submit', 'cancel', 'method-change', 'role-change']);

function cancelar() {
  if (!props.busy) emit('cancel');
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop" role="presentation" @click.self="cancelar">
    <form
      class="dialog request-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-account-title"
      @submit.prevent="emit('submit')"
    >
      <div class="request-dialog-image" role="img" aria-label="Ilustración de League of Legends"></div>
      <div class="request-dialog-content">
        <div class="dialog-heading">
          <div>
            <h2 id="create-account-title">Crear cuenta</h2>
            <p class="request-dialog-intro">
              {{ mode === 'request'
                ? 'El administrador revisará tus datos antes de crear la cuenta.'
                : form.rol === 'jugador'
                  ? 'Se crearán la cuenta y el perfil del jugador al mismo tiempo.'
                : 'La cuenta se creará directamente con el rol seleccionado.' }}
            </p>
          </div>
          <button type="button" class="close-detail" aria-label="Cerrar" :disabled="busy" @click="cancelar">×</button>
        </div>

        <label>{{ mode === 'request' ? 'Tipo de cuenta' : 'Rol' }}
          <select v-model="form.rol" :disabled="busy" @change="emit('role-change')">
            <option v-if="mode === 'admin'" value="admin">Admin</option>
            <option value="entrenador">Entrenador</option>
            <option value="jugador">Jugador</option>
          </select>
        </label>
        <label>Método de inicio
          <select v-model="form.auth_method" :disabled="busy" @change="emit('method-change')">
            <option value="password">Correo y contraseña</option>
            <option value="google">Google</option>
          </select>
        </label>

        <template v-if="form.auth_method === 'password'">
          <label v-if="form.rol !== 'jugador'">Nombre completo
            <input v-model.trim="form.display_name" type="text" autocomplete="name" required maxlength="255" />
          </label>
        </template>
        <label v-if="mode === 'admin' || form.auth_method === 'password'">Correo electrónico
          <input v-model.trim="form.email" type="email" autocomplete="email" required maxlength="254" />
        </label>
        <template v-if="form.auth_method === 'password'">
          <label>Contraseña
            <input v-model="form.password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" />
          </label>
        </template>
        <p v-else class="request-dialog-intro">
          {{ mode === 'request'
            ? 'Google verificará tu correo y nombre. No se creará la cuenta hasta que un administrador apruebe la solicitud.'
            : 'El nombre y la foto se obtendrán del perfil de Google al iniciar sesión.' }}
        </p>

        <template v-if="form.rol === 'jugador'">
          <div class="form-row">
            <label>Nickname<input v-model.trim="form.nickname" required maxlength="255" /></label>
            <label>Nombre real<input v-model.trim="form.nombre_real" required maxlength="255" /></label>
          </div>
          <div class="form-row">
            <label>País<input v-model.trim="form.pais" required maxlength="255" /></label>
            <label>Rol en el juego
              <select v-model="form.rol_jugador">
                <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
              </select>
            </label>
          </div>
        </template>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <div class="dialog-actions">
          <button type="button" class="secondary-button" :disabled="busy" @click="cancelar">Cancelar</button>
          <button class="primary-button" :disabled="busy">
            {{ busy ? 'Creando…' : mode === 'request' ? 'Enviar solicitud' : 'Crear cuenta' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
