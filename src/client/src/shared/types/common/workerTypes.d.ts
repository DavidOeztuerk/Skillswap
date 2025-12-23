export {};

declare global {
  interface WorkerGlobalScope {
    onrtctransform: ((event: RTCTransformEvent) => void) | null;
  }

  interface RTCTransformEventInit extends EventInit {
    transformer: RTCTransform;
  }

  interface RTCEncodedAudioFrame {
    data: ArrayBuffer;
    timestamp: number;
    type?: 'key' | 'delta';
  }

  interface RTCEncodedVideoFrame {
    data: ArrayBuffer;
    timestamp: number;
    type?: 'key' | 'delta';
  }

  interface RTCTransform {
    readonly readable: ReadableStream;
    readonly writable: WritableStream;
    readonly options?: Record<string, unknown>;
  }
}
