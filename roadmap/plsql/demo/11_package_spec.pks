-- 11 - Package specification: the public interface, no implementation
-- Compile with 13_package_test.pkc (which also compiles the body and calls it)

create or replace package hello_world as

  ------------------------------------
  -- a function can return one result
  ------------------------------------
  function say_hello return varchar2;

  ------------------------------------
  -- a procedure performs an action
  -- a procedure has no return value
  ------------------------------------
  procedure hello;

end hello_world;
/
