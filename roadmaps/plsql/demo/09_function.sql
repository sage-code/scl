-- 09 - A stored function: takes parameters, returns a value
-- Run in SQL*Plus / sqlcl: @09_function.sql

set serveroutput on

create or replace function get_price(quantity number, value number) return number is
  error_message varchar2(30) := 'Quantity cannot be zero.';
  price number;
begin
  price := value / quantity;
  return price;
exception
  when zero_divide then
    dbms_output.put_line(error_message);
    return 0;
end get_price;
/

-- call it like any SQL expression
begin
  dbms_output.put_line('price = ' || to_char(get_price(4, 100)));
  dbms_output.put_line('price = ' || to_char(get_price(0, 100))); -- triggers the handler
end;
/
