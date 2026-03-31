/*!
 * Mikeotizels Clipboard JS
 *
 * https://github.com/mikeotizels/clipboardjs
 *
 * @package   Mikeotizels/Web/Toolkit
 * @author    Michael Otieno <mikeotizels@gmail.com>
 * @copyright Copyright 2024-2026 Michael Otieno. All Rights Reserved.
 * @license   The MIT License (http://opensource.org/licenses/MIT)
 * @version   2.1.0
 */

;(() => {
    "use strict";

    /**
     * Class moClipboard
     * 
     * Clipboard utility class for copying/cutting text from DOM elements.
     *
     * @class
     */
    window.moClipboard = class {
        /**
         * Constructor
         * 
         * @since 1.0.0
         * @since 2.1.0 Added support for internal event listeners.
         *
         * @param {string}   selector            - A DOM selector string for trigger elements.
         *                                         Defaults to '[data-clipboard]' if not provided.
         *                                         These elements should have either:
         *                                         - `data-clipboard-action` set to either "copy" or "cut"
         *                                         - `data-clipboard-text`   attribute for direct text
         *                                         - `data-clipboard-target` pointing to an element ID
         * @param {Object}   [options={}]        - Configuration options.
         * @param {Function} [options.onSuccess] - Callback function invoked on successful copy/cut.
         *                                         Receives the object `{ action, text, trigger }`.
         * @param {Function} [options.onError]   - Callback function invoked on copy/cut failure.
         *                                         Receives the error object `{ name, message }` and the `trigger` element.
         */
        constructor(selector = "[data-clipboard]", options = {}) {
            this.selector = selector;

            // @since 2.1.0 Internal event listener registry
            this._listeners = new Map();

            // Backward compatibility: support constructor callbacks
            if (typeof options.onSuccess === "function") {
                this.on("success", options.onSuccess);
            }
            if (typeof options.onError === "function") {
                this.on("error", options.onError);
            }

            // @since 2.1.0 Only initialize delegation once
            if (!window.moClipboard._isInitialized) {
                this._init();
                window.moClipboard._isInitialized = true;
            }
        }

        /**
         * Registers a callback for an event ('success' or 'error').
         * 
         * @since 2.1.0
         * 
         * @param {string}   eventName - 'success' or 'error'
         * @param {Function} callback  - function to call when event fires
         * 
         * @returns {this} for chaining
         */
        on(eventName, callback) {
            if (typeof callback !== "function") return this;

            const normalized = eventName.toLowerCase();

            if (!["success", "error"].includes(normalized)) {
                console.warn(`[moClipboard] Unsupported event: "${eventName}"`);
                return this;
            }

            if (!this._listeners.has(normalized)) {
                this._listeners.set(normalized, new Set());
            }

            this._listeners.get(normalized).add(callback);

            return this;
        }

        /**
         * Removes a callback (or all callbacks) for an event.
         * 
         * @since 2.1.0
         * 
         * @param {string}   eventName  - 'success' or 'error'
         * @param {Function} [callback] - specific callback to remove (optional)
         * 
         * @returns {this} for chaining
         */
        off(eventName, callback) {
            const normalized = eventName.toLowerCase();

            if (!this._listeners.has(normalized)) return this;

            if (typeof callback === "function") {
                this._listeners.get(normalized).delete(callback);
                if (this._listeners.get(normalized).size === 0) {
                    this._listeners.delete(normalized);
                }
            } else {
                // Remove all listeners for this event
                this._listeners.delete(normalized);
            }

            return this;
        }

        /**
         * Triggers listeners for an event.
         * 
         * @since 2.1.0
         * 
         * @internal
         */
        _emit(eventName, ...args) {
            const normalized = eventName.toLowerCase();

            if (!this._listeners.has(normalized)) return;

            // Copy set to avoid mutation-during-iteration issues
            for (const cb of [...this._listeners.get(normalized)]) {
                try {
                    cb(...args);
                } catch (error) {
                    console.error(`[moClipboard] Error in ${eventName} callback:`, error);
                }
            }
        }

        /**
         * Initializes event listeners on elements matching the defined selector 
         * and then executes copy or cut operations.
         * 
         * @since 1.0.0
         * 
         * @private
         */
        _init() {
            /**
             * Add click event listeners to all trigger elements.
             * 
             * The Clipboard API requires transient activation, hence, it must 
             * be triggered off a UI event like a button click.
             * 
             * @see https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation
             * 
             * @since 2.1.0 Attaches a single delegated event listener to document 
             *              instead of binding to each button.
             */
            document.addEventListener("click", async (event) => {
                // Only continue if the clicked element matches our selector
                const trigger = event.target.closest(this.selector);
                if (!trigger) return;

                // Prevent the default behavior of the element.
                event.preventDefault();

                // Determine the action to execute.
                let action = trigger.getAttribute("data-clipboard-action") || "copy";
                if (action !== "copy" && action !== "cut") {
                    console.warn('[moClipboard] Invalid "action" attribute, defaulting to "copy".');
                    action = "copy";
                }

                // Determine the text to use.
                let text, targetEl;
                if (trigger.hasAttribute("data-clipboard-text")) {
                    // Use explicit text if provided.
                    text = trigger.getAttribute("data-clipboard-text");
                } else if (trigger.hasAttribute("data-clipboard-target")) {
                    // Use the text from another element referenced by its ID.
                    const targetId = trigger.getAttribute("data-clipboard-target");
                    targetEl = document.getElementById(targetId);

                    if (!targetEl) {
                        console.error(`[moClipboard] Target element not found: #${targetId}`);
                        this._emit("error", new Error("Target not found"), trigger);
                        return;
                    }

                    if (action === "copy" && targetEl.hasAttribute("disabled")) {
                        console.error('[moClipboard] Use "readonly" instead of "disabled" for copy targets.');
                        this._emit("error", new Error("Disabled target invalid for copy"), trigger);
                        return;
                    }

                    if (action === "cut" && (targetEl.hasAttribute("readonly") || targetEl.hasAttribute("disabled"))) {
                        console.error('[moClipboard] Cannot cut from readonly or disabled elements.');
                        this._emit("error", new Error("Readonly/disabled target invalid for cut"), trigger);
                        return;
                    }

                    text = this._getText(targetEl);
                } else {
                    // Fallback: Use text from the triggering element itself.
                    text = this._getText(trigger);
                }

                try {
                    // Execute the desired action.
                    if (action === "copy") {
                        await this._copy(text);
                    } else if (action === "cut") {
                        await this._copy(text);
                        this._removeText(targetEl);
                    }

                    this._emit("success", { action, text, trigger });
                } catch (error) {
                    console.error('[moClipboard] Operation failed:', error);
                    this._emit("error", error, trigger);
                }
            }, { passive: false });
        }

        /**
         * Retrieves text from an element.
         * 
         * If the element is an input or textarea, returns its value; otherwise, 
         * returns its innerText.
         * 
         * @since 1.0.0
         *
         * @param {HTMLElement} element Trigger or target element.
         * 
         * @returns {string}
         * 
         * @private
         */
        _getText(element) {
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                return element.value;
            }
            return element.innerText || element.textContent || "";
        }

        /**
         * Removes text from an element.
         * 
         * If the element is an input or textarea, removes its value, if it is
         * content editable, removes its innerHTML; otherwise, removes innerText.
         * 
         * @since 2.0.0
         *
         * @param {HTMLElement} element Target element.
         * 
         * @returns {void}
         * 
         * @private
         */
        _removeText(element) {
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                element.value = "";
            } else if (element.isContentEditable) {
                element.innerHTML = "";
            } else {
                element.innerText = "";
            }
        }

        /**
         * Copy action wrapper.
         * 
         * Copies the text to the clipboard.
         * 
         * @since 1.0.0
         *
         * @param {string} text - The text to copy.
         * 
         * @private
         */
        _copy(text) {
            if (navigator.clipboard?.writeText) {
                return navigator.clipboard.writeText(text);
            }
            return this._fallbackCopy(text);
        }

        /**
         * Fallback copy method.
         * 
         * Creates a temporary textarea element with a value and tries to use 
         * the outdated document.execCommand method to execute the copy action.
         * 
         * @since 1.0.0
         * 
         * @private
         *
         * @param {string} text - The text to copy.
         * 
         * @private
         */
        _fallbackCopy(text) {
            const textarea = document.createElement("textarea");

            // Position the textarea off-screen to avoid UI disruption.
            textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                const success = document.execCommand("copy");
                if (!success) throw new Error("execCommand('copy') failed");
            } catch (error) {
                throw error;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };
})();
