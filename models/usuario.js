'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model { }

  Usuario.init({
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    auth_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'password',
      validate: {
        isIn: [['password', 'google']]
      }
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    id_jugador: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      references: {
        model: 'Jugadors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    rol: {
      type: DataTypes.ENUM('admin', 'entrenador', 'jugador'),
      allowNull: false,
      defaultValue: 'entrenador'
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo'
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios'
  });

  return Usuario;
};
