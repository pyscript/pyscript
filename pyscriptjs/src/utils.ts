
function addClasses(element: HTMLElement, classes: Array<string>){
    for (let entry of classes) {
      element.classList.add(entry);
    }
}

const getLastPath = function (str) {
  return str.split('\\').pop().split('/').pop();
}

export {addClasses, getLastPath}