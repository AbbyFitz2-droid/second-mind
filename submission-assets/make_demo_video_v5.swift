import AppKit
import AVFoundation
import CoreGraphics
import CoreText
import Foundation
import ImageIO

let root = URL(fileURLWithPath: "/Users/abbyfitz/Documents/Cognisyn/submission-assets")
let framesRoot = root.appendingPathComponent("frames-v5")
let audioURL = root.appendingPathComponent("audio/second-mind-narration-v5.aiff")
let silentURL = root.appendingPathComponent("second-mind-build-week-demo-v5-silent.mp4")
let outputURL = root.appendingPathComponent("second-mind-build-week-demo-v5.mp4")

let frameFiles = [
    "01-home.png",
    "02-situation.png",
    "03-graph.png",
    "04-timeline.png",
    "05-merlin.png",
    "08-agency.png",
    "06-action.png",
    "09-perspective.png",
    "07-evals.png",
    "01-home.png",
]

let captions = [
    "Context before composition",
    "Messages · notes · events · screenshots",
    "A living, editable relationship graph",
    "Chronology before interpretation",
    "Competing hypotheses, not a verdict",
    "Evidence and inference stay separate",
    "The person chooses the response",
    "Perspective Simulation · estimate, not a fact",
    "4,188 conversations · 840 held out · 0 paid API calls",
    "Voice · Push to Think · Reflection · local-first",
]

let weights: [Double] = [0.06, 0.09, 0.10, 0.10, 0.14, 0.10, 0.13, 0.12, 0.09, 0.07]
let width = 1920
let height = 1080
let fps: Int32 = 30

func loadImage(_ url: URL) -> CGImage? {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(source, 0, nil)
}

let images = frameFiles.compactMap { loadImage(framesRoot.appendingPathComponent($0)) }
guard images.count == frameFiles.count else {
    fputs("Could not load every native-resolution product frame.\n", stderr)
    exit(1)
}

let audioAsset = AVURLAsset(url: audioURL)
let audioSeconds = CMTimeGetSeconds(audioAsset.duration)
guard audioSeconds.isFinite, audioSeconds > 0 else {
    fputs("Narration audio is missing or empty.\n", stderr)
    exit(1)
}

let videoSeconds = audioSeconds + 1.2
let totalFrames = Int(ceil(videoSeconds * Double(fps)))

try? FileManager.default.removeItem(at: silentURL)
try? FileManager.default.removeItem(at: outputURL)

let writer: AVAssetWriter
do {
    writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
} catch {
    fputs("Could not create video writer: \(error)\n", stderr)
    exit(1)
}

let compression: [String: Any] = [
    AVVideoAverageBitRateKey: 9_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
]
let videoInput = AVAssetWriterInput(
    mediaType: .video,
    outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: compression,
    ]
)
videoInput.expectsMediaDataInRealTime = false

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: videoInput,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ]
)

guard writer.canAdd(videoInput) else {
    fputs("Could not add the video track.\n", stderr)
    exit(1)
}
writer.add(videoInput)

let segmentDurations = weights.map { $0 * videoSeconds }
var segmentStarts: [Double] = [0]
for duration in segmentDurations.dropLast() {
    segmentStarts.append((segmentStarts.last ?? 0) + duration)
}

let transitionSeconds = 0.65
let rgb = CGColorSpaceCreateDeviceRGB()
let captionFont = CTFontCreateWithName("AvenirNext-DemiBold" as CFString, 34, nil)
let labelFont = CTFontCreateWithName("AvenirNext-Medium" as CFString, 20, nil)

func drawImage(_ image: CGImage, alpha: CGFloat, in context: CGContext) {
    context.saveGState()
    context.setAlpha(alpha)
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    context.restoreGState()
}

func drawText(_ value: String, font: CTFont, color: CGColor, x: CGFloat, y: CGFloat, in context: CGContext) {
    let attributes: [NSAttributedString.Key: Any] = [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): color,
    ]
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: value, attributes: attributes))
    context.textPosition = CGPoint(x: x, y: y)
    CTLineDraw(line, context)
}

func makePixelBuffer(segment: Int, progress: Double) -> CVPixelBuffer? {
    guard let pool = adaptor.pixelBufferPool else { return nil }
    var maybeBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &maybeBuffer) == kCVReturnSuccess,
          let buffer = maybeBuffer else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: rgb,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
    ) else { return nil }

    context.setFillColor(CGColor(red: 0.94, green: 0.92, blue: 0.87, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let fadeStart = max(0, 1 - transitionSeconds / segmentDurations[segment])
    if segment < images.count - 1, progress > fadeStart {
        let blend = min(1, (progress - fadeStart) / max(0.0001, 1 - fadeStart))
        drawImage(images[segment], alpha: CGFloat(1 - blend), in: context)
        drawImage(images[segment + 1], alpha: CGFloat(blend), in: context)
    } else {
        drawImage(images[segment], alpha: 1, in: context)
    }

    let panel = CGRect(x: 54, y: 42, width: 1812, height: 90)
    context.setFillColor(CGColor(red: 0.06, green: 0.10, blue: 0.085, alpha: 0.92))
    context.addPath(CGPath(roundedRect: panel, cornerWidth: 24, cornerHeight: 24, transform: nil))
    context.fillPath()

    drawText(
        captions[segment],
        font: captionFont,
        color: CGColor(red: 0.97, green: 0.96, blue: 0.92, alpha: 1),
        x: 94,
        y: 75,
        in: context
    )
    drawText(
        "SECOND MIND · \(String(format: "%02d", segment + 1))",
        font: labelFont,
        color: CGColor(red: 0.66, green: 0.74, blue: 0.68, alpha: 1),
        x: 1580,
        y: 80,
        in: context
    )

    return buffer
}

guard writer.startWriting() else {
    fputs("Could not start video writer: \(writer.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}
writer.startSession(atSourceTime: .zero)

var segment = 0
for frame in 0..<totalFrames {
    let second = Double(frame) / Double(fps)
    while segment < segmentStarts.count - 1 && second >= segmentStarts[segment + 1] {
        segment += 1
    }
    while !videoInput.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.002)
    }
    let local = second - segmentStarts[segment]
    let progress = min(1, max(0, local / segmentDurations[segment]))
    guard let buffer = makePixelBuffer(segment: segment, progress: progress) else {
        fputs("Could not create video frame \(frame).\n", stderr)
        exit(1)
    }
    let time = CMTime(value: CMTimeValue(frame), timescale: fps)
    guard adaptor.append(buffer, withPresentationTime: time) else {
        fputs("Could not append video frame \(frame).\n", stderr)
        exit(1)
    }
}

videoInput.markAsFinished()
let writeFinished = DispatchSemaphore(value: 0)
writer.finishWriting { writeFinished.signal() }
writeFinished.wait()
guard writer.status == .completed else {
    fputs("Silent video export failed: \(writer.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}

let videoAsset = AVURLAsset(url: silentURL)
let composition = AVMutableComposition()
guard
    let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
    let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
    let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
    let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
else {
    fputs("Could not assemble the final media tracks.\n", stderr)
    exit(1)
}

do {
    try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: videoAsset.duration), of: sourceVideo, at: .zero)
    try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: audioAsset.duration), of: sourceAudio, at: .zero)
} catch {
    fputs("Could not combine narration and video: \(error)\n", stderr)
    exit(1)
}

guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPreset1920x1080) else {
    fputs("Could not create the final exporter.\n", stderr)
    exit(1)
}
exporter.outputURL = outputURL
exporter.outputFileType = .mp4
exporter.shouldOptimizeForNetworkUse = true

let exportFinished = DispatchSemaphore(value: 0)
exporter.exportAsynchronously { exportFinished.signal() }
exportFinished.wait()

guard exporter.status == .completed else {
    fputs("Final export failed: \(exporter.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}

try? FileManager.default.removeItem(at: silentURL)
print(outputURL.path)
