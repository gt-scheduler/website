import React, { Component } from 'react';
import { classes } from '../../utils';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons/faCaretDown';
import { Button } from '../';

class Select extends Component {
  constructor(props) {
    super(props);

    this.state = {
      opened: false,
    };
  }

  handleOpen() {
    this.setState({ opened: true });
  }

  handleClose() {
    this.setState({ opened: false });
  }

  handleToggle() {
    this.setState({ opened: !this.state.opened });
  }

  render() {
    const { className, value, onChange, options } = this.props;
    const { opened } = this.state;

    const selectedOption = options.find(option => option.value === value);
    const label = selectedOption ? selectedOption.label : '-';

    return (
      <div className={classes('Button', 'Select', className)} onClick={() => this.handleToggle()}>
        <div className="text">
          {label}
        </div>
        <FontAwesomeIcon fixedWidth icon={faCaretDown}/>
        {
          opened &&
          <div className="intercept" onClick={() => this.handleClose()}/>
        }
        {
          opened &&
          <div className="option-container">
            {
              options.map(({ value, label }) => (
                <Button className="option" key={value} onClick={() => onChange(value)}>
                  {label}
                </Button>
              ))
            }
          </div>
        }
      </div>
    );
  }
}

export default Select;
