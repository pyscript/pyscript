import { checkedConfigOption, validateConfigParameter } from '../../src/plugin';
import { UserError } from '../../src/exceptions';

describe('validateConfigParamters', () => {
    const a_options = checkedConfigOption({ possible_values: ['a1', 100, false], default: 'a1' });

    it('should not change a matching config option', () => {
        //const a_opti
        const config = { a: 'a1', dummy: 'dummy' };
        validateConfigParameter(config, 'a', a_options);
        expect(config).toStrictEqual({ a: 'a1', dummy: 'dummy' });
    });

    it('should set the default value if no value is present', () => {
        const config = { dummy: 'dummy' };
        validateConfigParameter(config, 'a', a_options);
        expect(config).toStrictEqual({ a: 'a1', dummy: 'dummy' });
    });

    it('should error if the provided value is not in possible_values', () => {
        const config = { a: 'NotValidValue', dummy: 'dummy' };
        const func = () => validateConfigParameter(config, 'a', a_options);
        expect(func).toThrow(UserError);
        expect(func).toThrow(
            '(PY1000): Invalid value for config.a: the only accepted values are: ["a1", 100, false], got: "NotValidValue".',
        );
    });
});
