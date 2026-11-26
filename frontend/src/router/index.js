import { ref } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import AcercaDeView from '../views/AcercaDeView.vue';
import CuentasView from '../views/CuentasView.vue';
import GrupoJugadorView from '../views/GrupoJugadorView.vue';
import JugadoresView from '../views/JugadoresView.vue';
import LoginView from '../views/LoginView.vue';
import NoEncontradaView from '../views/NoEncontradaView.vue';
import RostersView from '../views/RostersView.vue';
import SolicitudesView from '../views/SolicitudesView.vue';
import VistasPublicasView from '../views/VistasPublicasView.vue';

export const sesionActiva = ref(null);
export const sesionLista = ref(false);

const rutas = [
  { path: '/', redirect: { name: 'login' } },
  { path: '/iniciar-sesion', name: 'login', component: LoginView, meta: { publico: true } },
  { path: '/acerca-de', name: 'acerca-de', component: AcercaDeView, meta: { publico: true } },
  { path: '/vistas-publicas', name: 'vistas-publicas', component: VistasPublicasView, meta: { publico: true } },
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
    if (!sesionActiva.value || destino.name !== 'login') return true;
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
