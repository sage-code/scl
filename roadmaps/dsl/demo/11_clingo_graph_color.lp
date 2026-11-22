% Clingo (Answer Set Programming): 3-coloring of a small undirected graph.
% Declare vertices, edges, and colors, then state constraints.

node(1..4).
color(red; green; blue).
edge(1, 2). edge(2, 3). edge(3, 4). edge(4, 1). edge(1, 3).

% Choice rule: each node must be assigned exactly one color
1 { assign(N, C) : color(C) } 1 :- node(N).

% Integrity constraint: adjacent nodes cannot share a color
:- edge(U, V), assign(U, C), assign(V, C).

#show assign/2.
