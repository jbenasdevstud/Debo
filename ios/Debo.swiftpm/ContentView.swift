import SwiftUI

struct ContentView: View {
    var body: some View {
        if let index = WebFiles.indexURL {
            DeboWebView(indexURL: index)
                .ignoresSafeArea(.container, edges: .bottom)
        } else {
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.largeTitle)
                Text("Web/index.html not found")
                    .font(.headline)
                Text("Check that the Web folder is inside the app package.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
    }
}

/// Finds Web/index.html in the app's resources.
enum WebFiles {
    static var indexURL: URL? {
        let bundles = [Bundle.main] + Bundle.allBundles + Bundle.allFrameworks
        for bundle in bundles {
            if let url = bundle.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
                return url
            }
            guard let resources = bundle.resourceURL else { continue }
            // SwiftPM resource bundle (…AppModule.bundle) next to the app's files
            let items = (try? FileManager.default.contentsOfDirectory(at: resources, includingPropertiesForKeys: nil)) ?? []
            for item in items where item.pathExtension == "bundle" {
                let index = item.appendingPathComponent("Web/index.html")
                if FileManager.default.fileExists(atPath: index.path) {
                    return index
                }
            }
        }
        return nil
    }
}
