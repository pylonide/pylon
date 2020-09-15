// #ifdef __WITH_UIRECORDER || __ENABLE_UIRECORDER_HOOK
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
ppc.uirecorder = {
    $inited         : false,
    isRecording     : false,
    isPlaying       : false,
    isPaused        : false,
    captureDetails  : false,
    $o3             : null,

    setTimeout      : self.setTimeout
}
//#endif

