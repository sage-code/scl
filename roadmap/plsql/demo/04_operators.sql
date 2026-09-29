-- 04 - Operators and expressions: arithmetic, comparison, logical, concatenation
-- Run in SQL*Plus / sqlcl: @04_operators.sql

set serveroutput on

declare
  a number := 10;
  b number := 3;
begin
  dbms_output.put_line('a + b  = ' || to_char(a + b));
  dbms_output.put_line('a - b  = ' || to_char(a - b));
  dbms_output.put_line('a * b  = ' || to_char(a * b));
  dbms_output.put_line('a / b  = ' || to_char(a / b));   -- real division, not integer
  dbms_output.put_line('mod(a,b) = ' || to_char(mod(a, b)));

  dbms_output.put_line('a = b  ? ' || case when a = b then 'true' else 'false' end);
  dbms_output.put_line('a > b  ? ' || case when a > b then 'true' else 'false' end);

  -- logical operators short-circuit left to right, same as most languages
  if a > 5 and b < 5 then
    dbms_output.put_line('both conditions hold');
  end if;

  -- || is the string concatenation operator
  dbms_output.put_line('a=' || a || ', b=' || b);

  -- IS NULL / IS NOT NULL — never compare to NULL with = or !=
  if b is not null then
    dbms_output.put_line('b is not null');
  end if;
end;
/
