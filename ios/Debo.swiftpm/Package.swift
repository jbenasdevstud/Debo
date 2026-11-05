// swift-tools-version: 5.9

// Swift Playgrounds app package for Debo (iPad / Mac).
// The app shows the same web version of Debo that the Android app uses (Web/).

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
            appIcon: .placeholder(icon: .heart),
            accentColor: .presetColor(.teal),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft,
                .portraitUpsideDown(.when(deviceFamilies: [.pad]))
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
