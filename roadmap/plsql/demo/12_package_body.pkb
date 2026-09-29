-- 12 - Package body implementing 11_package_spec.pks
--
-- Note: PL/SQL string literals use single quotes ('...'). Double quotes are
-- reserved for quoted identifiers and will not compile as a string here.

create or replace package body hello_world as

  function say_hello return varchar2 is
  begin
    return 'Hello World';
  end say_hello;

  procedure hello is
  begin
    dbms_output.put_line('Hello World');
  end hello;

end hello_world;
/
