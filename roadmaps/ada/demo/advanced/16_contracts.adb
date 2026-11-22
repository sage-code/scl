------------------------------------------------------------------------------
-- 16_contracts.adb — preconditions, postconditions, and predicates.
--
-- Demonstrates: aspects in a specification, 'Result and 'Old, and
-- Static_Predicate subtypes. Compile: gnatmake 16_contracts.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Contracts is

   subtype Even is Integer
     with Static_Predicate => Even mod 2 = 0;   --  compiler-checked where possible

   --  A function with a full contract. Note where each check fails:
   --  Pre violation  -> the CALLER's bug (Assertion_Error at call site)
   --  Post violation -> the CALLEE's bug (Assertion_Error at return)
   function Sqrt (X : Float) return Float
     with Pre  => X >= 0.0,
          Post => abs (Sqrt'Result ** 2 - X) < 1.0e-4 * (if X > 1.0 then X else 1.0)
   is
      R : Float := (if X > 0.0 then X else 1.0);
   begin
      if X = 0.0 then
         return 0.0;
      end if;
      for I in 1 .. 20 loop          --  Newton's method
         R := (R + X / R) / 2.0;
      end loop;
      return R;
   end Sqrt;

   --  'Old in a postcondition: value of the parameter at entry.
   procedure Grow (N : in out Natural)
     with Post => N = N'Old + 1
   is
   begin
      N := N + 1;
   end Grow;

   E : Even := 8;
   M : Natural := 5;
begin
   Put_Line (Float'Image (Sqrt (9.0)));    --  ~3.0
   --  Put_Line (Float'Image (Sqrt (-1.0)));
   --  ^ Assertion_Error AT THE CALL SITE: precondition violated

   Grow (M);
   Put_Line (Natural'Image (M));           --  6

   --  E := 7;   --  predicate violation: 7 is not even
   null;
end Contracts;
