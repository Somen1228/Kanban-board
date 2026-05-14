import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Untitled',
  },
  cards: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'boards',
  timestamps: true,
  underscored: true,
});

// Associations
User.hasMany(Board, { foreignKey: 'user_id', as: 'boards' });
Board.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Board;
