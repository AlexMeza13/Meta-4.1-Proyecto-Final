<template>
  <main class="about-page">
    <div class="about-shell">
      <header class="about-header">
        <span class="about-brand">EA SPORTS <i></i> TEAM MANAGEMENT</span>
        <nav aria-label="Navegación de Acerca de">
          <RouterLink class="about-link" :to="{ name: 'login' }">INICIAR SESIÓN</RouterLink>
        </nav>
      </header>

      <section class="about-hero" aria-labelledby="about-title">
        <div class="about-hero-copy">
          <div class="about-hero-content">
            <p class="about-eyebrow">PLATAFORMA DE GESTIÓN · ESPORTS</p>
            <h1 id="about-title">El equipo,<br />mejor organizado.</h1>
            <p class="about-intro">
              Jugadores, alineaciones y rosters coordinados en un solo lugar.
              Todo lo necesario para gestionar el equipo dentro y fuera del juego.
            </p>
          </div>
        </div>
        <div class="about-art" role="img" aria-label="Arte de personajes del juego" />
        <nav class="about-hero-nav" aria-label="Explora el proyecto">
          <RouterLink :to="{ name: 'vistas-publicas', query: { vista: 'jugador' } }">Jugadores</RouterLink>
          <RouterLink :to="{ name: 'vistas-publicas', query: { vista: 'entrenador' } }">Rosters</RouterLink>
          <a href="#about-features">Gestiones</a>
          <a href="#about-technology">Tecnologías</a>
        </nav>
      </section>

      <div id="about-details" class="about-details">
        <section id="about-features" class="about-info-section" aria-labelledby="about-features-title">
          <header class="about-section-heading">
            <h2 id="about-features-title">Qué puedes gestionar</h2>
            <p>Las herramientas principales para organizar el equipo.</p>
          </header>
          <div class="about-card-grid">
            <article id="about-players" class="about-card">
              <img src="/Icono1.png" alt="" />
              <h3>Jugadores</h3>
              <p>Perfiles y posiciones en un directorio del equipo.</p>
            </article>
            <article id="about-rosters" class="about-card">
              <img src="/Icono2.png" alt="" />
              <h3>Rosters</h3>
              <p>Alineaciones de titulares y suplentes por temporada.</p>
            </article>
            <article id="about-access" class="about-card">
              <img src="/Icono3.png" alt="" />
              <h3>Cuentas y acceso</h3>
              <p>Roles, permisos y solicitudes de registro.</p>
            </article>
          </div>
        </section>

        <section id="about-technology" class="about-info-section" aria-labelledby="about-technology-title">
          <header class="about-section-heading">
            <h2 id="about-technology-title">Tecnologías utilizadas</h2>
            <p>Esta página implementa estas tecnologías para construir la interfaz, el servidor y las pruebas.</p>
          </header>
          <div class="about-card-grid">
            <article class="about-card about-tech-card">
              <span class="about-tech-mark" aria-hidden="true">
                <svg class="about-tech-icon" viewBox="0 0 32 32">
                  <path d="m11 10-6 6 6 6M21 10l6 6-6 6M19 6l-6 20" />
                </svg>
              </span>
              <h3>Interfaz</h3>
              <p>Vue 3, Vue Router y Vite para la aplicación frontend.</p>
            </article>
            <article class="about-card about-tech-card">
              <span class="about-tech-mark" aria-hidden="true">
                <svg class="about-tech-icon" viewBox="0 0 32 32">
                  <ellipse cx="16" cy="7" rx="9" ry="3.5" />
                  <path d="M7 7v8c0 2 4 3.5 9 3.5s9-1.5 9-3.5V7M7 15v8c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-8" />
                </svg>
              </span>
              <h3>Servidor y datos</h3>
              <p>Node.js, Express, MySQL y Sequelize para la API y su persistencia.</p>
            </article>
            <article class="about-card about-tech-card">
              <span class="about-tech-mark" aria-hidden="true">
                <svg class="about-tech-icon" viewBox="0 0 32 32">
                  <path d="m16 3 10 4v7c0 7-4.5 11-10 15C10.5 25 6 21 6 14V7l10-4Z" />
                  <path d="m11.5 15.5 3 3 6-6" />
                </svg>
              </span>
              <h3>Sesiones y pruebas</h3>
              <p>JWT, cookies, CSRF y Playwright para seguridad y pruebas de navegador.</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
