// ANTLR 4 grammar for a simple arithmetic expression language.
// Labels (#MulDiv, #AddSub, etc.) generate typed visitor/listener methods.
grammar Expr;

prog:   stat+ EOF ;

stat:   expr NEWLINE                # printExpr
    |   ID '=' expr NEWLINE         # assign
    |   NEWLINE                     # blank
    ;

// Precedence is encoded directly by alternative order:
// multiplication/division bind tighter than addition/subtraction.
expr:   expr op=('*'|'/') expr      # MulDiv
    |   expr op=('+'|'-') expr      # AddSub
    |   INT                         # int
    |   ID                          # id
    |   '(' expr ')'                # parens
    ;

ID      : [a-zA-Z_][a-zA-Z_0-9]* ;
INT     : [0-9]+ ;
NEWLINE : '\r'? '\n' ;
WS      : [ \t]+ -> skip ;
