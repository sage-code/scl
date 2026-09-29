% 09 - Logic programming: Prolog, the canonical logic language. You state
% facts and rules; the engine searches for values that satisfy a query.
% There is no "how" here, only "what is true".

% Facts
parent(tom, bob).
parent(tom, liz).
parent(bob, ann).
parent(bob, pat).

% A rule: X is an ancestor of Y if X is a parent of Y ...
ancestor(X, Y) :- parent(X, Y).
% ... or X is a parent of some Z who is an ancestor of Y.
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

% Queries (run these at the ?- prompt in a Prolog interpreter):
%   ?- ancestor(tom, ann).
%   true.
%
%   ?- ancestor(tom, Who).
%   Who = bob ;
%   Who = liz ;
%   Who = ann ;
%   Who = pat.
%
% Note what did NOT happen: we never wrote a loop or a traversal order.
% We described the *relationship*, and Prolog's search found every answer.
