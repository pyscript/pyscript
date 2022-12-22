import { expect } from '@jest/globals';
import { type Stdio, CaptureStdio, StdioMultiplexer, TargetedStdio } from '../../src/stdio';

describe('CaptureStdio', () => {
    it('captured streams are initialized to empty string', () => {
        let stdio = new CaptureStdio();
        expect(stdio.captured_stdout).toBe("");
        expect(stdio.captured_stderr).toBe("");
    });

    it('stdout() and stderr() captures', () => {
        let stdio = new CaptureStdio();
        stdio.stdout_writeline("hello");
        stdio.stdout_writeline("world");
        stdio.stderr_writeline("this is an error");
        expect(stdio.captured_stdout).toBe("hello\nworld\n");
        expect(stdio.captured_stderr).toBe("this is an error\n");
    });

    it('reset() works', () => {
        let stdio = new CaptureStdio();
        stdio.stdout_writeline("aaa");
        stdio.stderr_writeline("bbb");
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
        multi.stdout_writeline('out 1');
        multi.stderr_writeline('err 1');
        expect(a.captured_stdout).toBe("");
        expect(a.captured_stderr).toBe("");
        expect(b.captured_stdout).toBe("");
        expect(b.captured_stderr).toBe("");
    });

    it('redirects to multiple listeners', () => {
        multi.addListener(a);
        multi.stdout_writeline('out 1');
        multi.stderr_writeline('err 1');

        multi.addListener(b);
        multi.stdout_writeline('out 2');
        multi.stderr_writeline('err 2');

        expect(a.captured_stdout).toBe("out 1\nout 2\n");
        expect(a.captured_stderr).toBe("err 1\nerr 2\n");

        expect(b.captured_stdout).toBe("out 2\n");
        expect(b.captured_stderr).toBe("err 2\n");
    });
});

describe('TargetedStdio', () => {
    let capture: CaptureStdio;
    let targeted: TargetedStdio;
    let multi: StdioMultiplexer;

    beforeEach(() => {
        capture = new CaptureStdio();
        targeted = new TargetedStdio('target-id');

        multi = new StdioMultiplexer();
        multi.addListener(capture)
        multi.addListener(targeted)

        let div = document.getElementById("target-id")
        if ( div=== null){
            div = document.createElement('div')
            div.id = "target-id"
            document.body.appendChild(div)
        }
        else {
            div.innerHTML = ""
        }
    });

    it('targeted id is set by constructor', () =>{
        expect(targeted.target_id).toBe("target-id");
    });

    it('targeted stdio/stderr also goes to multiplexer', () =>{
        multi.stdout_writeline("out 1");
        multi.stderr_writeline("out 2");
        expect(capture.captured_stdout).toBe("out 1\n");
        expect(capture.captured_stderr).toBe("out 2\n");
        expect(document.getElementById("target-id")?.innerHTML).toBe("out 1<br>out 2<br>");
    });

    it('Add and remove targeted listener', () => {
        multi.stdout_writeline("out 1");
        multi.removeListener(targeted);
        multi.stdout_writeline("out 2");
        multi.addListener(targeted);
        multi.stdout_writeline("out 3");

        expect(capture.captured_stdout).toBe("out 1\nout 2\nout 3\n");
        expect(document.getElementById("target-id")?.innerHTML).toBe("out 1<br>out 3<br>");
    });
});
