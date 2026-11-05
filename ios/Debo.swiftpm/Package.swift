// swift-tools-version: 5.9

// Swift Playgrounds app package for Debo (iPhone / iPad).
// The app shows the same web version of Debo that the Android app uses (Web/),
// with native iOS reminders, printing, file export and barcode scanning.

import PackageDescription
import AppleProductTypes

let package = Package(
    name: "Debo",
    platforms: [
        .iOS("17.0")
    ],
    products: [
        .iOSApplication(
            name: "Debo",
            targets: ["AppModule"],
            bundleIdentifier: "com.debo.app",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .asset("AppIcon"),
            accentColor: .asset("AccentColor"),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft,
                .portraitUpsideDown(.when(deviceFamilies: [.pad]))
            ],
            capabilities: [
                .camera(purposeString: "Debo uses the camera to scan food barcodes.")
            ]
        )
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            path: ".",
            resources: [
                .copy("Web")
            ]
        )
    ]
)
