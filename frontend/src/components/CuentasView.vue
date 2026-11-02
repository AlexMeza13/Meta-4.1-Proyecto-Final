<script setup>
import { onMounted } from 'vue';

const { app } = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const {
  sesion,
  usuarios,
  edicionesUsuario,
  formularioUsuario,
  jugadoresSinCuenta,
  nombreVisibleCuenta,
  obtenerJugadoresDisponiblesParaCuenta,
  hayCambiosEnCuenta,
  actualizarDatos,
  cargarCuentas,
  cargarJugadores,
  crearCuenta,
  cambiarMetodoAutenticacion,
  guardarCambiosCuenta
} = app;

onMounted(() => {
  actualizarDatos(cargarCuentas);
  actualizarDatos(cargarJugadores);
});
</script>

<template>
  <section class="data-card account-create-card">
    <div class="section-heading"><div><h2>Crear cuenta</h2><p>Elige cómo iniciará sesión esta cuenta.</p></div></div>
    <form class="account-create-form" @submit.prevent="crearCuenta">
      <label>Correo electrónico<input v-model.trim="formularioUsuario.email" type="email" autocomplete="off" required maxlength="254" /></label>
      <label>Método de inicio<select v-model="formularioUsuario.auth_method" @change="cambiarMetodoAutenticacion"><option value="password">Correo y contraseña</option><option value="google">Google</option></select></label>
      <label v-if="formularioUsuario.rol !== 'jugador' && formularioUsuario.auth_method === 'password'">Nombre completo<input v-model.trim="formularioUsuario.display_name" type="text" autocomplete="name" required maxlength="255" /></label>
      <label v-if="formularioUsuario.auth_method === 'password'">Contraseña inicial<input v-model="formularioUsuario.password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>
      <p v-else class="account-help">El nombre y la foto se obtendrán del perfil de Google al iniciar sesión.</p>
      <label>Rol<select v-model="formularioUsuario.rol" @change="formularioUsuario.id_jugador = 0"><option value="entrenador">Entrenador</option><option value="jugador">Jugador</option><option value="admin">Admin</option></select></label>
      <label v-if="formularioUsuario.rol === 'jugador'">Perfil de jugador<select v-model.number="formularioUsuario.id_jugador" required><option :value="0" disabled>Selecciona un perfil</option><option v-for="jugador in jugadoresSinCuenta" :key="jugador.id" :value="jugador.id">{{ jugador.nickname }}</option></select></label>
      <p v-if="formularioUsuario.rol === 'jugador' && !jugadoresSinCuenta.length" class="account-help">Todos los perfiles ya tienen cuenta vinculada.</p>
      <button class="primary-button" :disabled="formularioUsuario.rol === 'jugador' && (!jugadoresSinCuenta.length || !formularioUsuario.id_jugador)">Crear cuenta</button>
    </form>
  </section>

  <section class="data-card account-list-card">
    <div class="section-heading"><div><h2>Cuentas registradas</h2><p>{{ usuarios.length }} cuentas</p></div></div>
    <div v-if="usuarios.length" class="table-wrap">
      <table>
        <thead><tr><th>NOMBRE</th><th>CORREO</th><th>ACCESO</th><th>ROL</th><th>PERFIL</th><th>ESTADO</th><th>CREADA</th><th></th></tr></thead>
        <tbody>
          <tr v-for="usuario in usuarios" :key="usuario.id">
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
            <td><select v-model="edicionesUsuario[usuario.id].rol" class="account-select" :disabled="usuario.id === sesion.id" :aria-label="`Rol de ${usuario.email}`"><option value="admin">Admin</option><option value="entrenador">Entrenador</option><option value="jugador">Jugador</option></select></td>
            <td><select v-model.number="edicionesUsuario[usuario.id].id_jugador" class="account-select" :disabled="edicionesUsuario[usuario.id].rol !== 'jugador' || usuario.id === sesion.id" :aria-label="`Perfil vinculado a ${usuario.email}`"><option :value="0" disabled>Selecciona perfil</option><option v-for="jugador in obtenerJugadoresDisponiblesParaCuenta(usuario)" :key="jugador.id" :value="jugador.id">{{ jugador.nickname }}</option></select></td>
            <td><select v-model="edicionesUsuario[usuario.id].estado" class="account-select" :disabled="usuario.id === sesion.id" :aria-label="`Estado de ${usuario.email}`"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></td>
            <td>{{ new Date(usuario.createdAt).toLocaleDateString() }}</td>
            <td><button class="row-action-button" :disabled="usuario.id === sesion.id || !hayCambiosEnCuenta(usuario)" @click="guardarCambiosCuenta(usuario)">Guardar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state"><strong>No hay cuentas registradas</strong></div>
  </section>
</template>
