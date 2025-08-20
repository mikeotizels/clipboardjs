Mikeotizels Clipboard JS
========================

Version 2.0.0 - July 2025

**Mikeotizels Clipboard** is a lightweight JavaScript utility for handling copy
and cut operations using the modern asynchronous [Clipboard API][1]. Designed 
as a drop-in replacement for [Zenorocha's ClipboardJS][2] to addresses browser 
[compatibility issues][3] caused by the deprecated `execCommand` approach.

It supports:

  - Using a provided text via data-clipboard-text;
  - If not provided, checking for a data-clipboard-target attribute to 
    find another element by its ID;
  - Fallback to the old (synchronous) `document.execCommand` method if the 
    Clipboard API isn't available;
  - Callback functions for handling the "success" and "error" events after 
    triggering an action (copy or cut).

---

## Usage

1. **Load the Script**  

Simply include or bundle the script with your project.

Example:

```html
<script src="/assets/vendor/mikeotizels/dist/js/mo.clipboard.min.js"></script>
```

2. **Mark Up Your HTML** 

For an element to work with the plugin, add one or more of the following data
attributes:

- *data-clipboard* (default): Flag to register element with plugin. You can pass
  any selector you like to the class constructor when initializing the plugin.

- *data-clipboard-action*: Specify the action to execute, either "copy" or "cut". 
  If this attribute is omitted or has an invalid value, copy will be used by 
  default. 

- *data-clipboard-text* (optional): Explicit text value to copy or cut. If omitted,
  the inner text of the trigger element will be used.

- *data-clipboard-target* (optional): The ID of another element whose content will 
  be used. 

---

##### Copy text from another element

A pretty common use case is to copy content from another element. You can do 
that by adding a data-clipboard-target attribute in your trigger element. The 
value you include on this attribute needs to match the target element's ID.
  
```html 
<!-- Target element that holds the text -->
<div id="copy-target">
     Text to be copied...
</div>

<!-- Copy button that uses another element's text -->
<button type="button" class="btn btn-clipboard" aria-label="Copy"
    data-clipboard-action="copy"
    data-clipboard-target="copy-target">
    Copy text from element
</button>
```

---

##### Cut text from another element

Additionally, you can set the data-clipboard-action attribute to "cut" if you 
want to cut content from an element. If you omit this attribute, copy will be 
used by default.

```html
<!-- Target -->
<textarea id="cut-target">Text to be cut...</textarea>

<!-- Trigger -->
<button type="button" class="btn btn-clipboard" aria-label="Cut"
    data-clipboard-action="cut"
    data-clipboard-target="cut-target">
    Cut to clipboard
</button>
```

As you may expect, the "cut" action only works on `<input>` or `<textarea>` 
elements.

---

##### Copy text from explicit attribute

Truth is, you don't even need another element to copy its content from. You can 
just include a data-clipboard-text attribute in your trigger element.

```html
<!-- Copy button that pulls text explicitly -->
<button type="button" class="btn btn-clipboard" aria-label="Copy"
    data-clipboard-action="copy"
    data-clipboard-text="Hello, world!">
    Copy text from attribute
</button>
```

3. **Set Up the Script**  

After the DOM is ready, initialize the class and optionally provide callback 
functions:

```js
var clipboardSetup = function() {
    // Return early if the moClipboard object is undefined.
    if (typeof moClipboard === 'undefined') {
        console.error('Mikeotizels Clipboard JS is not loaded on the page.');
        // TODO: Optionally, hide the clipboard trigger elements if the handler 
        //       script is not available.
        return;
    }

    // Instantiate object
    const clipboard = new moClipboard('.btn-clipboard', {
        // Success callback
        // Called on a successful copy or cut; receives an object:
        // `{ action, text, trigger }`
        success: (event) => {
            //console.info(`Successfully executed "${event.action}" action with text: ${event.text}`);
            // TODO: You can add further UI feedback here, like showing a 
            //       tooltip "Copy" or "Cut" on the trigger element.
            showToast(event.action);
        },    
        // Error callback
        // Called on failure; receives the Error object and the trigger element.
        error: (error, trigger) => {
            console.error(`Error during ${trigger.getAttribute("data-clipboard-action")}:`, error);
            // TODO: Optionally, show a generic error message to the user or
            //       show a tooltip "Error" on the trigger element.
        }
    });

    // Custom toast notification.
    // TODO: You can use Bootstrap or SweetAlert2 toast which supports light 
    //       and dark theme and custom positioning options.
    function showToast(action, timeout = 3000) {
        const toastDiv  = document.createElement('div');
        let toastText = 'Copied to clipboard';

        if (action == 'cut') {
            toastText = 'Cut to clipboard'; 
        }

        toastDiv.setAttribute('style', 'position:fixed;top:100px;left:50%;z-index:9999;width:225px;text-align:center;color:#ffffff;background-color:#343a40;border:1px solid #1d2124;padding:10px 15px;border-radius:4px;margin-left:-100px;box-shadow:0 0 10px rgba(0,0,0,0.2);');
        toastDiv.appendChild(document.createTextNode(toastText));
        document.body.appendChild(toastDiv);
        setTimeout(function() {
            document.body.removeChild(toastDiv);
        }, timeout);
    }
}();
``` 
---

## Events

There are cases where you'd like to show some user feedback or capture what has 
been selected after a copy or cut operation.

That's why custom events are fired, such as success and error for you to listen
and implement your custom logic.

- **`success`**

    - Called on successful copy/cut operation
    - Receives the object `{ action, text, trigger }` 
    - Defaults to `console.log()`

- **`error`**
    
    - Called on failed copy/cut operation
    - Receives the error object `{ name, message }` and the `trigger` element
    - Defaults to `console.error()`

For a live demo of the default callback functions, just open your console.

---

## Additional Considerations

- **Security & Environment:**

  The new asynchronous Clipboard API requires a [secure context][4]. Ensure your 
  site is served over HTTPS to utilize these features. Additionally, it requires
  [transient activation][5], hence, it must be triggered off a UI event like a 
  button click.

- **UI Feedback:** 
  
  Each application has different design needs, that's why Clipboard JS does not 
  include any CSS or built-in notification solution. You might want to integrate 
  further visual feedback (like tooltips or toasts) when a copy or cut operation 
  succeeds or fails. 

- **Customized Data:**   

  If your application needs richer clipboard functionality, you can extend this 
  plugin to handle different types of data (like HTML or images) using the newer
  methods such as `navigator.clipboard.write()`, which accepts ClipboardItem 
  objects.
 
- **Further Enhancements:**  

  If you later decide to add paste functionality or allow dynamic selection of 
  content (for example, grabbing the current selection), you could add similar
  methods for reading from the clipboard with `navigator.clipboard.readText()`.

---

## Licensing

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file 
for the license terms.

-------------------------------------------------------------------------------

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
[2]: https://github.com/zenorocha/clipboard.js/issues/880
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
[4]: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
[5]: https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation
