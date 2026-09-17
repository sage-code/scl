------------------------------------------------------------------------------
-- 07_arrays.adb — constrained/unconstrained arrays, aggregates, slices.
--
-- Demonstrates: chosen index ranges, aggregate initialization, whole-array
-- assignment, slicing, and enum-indexed arrays. Compile: gnatmake 07_arrays.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Arrays is

   --  A constrained array: index range fixed by the type.
   type Temperatures is array (1 .. 7) of Float;

   --  An unconstrained array: bounds are chosen per object.
   type Int_Vector is array (Positive range <>) of Integer;

   --  An array indexed BY an enumeration — no hashing, no lookup tables.
   type Sensor is (Left, Center, Right);
   type Readings is array (Sensor) of Float;

   Week : Temperatures := (21.5, 22.0, 19.8, 20.1, 23.4, 24.0, 18.9);
   A    : Int_Vector (1 .. 4) := (1, 2, 3, 4);
   B    : Int_Vector (1 .. 4) := (others => 0);   --  all zeros
   R    : Readings := (Left => 0.5, Center => 0.7, Right => 0.2);
begin
   --  Week (8) := 0.0;   --  compile error: 8 is not in 1 .. 7
   Week (3) := 20.5;

   --  Whole-array assignment: B := A copies all elements (lengths match).
   B := A;

   --  Slices read and write contiguous runs:
   A (6 .. 8) := A (1 .. 3);
   A (1 .. 2) := (0, 0);

   for I in Week'Range loop
      Put (Float'Image (Week (I)) & ' ');
   end loop;
   New_Line;
   Put_Line ("week has" & Integer'Image (Week'Length) & " readings");

   --  Iterate an enum-indexed array BY NAME:
   for S in Sensor'Range loop
      Put (Sensor'Image (S) & '=' & Float'Image (R (S)) & ' ');
   end loop;
   New_Line;
end Arrays;
