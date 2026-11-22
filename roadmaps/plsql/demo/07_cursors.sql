-- 07 - Cursors: explicit cursor loop, %ROWTYPE, and the cursor FOR loop
-- Run in SQL*Plus / sqlcl: @07_cursors.sql
--
-- Uses an inline row source (no schema setup needed) so the demo runs as-is
-- on any Oracle instance.

set serveroutput on

declare
  cursor c_persons is
    select name, salary
      from (select 'Ana'  as name, 12000 as salary from dual
            union all select 'Bob',  9000 from dual
            union all select 'Cora', 15000 from dual)
     where salary > 10000;

  -- %ROWTYPE gives a record with one field per column the cursor selects
  v_person c_persons%rowtype;
begin
  dbms_output.put_line('--- explicit cursor ---');
  open c_persons;
  loop
    fetch c_persons into v_person;
    exit when c_persons%notfound;   -- cursor attributes use %, not #
    dbms_output.put_line(v_person.name || ', ' || to_char(v_person.salary));
  end loop;
  close c_persons;

  -- a cursor FOR loop opens, fetches, and closes automatically — the
  -- idiomatic, shorter way to write the same thing
  dbms_output.put_line('--- cursor FOR loop ---');
  for r in (select name, salary
              from (select 'Ana' as name, 12000 as salary from dual
                    union all select 'Bob',  9000 from dual
                    union all select 'Cora', 15000 from dual)
             where salary > 10000)
  loop
    dbms_output.put_line(r.name || ', ' || to_char(r.salary));
  end loop;
end;
/
