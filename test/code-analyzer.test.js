import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('test1', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '<mark1>    if (x + 1 + y < z) {</mark1>\n' +
            '        return x + y + z + 0 + 5;\n' +
            '<mark2>    } else if (x + 1 + y < z * 2) {</mark2>\n' +
            '        return x + y + z + 0 + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + 0 + z + 5;\n' +
            '    }\n' +
            '}'
        );
    });

    it('test2', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });

    it('test3', () => {
        assert.equal(
            parseCode('function f(x,y){\n' +
                ' let a = 1;\n' +
                ' x = y;\n' +
                ' if(x > 1){\n' +
                '  a = x + 1;}\n' +
                ' else{\n' +
                '  a = y + 1;}\n' +
                ' return a;\n' +
                '}','(x=1, y=2)'),
            'function f(x, y) {\n' +
            '    x = y;\n' +
            '<mark2>    if (x > 1) {</mark2>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return x + 1;\n' +
            '}'
        );
    });
    it('test4', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                ' let a = 1;\n' +
                ' if(x == 1){\n' +
                '  if(y == 3){\n' +
                '   a = 3;\n' +
                '  }\n' +
                '  else if(y == 2){\n' +
                '   a = 17;\n' +
                '  }\n' +
                ' }\n' +
                ' else{\n' +
                '  a = 2;\n' +
                ' }\n' +
                '    return z + a;\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '<mark2>    if (x == 1) {</mark2>\n' +
            '<mark1>        if (y == 3) {</mark1>\n' +
            '<mark2>        } else if (y == 2) {</mark2>\n' +
            '        }\n' +
            '    } else {\n' +
            '    }\n' +
            '    return z + 17;\n' +
            '}'
        );
    });
    it('test5', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = 2 * c;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = 2 * (x + 1 + x + 1 + y);\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });
    it('test6', () => {
        assert.equal(
            parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * c;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}','(x=1, y=2, z=3)'),
            'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) * (x + 1 + x + 1 + y);\n' +
            '    }\n' +
            '    return z;\n' +
            '}'
        );
    });
    it('test7', () => {
        assert.equal(
            parseCode('let a = 1;\n' +
                'var b = 2;\n' +
                '\n' +
                'function f(x){\n' +
                ' let a = 1;\n' +
                '  \n' +
                ' if(false){\n' +
                '  a = 5;\n' +
                ' }\n' +
                ' else{\n' +
                '  a = 456456;\n' +
                ' }\n' +
                'return x + a;\n' +
                '}','(x=1, y=2, z=3)'),
            'function f(x) {\n' +
            '<mark1>    if (false) {</mark1>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return x + 456456;\n' +
            '}'
        );
    });
    it('test8', () => {
        assert.equal(
            parseCode('let a = 1;\n' +
                'var b = 2;\n' +
                '\n' +
                'function f(x){\n' +
                ' let a ;\n' +
                ' let d = -1;\n' +
                ' let arr = [1, 2, 3];\n'+
                '  \n' +
                ' if(x[0] === 1){\n' +
                '  a = 5;\n' +
                ' }\n' +
                ' else{\n' +
                '  a = 4456;\n' +
                ' }\n' +
                'return a;\n' +
                '}','(x=[1])'),
            'function f(x) {\n' +
            '<mark2>    if (x[0] === 1) {</mark2>\n' +
            '    } else {\n' +
            '    }\n' +
            '    return 5;\n' +
            '}'
        );
    });
    it('test9', () => {
        assert.equal(
            parseCode('function foo(z){ \n' +
                '  let a = 1;\n' +
                '  let b = -1;\n' +
                '  let arr = [1,2,3];\n' +
                '  let c = 2 * a + 5 / 2 - 1 ;\n' +
                '  z[1] = 2;\n' +
                '  if (a == b){\n' +
                '     a = b;\n' +
                '     return b;\n' +
                '  }\n' +
                '  return a / -1;\n' +
                '}','(z=[1,2,3])'),
            'function foo(z) {\n' +
            '    z[1] = 2;\n' +
            '<mark1>    if (1 == -1) {</mark1>\n' +
            '        return -1;\n' +
            '    }\n' +
            '    return 1 / -1;\n' +
            '}'
        );
    });
    it('test10', () => {
        assert.equal(
            parseCode('function foo(z){ \n' +
                '  let a = 1;\n' +
                '  let b = -1;\n' +
                '  let arr = [1,2,3];\n' +
                '  let c = 2 * a + 5 / 2 - 1 ;\n' +
                '  z[1] = 2;\n' +
                '  if (a == b){\n' +
                '     let asd = 1;\n'+
                '     a = b;\n' +
                '     return b;\n' +
                '  }\n' +
                '  else if(a == b){\n' +
                '    a = b;\n' +
                '  }\n' +
                '  return a / -1;\n' +
                '}','(z=[1,2,3])'),
            'function foo(z) {\n' +
            '    z[1] = 2;\n' +
            '<mark1>    if (1 == -1) {</mark1>\n' +
            '        return -1;\n' +
            '<mark1>    } else if (1 == -1) {</mark1>\n' +
            '    }\n' +
            '    return 1 / -1;\n' +
            '}'
        );
    });
    it('test11', () => {
        assert.equal(
            parseCode('function foo(){ \n' +
                '  let q = 1;\n' +
                '  if (1 === 1){\n' +
                '     return 5;\n' +
                '  }\n' +
                '  return q;\n' +
                '}',''),
            'function foo() {\n' +
            '<mark2>    if (1 === 1) {</mark2>\n' +
            '        return 5;\n' +
            '    }\n' +
            '    return 1;\n' +
            '}'
        );
    });
    it('test12', () => {
        assert.equal(
            parseCode('function f(x){\n' +
                '    let a = [[1],2,3];\n' +
                '    return x + a[0];\n' +
                '}','x=[1]'),
            'function f(x) {\n' +
            '    return x + [[1],2,3][0];\n' +
            '}'
        );
    });

});
