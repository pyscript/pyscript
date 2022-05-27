import toga
from toga.style.pack import COLUMN, LEFT, RIGHT, ROW, Pack


class FreedomApp(toga.App):
    def calculate(self, widget):
        try:
            self.c_input.value = (float(self.f_input.value) - 32.0) * 5.0 / 9.0
        except ValueError:
            self.c_input.value = "???"

    def startup(self):
        self.main_window = toga.MainWindow(title=self.name)

        c_box = toga.Box()
        f_box = toga.Box()
        box = toga.Box()

        self.c_input = toga.TextInput(id="c_input", readonly=True)
        self.f_input = toga.TextInput(id="f_input")

        c_label = toga.Label("Celsius", style=Pack(text_align=LEFT))
        f_label = toga.Label("Fahrenheit", style=Pack(text_align=LEFT))
        join_label = toga.Label("is equivalent to", style=Pack(text_align=RIGHT))

        button = toga.Button("Calculate", id="calculate", on_press=self.calculate)

        f_box.add(self.f_input)
        f_box.add(f_label)

        c_box.add(join_label)
        c_box.add(self.c_input)
        c_box.add(c_label)

        box.add(f_box)
        box.add(c_box)
        box.add(button)

        box.style.update(direction=COLUMN, padding_top=10)
        f_box.style.update(direction=ROW, padding=5)
        c_box.style.update(direction=ROW, padding=5)

        self.c_input.style.update(flex=1)
        self.f_input.style.update(flex=1, padding_left=160)
        c_label.style.update(width=100, padding_left=10)
        f_label.style.update(width=100, padding_left=10)
        join_label.style.update(width=150, padding_right=10)

        button.style.update(padding=15, flex=1)

        self.main_window.content = box
        self.main_window.show()


def main():
    return FreedomApp("Freedom Units", "org.beeware.freedom", version="0.0.1")


if __name__ == "__main__":
    main().main_loop()
