import { getLogger } from './logger';
import { version } from './runtime';
import { readTextFromPath, mergeConfig, validateConfig, defaultConfig } from './utils'

const logger = getLogger('py-config');

export interface AppConfig extends Record<string, any> {
    name?: string;
    description?: string;
    version?: string;
    schema_version?: number;
    type?: string;
    author_name?: string;
    author_email?: string;
    license?: string;
    autoclose_loader?: boolean;
    runtimes?: Array<RuntimeConfig>;
    packages?: Array<string>;
    paths?: Array<string>;
    plugins?: Array<string>;
    pyscript?: PyScriptMetadata;
}

export type RuntimeConfig = {
    src?: string;
    name?: string;
    lang?: string;
};

export type PyScriptMetadata = {
    version?: string;
    time?: string;
}

export function loadConfigFromElement(el: HTMLElement): AppConfig {
    const configType: string = el.hasAttribute("type") ? el.getAttribute("type") : "toml";
    let srcConfig = extractFromSrc(el, configType);
    const inlineConfig = extractFromInline(el, configType);
    srcConfig = mergeConfig(srcConfig, defaultConfig);
    // then merge inline config and config from src
    const result = mergeConfig(inlineConfig, srcConfig);
    result.pyscript = {
        "version": version,
        "time": new Date().toISOString()
    };
    return result;
}

function extractFromSrc(el: HTMLElement, configType: string) {
    if (el.hasAttribute('src'))
    {
        const src = el.getAttribute('src');
        logger.info('loading ', src)
        return validateConfig(readTextFromPath(src), configType);
    }
    return {};
}


function extractFromInline(el: HTMLElement, configType: string) {
    if (el.innerHTML!=='')
    {
        logger.info('loading <py-config> content');
        return validateConfig(el.innerHTML, configType);
    }
    return {};
}
