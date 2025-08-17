Mikeotizels Clipboard JS
========================

Version 1.0.0 - December 2024

Mikeotizels Clipboard JS is a lightweight JavaScript utility for handling copy 
and cut operations using the asynchronous Clipboard API.

It supports:

  - Using a provided text via data-clipboard-text;
  - If not provided, checking for a data-clipboard-target attribute to 
    find another element by its ID;
  - Fallback to the old (synchronous) `document.execCommand` method if the 
    Clipboard API isn't available;
  - Callback functions for handling the "onSuccess" and "onError" events after 
    triggering an action (copy or cut).

---

### **How to Use**

1. **Include the Script**  

Simply include or bundle the script with your project.

```html
<script src="/path/to/mo.clipboard.min.js"></script>
```

2. **Markup the HTML** 

For an element to work with the plugin, add one or more of the following data
attributes:

- data-clipboard-action: Specify the action to execute, either "copy" or "cut". 
  If this attribute is omitted or has an invalid value, copy will be used by 
  default. 
- data-clipboard-text (optional): Explicit text value to copy or cut. If omitted,
  the inner text of the trigger element will be used.
- data-clipboard-target (optional): The ID of another element whose content will 
  be used. 

##### Copy text from explicit attribute

Just include a data-clipboard-text attribute in your trigger element.

```html
<!-- Copy button that pulls text explicitly -->
<button class="btn btn-clipboard" aria-label="Copy"
    data-clipboard-action="copy"
    data-clipboard-text="Hello, world!">
    Copy text from attribute
</button>
```

##### Copy text from another element

A pretty common use case is to copy content from another element. You can do 
that by adding a data-clipboard-target attribute in your trigger element. The 
value you include on this attribute needs to match the target element's ID.
  
```html 
<!-- Copy button that uses another element's text -->
<button class="btn btn-clipboard" aria-label="Copy"
    data-clipboard-action="copy"
    data-clipboard-target="copyTarget">
    Copy text from element
</button>

<!-- Target element that holds the text -->
<div id="copyTarget">
     Text to be copied...
</div>
```

##### Cut text from another element

Additionally, you can set the data-clipboard-action attribute to "cut" if you 
want to cut content from an element. If you omit this attribute, copy will be 
used by default. As you may expect, the cut action only works on `<input>` or 
`<textarea>` elements.

```html
<!-- Target -->
<textarea id="cutTarget">Text to be cut...</textarea>

<!-- Trigger -->
<button class="btn btn-clipboard" aria-label="Cut"
    data-clipboard-action="cut"
    data-clipboard-target="cutTarget">
    Cut to clipboard
</button>
```

3. **Set Up the Plugin**  

After the DOM is ready, initialize the plugin and optionally provide callback 
functions:

```js
var clipboardSetup = function() {
    // Return early if the moClipboard object is undefined.
    if (typeof moClipboard === 'undefined') {
        console.error('The Mikeotizels Clipboard JS is not loaded on the page.');
        return;
    }

    // Instantiate object
    var clipboard = new moClipboard('.btn-clipboard', {
        // Success callback
        // Called on a successful copy or cut; receives an object:
        // `{ action, text, trigger }`
        onSuccess: (info) => {
            console.log(`Successfully executed: ${info.action}`);
            // TODO: You can add further UI feedback here, like showing a 
            //       tooltip "Copy" or "Cut" on the trigger element.
            showToast(info.action);
        },    
        // Error callback
        // Called on failure; receives the error object and the trigger element.
        onError: (error, trigger) => {
            console.error(`Error during ${trigger.getAttribute("data-clipboard-action")}:`, error);
            // TODO: Optionally, show a generic error message to the user
        }
    });

    // Custom toast notification.
    function showToast(action, timeout = 3000) {
        const toastDiv = document.createElement('div');
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

## Inspirations

[zenorocha/clipboardjs](https://clipboardjs.com)