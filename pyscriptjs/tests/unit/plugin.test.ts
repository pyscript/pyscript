import { validateConfigParameter, validateConfigParameterFromArray } from '../../src/plugin';
import { UserError } from '../../src/exceptions';

describe('validateConfigParameter', () => {
    const validator = a => a.charAt(0) === 'a';

    it('should not change a matching config option', () => {
        const pyconfig = { a: 'a1', dummy: 'dummy' };
        validateConfigParameter({
            config: pyconfig,
            name: 'a',
            validator: validator,
            defaultValue: 'a_default',
            hintMessage: "Should start with 'a'",
        });
        expect(pyconfig).toStrictEqual({ a: 'a1', dummy: 'dummy' });
    });

    it('should set the default value if no value is present', () => {
        const pyconfig = { dummy: 'dummy' };
        validateConfigParameter({
            config: pyconfig,
            name: 'a',
            validator: validator,
            defaultValue: 'a_default',
            hintMessage: "Should start with 'a'",
        });
        expect(pyconfig).toStrictEqual({ a: 'a_default', dummy: 'dummy' });
    });

    it('should error if the provided value is not valid', () => {
        const pyconfig = { a: 'NotValidValue', dummy: 'dummy' };
        const func = () =>
            validateConfigParameter({
                config: pyconfig,
                name: 'a',
                validator: validator,
                defaultValue: 'a_default',
                hintMessage: "Should start with 'a'",
            });
        expect(func).toThrow(UserError);
        expect(func).toThrow('(PY1000): Invalid value "NotValidValue" for config.a. Should start with \'a\'');
    });

    it('should error if the provided default is not valid', () => {
        const pyconfig = { a: 'a1', dummy: 'dummy' };
        const func = () =>
            validateConfigParameter({
                config: pyconfig,
                name: 'a',
                validator: validator,
                defaultValue: 'NotValidDefault',
                hintMessage: "Should start with 'a'",
            });
        expect(func).toThrow(Error);
        expect(func).toThrow(
            'Default value "NotValidDefault" for a is not a valid argument, according to the provided validator function. Should start with \'a\'',
        );
    });
});

describe('validateConfigParameterFromArray', () => {
    const possibilities = ['a1', 'a2', true, 42, 'a_default'];

    it('should not change a matching config option', () => {
        const pyconfig = { a: 'a1', dummy: 'dummy' };
        validateConfigParameterFromArray({
            config: pyconfig,
            name: 'a',
            possibleValues: possibilities,
            defaultValue: 'a_default',
        });
        expect(pyconfig).toStrictEqual({ a: 'a1', dummy: 'dummy' });
    });

    it('should set the default value if no value is present', () => {
        const pyconfig = { dummy: 'dummy' };
        validateConfigParameterFromArray({
            config: pyconfig,
            name: 'a',
            possibleValues: possibilities,
            defaultValue: 'a_default',
        });
        expect(pyconfig).toStrictEqual({ a: 'a_default', dummy: 'dummy' });
    });

    it('should error if the provided value is not in possible_values', () => {
        const pyconfig = { a: 'NotValidValue', dummy: 'dummy' };
        const func = () =>
            validateConfigParameterFromArray({
                config: pyconfig,
                name: 'a',
                possibleValues: possibilities,
                defaultValue: 'a_default',
            });
        expect(func).toThrow(Error);
        expect(func).toThrow(
            '(PY1000): Invalid value "NotValidValue" for config.a. The only accepted values are: ["a1", "a2", true, 42, "a_default"]',
        );
    });

    it('should error if the provided default is not in possible_values', () => {
        const pyconfig = { a: 'a1', dummy: 'dummy' };
        const func = () =>
            validateConfigParameterFromArray({
                config: pyconfig,
                name: 'a',
                possibleValues: possibilities,
                defaultValue: 'NotValidDefault',
            });
        expect(func).toThrow(Error);
        expect(func).toThrow(
            'Default value "NotValidDefault" for a is not a valid argument, according to the provided validator function. The only accepted values are: ["a1", "a2", true, 42, "a_default"]',
        );
    });
});
