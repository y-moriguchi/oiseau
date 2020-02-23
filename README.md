# Oiseau

Oiseau is a program language which based on lambda calculus or combinator logic.  
Features of Oiseau are shown as follows.

* Macro definition: combinators are implemented by macros
* Beta reduction
* Evaluate expression strictly or nonstrictly
* T[] transform

## How to use

### node.js
You can download Oiseau from npm.

```
npm install -g oiseau
```

To execute REPL, type "oiseau" from command line.
```
$ oiseau
Oiseau Ver. 1.0.0
> SKK
^a.a
```

## Reference

### Exprssion elements

#### Variable
Variables are described by lower case Latin alphabet or lower case alphabet with numbers.  
For example, x and x27 are valid variable.

#### Macro
Macro are described by upper case Latin alphabet or upper case alphabet with numbers.  
Macro are also described by any character except [,],= surrounded by [ and ].  
For example, S, S27 and [Cons] are valid macro name.

#### Print expression
Print expression is an identity function with printing message to log.  
Print expression is a sequence <, characters without >, >.  
Side effect of print expression is used only in evaluation, and ignored in beta reduction.

```
<Hello, world>
```

#### Block expression
Block expression is a list of expression surrounded by (, ).  
By block expression, association of expression can be changed.

### Expressions

#### Lambda expression
Lambda expression is a sequence ^, variables, . and list of expression.  

```
^xyz.xz(yz)
```
Oiseau can use Greek alphabet λ instead of ^.

#### Macro definition
Macro definition is a sequence [, macro name, ], = or := and list of expression.  
If spaces are not included in the macro name, [, ] are optional.
Macro can not be redefined.  

```
True = ^xy.x
[this is false] = ^xy.y
```

### Church numeraals
Natural numbers is interpreted as Church numerals.  
For example, number 2 is interpreted as ^ab.a(ab).

### Evaluate expressions

#### Reduction
To reduce an expression, you just type expression to reduce.

```
> SKK
^a.a
```

#### Evaluation (strict)
To evaluate expression, you add \` before the list of expression.  
For example, Print "Hello, world." to log.

```
> `<Hello, world.>I
Hello, world.
^ab.a
```

#### Evaluation (nonstrict)
If \`\` are used instead of \`, the expressions are evaluated nonstrictly.  

#### T[] Transform
To transform expression to SKI-combinator form, put @ before the list of expression.
SKI-combinator form will be printed to log.

```
> @SKK
I
^ab.a
```

### Predefined Macros
Macros which are shown as follows are predefined.

```
S = ^xyz.xz(yz)
K = ^xy.z
I = ^x.x
T = ^xy.x
F = ^xy.y
Cons = ^cdf.fcd
Car = ^p.pT
Cdr = ^p.pF
Isnil = ^x.x(^abc.F)T
```

### Grammar of Oiseau
```
input:
    macro |
    evaluation

macro:
    macro-definition-name macro-eq expression-list

macro-definition-name:
    <characters except "=", "[", "]", or space> |
    "[" <characters except "=", "[", or "]"> "]"

macro-eq:
    "=" | ":="

evalation:
    expression-list "==" expression-list |
    "``" expression-list |
    "`" expression-list |
    "@" expression-list

expression-list:
    "(" expression-list ")" |
    lambda-clause |
    variable-name |
    macro-name |
    "<" <characters except ">"> ">" |
    "[[" list "]]"
    number

lambda-clause:
    lambda-mark variable-list "." expression-list

lambda-mark:
    "^" | "λ"

variable-list:
    variable-name variable-list |
    variable-name

variable-name:
    "a" .. "z" ("0" .. "9")*

macro-name:
    "A" .. "Z" (("0" .. "9")+ | "*"+)? |
    "[" <characters except "=", "[", or "]"> "]"

list:
    lambda-clause list |
    lambda-clause "|" lambda-clause |
    lambda-caluse

number:
    ("0" .. "9")+
```

