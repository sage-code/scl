-- 15 - Triggers: BEFORE INSERT, :NEW, and enforcing a rule the table cannot
-- Run in SQL*Plus / sqlcl: @15_triggers.sql
--
-- Self-contained: creates its own table so the demo runs on a fresh schema.

-- drop the demo table first, ignoring the error if it does not exist yet
begin
  execute immediate 'drop table demo_products';
exception
  when others then
    if sqlcode != -942 then raise; end if; -- -942 = table does not exist
end;
/

create table demo_products (
  id         number generated always as identity primary key,
  name       varchar2(50) not null,
  price      number(10, 2) not null,
  created_at date
);
/

-- a BEFORE INSERT row-level trigger: fires once per inserted row, before it
-- is written, and can inspect or change the incoming values through :NEW
create or replace trigger trg_products_bi
  before insert on demo_products
  for each row
begin
  if :new.created_at is null then
    :new.created_at := sysdate; -- fill in a default the table itself has none for
  end if;

  if :new.price < 0 then
    raise_application_error(-20001, 'price cannot be negative: ' || :new.price);
  end if;
end;
/

set serveroutput on

-- this insert succeeds: created_at is stamped automatically by the trigger
insert into demo_products (name, price) values ('Widget', 9.99);

-- this insert is rejected by the trigger before it ever reaches the table
begin
  insert into demo_products (name, price) values ('Broken Widget', -1);
exception
  when others then
    dbms_output.put_line('rejected by trigger: ' || sqlerrm);
end;
/

select id, name, price, created_at from demo_products;
