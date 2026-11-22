-- 08 - Exception handling: predefined, user-defined, and PRAGMA EXCEPTION_INIT
-- Run in SQL*Plus / sqlcl: @08_exceptions.sql

set serveroutput on

declare
  -- a user-defined exception: declared like a variable, has no data of its own
  e_negative_price exception;

  -- binds a name to an Oracle error number, so you can WHEN it by name
  e_resource_busy exception;
  pragma exception_init(e_resource_busy, -54);

  n_price number := -5;
  n_result number;
begin
  -- raise a user-defined exception on a business-rule violation
  if n_price < 0 then
    raise e_negative_price;
  end if;

  n_result := 100 / n_price; -- never reached in this demo
exception
  when e_negative_price then
    dbms_output.put_line('price cannot be negative: ' || n_price);
  when zero_divide then
    dbms_output.put_line('caught division by zero');
  when e_resource_busy then
    dbms_output.put_line('resource was busy (ORA-00054)');
  when others then
    -- always the last handler: catches anything not matched above
    dbms_output.put_line('unexpected error: ' || sqlerrm);
end;
/

-- a second block: division by zero, caught by a predefined exception
declare
  n_result number;
begin
  n_result := 10 / 0;
exception
  when zero_divide then
    dbms_output.put_line('block 2: caught division by zero');
end;
/
