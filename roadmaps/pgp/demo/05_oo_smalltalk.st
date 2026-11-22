"05 - Object-oriented programming: Smalltalk, the language that defined the
paradigm's vocabulary in the 1970s — everything, including a number or a
block of code, is an object that responds to messages."

Object subclass: #Counter
    instanceVariableNames: 'count'
    classVariableNames: ''
    package: 'Demo'.

Counter >> initialize
    "Constructors are just a regular method named initialize."
    count := 0.

Counter >> increment
    "count := count + 1 sends the message #+ to the object count."
    count := count + 1.
    ^count.

Counter >> value
    ^count.

| c |
c := Counter new.
c increment.
c increment.
Transcript showCr: 'count = ', c value printString.
