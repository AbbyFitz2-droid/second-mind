import AVFoundation
import Foundation

let root = URL(fileURLWithPath: "/Users/abbyfitz/Documents/Cognisyn/submission-assets")
let videoURL = root.appendingPathComponent("second-mind-screen.mov")
let audioURL = root.appendingPathComponent("audio/second-mind-narration.aiff")
let outputURL = root.appendingPathComponent("second-mind-build-week-demo-final.mp4")

let videoAsset = AVURLAsset(url: videoURL)
let audioAsset = AVURLAsset(url: audioURL)
let composition = AVMutableComposition()

guard
    let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
    let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
    let videoTrack = composition.addMutableTrack(
        withMediaType: .video,
        preferredTrackID: kCMPersistentTrackID_Invalid
    ),
    let audioTrack = composition.addMutableTrack(
        withMediaType: .audio,
        preferredTrackID: kCMPersistentTrackID_Invalid
    )
else {
    fputs("Could not create the required media tracks.\n", stderr)
    exit(1)
}

let videoDuration = videoAsset.duration
let audioDuration = audioAsset.duration
let videoRange = CMTimeRange(start: .zero, duration: videoDuration)
let audioRange = CMTimeRange(start: .zero, duration: audioDuration)

do {
    try videoTrack.insertTimeRange(videoRange, of: sourceVideo, at: .zero)
    try audioTrack.insertTimeRange(audioRange, of: sourceAudio, at: .zero)
    videoTrack.scaleTimeRange(videoRange, toDuration: audioDuration)
    videoTrack.preferredTransform = sourceVideo.preferredTransform
} catch {
    fputs("Could not assemble the demo: \(error)\n", stderr)
    exit(1)
}

guard let exporter = AVAssetExportSession(
    asset: composition,
    presetName: AVAssetExportPreset1920x1080
) else {
    fputs("Could not create the video exporter.\n", stderr)
    exit(1)
}

exporter.outputURL = outputURL
exporter.outputFileType = .mp4
exporter.shouldOptimizeForNetworkUse = true

let finished = DispatchSemaphore(value: 0)
exporter.exportAsynchronously {
    finished.signal()
}
finished.wait()

switch exporter.status {
case .completed:
    print(outputURL.path)
default:
    fputs("Video export failed: \(exporter.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}
