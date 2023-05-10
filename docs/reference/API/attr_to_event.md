# List of PyScript Attributes to Events:

PyScript provides a convenient syntax for mapping JavaScript events to PyScript events, making it easy to connect events to HTML tags.

For example, you can use the following code to connect the click event to a button:

```
<button id="py-click" py-click="foo()">Click me</button>
```

Here is a list of all the available event mappings:

| PyScript Event Name | DOM Event Name |
|-------------------|----------------|
| py-afterprint     | afterprint     |
| py-beforeprint    | beforeprint    |
| py-beforeunload   | beforeunload   |
| py-error          | error          |
| py-hashchange     | hashchange     |
| py-load           | load           |
| py-message        | message        |
| py-offline        | offline        |
| py-online         | online         |
| py-pagehide       | pagehide       |
| py-pageshow       | pageshow       |
| py-popstate       | popstate       |
| py-resize         | resize         |
| py-storage        | storage        |
| py-unload         | unload         |
| py-blur           | blur           |
| py-change         | change         |
| py-contextmenu    | contextmenu    |
| py-focus          | focus          |
| py-input          | input          |
| py-invalid        | invalid        |
| py-reset          | reset          |
| py-search         | search         |
| py-select         | select         |
| py-submit         | submit         |
| py-keydown        | keydown        |
| py-keypress       | keypress       |
| py-keyup          | keyup          |
| py-click          | click          |
| py-dblclick       | dblclick       |
| py-mousedown      | mousedown      |
| py-mousemove      | mousemove      |
| py-mouseout       | mouseout       |
| py-mouseover      | mouseover      |
| py-mouseup        | mouseup        |
| py-mousewheel     | mousewheel     |
| py-wheel          | wheel          |
| py-drag           | drag           |
| py-dragend        | dragend        |
| py-dragenter      | dragenter      |
| py-dragleave      | dragleave      |
| py-dragover       | dragover       |
| py-dragstart      | dragstart      |
| py-drop           | drop           |
| py-scroll         | scroll         |
| py-copy           | copy           |
| py-cut            | cut            |
| py-paste          | paste          |
| py-abort          | abort          |
| py-canplay        | canplay        |
| py-canplaythrough | canplaythrough |
| py-cuechange      | cuechange      |
| py-durationchange | durationchange |
| py-emptied        | emptied        |
| py-ended          | ended          |
| py-loadeddata     | loadeddata     |
| py-loadedmetadata | loadedmetadata |
| py-loadstart      | loadstart      |
| py-pause          | pause          |
| py-play           | play           |
| py-playing        | playing        |
| py-progress       | progress       |
| py-ratechange     | ratechange     |
| py-seeked         | seeked         |
| py-seeking        | seeking        |
| py-stalled        | stalled        |
| py-suspend        | suspend        |
| py-timeupdate     | timeupdate     |
| py-volumechange   | volumechange   |
| py-waiting        | waiting        |
| py-toggle         | toggle         |
