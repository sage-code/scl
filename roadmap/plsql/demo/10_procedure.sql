-- 10 - A stored procedure: performs an action, has no return value
-- Run in SQL*Plus / sqlcl: @10_procedure.sql

set serveroutput on

create or replace procedure show_price(quantity number, value number) is
  error_message varchar2(30) := 'Quantity cannot be zero.';
  price number;
begin
  price := value / quantity;
  dbms_output.put_line('price = ' || to_char(price));
exception
  when zero_divide then
    dbms_output.put_line(error_message);
end show_price;
/

-- call it as a standalone statement, not inside an expression
begin
  show_price(4, 100);
  show_price(0, 100); -- triggers the handler
end;
/
