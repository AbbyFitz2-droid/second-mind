import AVFoundation
import Foundation
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: "/Users/abbyfitz/Documents/Cognisyn/submission-assets")
let videoURL = root.appendingPathComponent("second-mind-build-week-demo-v5.mp4")
let output = root.appendingPathComponent("frames-v5")
let asset = AVURLAsset(url: videoURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

print(String(format: "duration: %.2f seconds", CMTimeGetSeconds(asset.duration)))
print("video tracks: \(asset.tracks(withMediaType: .video).count)")
print("audio tracks: \(asset.tracks(withMediaType: .audio).count)")

for second in [2, 18, 32, 45, 60, 80, 96, 114, 132, 143] {
    let time = CMTime(seconds: Double(second), preferredTimescale: 600)
    let image = try generator.copyCGImage(at: time, actualTime: nil)
    let url = output.appendingPathComponent(String(format: "verify-%03d.png", second))
    guard let destination = CGImageDestinationCreateWithURL(
        url as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else { continue }
    CGImageDestinationAddImage(destination, image, nil)
    CGImageDestinationFinalize(destination)
    print(url.path)
}
