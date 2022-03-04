
export function addClasses(element: HTMLElement, classes: Array<string>){
    for (let entry of classes) {
      element.classList.add(entry);
    }
}
