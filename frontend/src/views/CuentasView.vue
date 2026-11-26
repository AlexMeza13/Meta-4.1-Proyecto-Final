<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import CrearCuentaDialog from '../components/CrearCuentaDialog.vue';
import { sesionActiva } from '../router/index.js';
import { api } from '../services/api.js';
import { useNotifications } from '../composables/useNotifications.js';

const ordenRolesCuenta = { admin: 0, entrenador: 1, jugador: 2 };
const sesion = sesionActiva;
const { mostrarAviso } = useNotifications();
const usuarios = ref([]);
const edicionesUsuario = reactive({});
const formularioUsuario = reactive({
  email: '',
  password: '',
  display_name: '',
  auth_method: 'password',
  rol: 'entrenador',
  nickname: '',
  nombre_real: '',
  pais: '',
  rol_jugador: 'Top'
});
const procesando = ref(false);
const roles = ref(['Top', 'Jungle', 'Mid', 'ADC', 'Support']);
const busquedaCuenta = ref('');
const dialogoCrearCuenta = ref(false);
const dialogoPerfilJugador = ref(false);
const cuentaParaConvertir = ref(null);
const guardandoPerfilJugador = ref(false);
const formularioPerfilJugador = reactive({
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Top'
});
const rolCuenta = ref('');
const accesoCuenta = ref('');
const estadoCuenta = ref('');
const cuentasFiltradas = computed(() => {
  const busqueda = busquedaCuenta.value.trim().toLocaleLowerCase();
  return usuarios.value.filter((usuario) =>
    (!busqueda || [nombreVisibleCuenta(usuario), usuario.email].some((dato) => dato?.toLocaleLowerCase().includes(busqueda))) &&
    (!rolCuenta.value || usuario.rol === rolCuenta.value) &&
    (!accesoCuenta.value || usuario.auth_method === accesoCuenta.value) &&
    (!estadoCuenta.value || usuario.estado === estadoCuenta.value)
  ).sort((a, b) =>
    ordenRolesCuenta[a.rol] - ordenRolesCuenta[b.rol] ||
    a.email.localeCompare(b.email, 'es', { sensitivity: 'base' })
  );
});

onMounted(async () => {
  try {
    await cargarCuentas();
    roles.value = await api.getRoles();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
});

async function cargarCuentas() {
  usuarios.value = await api.listUsers();
  for (const id of Object.keys(edicionesUsuario)) delete edicionesUsuario[id];
  for (const usuario of usuarios.value) {
    edicionesUsuario[usuario.id] = {
      rol: usuario.rol,
      estado: usuario.estado,
      display_name: usuario.display_name || ''
    };
  }
}

const nombreVisibleCuenta = (usuario) => usuario.rol === 'jugador'
  ? usuario.jugador?.nickname || usuario.email.split('@')[0]
  : usuario.display_name || usuario.email.split('@')[0];

function hayCambiosEnCuenta(usuario) {
  const edicion = edicionesUsuario[usuario.id];
  return edicion.rol !== usuario.rol ||
    edicion.estado !== usuario.estado ||
    (usuario.rol !== 'jugador' &&
      edicion.display_name.trim() !== (usuario.display_name || ''));
}

function cambiarMetodoAutenticacion() {
  if (formularioUsuario.auth_method === 'google') {
    formularioUsuario.password = '';
    formularioUsuario.display_name = '';
  }
}

async function crearCuenta() {
  procesando.value = true;
  try {
    const nuevoUsuario = {
      email: formularioUsuario.email,
      auth_method: formularioUsuario.auth_method,
      rol: formularioUsuario.rol,
      ...(formularioUsuario.rol === 'jugador' && {
        jugador: {
          nickname: formularioUsuario.nickname,
          nombre_real: formularioUsuario.nombre_real,
          pais: formularioUsuario.pais,
          rol: formularioUsuario.rol_jugador
        }
      })
    };
    if (formularioUsuario.rol !== 'jugador' && formularioUsuario.auth_method === 'password') {
      nuevoUsuario.display_name = formularioUsuario.display_name;
    }
    if (formularioUsuario.auth_method === 'password') nuevoUsuario.password = formularioUsuario.password;

    await api.createUser(nuevoUsuario);
    Object.assign(formularioUsuario, {
      email: '',
      password: '',
      display_name: '',
      auth_method: 'password',
      rol: 'entrenador',
      nickname: '',
      nombre_real: '',
      pais: '',
      rol_jugador: roles.value[0] || 'Top'
    });
    try {
      await cargarCuentas();
    } catch (error) {
      mostrarAviso(`La cuenta se creó, pero no se pudo actualizar la lista: ${error.message}`, 'error');
      return true;
    }
    mostrarAviso('Cuenta creada.');
    return true;
  } catch (error) {
    mostrarAviso(error.message, 'error');
    return false;
  } finally {
    procesando.value = false;
  }
}

async function guardarCambiosCuenta(usuario, perfilJugador = null) {
  const edicion = edicionesUsuario[usuario.id];
  const cambios = {
    rol: perfilJugador ? 'jugador' : edicion.rol,
    estado: edicion.estado
  };
  if (perfilJugador) cambios.jugador = perfilJugador;
  if (cambios.rol !== 'jugador') cambios.display_name = edicion.display_name;

  try {
    await api.updateUser(usuario.id, cambios);
    await cargarCuentas();
    mostrarAviso('Cuenta actualizada.');
    return true;
  } catch (error) {
    mostrarAviso(error.message, 'error');
    try {
      await cargarCuentas();
    } catch (refreshError) {
      mostrarAviso(`No se pudo actualizar la lista de cuentas: ${refreshError.message}`, 'error');
    }
    return false;
  }
}

function abrirDialogoCrearCuenta() {
  Object.assign(formularioUsuario, {
    email: '',
    password: '',
    display_name: '',
    auth_method: 'password',
    rol: 'jugador',
    nickname: '',
    nombre_real: '',
    pais: '',
    rol_jugador: 'Top'
  });
  dialogoCrearCuenta.value = true;
}

async function crearCuentaDesdeDialogo() {
  if (!await crearCuenta()) return;
  busquedaCuenta.value = '';
  rolCuenta.value = '';
  accesoCuenta.value = '';
  estadoCuenta.value = '';
  dialogoCrearCuenta.value = false;
}

function cambiarRolCuenta(usuario) {
  if (usuario.rol !== 'entrenador' || edicionesUsuario[usuario.id].rol !== 'jugador') return;

  cuentaParaConvertir.value = usuario;
  Object.assign(formularioPerfilJugador, {
    nickname: '',
    nombre_real: '',
    pais: '',
    rol: roles.value[0] || 'Top'
  });
  dialogoPerfilJugador.value = true;
}

function cancelarCambioRol() {
  if (guardandoPerfilJugador.value) return;
  const usuario = cuentaParaConvertir.value;
  if (usuario) edicionesUsuario[usuario.id].rol = usuario.rol;
  dialogoPerfilJugador.value = false;
  cuentaParaConvertir.value = null;
}

async function guardarPerfilJugador() {
  const usuario = cuentaParaConvertir.value;
  if (!usuario || guardandoPerfilJugador.value) return;

  guardandoPerfilJugador.value = true;
  try {
    if (await guardarCambiosCuenta(usuario, { ...formularioPerfilJugador })) {
      dialogoPerfilJugador.value = false;
      cuentaParaConvertir.value = null;
    }
  } finally {
    guardandoPerfilJugador.value = false;
  }
}
</script>

<template>
  <div class="page-heading">
    <h1>Cuentas</h1>
    <button class="primary-button" type="button" @click="abrirDialogoCrearCuenta">＋ Crear cuenta</button>
  </div>

  <section class="data-card account-list-card">
    <div class="section-heading"><div><h2>Cuentas registradas</h2><p>{{ cuentasFiltradas.length }} de {{ usuarios.length }} cuentas</p></div></div>
    <div v-if="usuarios.length" class="list-filters" aria-label="Filtros de cuentas">
      <label class="list-filter-search">Buscar
        <input v-model="busquedaCuenta" type="search" placeholder="Nombre o correo" />
      </label>
      <label>Rol
        <select v-model="rolCuenta">
          <option value="">Todos</option>
          <option value="admin">Admin</option>
          <option value="entrenador">Entrenador</option>
          <option value="jugador">Jugador</option>
        </select>
      </label>
      <label>Acceso
        <select v-model="accesoCuenta">
          <option value="">Todos</option>
          <option value="google">Google</option>
          <option value="password">Correo y contraseña</option>
        </select>
      </label>
      <label>Estado
        <select v-model="estadoCuenta">
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>
    </div>
    <div v-if="cuentasFiltradas.length" class="table-wrap">
      <table>
        <thead><tr><th>NOMBRE</th><th>CORREO</th><th>ACCESO</th><th>ROL</th><th>NICKNAME</th><th>ESTADO</th><th>CREADA</th><th></th></tr></thead>
        <tbody>
          <tr v-for="usuario in cuentasFiltradas" :key="usuario.id">
            <td>
              <div class="user-cell">
                <img v-if="usuario.avatar_url" :src="usuario.avatar_url" alt="" class="profile-avatar profile-avatar-image" referrerpolicy="no-referrer" />
                <span v-else class="profile-avatar">{{ nombreVisibleCuenta(usuario).slice(0, 1).toUpperCase() }}</span>
                <span v-if="usuario.rol === 'jugador'">{{ nombreVisibleCuenta(usuario) }}</span>
                <input v-else v-model.trim="edicionesUsuario[usuario.id].display_name" class="account-select" type="text" :disabled="usuario.id === sesion.id && usuario.rol !== 'admin'" :placeholder="nombreVisibleCuenta(usuario)" maxlength="255" :aria-label="`Nombre de ${usuario.email}`" />
                <span v-if="usuario.id === sesion.id" class="self-label">Tú</span>
              </div>
            </td>
            <td>{{ usuario.email }}</td>
            <td>{{ usuario.auth_method === 'google' ? 'Google' : 'Correo y contraseña' }}</td>
            <td>
              <select
                v-model="edicionesUsuario[usuario.id].rol"
                class="account-select"
                :disabled="usuario.id === sesion.id || usuario.rol === 'admin'"
                :aria-label="`Rol de ${usuario.email}`"
                @change="cambiarRolCuenta(usuario)"
              >
                <option v-if="usuario.rol === 'admin'" value="admin">Admin</option>
                <template v-else>
                  <option value="entrenador">Entrenador</option>
                  <option value="jugador">Jugador</option>
                </template>
              </select>
            </td>
            <td>{{ usuario.jugador?.nickname || '—' }}</td>
            <td><select v-model="edicionesUsuario[usuario.id].estado" class="account-select" :disabled="usuario.id === sesion.id" :aria-label="`Estado de ${usuario.email}`"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></td>
            <td>{{ new Date(usuario.createdAt).toLocaleDateString() }}</td>
            <td><button class="row-action-button" :disabled="usuario.id === sesion.id || !hayCambiosEnCuenta(usuario)" @click="guardarCambiosCuenta(usuario)">Guardar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="usuarios.length" class="empty-state"><strong>No hay cuentas que coincidan</strong><p>Prueba cambiando o limpiando los filtros.</p></div>
    <div v-else class="empty-state"><strong>No hay cuentas registradas</strong></div>
  </section>

  <CrearCuentaDialog
    :visible="dialogoCrearCuenta"
    mode="admin"
    :form="formularioUsuario"
    :roles="roles"
    :busy="procesando"
    @submit="crearCuentaDesdeDialogo"
    @cancel="dialogoCrearCuenta = false"
    @method-change="cambiarMetodoAutenticacion"
  />

  <div v-if="dialogoPerfilJugador" class="modal-backdrop" role="presentation" @click.self="cancelarCambioRol">
    <form
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convertir-jugador-title"
      @submit.prevent="guardarPerfilJugador"
    >
      <div class="dialog-heading">
        <div>
          <h2 id="convertir-jugador-title">Cambiar a jugador</h2>
          <p>Completa el perfil que se asociará a {{ cuentaParaConvertir?.email }}.</p>
        </div>
        <button type="button" class="close-detail" aria-label="Cerrar" :disabled="guardandoPerfilJugador" @click="cancelarCambioRol">×</button>
      </div>
      <label>Nickname<input v-model.trim="formularioPerfilJugador.nickname" required maxlength="255" /></label>
      <label>Nombre real<input v-model.trim="formularioPerfilJugador.nombre_real" required maxlength="255" /></label>
      <div class="form-row">
        <label>País<input v-model.trim="formularioPerfilJugador.pais" required maxlength="255" /></label>
        <label>Rol en el juego
          <select v-model="formularioPerfilJugador.rol">
            <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
          </select>
        </label>
      </div>
      <div class="dialog-actions">
        <button type="button" class="secondary-button" :disabled="guardandoPerfilJugador" @click="cancelarCambioRol">Cancelar</button>
        <button class="primary-button" :disabled="guardandoPerfilJugador">{{ guardandoPerfilJugador ? 'Guardando…' : 'Crear perfil y cambiar rol' }}</button>
      </div>
    </form>
  </div>
</template>
