import { type Stdio, CaptureStdio, StdioMultiplexer } from '../../src/stdio';

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


describe('StdioMultiplexer', () => {
    let a: CaptureStdio;
    let b: CaptureStdio;
    let multi: StdioMultiplexer;

    beforeEach(() => {
        a = new CaptureStdio();
        b = new CaptureStdio();
        multi = new StdioMultiplexer();
    });

    it('works without listeners', () => {
        // no listeners, messages are ignored
        multi.stdout('out 1');
        multi.stderr('err 1');
        expect(a.captured_stdout).toBe("");
        expect(a.captured_stderr).toBe("");
        expect(b.captured_stdout).toBe("");
        expect(b.captured_stderr).toBe("");
    });

    it('redirects to multiple listeners', () => {
        multi.addListener(a);
        multi.stdout('out 1');
        multi.stderr('err 1');

        multi.addListener(b);
        multi.stdout('out 2');
        multi.stderr('err 2');

        expect(a.captured_stdout).toBe("out 1\nout 2\n");
        expect(a.captured_stderr).toBe("err 1\nerr 2\n");

        expect(b.captured_stdout).toBe("out 2\n");
        expect(b.captured_stderr).toBe("err 2\n");
    });
});
