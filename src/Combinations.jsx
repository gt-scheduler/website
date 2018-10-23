import React, { PureComponent } from 'react';
import './Combinations.scss';
import Calendar from './Calendar';

class Combinations extends PureComponent {
  render() {
    const { combinations, crns, pinnedCrns, onSetOverlayCrns, onSetPinnedCrns } = this.props;

    return (
      <div className="Combinations">
        {
          combinations.map((combination, i) => (
            <div className="combination" key={i}
                 onMouseEnter={() => onSetOverlayCrns(combination)}
                 onMouseLeave={() => onSetOverlayCrns([])}
                 onClick={() => onSetPinnedCrns([...pinnedCrns, ...combination])}>
              <div className="number">{i + 1}</div>
              <Calendar className="preview" pinnedCrns={[...pinnedCrns, ...combination]} overlayCrns={[]}
                        crns={crns} key={i} preview/>
            </div>
          ))
        }
      </div>
    );
  }
}


export default Combinations;
