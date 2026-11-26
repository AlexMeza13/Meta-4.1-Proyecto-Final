'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SolicitudUsuario extends Model { }

  SolicitudUsuario.init({
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    auth_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['password', 'google']] }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rol: {
      type: DataTypes.ENUM('entrenador', 'jugador'),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    nombre_real: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pais: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rol_jugador: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING(2048),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SolicitudUsuario',
    tableName: 'SolicitudesUsuarios'
  });

  return SolicitudUsuario;
};
