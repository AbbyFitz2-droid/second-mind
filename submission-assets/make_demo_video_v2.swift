import AVFoundation
import CoreGraphics
import Foundation

let root = URL(fileURLWithPath: "/Users/abbyfitz/Documents/Cognisyn/submission-assets")
let videoURL = root.appendingPathComponent("second-mind-screen.mov")
let audioURL = root.appendingPathComponent("audio/second-mind-narration-normal.aiff")
let outputURL = root.appendingPathComponent("second-mind-build-week-demo-v4.mp4")

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

do {
    try videoTrack.insertTimeRange(
        CMTimeRange(start: .zero, duration: videoDuration),
        of: sourceVideo,
        at: .zero
    )
    try audioTrack.insertTimeRange(
        CMTimeRange(start: .zero, duration: audioDuration),
        of: sourceAudio,
        at: .zero
    )
} catch {
    fputs("Could not assemble the demo: \(error)\n", stderr)
    exit(1)
}

// Crop the original full-desktop capture down to the 16:9 product viewport.
let crop = CGRect(x: 1320, y: 448, width: 1170, height: 658)
let renderSize = CGSize(width: 1920, height: 1080)
let scaleX = renderSize.width / crop.width
let scaleY = renderSize.height / crop.height

let videoComposition = AVMutableVideoComposition()
videoComposition.renderSize = renderSize
videoComposition.frameDuration = CMTime(value: 1, timescale: 30)

let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: videoDuration)

let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
let transform = CGAffineTransform(scaleX: scaleX, y: scaleY)
    .translatedBy(x: -crop.origin.x, y: -crop.origin.y)
layerInstruction.setTransform(transform, at: .zero)
instruction.layerInstructions = [layerInstruction]
videoComposition.instructions = [instruction]

guard let exporter = AVAssetExportSession(
    asset: composition,
    presetName: AVAssetExportPreset1920x1080
) else {
    fputs("Could not create the video exporter.\n", stderr)
    exit(1)
}

exporter.outputURL = outputURL
exporter.outputFileType = .mp4
exporter.videoComposition = videoComposition
exporter.shouldOptimizeForNetworkUse = true

let finished = DispatchSemaphore(value: 0)
exporter.exportAsynchronously { finished.signal() }
finished.wait()

switch exporter.status {
case .completed:
    print(outputURL.path)
default:
    fputs("Video export failed: \(exporter.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}
