'use strict';

const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');

const teams = [
  {
    name: 'T1 - Worlds 2024',
    coachName: 'Entrenador de T1',
    players: [
      { nickname: 'Zeus', nombre_real: 'Choi Woo-je', pais: 'Corea del Sur', rol: 'Top' },
      { nickname: 'Oner', nombre_real: 'Moon Hyeon-joon', pais: 'Corea del Sur', rol: 'Jungle' },
      { nickname: 'Faker', nombre_real: 'Lee Sang-hyeok', pais: 'Corea del Sur', rol: 'Mid' },
      { nickname: 'Gumayusi', nombre_real: 'Lee Min-hyeong', pais: 'Corea del Sur', rol: 'ADC' },
      { nickname: 'Keria', nombre_real: 'Ryu Min-seok', pais: 'Corea del Sur', rol: 'Support' }
    ]
  },
  {
    name: 'G2 Esports - Worlds 2024',
    coachName: 'Entrenador de G2',
    players: [
      { nickname: 'BrokenBlade', nombre_real: 'Sergen Çelik', pais: 'Turquía', rol: 'Top' },
      { nickname: 'Yike', nombre_real: 'Martin Sundelin', pais: 'Suecia', rol: 'Jungle' },
      { nickname: 'Caps', nombre_real: 'Rasmus Winther', pais: 'Dinamarca', rol: 'Mid' },
      { nickname: 'Hans Sama', nombre_real: 'Steven Liv', pais: 'Francia', rol: 'ADC' },
      { nickname: 'Mikyx', nombre_real: 'Mihael Mehle', pais: 'Eslovenia', rol: 'Support' }
    ]
  },
  {
    name: 'Gen.G - Worlds 2024',
    coachName: 'Entrenador de Gen.G',
    players: [
      { nickname: 'Kiin', nombre_real: 'Kim Gi-in', pais: 'Corea del Sur', rol: 'Top' },
      { nickname: 'Canyon', nombre_real: 'Kim Geon-bu', pais: 'Corea del Sur', rol: 'Jungle' },
      { nickname: 'Chovy', nombre_real: 'Jeong Ji-hoon', pais: 'Corea del Sur', rol: 'Mid' },
      { nickname: 'Peyz', nombre_real: 'Kim Su-hwan', pais: 'Corea del Sur', rol: 'ADC' },
      { nickname: 'Lehends', nombre_real: 'Son Si-woo', pais: 'Corea del Sur', rol: 'Support' }
    ]
  }
];

const fieldsMatch = (player, expected) =>
  player.nickname === expected.nickname &&
  player.nombre_real === expected.nombre_real &&
  player.pais === expected.pais &&
  player.rol === expected.rol;

module.exports = {
  async up(queryInterface) {
    const cliEnvironmentIndex = process.argv.indexOf('--env');
    const cliEnvironment = cliEnvironmentIndex === -1
      ? null
      : process.argv[cliEnvironmentIndex + 1];
    if (process.env.NODE_ENV === 'production' || cliEnvironment === 'production') {
      throw new Error('Los datos de demostración no se pueden cargar en producción.');
    }

    const sequelize = queryInterface.sequelize;
    const Usuario = sequelize.define('DemoUsuario', {
      email: DataTypes.STRING(254),
      password_hash: DataTypes.STRING(255),
      auth_method: DataTypes.STRING(20),
      display_name: DataTypes.STRING(255),
      avatar_url: DataTypes.STRING(2048),
      id_jugador: DataTypes.INTEGER,
      rol: DataTypes.STRING(20),
      estado: DataTypes.STRING(20)
    }, { tableName: 'Usuarios', timestamps: true, freezeTableName: true });
    const Jugador = sequelize.define('DemoJugador', {
      nickname: DataTypes.STRING,
      nombre_real: DataTypes.STRING,
      pais: DataTypes.STRING,
      rol: DataTypes.STRING,
      estado: DataTypes.STRING
    }, { tableName: 'Jugadors', timestamps: true, freezeTableName: true });
    const Roster = sequelize.define('DemoRoster', {
      nombre: DataTypes.STRING,
      juego: DataTypes.STRING,
      tipo: DataTypes.STRING,
      temporada: DataTypes.STRING,
      id_entrenador: DataTypes.INTEGER
    }, { tableName: 'Rosters', timestamps: true, freezeTableName: true });
    const RosterJugador = sequelize.define('DemoRosterJugador', {
      id_roster: DataTypes.INTEGER,
      id_jugador: DataTypes.INTEGER,
      rol_en_roster: DataTypes.STRING
    }, { tableName: 'Roster_Jugadors', timestamps: true, freezeTableName: true });

    await sequelize.transaction(async (transaction) => {
      const activeTrainers = await Usuario.findAll({
        where: { rol: 'entrenador', estado: 'activo' },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const generatedCoachEmails = [];

      for (let candidate = 1; activeTrainers.length < teams.length; candidate += 1) {
        const email = `Entrenador${candidate}@gmail.com`;
        const existingAccount = await Usuario.findOne({
          where: { email },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (existingAccount) continue;

        const password = `Entrenador${candidate}`;
        const trainer = await Usuario.create({
          email,
          password_hash: await bcrypt.hash(password, 12),
          auth_method: 'password',
          display_name: teams[activeTrainers.length].coachName,
          avatar_url: null,
          id_jugador: null,
          rol: 'entrenador',
          estado: 'activo'
        }, { transaction });
        activeTrainers.push(trainer);
        generatedCoachEmails.push(email);
      }

      const seededPlayers = new Map();
      const accountNumbers = new Map([['Faker', 1]]);
      let nextAccountNumber = 2;
      for (const playerData of teams.flatMap((team) => team.players)) {
        if (playerData.nickname !== 'Faker') {
          accountNumbers.set(playerData.nickname, nextAccountNumber);
          nextAccountNumber += 1;
        }
      }
      let createdPlayerCount = 0;
      let createdAccountCount = 0;

      for (const playerData of teams.flatMap((team) => team.players)) {
        const accountNumber = accountNumbers.get(playerData.nickname);
        const email = `Jugador${accountNumber}@gmail.com`;
        const password = `Jugador${accountNumber}`;
        let account = await Usuario.findOne({
          where: { email },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        let player;

        if (account) {
          if (account.rol !== 'jugador' || !account.id_jugador || account.auth_method !== 'password') {
            throw new Error(`${email} existe, pero no es una cuenta de jugador con contraseña.`);
          }
          player = await Jugador.findByPk(account.id_jugador, { transaction, lock: transaction.LOCK.UPDATE });
          if (!player || !fieldsMatch(player, playerData)) {
            throw new Error(`${email} no está vinculado al perfil esperado de ${playerData.nickname}.`);
          }
          await account.update({
            password_hash: await bcrypt.hash(password, 12)
          }, { transaction });
        } else {
          player = await Jugador.findOne({
            where: { nickname: playerData.nickname },
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (player && !fieldsMatch(player, playerData)) {
            throw new Error(`El nickname ${playerData.nickname} ya existe con datos diferentes.`);
          }
          if (player) {
            const linkedAccount = await Usuario.findOne({
              where: { id_jugador: player.id },
              transaction,
              lock: transaction.LOCK.UPDATE
            });
            if (linkedAccount) {
              throw new Error(`${playerData.nickname} ya está vinculado a otra cuenta.`);
            }
          } else {
            player = await Jugador.create({
              ...playerData,
              estado: 'activo'
            }, { transaction });
            createdPlayerCount += 1;
          }

          account = await Usuario.create({
            email,
            password_hash: await bcrypt.hash(password, 12),
            auth_method: 'password',
            display_name: null,
            avatar_url: null,
            id_jugador: player.id,
            rol: 'jugador',
            estado: 'activo'
          }, { transaction });
          createdAccountCount += 1;
        }

        seededPlayers.set(playerData.nickname, player);
      }

      for (const [teamIndex, team] of teams.entries()) {
        const coach = activeTrainers[teamIndex];
        const rosterData = {
          nombre: team.name,
          juego: 'League of Legends',
          tipo: 'Principal',
          temporada: '2024',
          id_entrenador: coach.id
        };
        let roster = await Roster.findOne({
          where: {
            nombre: rosterData.nombre,
            juego: rosterData.juego,
            tipo: rosterData.tipo,
            temporada: rosterData.temporada
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!roster) {
          roster = await Roster.create(rosterData, { transaction });
          await RosterJugador.bulkCreate(team.players.map((playerData) => ({
            id_roster: roster.id,
            id_jugador: seededPlayers.get(playerData.nickname).id,
            rol_en_roster: 'Titular'
          })), { transaction });
          continue;
        }

        if (roster.id_entrenador !== coach.id) {
          throw new Error(`El roster ${team.name} ya existe con otro entrenador asignado.`);
        }
        const assignments = await RosterJugador.findAll({
          where: { id_roster: roster.id },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        const expectedAssignments = new Map(team.players.map((playerData) => [
          seededPlayers.get(playerData.nickname).id,
          'Titular'
        ]));
        if (assignments.length !== expectedAssignments.size ||
            assignments.some((assignment) =>
              expectedAssignments.get(assignment.id_jugador) !== assignment.rol_en_roster
            )) {
          throw new Error(`El roster ${team.name} existe, pero su alineación no coincide con los datos demo.`);
        }
      }

      console.log(`Datos LoL demo listos: ${teams.length} rosters, ${seededPlayers.size} jugadores vinculados a cuentas.`);
      if (createdPlayerCount || createdAccountCount) {
        console.log(`Nuevos perfiles: ${createdPlayerCount}; nuevas cuentas de jugador: ${createdAccountCount}.`);
      }
      if (generatedCoachEmails.length) {
        console.log(`Cuentas de entrenador demo creadas: ${generatedCoachEmails.join(', ')} (contraseña igual al nombre de usuario).`);
      }
    });
  },

  async down() {
    throw new Error('Este seeder conserva el perfil y la cuenta Faker existentes; elimina los datos demo manualmente si deseas revertirlo.');
  }
};
