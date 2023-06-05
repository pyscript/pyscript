const div = document.body.appendChild(document.createElement("div"));
div.style.cssText = "position:fixed;top:0;left:0";

let i = 0;
(function counter() {
    div.textContent = ++i;
    requestAnimationFrame(counter);
})();
