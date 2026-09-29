-- 05 - Decisions: IF/ELSIF/ELSE and the two flavors of CASE
-- Run in SQL*Plus / sqlcl: @05_control.sql

set serveroutput on

declare
  n_score number := 74;
  v_grade varchar2(1);
begin
  -- classic if/elsif/else ladder
  if n_score >= 90 then
    v_grade := 'A';
  elsif n_score >= 80 then
    v_grade := 'B';
  elsif n_score >= 70 then
    v_grade := 'C';
  else
    v_grade := 'F';
  end if;

  dbms_output.put_line('score ' || n_score || ' -> grade ' || v_grade);

  -- selector CASE: matches one expression against a list of values
  declare
    n_day pls_integer := 3;
    v_name varchar2(10);
  begin
    v_name := case n_day
                when 1 then 'Monday'
                when 2 then 'Tuesday'
                when 3 then 'Wednesday'
                else 'Other'
              end;
    dbms_output.put_line('day ' || n_day || ' -> ' || v_name);
  end;

  -- conditional CASE: evaluates each WHEN as its own boolean condition
  declare
    n_temp number := 5;
    v_state varchar2(10);
  begin
    v_state := case
                 when n_temp <= 0 then 'freezing'
                 when n_temp < 15 then 'cold'
                 when n_temp < 25 then 'mild'
                 else 'hot'
               end;
    dbms_output.put_line('temp ' || n_temp || ' -> ' || v_state);
  end;
end;
/
