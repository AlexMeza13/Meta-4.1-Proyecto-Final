# API de eSports - Gestión de Perfiles y Rosters

API REST desarrollada en Node.js para la gestión de equipos de eSports. Permite administrar jugadores, crear rosters y asignar titulares/suplentes aplicando reglas de negocio específicas (MVC).

## Tecnologías Utilizadas
* **Backend:** Node.js (ES Modules), Express.js
* **Frontend:** Vue 3, Vite
* **Base de Datos:** MySQL (Docker)
* **ORM:** Sequelize
* **Documentación:** Swagger UI (OpenAPI 3.0)

## Requisitos Previos
Para ejecutar este proyecto de manera local, necesitas tener instalado:
* Node.js
* Docker Desktop

## Instalación y Configuración

1. **Clonar el repositorio y entrar a la carpeta:**
   ```bash
   git clone "URL del repositorio"
   cd eaSports
   ```

2. **Instalar las dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Levantar la base de datos MySQL con Docker:**
   Inicia Docker Desktop y, desde la carpeta `eaSports`, ejecuta:
   ```bash
   docker compose up -d
   ```

4. **Revisar y ejecutar las migraciones:**
   Primero revisa qué migraciones están aplicadas y cuáles faltan:
   ```bash
   npm run db:migrate:status
   ```
   Aplica las migraciones pendientes:
   ```bash
   npm run db:migrate
   ```

   Para cargar equipos y jugadores de League of Legends de Worlds 2024 (T1, G2 Esports y Gen.G), ejecuta:
   ```powershell
   npm run db:seed:demo
   ```
   El seeder agrega 15 perfiles/cuentas de jugador y asigna cada roster a un entrenador activo. Si no hay tres entrenadores activos, crea los que falten.

   Cuentas demo de jugadores: `Jugador1@gmail.com` a `Jugador15@gmail.com`; la contraseña corresponde al número (por ejemplo, `Jugador1@gmail.com` / `Jugador1`). La cuenta existente `Jugador1@gmail.com`, vinculada a Faker, tendrá la contraseña `Jugador1` tras cargar el seeder. Si se crean entrenadores demo, sus credenciales se muestran en la salida del comando y usan el mismo patrón (`EntrenadorN@gmail.com` / `EntrenadorN`). Son credenciales públicas de demostración: no las uses en producción.

5. **Configurar la autenticación:**
   Crea un archivo `.env` en la raíz del proyecto con una clave aleatoria de al menos 32 caracteres y el origen del frontend:
   ```env
   JWT_SECRET=
   CLIENT_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```

6. **Crear el primer administrador:**
   El comando de bootstrap solo crea un admin si todavía no existe ninguno. Completa `ADMIN_EMAIL` y `ADMIN_PASSWORD` localmente en `.env` ; la contraseña debe tener al menos 8 caracteres:
   ```powershell
   npm run user:create-admin
   ```

   Si ya existe exactamente un admin y cambiaste `ADMIN_EMAIL` o `ADMIN_PASSWORD` en `.env`, actualiza sus credenciales sin borrar la base de datos:
   ```powershell
   npm run user:update-admin
   ```
   Este comando conserva el resto de los datos. Se detiene si hay varios admins o si el nuevo correo ya pertenece a otra cuenta.

## Ejecución del Servidor

Para iniciar el servidor en modo desarrollo (con recarga automática):

```bash
npm run dev
```

El servidor estará escuchando en http://localhost:3000. Para iniciarlo sin recarga automática usa `npm start`.

## Ejecución del Frontend

Con MySQL y el backend en ejecución, abre otra terminal desde la carpeta `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 e inicia sesión con una cuenta existente.

Desde la pantalla de inicio de sesión, una persona puede seleccionar **Crear Cuenta**, elegir una cuenta de entrenador o jugador y usar correo/contraseña o Google. Las solicitudes no crean acceso inmediatamente: un administrador debe abrir **Solicitudes** y aprobarlas o rechazarlas. Al aprobar una solicitud de jugador también se crea su perfil; al rechazarla, se elimina.

La tabla de solicitudes requiere aplicar las migraciones pendientes con `npm run db:migrate` desde la carpeta raíz `eaSports`.


## Probar la API con REST Client

Con el servidor y MySQL en ejecución, abre `test-collection.http` en Visual Studio Code y ejecuta las solicitudes en orden con la extensión REST Client. La colección incluye casos de éxito y error para jugadores, rosters y asignaciones, y reutiliza IDs capturados de respuestas anteriores.

## Reglas de Negocio Implementadas
* **RN-01:** El nickname de un jugador debe ser único.
* **RN-02:** Un roster puede tener un máximo de 5 jugadores titulares.
* **RN-03:** No puede haber dos jugadores titulares con el mismo rol en un roster.
* **RN-05:** Al eliminar un roster, los perfiles de los jugadores permanecen intactos en la base de datos.