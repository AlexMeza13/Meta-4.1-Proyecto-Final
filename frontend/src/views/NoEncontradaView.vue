<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <p class="not-found-code">404</p>
      <h1>Esta página no existe</h1>
      <p>La dirección que escribiste no corresponde a ninguna página de EA Sports.</p>
      <RouterLink class="not-found-link" :to="{ name: 'login' }">Volver al inicio</RouterLink>
    </section>
  </main>
</template>
