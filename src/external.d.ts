declare module '@sweetalert/with-react' {
  import React from 'react';
  import swal, {
    ActionOptions,
    SwalState,
    SwalOptions as BaseSwalOptions,
  } from 'sweetalert';

  // Types taken from sweetalert typings:
  // https://github.com/t4t5/sweetalert/blob/master/typings/core.d.ts

  export type SwalOptions = BaseSwalOptions & {
    content: React.ReactNode;
  };

  export declare type SwalParams = (string | Partial<SwalOptions>)[];

  export interface SweetAlert {
    (...params: SwalParams): Promise<unknown>;
    close?(namespace?: string): void;
    getState?(): SwalState;
    setActionValue?(opts: string | ActionOptions): void;
    stopLoading?(): void;
    setDefaults?(opts: Record<string, unknown>): void;
  }

  declare const swal: SweetAlert;
  export default swal;
}
