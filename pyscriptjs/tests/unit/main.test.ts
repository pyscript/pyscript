import { jest } from "@jest/globals"
import { UserError } from "../../src/exceptions"
import { PyScriptApp } from "../../src/main"

describe("Test withUserErrorHandler", () => {

    class MyApp extends PyScriptApp {
        myRealMain: any;

        constructor(myRealMain) {
            super();
            this.myRealMain = myRealMain;
        }

        _realMain() {
            this.myRealMain();
        }
    }

    beforeEach(() => {
        // Ensure we always have a clean body
        document.body.innerHTML = `<div>Hello World</div>`;
    });

    it("userError doesn't stop execution", () => {
        function myRealMain() {
            throw new UserError(UserError.ErrorCode.GENERIC, "Computer says no");
        }

        const app = new MyApp(myRealMain);
        app.main();
        const banners = document.getElementsByClassName("alert-banner");
        expect(banners.length).toBe(1);
        expect(banners[0].innerHTML).toBe("(PY0000): Computer says no");
    });

    it("userError escapes by default", () => {
        function myRealMain() {
            throw new UserError(UserError.ErrorCode.GENERIC, "hello <br>");
        }

        const app = new MyApp(myRealMain);
        app.main();
        const banners = document.getElementsByClassName("alert-banner");
        expect(banners.length).toBe(1);
        expect(banners[0].innerHTML).toBe("(PY0000): hello &lt;br&gt;");
    });

    it("userError messageType=html don't escape", () => {
        function myRealMain() {
            throw new UserError(UserError.ErrorCode.GENERIC, "hello <br>", "html");
        }

        const app = new MyApp(myRealMain);
        app.main();
        const banners = document.getElementsByClassName("alert-banner");
        expect(banners.length).toBe(1);
        expect(banners[0].innerHTML).toBe("(PY0000): hello <br>");
    });

    it("any other exception should stop execution and raise", () => {
        function myRealMain() {
            throw new Error("Explosions!");
        }

        const app = new MyApp(myRealMain);
        expect(() => app.main()).toThrow(new Error("Explosions!"))
    });
});
