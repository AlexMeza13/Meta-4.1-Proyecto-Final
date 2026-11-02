import { ref } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import CuentasView from '../components/CuentasView.vue';
import GrupoJugadorView from '../components/GrupoJugadorView.vue';
import JugadoresView from '../components/JugadoresView.vue';
import LoginView from '../components/LoginView.vue';
import NoEncontradaView from '../components/NoEncontradaView.vue';
import RostersView from '../components/RostersView.vue';
import SolicitudesView from '../components/SolicitudesView.vue';

export const sesionActiva = ref(null);
export const sesionLista = ref(false);

const rutas = [
  { path: '/', redirect: { name: 'login' } },
  { path: '/iniciar-sesion', name: 'login', component: LoginView, meta: { publico: true } },
  { path: '/jugadores', name: 'jugadores', component: JugadoresView, meta: { roles: ['admin', 'entrenador'], panel: true } },
  { path: '/rosters', name: 'rosters', component: RostersView, meta: { roles: ['admin', 'entrenador'], panel: true } },
  { path: '/cuentas', name: 'cuentas', component: CuentasView, meta: { roles: ['admin'], panel: true } },
  { path: '/solicitudes', name: 'solicitudes', component: SolicitudesView, meta: { roles: ['admin'], panel: true } },
  { path: '/mi-grupo', name: 'grupo-jugador', component: GrupoJugadorView, meta: { roles: ['jugador'], panel: true } },
  { path: '/:pathMatch(.*)*', name: 'no-encontrada', component: NoEncontradaView, meta: { notFound: true } }
];

const enrutador = createRouter({
  history: createWebHistory(),
  routes: rutas
});

enrutador.beforeEach((destino) => {
  if (destino.meta.notFound) return true;
  if (!sesionLista.value) return true;

  if (destino.meta.publico) {
    if (!sesionActiva.value) return true;
    return sesionActiva.value.rol === 'jugador'
      ? { name: 'grupo-jugador' }
      : { name: 'jugadores' };
  }

  if (!sesionActiva.value) return { name: 'login' };
  if (destino.meta.roles && !destino.meta.roles.includes(sesionActiva.value.rol)) {
    return sesionActiva.value.rol === 'jugador'
      ? { name: 'grupo-jugador' }
      : { name: 'jugadores' };
  }

  return true;
});

export default enrutador;
