<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from './services/api.js';
import { sesionActiva, sesionLista } from './router/index.js';
import PanelLayout from './components/PanelLayout.vue';

const enrutador = useRouter();
const rutaActual = useRoute();
const sesion = sesionActiva;
const formularioInicioSesion = reactive({ email: '', password: '' });
const errorInicioSesion = ref('');
const mensajeSolicitudInicioSesion = ref('');
const procesando = ref(false);
const jugadores = ref([]);
const rosters = ref([]);
const usuarios = ref([]);
const solicitudesCuenta = ref([]);
const edicionesUsuario = reactive({});
const rosterSeleccionado = ref(null);
const jugadoresRoster = ref([]);
const roles = ref(['Top', 'Jungle', 'Mid', 'ADC', 'Support']);
const estados = ref(['activo', 'inactivo']);
const tiposRoster = ref(['Principal', 'Academy']);
const procesandoAlineacion = ref(false);
const formularioAsignacion = reactive({ idJugador: 0, rol: 'Titular' });
const aviso = ref('');
const tipoAviso = ref('success');
const dialogoJugador = ref(false);
const dialogoRoster = ref(false);
const dialogoSolicitudCuenta = ref(false);
const procesandoSolicitudCuenta = ref(false);
const errorSolicitudCuenta = ref('');
const formularioSolicitudCuenta = reactive({
  auth_method: 'password',
  email: '',
  password: '',
  display_name: '',
  rol: 'entrenador',
  nickname: '',
  nombre_real: '',
  pais: '',
  rol_jugador: 'Top'
});
const idJugadorEditado = ref(null);
const idRosterEditado = ref(null);
const formularioJugador = reactive({
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Top',
  estado: 'activo'
});
const formularioRoster = reactive({
  nombre: '',
  tipo: 'Principal',
  temporada: new Date().getFullYear().toString()
});
const formularioUsuario = reactive({
  email: '',
  password: '',
  display_name: '',
  auth_method: 'password',
  rol: 'entrenador',
  id_jugador: 0
});

const jugadoresDisponiblesParaRoster = computed(() => {
  const idsAsignados = new Set(jugadoresRoster.value.map((jugador) => jugador.id));
  return jugadores.value.filter((jugador) => !idsAsignados.has(jugador.id));
});
const titularesRoster = computed(() =>
  jugadoresRoster.value.filter((jugador) => jugador.rol_en_roster === 'Titular')
);
const errorAsignacionRoster = computed(() => {
  if (formularioAsignacion.rol !== 'Titular' || !formularioAsignacion.idJugador) return '';
  const jugador = jugadoresDisponiblesParaRoster.value.find(
    (elemento) => elemento.id === Number(formularioAsignacion.idJugador)
  );
  return jugador ? obtenerErrorTitular(jugador) : '';
});
const jugadoresSinCuenta = computed(() => jugadores.value.filter((jugador) =>
  !usuarios.value.some((usuario) => usuario.id_jugador === jugador.id)
));
const nombreJugador = computed(() =>
  jugadoresRoster.value.find((jugador) => jugador.id === sesion.value?.id_jugador)?.nickname ||
  sesion.value?.email?.split('@')[0] ||
  'Jugador'
);
const nombreVisibleCuenta = (usuario) => usuario.rol === 'jugador'
  ? usuario.jugador?.nickname || usuario.email.split('@')[0]
  : usuario.display_name || usuario.email.split('@')[0];

function obtenerErrorTitular(jugador, idIgnorado = null) {
  const otrosTitulares = titularesRoster.value.filter((titular) => titular.id !== idIgnorado);
  if (otrosTitulares.length >= 5) {
    return 'El roster ya tiene el máximo de 5 titulares.';
  }
  if (otrosTitulares.some((titular) => titular.rol === jugador.rol)) {
    return `Ya hay un titular con la posición ${jugador.rol}.`;
  }
  return '';
}

function obtenerErrorCambioRolRoster(jugador) {
  if (jugador.rol_en_roster === 'Titular') return '';
  return obtenerErrorTitular(jugador, jugador.id);
}

function mostrarAviso(mensaje, tipo = 'success') {
  aviso.value = mensaje;
  tipoAviso.value = tipo;
  window.clearTimeout(mostrarAviso.timeout);
  mostrarAviso.timeout = window.setTimeout(() => { aviso.value = ''; }, 3600);
}

async function cargarJugadores() {
  jugadores.value = await api.listPlayers();
}

async function cargarRosters() {
  rosters.value = await api.listRosters();
}

async function cargarCuentas() {
  usuarios.value = await api.listUsers();
  for (const id of Object.keys(edicionesUsuario)) delete edicionesUsuario[id];
  for (const usuario of usuarios.value) {
    edicionesUsuario[usuario.id] = {
      rol: usuario.rol,
      estado: usuario.estado,
      id_jugador: usuario.id_jugador ?? 0,
      display_name: usuario.display_name || ''
    };
  }
}

async function cargarSolicitudes() {
  solicitudesCuenta.value = await api.listAccountRequests();
}

async function cargarDatosPanel() {
  if (sesion.value?.rol === 'jugador') {
    try {
      await cargarRosters();
      if (rosters.value.length) {
        await cargarDetalleRoster(rosters.value[0].id);
      } else {
        rosterSeleccionado.value = null;
        jugadoresRoster.value = [];
      }
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
    return;
  }

  const promesasCarga = [
    cargarJugadores(),
    cargarRosters(),
    api.getRoles(),
    api.getStates(),
    api.getRosterTypes()
  ];
  if (sesion.value?.rol === 'admin') {
    promesasCarga.push(cargarCuentas(), cargarSolicitudes());
  }

  const resultadosCarga = await Promise.allSettled(promesasCarga);

  if (resultadosCarga[2].status === 'fulfilled') roles.value = resultadosCarga[2].value;
  if (resultadosCarga[3].status === 'fulfilled') estados.value = resultadosCarga[3].value;
  if (resultadosCarga[4].status === 'fulfilled') tiposRoster.value = resultadosCarga[4].value;

  const cargaFallida = resultadosCarga.find((resultado, indice) =>
    (indice < 2 || indice >= 5) && resultado.status === 'rejected'
  );
  if (cargaFallida) mostrarAviso(cargaFallida.reason.message, 'error');
}

async function iniciarSesion() {
  errorInicioSesion.value = '';
  procesando.value = true;
  try {
    const respuesta = await api.login(formularioInicioSesion.email, formularioInicioSesion.password);
    sesion.value = respuesta.usuario;
    formularioInicioSesion.password = '';
    await cargarDatosPanel();
    await enrutador.push(sesion.value.rol === 'jugador'
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
      rol: 'entrenador',
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

async function aprobarSolicitudCuenta(solicitud) {
  try {
    await api.approveAccountRequest(solicitud.id);
    await Promise.all([cargarSolicitudes(), cargarCuentas(), cargarJugadores()]);
    mostrarAviso('Solicitud aprobada y cuenta creada.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function rechazarSolicitudCuenta(solicitud) {
  try {
    await api.rejectAccountRequest(solicitud.id);
    await cargarSolicitudes();
    mostrarAviso('Solicitud rechazada.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function cerrarSesion() {
  procesando.value = true;
  try {
    await api.logout();
    sesion.value = null;
    rosterSeleccionado.value = null;
    await enrutador.replace({ name: 'login' });
    mostrarAviso('Sesión cerrada correctamente.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    procesando.value = false;
  }
}

async function actualizarDatos(funcionCarga) {
  try {
    await funcionCarga();
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function restablecerFormularioJugador() {
  Object.assign(formularioJugador, {
    nickname: '',
    nombre_real: '',
    pais: '',
    rol: roles.value[0] || 'Top',
    estado: estados.value[0] || 'activo'
  });
  idJugadorEditado.value = null;
}

function abrirDialogoJugador(jugador = null) {
  restablecerFormularioJugador();
  if (jugador) {
    idJugadorEditado.value = jugador.id;
    Object.assign(formularioJugador, {
      nickname: jugador.nickname,
      nombre_real: jugador.nombre_real,
      pais: jugador.pais,
      rol: jugador.rol,
      estado: jugador.estado
    });
  }
  dialogoJugador.value = true;
}

async function guardarJugador() {
  procesando.value = true;
  try {
    if (idJugadorEditado.value) {
      await api.updatePlayer(idJugadorEditado.value, { ...formularioJugador });
      mostrarAviso('Jugador actualizado.');
    } else {
      await api.createPlayer({ ...formularioJugador });
      mostrarAviso('Jugador agregado al roster pool.');
    }
    dialogoJugador.value = false;
    await cargarJugadores();
    if (rosterSeleccionado.value) await abrirRoster(rosterSeleccionado.value.id);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    procesando.value = false;
  }
}

async function eliminarJugador(jugador) {
  try {
    await api.deletePlayer(jugador.id);
    await cargarJugadores();
    if (rosterSeleccionado.value) await abrirRoster(rosterSeleccionado.value.id);
    mostrarAviso('Jugador eliminado.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function abrirDialogoRoster(roster = null) {
  idRosterEditado.value = roster?.id ?? null;
  Object.assign(formularioRoster, roster ? {
    nombre: roster.nombre,
    tipo: roster.tipo,
    temporada: roster.temporada
  } : {
    nombre: '',
    tipo: tiposRoster.value[0] || 'Principal',
    temporada: new Date().getFullYear().toString()
  });
  dialogoRoster.value = true;
}

async function guardarRoster() {
  procesando.value = true;
  try {
    if (idRosterEditado.value) {
      await api.updateRoster(idRosterEditado.value, { ...formularioRoster });
      mostrarAviso('Roster actualizado.');
    } else {
      await api.createRoster({ ...formularioRoster });
      mostrarAviso('Roster creado.');
    }
    dialogoRoster.value = false;
    await cargarRosters();
    if (rosterSeleccionado.value) await abrirRoster(rosterSeleccionado.value.id);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    procesando.value = false;
  }
}

async function cargarDetalleRoster(id) {
  const [roster, integrantesRoster] = await Promise.all([
    api.getRoster(id),
    api.getRosterPlayers(id)
  ]);
  rosterSeleccionado.value = roster;
  jugadoresRoster.value = integrantesRoster;
  formularioAsignacion.idJugador = jugadoresDisponiblesParaRoster.value[0]?.id ?? 0;
  formularioAsignacion.rol = 'Titular';
}

async function abrirRoster(id) {
  try {
    await cargarDetalleRoster(id);
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function asignarJugadorARoster() {
  if (!rosterSeleccionado.value || !formularioAsignacion.idJugador) return;

  if (errorAsignacionRoster.value) {
    mostrarAviso(errorAsignacionRoster.value, 'error');
    return;
  }

  procesandoAlineacion.value = true;
  const idRoster = rosterSeleccionado.value.id;
  try {
    await api.assignPlayerToRoster(idRoster, {
      id_jugador: Number(formularioAsignacion.idJugador),
      rol_en_roster: formularioAsignacion.rol
    });
    await cargarDetalleRoster(idRoster);
    mostrarAviso('Jugador asignado al roster.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    procesandoAlineacion.value = false;
  }
}

async function cambiarRolJugadorEnRoster(jugador, rol) {
  if (!rosterSeleccionado.value || rol === jugador.rol_en_roster) return;

  if (rol === 'Titular') {
    const errorValidacion = obtenerErrorCambioRolRoster(jugador);
    if (errorValidacion) {
      mostrarAviso(errorValidacion, 'error');
      return;
    }
  }

  procesandoAlineacion.value = true;
  const idRoster = rosterSeleccionado.value.id;
  try {
    await api.updateRosterPlayerRole(idRoster, jugador.id, rol);
    await cargarDetalleRoster(idRoster);
    mostrarAviso('Rol actualizado.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
    try {
      await cargarDetalleRoster(idRoster);
    } catch (errorAlActualizar) {
      mostrarAviso(`No se pudo actualizar la alineación: ${errorAlActualizar.message}`, 'error');
    }
  } finally {
    procesandoAlineacion.value = false;
  }
}

async function quitarJugadorDeRoster(jugador) {
  if (!rosterSeleccionado.value) return;
  procesandoAlineacion.value = true;
  const idRoster = rosterSeleccionado.value.id;
  try {
    await api.removePlayerFromRoster(idRoster, jugador.id);
    await cargarDetalleRoster(idRoster);
    mostrarAviso('Jugador quitado del roster.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  } finally {
    procesandoAlineacion.value = false;
  }
}

async function eliminarRoster(roster) {
  try {
    await api.deleteRoster(roster.id);
    if (rosterSeleccionado.value?.id === roster.id) rosterSeleccionado.value = null;
    await cargarRosters();
    mostrarAviso('Roster eliminado.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

async function crearCuenta() {
  try {
    const nuevoUsuario = {
      email: formularioUsuario.email,
      auth_method: formularioUsuario.auth_method,
      rol: formularioUsuario.rol,
      id_jugador: formularioUsuario.rol === 'jugador' ? Number(formularioUsuario.id_jugador) : undefined
    };
    if (formularioUsuario.rol !== 'jugador' && formularioUsuario.auth_method === 'password') {
      nuevoUsuario.display_name = formularioUsuario.display_name;
    }
    if (formularioUsuario.auth_method === 'password') nuevoUsuario.password = formularioUsuario.password;

    await api.createUser({
      ...nuevoUsuario
    });
    formularioUsuario.email = '';
    formularioUsuario.password = '';
    formularioUsuario.display_name = '';
    formularioUsuario.auth_method = 'password';
    formularioUsuario.rol = 'entrenador';
    formularioUsuario.id_jugador = 0;
    await cargarCuentas();
    mostrarAviso('Cuenta creada.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
  }
}

function cambiarMetodoAutenticacion() {
  if (formularioUsuario.auth_method === 'google') {
    formularioUsuario.password = '';
    formularioUsuario.display_name = '';
  }
}

function obtenerJugadoresDisponiblesParaCuenta(usuario) {
  return jugadores.value.filter((jugador) =>
    !usuarios.value.some((otroUsuario) =>
      otroUsuario.id !== usuario.id && otroUsuario.id_jugador === jugador.id
    )
  );
}

function hayCambiosEnCuenta(usuario) {
  const edicion = edicionesUsuario[usuario.id];
  return edicion.rol !== usuario.rol ||
    edicion.estado !== usuario.estado ||
    Number(edicion.id_jugador || 0) !== Number(usuario.id_jugador || 0) ||
    (usuario.rol !== 'jugador' &&
      edicion.display_name.trim() !== (usuario.display_name || ''));
}

async function guardarCambiosCuenta(usuario) {
  const edicion = edicionesUsuario[usuario.id];
  const cambios = {
    rol: edicion.rol,
    estado: edicion.estado,
    id_jugador: edicion.rol === 'jugador' ? Number(edicion.id_jugador) : null
  };
  if (edicion.rol !== 'jugador') cambios.display_name = edicion.display_name;
  try {
    await api.updateUser(usuario.id, cambios);
    await cargarCuentas();
    mostrarAviso('Cuenta actualizada.');
  } catch (error) {
    mostrarAviso(error.message, 'error');
    await actualizarDatos(cargarCuentas);
  }
}

const app = {
  sesion,
  formularioInicioSesion,
  errorInicioSesion,
  mensajeSolicitudInicioSesion,
  procesando,
  jugadores,
  rosters,
  usuarios,
  solicitudesCuenta,
  edicionesUsuario,
  rosterSeleccionado,
  jugadoresRoster,
  roles,
  estados,
  tiposRoster,
  procesandoAlineacion,
  formularioAsignacion,
  aviso,
  tipoAviso,
  dialogoJugador,
  dialogoRoster,
  dialogoSolicitudCuenta,
  procesandoSolicitudCuenta,
  errorSolicitudCuenta,
  formularioSolicitudCuenta,
  idJugadorEditado,
  idRosterEditado,
  formularioJugador,
  formularioRoster,
  formularioUsuario,
  jugadoresDisponiblesParaRoster,
  errorAsignacionRoster,
  obtenerErrorCambioRolRoster,
  jugadoresSinCuenta,
  nombreJugador,
  nombreVisibleCuenta,
  mostrarAviso,
  cargarJugadores,
  cargarRosters,
  cargarCuentas,
  cargarSolicitudes,
  iniciarSesion,
  iniciarSesionGoogle,
  abrirSolicitudCuenta,
  cambiarMetodoSolicitud,
  enviarSolicitudCuenta,
  aprobarSolicitudCuenta,
  rechazarSolicitudCuenta,
  cerrarSesion,
  actualizarDatos,
  restablecerFormularioJugador,
  abrirDialogoJugador,
  guardarJugador,
  eliminarJugador,
  abrirDialogoRoster,
  guardarRoster,
  cargarDetalleRoster,
  abrirRoster,
  asignarJugadorARoster,
  cambiarRolJugadorEnRoster,
  quitarJugadorDeRoster,
  eliminarRoster,
  crearCuenta,
  cambiarMetodoAutenticacion,
  obtenerJugadoresDisponiblesParaCuenta,
  hayCambiosEnCuenta,
  guardarCambiosCuenta
};

onMounted(async () => {
  const estadoGoogle = new URLSearchParams(window.location.search).get('google');
  const estadoSolicitud = new URLSearchParams(window.location.search).get('request');
  if (estadoGoogle || estadoSolicitud) {
    window.history.replaceState({}, document.title, window.location.pathname);
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

  try {
    const respuesta = await api.verifySession();
    sesion.value = respuesta.usuario;
    await cargarDatosPanel();
    if (estadoGoogle === 'success') {
      mostrarAviso('Inicio de sesión con Google exitoso.');
    }
  } catch (error) {
    if (estadoGoogle && estadoGoogle !== 'success') {
      const erroresGoogle = {
        cancelled: 'Cancelaste el inicio de sesión con Google.',
        invalid_response: 'Google no devolvió una respuesta válida. Intenta de nuevo.',
        invalid_state: 'No se pudo validar la sesión de Google. Intenta de nuevo.',
        unverified_email: 'Google no pudo verificar tu correo electrónico.',
        google_not_enabled: 'Esta cuenta está configurada para iniciar sesión con correo y contraseña.',
        account_not_available: 'No hay una cuenta activa de EA Sports asociada a ese correo.',
        failed: 'No se pudo completar el inicio de sesión con Google. Intenta de nuevo.'
      };
      errorInicioSesion.value = erroresGoogle[estadoGoogle] || 'No se pudo iniciar sesión con Google.';
      return;
    }
    if (estadoGoogle === 'success') {
      errorInicioSesion.value = 'Google autenticó tu cuenta, pero no se pudo verificar la sesión de EA Sports.';
      return;
    }
    if (!error.message.includes('(401)') && !error.message.includes('Autenticacion requerida')) {
      mostrarAviso(error.message, 'error');
    }
  } finally {
    if (sesion.value && !rutaActual.meta.notFound) {
      await enrutador.replace(sesion.value.rol === 'jugador'
        ? { name: 'grupo-jugador' }
        : { name: 'jugadores' });
    } else if (rutaActual.name !== 'login' && !rutaActual.meta.notFound) {
      await enrutador.replace({ name: 'login' });
    }
    sesionLista.value = true;
  }
});
</script>

<template>
  <RouterView v-if="sesionLista" v-slot="{ Component, route }">
    <PanelLayout v-if="route.meta.panel" :app="app">
      <component :is="Component" :app="app" />
    </PanelLayout>
    <component :is="Component" v-else :app="app       " />
  </RouterView>
  <div v-else class="app-loading" role="status">Cargando...</div>
</template>