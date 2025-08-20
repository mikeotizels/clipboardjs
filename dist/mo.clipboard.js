/*!
 * Mikeotizels Clipboard JS
 * 
 * https://github.com/mikeotizels/clipboardjs
 * 
 * @category  Web API
 * @package   Mikeotizels/Web/Toolkit
 * @author    Michael Otieno <mikeotizels@gmail.com>
 * @copyright Copyright 2024-2025 Michael Otieno. All Rights Reserved.
 * @license   The MIT License (http://opensource.org/licenses/MIT)
 * @since     2.0.0
 * @version   2.0.0
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
    class moClipboard {
        /**
         * Constructor.
         * 
         * @since 1.0.0
         *
         * @param {string}   selector          - A CSS selector string for trigger elements.
         *                                       Defaults to '[data-clipboard]' if not provided.
         *                                       These elements should have either:
         *                                       - `data-clipboard-action` set to either "copy" or "cut"
         *                                       - `data-clipboard-text`   attribute for direct text
         *                                       - `data-clipboard-target` pointing to an element ID
         * @param {Object}   [options={}]      - Configuration options.
         * @param {Function} [options.success] - Callback function invoked on successful copy/cut.
         *                                       Receives the object `{ action, text, trigger }`.
         *                                       Defaults to `console.info()`
         * @param {Function} [options.error]   - Callback function invoked on copy/cut failure.
         *                                       Receives the error object `{ name, message }` and the `trigger` element. 
         *                                       Defaults to `console.error()`.
         */
        constructor(selector, options = {}) {
            // Selector for trigger elements
            this.selector = selector || "[data-clipboard]";

            // Options for callback events
            this.options = options;

            // Callback function for success event
            this.success = typeof this.options.success === "function"
                ? this.options.success
                : (data, trigger) => console.info("[moClipboard] Clipboard operation executed.", { action, text, trigger });
            
            // Callback function for error event
            this.error = typeof this.options.error === "function"
                ? this.options.error
                : (error, trigger) => console.error("[moClipboard] Clipboard operation failed.", error, { trigger: trigger });
            
            // Initialize the plugin
            this._init();
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
            // Select all elements that should trigger the Clipboard API.
            const triggers = document.querySelectorAll(this.selector);

            // Return early if no trigger element is found in the current DOM.
            if (!triggers.length) {
                return;
            }

            /**
             * Add click event listeners to all trigger elements.
             * 
             * The Clipboard API requires transient activation, hence, it must 
             * be triggered off a UI event like a button click.
             * 
             * @see https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation
             * 
             * @todo Try attaching a single delegated event listener to document 
             *       instead of binding to each button.
             */
            triggers.forEach((trigger) => {
                // Arrow function keeps `this` bound to the instance.
                trigger.addEventListener("click", async (event) => {
                    // Prevent the default behavior of the element.
                    event.preventDefault();

                    // Determine the action to execute.
                    let action = trigger.getAttribute("data-clipboard-action");
                    if (!action || (action !== "copy" && action !== "cut")) {
                        // Default to copy if data-clipboard-action attribute 
                        // is missing or has an invalid value.
                        console.warn('[moClipboard] Missing or invalid "action" attribute, defaulting to "copy".');
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

                        if (targetEl) {
                            if (action === "copy" && targetEl.hasAttribute("disabled")) {
                                console.error(
                                    '[moClipboard] Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute.'
                                );
                                return;
                            }

                            if (action === "cut" && (targetEl.hasAttribute("readonly") || targetEl.hasAttribute("disabled"))) {
                                console.error(
                                    '[moClipboard] Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes.'
                                );
                                return;
                            }

                            text = this._getText(targetEl);
                        } else {
                            console.error(`[moClipboard] Unable to find the "target" element with ID "${targetId}"`);
                            return;
                        }
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
                        this.success({ action: action, text: text, trigger: trigger });
                    } catch (error) {
                        this.error(error, trigger);
                    }                    
                });
            });
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

            return element.innerText;
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
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            } else {
                return this._fallbackCopy(text);
            } 
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
            textarea.style.position = "fixed";
            textarea.style.top      = "0";
            textarea.style.left     = "0";
            textarea.style.opacity  = "0";
            textarea.value          = text;
            textarea.setAttribute("readonly", "readonly");
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                document.execCommand("copy");
            } catch (error) {
                throw error;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }

    // Expose the moClipboard class globally.
    window.moClipboard = moClipboard;
})();
