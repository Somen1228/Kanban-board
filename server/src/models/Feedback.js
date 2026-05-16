import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Feedback = sequelize.define('Feedback', {
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
  type: {
    type: DataTypes.ENUM('bug', 'feature-request', 'query', 'feedback'),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'replied'),
    defaultValue: 'new',
  },
}, {
  tableName: 'feedbacks',
  timestamps: true,
  underscored: true,
});

User.hasMany(Feedback, { foreignKey: 'user_id', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Feedback;
