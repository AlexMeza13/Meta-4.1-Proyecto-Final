<script setup>
defineProps({
  app: {
    type: Object,
    required: true
  }
});
</script>

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

<style scoped>
.not-found-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: radial-gradient(ellipse at center, #102b40, #071522 70%);
}

.not-found-card {
  width: min(100%, 520px);
  padding: 44px 32px;
  border: 1px solid #29485b;
  border-radius: 8px;
  background: linear-gradient(155deg, #102b40, #0b1b29 72%);
  box-shadow: 0 18px 55px #020a11a8;
  text-align: center;
}

.not-found-code {
  margin: 0;
  color: #78e2dc;
  font-size: clamp(72px, 18vw, 112px);
  font-weight: 700;
  line-height: 1;
}

.not-found-card h1 {
  margin: 18px 0 10px;
  color: #f0ead9;
  font-size: 25px;
  font-weight: 600;
}

.not-found-card > p:not(.not-found-code) {
  margin: 0 0 26px;
  color: #91a0a9;
  font-size: 14px;
  line-height: 1.6;
}

.not-found-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid #b89c64;
  border-radius: 4px;
  background: linear-gradient(180deg, #d8c18b, #b99d64);
  color: #142636;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.not-found-link:hover {
  border-color: #e4d2a7;
  background: linear-gradient(180deg, #ead8a7, #c8aa6e);
}
</style>
