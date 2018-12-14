import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
// var esprima = require('esprima');
// var escodegen = require('escodegen');
let vars = [];
let vals = [];
let args = [];
let updated_env = [];
let colors = [];


const parseCode = (codeToParse, app) => {
    args = [];
    vars = [];
    vals = [];
    updated_env = [];
    colors = [];
    parse_application(esprima.parseScript(app));
    let json_obj = esprima.parseScript(codeToParse, {loc: true});

    json_obj.body.map((x) => ParseLine[x.type](x,[vars,vals]));
    json_obj.body = json_obj.body.filter((x) =>  !(x.type === 'VariableDeclaration') && !(x.type === 'ExpressionStatement'));
    return color(fix_array_string(escodegen.generate(json_obj)));

};

function args_line (left, right){
    this.left = left;
    this.right = right;
}


const block_statement = (obj,env) => {
    let j;
    for(j = 0; j <  obj.body.length; j++){
        ParseLine[obj.body[j].type](obj.body[j],env);
    }
    obj.body = obj.body.filter(filter_func);
};


const filter_func = (x) => {
    return x.type === 'VariableDeclaration'? false :
        x.type === 'ExpressionStatement' ? ((check_if_argument(x.expression.left.name)) ||
            (x.expression.left.type === 'MemberExpression' ? (check_if_argument(x.expression.left.object.name)) : false)) :
            true;
};

const function_declaration = (obj,env) => {
    ParseLine[obj.body.type](obj.body,env);
};

const variable_declaration = (obj,env) => {
    let i;
    for (i = 0; i < obj.declarations.length; i++) {
        let val;
        if(obj.declarations[i].init == null) {
            val = null;
        }
        else {
            val = ParseExp[obj.declarations[i].init.type](obj.declarations[i].init,env);
        }
        let var1 = obj.declarations[i].id.name;
        env[0].push(var1);
        env[1].push(val);
    }
};

const right_literal = (obj) => {
    return obj.raw;
};

const right_binary = (obj,env) => {
    let left = (ParseExp[obj.left.type](obj.left,env));
    let right = (ParseExp[obj.right.type](obj.right,env));
    if (obj.operator === '*' || obj.operator === '/'){
        return math_paren(left,obj.operator,right);
    }
    return left + ' ' + obj.operator + ' ' + right;
};

const math_paren = (left,op,right) => {
    if(left.toString().length > 1 && right.toString().length > 1){
        return '(' + left + ') ' + op + ' (' + right + ')';
    }
    else if(left.toString().length > 1){
        return '(' + left + ') ' + op + ' ' + right ;
    }
    else{
        return left + ' ' + op + ' (' + right + ')';
    }
};

const right_identifier = (obj,env) => {
    try{
        let val = search_in_table(obj.name, env);
        return check_if_argument(obj.name) ? obj.name : val;
    }
    catch (e){
        return obj.name;
    }
};

const member_expression = (obj,env) => {
    return (ParseExp[obj.object.type](obj.object,env)) + '[' + (ParseExp[obj.property.type](obj.property,env)) + ']';
};

const unary_expression = (obj,env) => {
    return obj.operator + (ParseExp[obj.argument.type](obj.argument,env));
};

const array_expression = (obj,env) => {
    let s = '[';
    let i;
    for(i = 0; i < obj.elements.length - 1; i++){
        s += ParseExp[obj.elements[i].type](obj.elements[i],env);
        s += ', ';
    }
    s += ParseExp[obj.elements[i].type](obj.elements[i],env);
    s += ']';
    return s;
};

const ParseExp =  {
    'Literal' : right_literal,
    'Identifier' : right_identifier,
    'BinaryExpression' : right_binary,
    'MemberExpression' : member_expression,
    'UnaryExpression' : unary_expression,
    'ArrayExpression' : array_expression

};

const assignment_expression = (obj,env) =>{
    let right_side = ParseExp[obj.right.type](obj.right,env);
    env[1].push(right_side);
    env[0].push(obj.left.name);
    obj.right = esprima.parseScript(right_side).body[0].expression;
};

const expression_statement = (obj,env) => {
    assignment_expression(obj.expression,env);
};

const while_statement = (obj,env) => {
    let test = ParseExp[obj.test.type](obj.test, env);
    obj.test = esprima.parseScript(test).body[0].expression;
    let new_env = clone_env(env);
    ParseLine[obj.body.type](obj.body,new_env);
};

const if_statement = (obj,env) => {
    let test = ParseExp[obj.test.type](obj.test,env);
    obj.test = esprima.parseScript(test).body[0].expression;
    let new_env = clone_env(env);
    colors.push(run_test(test,env));
    ParseLine[obj.consequent.type](obj.consequent,new_env);
    if(run_test(test,env) && updated_env.length === 0) {
        updated_env = new_env;
    }
    if (obj.alternate != null)
        alternate_if[obj.alternate.type](obj.alternate,env,0);
    if(updated_env.length !== 0) {
        add_env(env, updated_env);
    }
};


const alternate_if_statement = (obj,env) => {
    let test = ParseExp[obj.test.type](obj.test,env);
    obj.test = esprima.parseScript(test).body[0].expression;
    let new_env = clone_env(env);
    colors.push(run_test(test,env));
    ParseLine[obj.consequent.type](obj.consequent,new_env);
    if(run_test(test,env) && updated_env.length === 0) {
        updated_env = new_env;
    }
    if (obj.alternate != null)
        alternate_if[obj.alternate.type](obj.alternate,env);
};

const alternate_block_statement = (obj,env) => {
    let new_env = clone_env(env);
    let j;
    for(j = 0; j <  obj.body.length; j++){
        ParseLine[obj.body[j].type](obj.body[j],new_env);
    }
    if(updated_env.length === 0){
        updated_env = new_env;

    }
    obj.body = obj.body.filter(filter_func);
};



const return_statement = (obj,env) => {
    let var1 = ParseExp[obj.argument.type](obj.argument,env);
    obj.argument = esprima.parseScript(var1).body[0].expression;
};

const alternate_if = {
    'IfStatement' : alternate_if_statement,
    'BlockStatement' : alternate_block_statement,
    'ReturnStatement' : return_statement

};

const ParseLine = {
    'FunctionDeclaration' : function_declaration,
    'VariableDeclaration' : variable_declaration,
    'ExpressionStatement' : expression_statement,
    'WhileStatement' : while_statement,
    'IfStatement' : if_statement,
    'BlockStatement' : block_statement,
    'ReturnStatement' : return_statement,
    'AssignmentExpression' : assignment_expression
};

const search_in_table = (obj,env) => {
    let idx = env[0].lastIndexOf(obj);
    if (idx === -1)
        throw 'X_no_match';
    return env[1][idx];
};

const parse_application = (obj) => {
    try {
        let i;
        for (i = 0; i < obj.body[0].expression.expressions.length; i++) {
            let arg = new args_line(obj.body[0].expression.expressions[i].left.name,escodegen.generate(obj.body[0].expression.expressions[i].right));
            args.push(arg);
        }
    }
    catch(e){
        try {
            let arg = new args_line(obj.body[0].expression.left.name, escodegen.generate(obj.body[0].expression.right));
            args.push(arg);
        }
        catch(e){
            args = [];
        }
    }
};

const clone_env = (env) =>{
    let vars_clone = env[0].map((x) => x);
    let vals_clone = env[1].map((x) => x);
    return [vars_clone,vals_clone];
};


const run_test = (obj,env) => {
    let code;
    code = args.reduce(((str, line) => str + 'let ' + line.left + ' = ' + line.right + '; '), '');
    let i;
    for( i = 0; i < env[0].length; i++){
        if(check_if_argument(env[0][i]))
            code += env[0][i] + ' = ' + env[1][i] + '; ';
    }
    code += obj + ';';
    return eval(code);
};

const check_if_argument = (arg) => {
    let i;
    for(i = 0; i < args.length; i++){
        if((args[i].left === arg))
            return true;
    }
    return false;
};

const add_env = (env,new_env) => {
    let i;
    for(i = 0 ; i < new_env[0].length; i++){
        env[0].push(new_env[0][i]);
        env[1].push(new_env[1][i]);
    }
};

const color = (str) => {
    let arr = str.split('\n');
    let i;
    let j = 0;
    for(i = 0; i < arr.length; i++){
        if(arr[i].includes('if') || arr[i].includes('else if')){
            arr[i] = color_helper(arr,i,j);
            j++;
        }
    }
    return arr.join('\n');
};

const color_helper = (arr,i,j) => {
    return colors[j] === false? '<mark1>' + arr[i] + '</mark1>' : '<mark2>' + arr[i] + '</mark2>';
};

const fix_array_string = (str) => {
    let i;
    let counter = 0;
    for(i = 0; i < str.length; i++){
        if(str[i] === '['){
            counter ++;
            i++;
            while(counter > 0){
                counter = update_counter(counter,str[i]);
                if(char_check(str[i])){
                    str = str.slice(0,i) + str.slice(i+1);
                    i--;
                }
                i++;
            }
        }
    }
    return str;
};

const update_counter = (counter,char) => {
    if(char === ']')
        return counter - 1;
    else if(char === '[')
        return counter + 1;
    else
        return counter;
};

const char_check = (char) => {
    return char === '\n' || char === ' ';
};

// module.exports = (parseCode);
export {parseCode};
