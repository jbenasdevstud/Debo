import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Upload key: android/keystore.properties (not shared) points to the .jks file and its passwords
val keystoreProps = Properties().apply {
    rootProject.file("keystore.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}

android {
    namespace = "com.debo.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.debo.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 40
        versionName = "1.1.1"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        if (keystoreProps.containsKey("storeFile")) create("upload") {
            storeFile = file(keystoreProps.getProperty("storeFile"))
            storePassword = keystoreProps.getProperty("storePassword")
            keyAlias = keystoreProps.getProperty("keyAlias")
            keyPassword = keystoreProps.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("upload")
            // R8 shrinks and optimises the code (Play Console's "DEX code optimisation");
            // proguard-rules.pro keeps the JavaScript bridge methods the web app calls by name
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            isDebuggable = false
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
    implementation("com.android.billingclient:billing:9.1.0")
    implementation("androidx.credentials:credentials:1.6.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.6.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    implementation("androidx.health.connect:connect-client:1.1.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}

configurations.configureEach {
    resolutionStrategy.force(
        "org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22",
        "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22"
    )
}
