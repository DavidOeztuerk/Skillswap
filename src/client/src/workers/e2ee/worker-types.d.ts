/**
 * Safari RTCRtpScriptTransform Type Declarations
 *
 * Diese Types sind für Safari's RTCRtpScriptTransform API erforderlich,
 * die eine andere Worker-Architektur verwendet als Chrome/Firefox.
 */

declare global {
  /**
   * Erweiterte WorkerGlobalScope für Safari RTCRtpScriptTransform
   */
  interface WorkerGlobalScope {
    /**
     * Safari's RTCRtpScriptTransform Event Handler
     * KRITISCH: Keys müssen zu diesem Zeitpunkt bereits gesetzt sein!
     */
    onrtctransform?: ((event: RTCTransformEvent) => void) | null;
  }

  /**
   * RTCRtpScriptTransform Event
   * Wird getriggert wenn ein RTCRtpScriptTransform zugewiesen wird
   */
  interface RTCTransformEvent extends Event {
    readonly transformer: RTCTransformer;
  }

  /**
   * RTCTransformer - Enthält readable/writable Streams für Frame-Transformation
   */
  interface RTCTransformer {
    /** Stream von eingehenden Frames */
    readonly readable: ReadableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
    /** Stream für ausgehende (transformierte) Frames */
    readonly writable: WritableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
    /** Optionale Konfiguration vom Main Thread */
    readonly options?: RTCTransformOptions;
  }

  /**
   * RTCTransformer Optionen
   */
  interface RTCTransformOptions {
    /** Operation: 'encrypt' für ausgehende, 'decrypt' für eingehende Frames */
    readonly operation?: 'encrypt' | 'decrypt';
    /** Media-Typ */
    readonly kind?: 'video' | 'audio';
    /** Optionale zusätzliche Daten */
    readonly metadata?: Record<string, unknown>;
  }

  /**
   * Encoded Video Frame
   */
  interface RTCEncodedVideoFrame {
    /** Frame-Daten (kann modifiziert werden) */
    data: ArrayBuffer;
    /** Timestamp in Mikrosekunden */
    readonly timestamp: number;
    /** Frame-Typ: 'key' für I-Frames, 'delta' für P/B-Frames */
    readonly type?: 'key' | 'delta' | 'empty';
    /** Optionale Metadaten */
    readonly metadata?: RTCEncodedVideoFrameMetadata;
  }

  /**
   * Video Frame Metadaten
   */
  interface RTCEncodedVideoFrameMetadata {
    /** Frame ID */
    readonly frameId?: number;
    /** Dependencies */
    readonly dependencies?: readonly number[];
    /** Breite */
    readonly width?: number;
    /** Höhe */
    readonly height?: number;
    /** Spatial Index (Simulcast) */
    readonly spatialIndex?: number;
    /** Temporal Index */
    readonly temporalIndex?: number;
    /** Synchronization Source */
    readonly synchronizationSource?: number;
    /** Contributing Sources */
    readonly contributingSources?: readonly number[];
    /** Payload Type */
    readonly payloadType?: number;
  }

  /**
   * Encoded Audio Frame
   */
  interface RTCEncodedAudioFrame {
    /** Frame-Daten (kann modifiziert werden) */
    data: ArrayBuffer;
    /** Timestamp in Mikrosekunden */
    readonly timestamp: number;
    /** Optionale Metadaten */
    readonly metadata?: RTCEncodedAudioFrameMetadata;
  }

  /**
   * Audio Frame Metadaten
   */
  interface RTCEncodedAudioFrameMetadata {
    /** Synchronization Source */
    readonly synchronizationSource?: number;
    /** Contributing Sources */
    readonly contributingSources?: readonly number[];
    /** Payload Type */
    readonly payloadType?: number;
  }

  /**
   * RTCRtpScriptTransform Konstruktor
   * Wird im Main Thread verwendet, um einen Worker für Frame-Transformation zu erstellen
   */
  interface RTCRtpScriptTransformConstructor {
    new (worker: Worker, options?: RTCTransformOptions): RTCRtpScriptTransform;
  }

  /**
   * RTCRtpScriptTransform Instanz
   */
  interface RTCRtpScriptTransform {
    /** Zugehöriger Worker */
    readonly worker: Worker;
  }

  // Globale Verfügbarkeit
  const RTCRtpScriptTransform: RTCRtpScriptTransformConstructor | undefined;
}

export {};
