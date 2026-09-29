-- 20 - Transforming data: JOIN, GROUP BY, a CTE, and a VIEW
-- Run 19_build_schema.sql first, then: @20_transform_etl.sql

-- an inner join reshapes two tables into one result set, row by row
select c.name, o.id as order_id, o.status
  from customer c
  join customer_order o on o.customer_id = c.id
 order by c.name, o.id;

-- joining three tables, with a computed column per row
select c.name, o.id as order_id, i.product, i.quantity, i.unit_price,
       i.quantity * i.unit_price as line_total
  from customer c
  join customer_order o on o.customer_id = c.id
  join order_item i     on i.order_id = o.id
 order by c.name, o.id, i.line_no;

-- GROUP BY collapses many rows into one summary row per group
select o.customer_id, count(*) as order_count, sum(i.quantity * i.unit_price) as total_spent
  from customer_order o
  join order_item i on i.order_id = o.id
 group by o.customer_id
having sum(i.quantity * i.unit_price) > 20
 order by total_spent desc;

-- a CTE (WITH clause) names a subquery so it can be reused and read top to
-- bottom, instead of nesting subqueries inside each other
with order_totals as (
  select o.id as order_id, o.customer_id,
         sum(i.quantity * i.unit_price) as order_total
    from customer_order o
    join order_item i on i.order_id = o.id
   group by o.id, o.customer_id
)
select c.name, ot.order_id, ot.order_total
  from order_totals ot
  join customer c on c.id = ot.customer_id
 order by ot.order_total desc;

-- a VIEW packages a query as if it were a table — the same query, saved
create or replace view customer_order_totals as
  select c.id as customer_id, c.name,
         count(o.id) as order_count,
         nvl(sum(i.quantity * i.unit_price), 0) as total_spent
    from customer c
    left join customer_order o on o.customer_id = c.id
    left join order_item i     on i.order_id = o.id
   group by c.id, c.name;

select * from customer_order_totals order by total_spent desc;
