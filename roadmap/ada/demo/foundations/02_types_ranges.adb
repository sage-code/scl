------------------------------------------------------------------------------
-- 02_types_ranges.adb — new types, subtypes, and range checks.
--
-- Demonstrates: "type" creates an incompatible type; "subtype" restricts
-- an existing one; range violations raise Constraint_Error at the exact
-- assignment. Compile: gnatmake 02_types_ranges.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;      --  "use" drops the package prefix

procedure Types_Ranges is

   --  A NEW type: incompatible with Integer and with every other type,
   --  even one declared with the same range. Domain meaning is enforced.
   type Day_Of_Month is range 1 .. 31;

   --  A SUBTYPE of Integer: interchangeable with Integer, but values
   --  are checked against 0..40 on every assignment.
   subtype Work_Hours is Integer range 0 .. 40;

   Day   : Day_Of_Month := 15;
   Hours : Work_Hours   := 38;
   Plain : Integer      := 42;
begin
   --  Un-commenting either line below is a COMPILE error, not a warning:
   --  Day   := 32;         --  32 is not in 1 .. 31
   --  Hours := Day;        --  distinct types never mix implicitly

   Plain := Hours;         --  legal: a subtype IS its base type

   --  Range checks also happen at run time for computed values.
   --  This block catches the failure and shows the exception name:
   begin
      Hours := Hours + 5;      --  43 is fine (<= 40? no!) -> Constraint_Error
      Put_Line ("never reached");
   exception
      when E : Constraint_Error =>
         Put_Line ("caught: " & Exception_Message (E));
   end;

   Put_Line ("day   = " & Day_Of_Month'Image (Day));   --  attributes:
   Put_Line ("last  = " & Day_Of_Month'Image (Day_Of_Month'Last));  -- 31
   Put_Line ("plain = " & Integer'Image (Plain));      --  38
end Types_Ranges;
