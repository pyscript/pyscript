import { type Stdio, CaptureStdio } from '../../src/stdio';

describe('CaptureStdio', () => {
    it('captured streams are initialized to empty string', () => {
        let stdio = new CaptureStdio();
        expect(stdio.captured_stdout).toBe("");
        expect(stdio.captured_stderr).toBe("");
    });

    it('stdout() and stderr() captures', () => {
        let stdio = new CaptureStdio();
        stdio.stdout("hello");
        stdio.stdout("world");
        stdio.stderr("this is an error");
        expect(stdio.captured_stdout).toBe("hello\nworld\n");
        expect(stdio.captured_stderr).toBe("this is an error\n");
    });

    it('reset() works', () => {
        let stdio = new CaptureStdio();
        stdio.stdout("aaa");
        stdio.stderr("bbb");
        stdio.reset();
        expect(stdio.captured_stdout).toBe("");
        expect(stdio.captured_stderr).toBe("");
    });

});
