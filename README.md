# Oiseau

Oiseau is a program language which based on lambda calculus or combinator logic.  
Features of Oiseau are shown as follows.

* Macro definition: combinators are implemented by macros
* Beta reduction
* Evaluate expression strictly or nonstrictly

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

#### Evaluation (strict)
To evaluate expression, you add \` before the list of expression.  
For example, Print "Hello, world." to log.

```
\`<Hello, world.>I
```

#### Evaluation (nonstrict)
If \`\` are used instead of \`, the expressions are evaluated nonstrictly.  

