import { ref } from 'vue';

const aviso = ref('');
const tipoAviso = ref('success');
let temporizadorAviso;

export function useNotifications() {
  function mostrarAviso(mensaje, tipo = 'success') {
    aviso.value = mensaje;
    tipoAviso.value = tipo;
    window.clearTimeout(temporizadorAviso);
    temporizadorAviso = window.setTimeout(() => {
      aviso.value = '';
    }, 3600);
  }

  return { aviso, tipoAviso, mostrarAviso };
}
