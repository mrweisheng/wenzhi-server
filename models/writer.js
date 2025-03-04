const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Writer = sequelize.define('Writer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  writer_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  education: {
    type: DataTypes.STRING,
    allowNull: false
  },
  major: {
    type: DataTypes.STRING,
    allowNull: false
  },
  writing_experience: {
    type: DataTypes.ENUM('大学水平','在职水平','事业单位水平','淘宝老手','在职老师','期刊报告科研'),
    allowNull: false
  },
  specialized_content: DataTypes.STRING,
  phone_1: DataTypes.STRING,
  phone_2: DataTypes.STRING,
  alipay_name: DataTypes.STRING,
  alipay_account: DataTypes.STRING,
  id_number: DataTypes.STRING,
  ip_address: DataTypes.STRING,
  starred: DataTypes.BOOLEAN,
  processed: DataTypes.BOOLEAN,
  created_time: DataTypes.DATE,
  created_by: DataTypes.STRING,
  last_modified_time: DataTypes.DATE,
  last_modified_by: DataTypes.STRING
}, {
  tableName: 'writer_info',
  timestamps: false
});

module.exports = Writer; 