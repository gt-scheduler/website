declare module '@sweetalert/with-react' {
  import React from 'react';

  // TODO enhance type declaration as needed:
  // https://sweetalert.js.org/docs/
  export default function swal(args: {
    button: string;
    content: React.ReactNode;
  });
}
