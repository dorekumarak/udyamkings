'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('form_configs', 'show_condition', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Conditional logic for showing/hiding this field'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('form_configs', 'show_condition');
  }
};
