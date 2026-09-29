-- 02 - Declaring variables: fixed vs. variable length, defaults, assignment
-- Run in SQL*Plus / sqlcl: @02_variables.sql

set serveroutput on

declare
  v_message varchar2(30);          -- variable length string, max 30 chars
  c_code    char(10);              -- fixed length string, always 10 chars
  n_price   number(5, 2);          -- a number with up to 2 decimal places
  d_today   date := sysdate;       -- initialized to today at declaration time
  b_active  boolean := true;       -- boolean has no SQL type, PL/SQL only
begin
  v_message := 'hello world';      -- assign after declaration
  n_price   := 19.99;

  dbms_output.put_line(v_message);
  dbms_output.put_line('price = ' || to_char(n_price));
  dbms_output.put_line('today = ' || to_char(d_today, 'YYYY-MM-DD'));

  if b_active then
    dbms_output.put_line('active');
  end if;
end;
/
