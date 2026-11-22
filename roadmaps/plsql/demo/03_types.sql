-- 03 - Data types, %TYPE anchoring, and conversion functions
-- Run in SQL*Plus / sqlcl: @03_types.sql

set serveroutput on

declare
  -- %TYPE anchors a variable's type to a column, so it tracks the schema
  -- automatically if the column definition ever changes
  v_first_name employees.first_name%type;

  n_int    pls_integer := 42;      -- fast, CPU-native integer arithmetic
  n_float  number      := 3.14159;
  s_text   varchar2(20);
  d_date   date;
begin
  -- conversion functions: the safe way to move between types
  s_text := to_char(n_float, '999.99');
  d_date := to_date('2026-09-29', 'YYYY-MM-DD');

  dbms_output.put_line('formatted float = ' || s_text);
  dbms_output.put_line('parsed date     = ' || to_char(d_date, 'DD Month YYYY'));
  dbms_output.put_line('int + 1         = ' || to_char(n_int + 1));

  -- %TYPE keeps this in sync even if first_name's length ever changes
  select first_name into v_first_name
    from employees
   where rownum = 1;

  dbms_output.put_line('first employee  = ' || v_first_name);
exception
  when no_data_found then
    dbms_output.put_line('(no employees table in this schema — that is fine for this demo)');
end;
/
