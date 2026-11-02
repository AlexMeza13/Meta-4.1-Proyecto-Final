'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SolicitudesUsuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        unique: true
      },
      auth_method: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      rol: {
        type: Sequelize.ENUM('entrenador', 'jugador'),
        allowNull: false
      },
      nickname: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      nombre_real: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pais: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rol_jugador: {
        type: Sequelize.STRING,
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING(2048),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SolicitudesUsuarios');
  }
};
