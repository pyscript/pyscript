from pyscript import document

document.body.textContent = f"{document.body.textContent.strip()}OK";

document.documentElement.classList.add(__script__.id)
