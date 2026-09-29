-- 14 - Collections: associative array, nested table, and VARRAY
-- Run in SQL*Plus / sqlcl: @14_collections.sql

set serveroutput on

declare
  -- associative array: indexed by a key (here, PLS_INTEGER), grows freely,
  -- exists only in PL/SQL memory — never stored in a database column
  type t_scores is table of number index by pls_integer;
  scores t_scores;

  -- nested table: an ordered collection that CAN be stored in a database
  -- column; starts empty and must be initialized with a constructor
  type t_names is table of varchar2(20);
  names t_names := t_names();

  -- varray: like a nested table, but with a fixed maximum size
  type t_top3 is varray(3) of varchar2(20);
  top3 t_top3 := t_top3();

  idx pls_integer;
begin
  -- associative array: assign directly to any key
  scores(1) := 90;
  scores(2) := 75;
  scores(100) := 60; -- keys need not be contiguous

  idx := scores.first;
  while idx is not null loop
    dbms_output.put_line('scores(' || idx || ') = ' || scores(idx));
    idx := scores.next(idx);
  end loop;

  -- nested table: grow with EXTEND, index from 1
  names.extend(2);
  names(1) := 'Ana';
  names(2) := 'Bob';
  for i in 1 .. names.count loop
    dbms_output.put_line('names(' || i || ') = ' || names(i));
  end loop;

  -- varray: same EXTEND pattern, but capped at 3 elements
  top3.extend(3);
  top3(1) := 'Gold';
  top3(2) := 'Silver';
  top3(3) := 'Bronze';
  for i in 1 .. top3.count loop
    dbms_output.put_line('top3(' || i || ') = ' || top3(i));
  end loop;
end;
/
