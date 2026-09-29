-- 01 - Hello, World: an anonymous PL/SQL block
-- Run in SQL*Plus / sqlcl: @01_hello.sql

set serveroutput on

begin
  dbms_output.put_line('Hello, world!');
end;
/
