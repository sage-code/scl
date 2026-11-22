#lang racket

;; A tiny embedded DSL in Racket using syntax-rules macros.
;; `define-rules` turns declarative `when -> action` pairs into a dispatcher.

(define-syntax define-rules
  (syntax-rules (-> else)
    [(define-rules name
       [pred? -> action] ...
       [else  -> default])
     (define (name value)
       (cond
         [(pred? value) (action value)] ...
         [else (default value)]))]))

;; Build a classifier using the DSL
(define-rules classify-temp
  [(lambda (t) (< t 0))   -> (lambda (_) 'freezing)]
  [(lambda (t) (< t 20))  -> (lambda (_) 'cool)]
  [(lambda (t) (< t 30))  -> (lambda (_) 'warm)]
  [else                   -> (lambda (_) 'hot)])

(for-each (lambda (t)
            (printf "~a C -> ~a~n" t (classify-temp t)))
          '(-5 12 24 35))
