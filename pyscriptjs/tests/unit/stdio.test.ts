import { expect } from '@jest/globals';
import { type Stdio, CaptureStdio, StdioMultiplexer, TargetedStdio } from '../../src/stdio';

describe('CaptureStdio', () => {
    it('captured streams are initialized to empty string', () => {
        let stdio = new CaptureStdio();
        expect(stdio.captured_stdout).toBe('');
        expect(stdio.captured_stderr).toBe('');
    });

    it('stdout() and stderr() captures', () => {
        let stdio = new CaptureStdio();
        stdio.stdout_writeline('hello');
        stdio.stdout_writeline('world');
        stdio.stderr_writeline('this is an error');
        expect(stdio.captured_stdout).toBe('hello\nworld\n');
        expect(stdio.captured_stderr).toBe('this is an error\n');
    });

    it('reset() works', () => {
        let stdio = new CaptureStdio();
        stdio.stdout_writeline('aaa');
        stdio.stderr_writeline('bbb');
        stdio.reset();
        expect(stdio.captured_stdout).toBe('');
        expect(stdio.captured_stderr).toBe('');
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
        expect(a.captured_stdout).toBe('');
        expect(a.captured_stderr).toBe('');
        expect(b.captured_stdout).toBe('');
        expect(b.captured_stderr).toBe('');
    });

    it('redirects to multiple listeners', () => {
        multi.addListener(a);
        multi.stdout_writeline('out 1');
        multi.stderr_writeline('err 1');

        multi.addListener(b);
        multi.stdout_writeline('out 2');
        multi.stderr_writeline('err 2');

        expect(a.captured_stdout).toBe('out 1\nout 2\n');
        expect(a.captured_stderr).toBe('err 1\nerr 2\n');

        expect(b.captured_stdout).toBe('out 2\n');
        expect(b.captured_stderr).toBe('err 2\n');
    });
});

describe('TargetedStdio', () => {
    let capture: CaptureStdio;
    let targeted: TargetedStdio;
    let error_targeted: TargetedStdio;
    let multi: StdioMultiplexer;

    beforeEach(() => {
        //DOM element to capture stdout and stderr
        let target_div = document.getElementById('output-id');

        if (target_div === null) {
            target_div = document.createElement('div');
            target_div.id = 'output-id';
            document.body.appendChild(target_div);
        } else {
            target_div.innerHTML = '';
        }

        //DOM element to capture stderr
        let error_div = document.getElementById('error-id');

        if (error_div === null) {
            error_div = document.createElement('div');
            error_div.id = 'error-id';
            document.body.appendChild(error_div);
        } else {
            error_div.innerHTML = '';
        }

        const tag = document.createElement('div');
        tag.setAttribute('output', 'output-id');
        tag.setAttribute('stderr', 'error-id');

        capture = new CaptureStdio();
        targeted = new TargetedStdio(tag, 'output', true, true);
        error_targeted = new TargetedStdio(tag, 'stderr', false, true);

        multi = new StdioMultiplexer();
        multi.addListener(capture);
        multi.addListener(targeted);
        multi.addListener(error_targeted);
    });

    it('targeted id is set by constructor', () => {
        expect(targeted.source_attribute).toBe('output');
    });

    it('targeted stdio/stderr also goes to multiplexer', () => {
        multi.stdout_writeline('out 1');
        multi.stderr_writeline('out 2');
        expect(capture.captured_stdout).toBe('out 1\n');
        expect(capture.captured_stderr).toBe('out 2\n');
        expect(document.getElementById('output-id')?.innerHTML).toBe('out 1<br>out 2<br>');
        expect(document.getElementById('error-id')?.innerHTML).toBe('out 2<br>');
    });

    it('Add and remove targeted listener', () => {
        multi.stdout_writeline('out 1');
        multi.removeListener(targeted);
        multi.stdout_writeline('out 2');
        multi.addListener(targeted);
        multi.stdout_writeline('out 3');

        //all three should be captured by multiplexer
        expect(capture.captured_stdout).toBe('out 1\nout 2\nout 3\n');
        //out 2 should not be present in the DOM element
        expect(document.getElementById('output-id')?.innerHTML).toBe('out 1<br>out 3<br>');
    });
});
