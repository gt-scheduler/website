import React, { useState } from "react";

export default props => {
  const [state, setState] = useState(false);

  const togglePop = () => {
    setState(!state);
  };

  return (
    <div>
      <div className="btn" onClick={togglePop}>
        <button>New User?</button>
      </div>
      {state ? (
        <div className="modal">
          <div className="modal_content">
            <span className="close" onClick={togglePop}>
              &times;{" "}
            </span>
            {props.children}
          </div>
        </div>
      ) : null}
    </div>
  );
};
