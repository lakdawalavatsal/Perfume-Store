import Foundation
import Vision
import AppKit

func recognizeText(imagePath: String) -> [String] {
    guard let image = NSImage(contentsOfFile: imagePath),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        return []
    }
    var lines: [String] = []
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeTextRequest { (req, err) in
        guard let obs = req.results as? [VNRecognizedTextObservation] else { return }
        for o in obs {
            if let str = o.topCandidates(1).first?.string {
                lines.append(str)
            }
        }
    }
    request.recognitionLevel = .accurate
    try? requestHandler.perform([request])
    return lines
}

print("==================== 50 ML CATALOG ====================")
for i in 1...12 {
    let p = String(format: "extracted_assets/50ml/page_%02d.png", i)
    let lines = recognizeText(imagePath: p)
    print("----- 50ML PAGE \(i) (\(p)) -----")
    for l in lines {
        print(l)
    }
}

print("\n==================== 20 ML CATALOG ====================")
for i in 1...5 {
    let p = String(format: "extracted_assets/20ml/page_%02d.png", i)
    let lines = recognizeText(imagePath: p)
    print("----- 20ML PAGE \(i) (\(p)) -----")
    for l in lines {
        print(l)
    }
}
