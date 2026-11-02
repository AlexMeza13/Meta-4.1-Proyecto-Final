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
  jugadores,
  abrirDialogoJugador,
  eliminarJugador,
  actualizarDatos,
  cargarJugadores
} = app;

onMounted(() => actualizarDatos(cargarJugadores));
</script>

<template>
  <div v-if="sesion.rol === 'admin'" class="page-heading player-admin-heading">
    <button class="primary-button" @click="abrirDialogoJugador()">＋ Añadir jugador</button>
  </div>
  <div v-else class="page-heading player-directory-heading">
    <div>
      <h1>Jugadores</h1>
      <p class="page-subtitle">Perfiles disponibles para integrar a tus rosters.</p>
    </div>
  </div>
  <section class="data-card">
    <div class="section-heading">
      <div>
        <h2>{{ sesion.rol === 'admin' ? 'Todos los jugadores' : 'Perfiles disponibles' }}</h2>
        <p>{{ sesion.rol === 'admin' ? 'Perfiles del equipo.' : 'Selecciona uno al administrar la alineación de un roster.' }}</p>
      </div>
    </div>
    <div v-if="jugadores.length" class="table-wrap">
      <table>
        <thead><tr><th>JUGADOR</th><th>ROL</th><th>PAÍS</th><th>ESTADO</th><th v-if="sesion.rol === 'admin'"></th></tr></thead>
        <tbody>
          <tr v-for="jugador in jugadores" :key="jugador.id">
            <td><div class="player-cell"><span class="player-avatar">{{ jugador.nickname?.slice(0, 2).toUpperCase() }}</span><span><strong>{{ jugador.nickname }}</strong><small>{{ jugador.nombre_real }}</small></span></div></td>
            <td><span class="role-pill">{{ jugador.rol }}</span></td>
            <td>{{ jugador.pais }}</td>
            <td><span class="state-pill" :class="jugador.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'"><i></i>{{ jugador.estado }}</span></td>
            <td v-if="sesion.rol === 'admin'">
              <div class="row-actions">
                <button class="row-action-button" aria-label="Editar jugador" title="Editar" @click="abrirDialogoJugador(jugador)">Editar</button>
                <button class="row-action-button row-action-danger" aria-label="Eliminar jugador" title="Eliminar" @click="eliminarJugador(jugador)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      <strong>Aún no hay jugadores</strong>
      <p>{{ sesion.rol === 'admin' ? 'Agrega el primer perfil para comenzar.' : 'Pide al administrador que registre los perfiles de jugadores.' }}</p>
      <button v-if="sesion.rol === 'admin'" class="text-button" @click="abrirDialogoJugador()">＋ Añadir jugador</button>
    </div>
  </section>
</template>
