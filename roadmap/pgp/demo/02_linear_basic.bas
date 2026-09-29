10 REM 02 - Linear programming: classic line-numbered BASIC
20 REM Every line runs once, in numeric order, top to bottom.
30 PRINT "Enter your name:"
40 INPUT N$
50 PRINT "Hello, "; N$; "!"
60 PRINT "Enter two numbers to add:"
70 INPUT A, B
80 LET C = A + B
90 PRINT "Sum = "; C
100 END
110 REM Note: real BASIC also has GOTO, which breaks pure linearity by
120 REM jumping out of order — this program avoids it on purpose to show
130 REM linear programming in its cleanest form: one line leads to the next.
