-- 19 - Building a schema: CREATE TABLE, constraints, and a sequence-backed key
-- Run in SQL*Plus / sqlcl: @19_build_schema.sql
--
-- Standard Oracle DDL — companion to the DDL: CREATE / ALTER section of
-- build.html, but written to run as-is (drops its own tables first).

begin
  for t in (select table_name from user_tables
             where table_name in ('ORDER_ITEM', 'CUSTOMER_ORDER', 'CUSTOMER'))
  loop
    execute immediate 'drop table ' || t.table_name || ' cascade constraints';
  end loop;
end;
/

-- main table: one row per customer
create table customer (
  id    number generated always as identity primary key,
  name  varchar2(50) not null,
  email varchar2(100) unique
);

-- detail table: one row per order, referencing its customer
create table customer_order (
  id          number generated always as identity primary key,
  customer_id number not null references customer(id),
  placed_at   date default sysdate not null,
  status      varchar2(10) default 'NEW'
                check (status in ('NEW', 'PAID', 'SHIPPED', 'CANCELLED'))
);

-- associative/detail table: one row per line item on an order
create table order_item (
  order_id   number not null references customer_order(id),
  line_no    number not null,
  product    varchar2(50) not null,
  quantity   number not null check (quantity > 0),
  unit_price number(10, 2) not null check (unit_price >= 0),
  primary key (order_id, line_no)
);

-- seed a little data to query against in 20_transform_etl.sql
insert into customer (name, email) values ('Ana Pop', 'ana@example.com');
insert into customer (name, email) values ('Bob Ionescu', 'bob@example.com');

insert into customer_order (customer_id, status) values (1, 'PAID');
insert into customer_order (customer_id, status) values (1, 'NEW');
insert into customer_order (customer_id, status) values (2, 'SHIPPED');

insert into order_item values (1, 1, 'Widget', 2, 9.99);
insert into order_item values (1, 2, 'Gadget', 1, 24.50);
insert into order_item values (2, 1, 'Widget', 5, 9.99);
insert into order_item values (3, 1, 'Gizmo',  1, 99.00);

commit;
