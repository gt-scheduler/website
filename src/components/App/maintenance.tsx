import React from 'react';

export default function Maintenance(): React.ReactElement {
  return (
    <div className="Maintenance">
      <div className="content">
        <div className="main-content">
          <div className="text">
            <h1>
              GT Scheduler is <br />
              Under Maintenance
            </h1>
            <p>
              GT Scheduler is currently undergoing maintenance. <br />
              We’ll resume service to assist registration and scheduling soon.
            </p>
            <p>
              We appreciate your continued support and patience. For any
              inquiries, please{' '}
              <a href="mailto: contact@gt-scheduler.org">contact us</a>.
            </p>
            <p>
              —The GT Scheduler Team{' '}
              <a href="https://bitsofgood.org/">@Bits of Good</a>
              <br />
              <br />
            </p>
          </div>
          <img alt="GT Scheduler Logo" src="/mascot.png" />
        </div>
        <a className="footer" href="https://bitsofgood.org/">
          <img alt="Bits of Good Logo" src="/bitsOfGood.png" />
        </a>
      </div>
    </div>
  );
}
