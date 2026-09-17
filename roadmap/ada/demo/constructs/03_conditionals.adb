------------------------------------------------------------------------------
-- 03_conditionals.adb — if/elsif and the compiler-checked case statement.
--
-- Demonstrates: Boolean-only conditions, case coverage of every value,
-- and the Ada 2012 conditional expression. Compile: gnatmake 03_conditionals.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Conditionals is

   type Mode is (Off, Standby, Active, Fault);   --  an enumeration type

   Speed : constant Integer := 95;
   M     : constant Mode      := Standby;
begin
   --  if/elsif/else: the condition is always Boolean — writing
   --  "if Speed then" is a compile error, unlike C.
   if Speed > 120 then
      Put_Line ("overspeeding");
   elsif Speed > 90 then
      Put_Line ("approaching the limit");
   else
      Put_Line ("cruising");
   end if;

   --  case: EVERY value of the selector must be covered. The compiler
   --  rejects an incomplete case, so adding a Mode literal later breaks
   --  this compile until it is handled.
   case M is
      when Off      => Put_Line ("system down");
      when Standby  => Put_Line ("warm, waiting");
      when Active   => Put_Line ("fully operational");
      when Fault    => Put_Line ("diagnostics required");
   end case;

   --  Conditional EXPRESSION (Ada 2012): a value, not a statement.
   --  Every branch must produce a value — no implicit defaults.
   declare
      Level : constant String :=
        (if Speed > 90 then "high" else "normal");
   begin
      Put_Line ("alert level: " & Level);
   end;
end Conditionals;
