import Foundation
import PDFKit
import AppKit

func processPDF(filePath: String, outDir: String) {
    let url = URL(fileURLWithPath: filePath)
    guard let document = PDFDocument(url: url) else {
        print("Failed to open \(filePath)")
        return
    }
    
    try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
    let pageCount = document.pageCount
    print("Processing \(filePath), total pages: \(pageCount)")
    
    for i in 0..<pageCount {
        guard let page = document.page(at: i) else { continue }
        let text = page.string ?? ""
        print("--- Page \(i + 1) ---")
        print(text)
        
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0 // High-res
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        
        let image = NSImage(size: size)
        image.lockFocus()
        if let context = NSGraphicsContext.current?.cgContext {
            context.setFillColor(NSColor.white.cgColor)
            context.fill(CGRect(origin: .zero, size: size))
            context.scaleBy(x: scale, y: scale)
            page.draw(with: .mediaBox, to: context)
        }
        image.unlockFocus()
        
        if let tiffData = image.tiffRepresentation,
           let bitmap = NSBitmapImageRep(data: tiffData),
           let pngData = bitmap.representation(using: .png, properties: [:]) {
            let outPath = "\(outDir)/page_\(i + 1).png"
            try? pngData.write(to: URL(fileURLWithPath: outPath))
            print("Saved page image to \(outPath)")
        }
    }
}

let base = FileManager.default.currentDirectoryPath
processPDF(filePath: "\(base)/Mangaalam Perfumes 50ml.pdf", outDir: "\(base)/extracted/50ml")
processPDF(filePath: "\(base)/Mangaalam Perfumes 20ml.pdf", outDir: "\(base)/extracted/20ml")
