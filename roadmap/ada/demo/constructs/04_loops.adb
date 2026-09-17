------------------------------------------------------------------------------
-- 04_loops.adb — for, reverse, while, loop/exit, next, and loop labels.
--
-- Demonstrates: the loop variable is a compiler-managed constant, ranges
-- come from data, and exit/next target labeled loops. Compile: gnatmake 04_loops.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Loops is
   type Int_Array is array (Positive range <>) of Integer;
   Data : constant Int_Array := (10, 20, 30, 40);
   Sum  : Integer := 0;
begin
   --  for: I is declared BY the loop, has the range's type, is a constant,
   --  and does not exist after the loop.
   for I in 1 .. 5 loop
      Put (Integer'Image (I) & ' ');
   end loop;
   New_Line;

   --  reverse: counts DOWN from the last to the first value.
   for I in reverse 1 .. 5 loop
      Put (Integer'Image (I) & ' ');
   end loop;
   New_Line;

   --  The range usually comes from the data itself — bounds can never
   --  drift from the array:
   for I in Data'Range loop
      Sum := Sum + Data (I);
   end loop;
   Put_Line ("sum = " & Integer'Image (Sum));    --  100

   --  while tests BEFORE the body; loop + exit when tests AFTER.
   --  The plain loop is the idiom for unbounded iteration:
   declare
      Balance : Integer := 100;
   begin
      while Balance > 30 loop
         Balance := Balance - 30;
      end loop;
      Put_Line ("while left: " & Integer'Image (Balance));   --  10
   end;

   --  Labeled loops: exit/next can name their target in nested loops.
   Outer :
   for Row in 1 .. 3 loop
      for Col in 1 .. 3 loop
         if Row = Col then
            next Outer;   --  skip this ENTIRE row, not just the cell
         end if;
         Put ("(" & Integer'Image (Row) & "," & Integer'Image (Col) &) ");
      end loop;
   end loop Outer;
   New_Line;
end Loops;
