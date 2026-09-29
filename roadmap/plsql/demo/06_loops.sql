-- 06 - Loops: basic LOOP/EXIT, WHILE, and numeric FOR
-- Run in SQL*Plus / sqlcl: @06_loops.sql

set serveroutput on

declare
  n pls_integer;
begin
  -- basic loop: repeats until an explicit EXIT
  n := 1;
  loop
    dbms_output.put_line('basic loop n = ' || n);
    exit when n >= 3;
    n := n + 1;
  end loop;

  -- while loop: condition checked before each iteration
  n := 1;
  while n <= 3 loop
    dbms_output.put_line('while loop n = ' || n);
    n := n + 1;
  end loop;

  -- numeric for loop: the loop variable is implicitly declared and read-only
  for i in 1 .. 3 loop
    dbms_output.put_line('for loop i = ' || i);
  end loop;

  -- reverse for loop
  for i in reverse 1 .. 3 loop
    dbms_output.put_line('reverse for i = ' || i);
  end loop;

  -- EXIT WHEN inside a FOR loop, to leave early
  for i in 1 .. 10 loop
    exit when i > 3;
    dbms_output.put_line('early exit i = ' || i);
  end loop;
end;
/
