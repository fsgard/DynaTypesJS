import ArgumentsController from "./lib/ArgumentsController";
import { TypeJSErrorMode, TypeJSError, ArgumentsControllerError, InterfaceError, ClassError } from "./lib/Errors";
import Class from "./lib/Class";
import { Enum, MetaType, T, TypeJSType } from "./lib/Types";

export default class ScriptTypeJS {
    static mode = 'dev';
    static errorMode = TypeJSErrorMode.default;
    static interfaces = {};
    static types = {};
    static prefix = '__SCRIPT_TYPE_JS__';
    static usePrivateSynthax = false;
    static methodPropertyName = ScriptTypeJS.prefix + 'METHODS';
    static instanciationPropertyName = ScriptTypeJS.prefix + 'INSTANCIATE';
    static bundlerIdentifier = {
        WEBPACK: {
            regex: /(_(.*)__WEBPACK.*__)(\.((.*)(\[.*\])|.*)|.*)/,
            test: function (type) {
                const match = type.match(this.regex);

                if (match) {
                    return {
                        module: match[1],
                        parent: match[2],
                        type: match[4] || match[2]
                    }
                }
                return false;
            }
        }
    }

    static settings(options) {
        if (options) {
            ScriptTypeJS.mode = options.mode ?? 'dev';
            ScriptTypeJS.errorMode = options.errorMode ?? '';
            TypeJSError.mode = ScriptTypeJS.errorMode;
            ScriptTypeJS.prefix = options.prefix ?? ScriptTypeJS.prefix;
        }

        if (ScriptTypeJS.mode == 'dev') {
            Object.entries(ScriptTypeJS.types).forEach(([name, declaration]) => {
                if (declaration instanceof TypeJSType) declaration.declare(name);
                else Class.construct(declaration);
            });
        }
        return ScriptTypeJS;
    }

    static declare(objects) {
        if (typeof objects === 'function') {
            ScriptTypeJS.types[objects.name] = objects;
            return new Class(objects);
        }

        Object.entries(objects).forEach(([name, obj]) => {
            ScriptTypeJS.types[name] = obj;
        });

    }

    static getTypeJSPrefix() {
        return `${ScriptTypeJS.usePrivateSynthax ? '#' : ''}${ScriptTypeJS.prefix}`;
    }

    static getTypeJSNameOf(value) {
        return ScriptTypeJS.getTypeJSPrefix() + value;
    }

    static getTypeDeclaration(type) {
        if (!type) return undefined;
        ArgumentsController.declare(String).validate(arguments);

        for (const [bundler, description] of Object.entries(ScriptTypeJS.bundlerIdentifier)) {
            const result = description.test(type)
            if (result) {
                type = result.type;
                break;
            }
        }

        if (ScriptTypeJS.types[type]) return `${ScriptTypeJS.prefix}.types.${type}`;
        else if (ScriptTypeJS.interfaces[type]) return `${ScriptTypeJS.prefix}.interfaces.${type}`;
        else {
            const isObjectStaticProperty = type.match(/^(.*)\["(.*)"\]$/)
            if (isObjectStaticProperty) {
                if (ScriptTypeJS.types[isObjectStaticProperty[1]]) return `${ScriptTypeJS.prefix}.types.${type}`;
            }
            return type
        }
    }
}

global[ScriptTypeJS.prefix] = ScriptTypeJS;

export { TypeJSErrorMode, TypeJSError, ArgumentsController, ArgumentsControllerError, Class, ClassError, InterfaceError, Enum, MetaType, T };
