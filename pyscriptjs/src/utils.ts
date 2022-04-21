
function addClasses(element: HTMLElement, classes: Array<string>){
    for (let entry of classes) {
      element.classList.add(entry);
    }
}

const getLastPath = function (str) {
  return str.split('\\').pop().split('/').pop();
}

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return ltrim(doc.documentElement.textContent);
}

function ltrim(code: string): string {
  const lines = code.split("\n")
  if (lines.length == 0)
    return code

  const lengths = lines
    .filter((line) => line.trim().length != 0)
    .map((line) => {
      const [prefix] = line.match(/^\s*/)
      return prefix.length
    })

  const k = Math.min(...lengths)

  if (k != 0)
    return lines.map((line) => line.substring(k)).join("\n")
  else
    return code
}

export {addClasses, getLastPath, ltrim, htmlDecode}
