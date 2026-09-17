------------------------------------------------------------------------------
-- 13_exceptions.adb — raising, handling, and propagating exceptions.
--
-- Demonstrates: user-defined exceptions, messages, propagation through
-- frames, and the log-and-reraise idiom. Compile: gnatmake 13_exceptions.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Exceptions; use Ada.Exceptions;

procedure Exceptions is

   Overflow : exception;      --  a user-defined exception

   --  This frame does NOT handle Overflow — exceptions propagate
   --  through frames that don't handle them:
   function Divide (A, B : Integer) return Integer is
   begin
      if B = 0 then
         raise Overflow with "division by zero requested";
      end if;
      return A / B;
   end Divide;

   --  Log and reraise: the standard middle-layer idiom.
   procedure Audit (N : Integer) is
   begin
      Put_Line ("result = " & Integer'Image (Divide (N, 0)));
   exception
      when E : Overflow =>
         Put_Line ("[audit] seen: " & Exception_Message (E));
         raise;               --  re-raise the SAME occurrence upward
   end Audit;
begin
   begin
      Audit (10);
   exception
      when E : Overflow =>
         Put_Line ("[main] handled: " & Exception_Name (E));
   end;

   --  Predefined exceptions are raised by the run time itself:
   begin
      declare
         type Small is range 0 .. 10;
         S : Small;
      begin
         S := Small (20);     --  out of range: Constraint_Error HERE
      end;
   exception
      when E : Constraint_Error =>
         Put_Line ("[main] range check: " & Exception_Message (E));
   end;
end Exceptions;
