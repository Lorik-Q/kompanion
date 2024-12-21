declare module 'simple-peer-light' {
  interface SimplePeerData {
    type: string;
    sdp: string;
  }

  interface SimplePeerOptions {
    initiator: boolean;
    stream?: MediaStream;
    trickle?: boolean;
    config?: RTCConfiguration;
  }

  export default class SimplePeer {
    constructor(opts?: SimplePeerOptions);
    signal(data: any): void;
    on(event: 'signal', listener: (data: SimplePeerData) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    destroy(): void;
  }
}
