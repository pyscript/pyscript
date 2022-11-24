const CLOSEBUTTON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill="currentColor" width="12px"><path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/></svg>`;

type MessageType = 'text' | 'html';

export class UserError extends Error {
    messageType: MessageType;

    constructor(message: string, t: MessageType = 'text') {
        super(message);
        this.name = 'UserError';
        this.messageType = t;
    }
}

export class FetchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FetchError';
    }
}

export function _createAlertBanner(
    message: string,
    level: 'error' | 'warning' = 'error',
    messageType: MessageType = 'text',
    logMessage = true,
) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    switch (`log-${level}-${logMessage}`) {
        case 'log-error-true':
            console.error(message);
            break;
        case 'log-warning-true':
            console.warn(message);
            break;
    }

    const banner = document.createElement('div');
    banner.className = `alert-banner py-${level}`;

    if (messageType === 'html') {
        banner.innerHTML = message;
    } else {
        banner.textContent = message;
    }

    if (level === 'warning') {
        const closeButton = document.createElement('button');

        closeButton.id = 'alert-close-button';
        closeButton.addEventListener('click', () => {
            banner.remove();
        });
        closeButton.innerHTML = CLOSEBUTTON;

        banner.appendChild(closeButton);
    }

    document.body.prepend(banner);
}
