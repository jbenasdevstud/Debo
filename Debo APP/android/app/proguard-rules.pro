# R8 rules for Debo (release builds shrink and optimise the code)

# The web app calls the bridge objects by method name (window.AndroidHealth.readGlucose(...) and so on):
# every @JavascriptInterface method must keep its exact name, or the call silently does nothing
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Crash reports in Play Console keep file and line numbers (names are mapped back with the
# mapping file that is packed into the app bundle)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
