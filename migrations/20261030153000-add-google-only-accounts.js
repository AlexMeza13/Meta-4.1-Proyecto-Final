'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Usuarios', 'auth_method', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'password'
    });
    await queryInterface.changeColumn('Usuarios', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS count FROM Usuarios WHERE password_hash IS NULL'
    );
    if (Number(rows[0].count) > 0) {
      throw new Error('No se puede revertir mientras existan cuentas sin contraseña local');
    }

    await queryInterface.changeColumn('Usuarios', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
    await queryInterface.removeColumn('Usuarios', 'auth_method');
  }
};
