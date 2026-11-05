import UIKit
import WebKit
import ObjectiveC

/// WKWebView ignores a JavaScript focus() that was not caused by a tap: the field gets a caret,
/// but the on-screen keyboard does not open and typing on a hardware keyboard goes nowhere.
/// Debo focuses fields itself (name, amount, search), so treat every focus as user-initiated.
/// This is the same approach Capacitor/Cordova apps use (KeyboardDisplayRequiresUserAction = false).
enum KeyboardFocus {
    private static var installed = false

    static func allowProgrammaticFocus() {
        guard !installed else { return }
        installed = true
        guard let contentView = NSClassFromString("WK" + "ContentView") else { return }
        let selector = sel_getUid("_elementDidFocus:userIsInteracting:blurPreviousNode:activityStateChanges:userObject:")
        guard let method = class_getInstanceMethod(contentView, selector) else { return }

        typealias Original = @convention(c) (AnyObject, Selector, UnsafeRawPointer, Bool, Bool, UInt, AnyObject?) -> Void
        let original = unsafeBitCast(method_getImplementation(method), to: Original.self)
        let replacement: @convention(block) (AnyObject, UnsafeRawPointer, Bool, Bool, UInt, AnyObject?) -> Void = {
            view, element, _, blurPrevious, activityChanges, userObject in
            original(view, selector, element, true, blurPrevious, activityChanges, userObject)
        }
        method_setImplementation(method, imp_implementationWithBlock(replacement))
    }
}
