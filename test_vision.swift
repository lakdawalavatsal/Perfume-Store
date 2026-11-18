import Foundation
import Vision
import AppKit

func recognizeText(imagePath: String) {
    guard let image = NSImage(contentsOfFile: imagePath),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("Cannot load \(imagePath)")
        return
    }
    
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        print("=== Results for \(imagePath) ===")
        for observation in observations {
            let candidate = observation.topCandidates(1).first
            if let string = candidate?.string {
                print(string)
            }
        }
    }
    request.recognitionLevel = .accurate
    try? requestHandler.perform([request])
}

let args = CommandLine.arguments
if args.count > 1 {
    recognizeText(imagePath: args[1])
}
