import React from 'react';
import PropTypes from 'prop-types';
import { classes } from '../../utils';

import './stylesheet.scss';

const Tab = ({ label, active, onClick, className, style }) => (
  <button
    className={classes('Tab', active && 'active', className)}
    style={style}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

Tab.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object
};

Tab.defaultProps = {
  active: false,
  className: '',
  style: {}
};

export default Tab;
