% Prolog facts and recursive rules for directed graph reachability.

edge(a, b).
edge(b, c).
edge(c, d).
edge(b, e).

% Base case: direct edge
path(X, Y) :- edge(X, Y).
% Recursive step: intermediate node Z
path(X, Y) :- edge(X, Z), path(Z, Y).

% Example query:
% ?- path(a, d).   -> true.
% ?- path(a, X).   -> X = b ; X = c ; X = d ; X = e.
