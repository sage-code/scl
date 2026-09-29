; 07 - Functional programming: Lisp, the first functional language,
; invented by John McCarthy in 1960. Functions are data, and recursion
; replaces loops.

(defun square (x)
  (* x x))

;; A higher-order function: takes another function as an argument
(defun apply-twice (f x)
  (funcall f (funcall f x)))

;; A pure, recursive function — no loops, no mutation
(defun factorial (n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

;; A lambda (anonymous function) passed directly as an argument
(print (apply-twice #'square 3))       ; square(square(3)) = 81
(print (factorial 5))                  ; 120
(print (mapcar (lambda (x) (* x 2)) '(1 2 3 4 5))) ; (2 4 6 8 10)
