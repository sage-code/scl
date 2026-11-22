------------------------------------------------------------------------------
-- 06_enumeration.adb — enumerations as full-fledged types.
--
-- Demonstrates: ordered literals, attributes (Image/Pos/First/Last),
-- case coverage, subtypes over enums, and wire-value representation.
-- Compile: gnatmake 06_enumeration.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Enumeration is

   --  Literals are ordered: Mon < Tue < ... and comparisons use that order.
   type Day is (Mon, Tue, Wed, Thu, Fri, Sat, Sun);

   --  A subtype names a legal window of the enumeration:
   subtype Weekday is Day range Mon .. Fri;

   type Level is (Low, Mid, High);
   for Level use (Low => 0, Mid => 4, High => 9);  --  exact wire values

   D : Day     := Wed;
   W : Weekday := Thu;
begin
   --  Ordering comes from the declaration:
   if D > Fri then
      Put_Line ("weekend");
   else
      Put_Line ("weekday: " & Day'Image (D));    --  "WED"
   end if;

   Put_Line (Day'Pos (D)'Image);                  --  "2"  (Mon is 0)
   Put_Line (Day'Image (Day'Succ (D)));           --  "THU"
   Put_Line (Day'Image (Day'First));              --  "MON"

   --  From text back to a value — raises Constraint_Error on garbage:
   Put_Line (Day'Image (Day'Value ("sun")));

   --  W := Sun;   --  compile error: Sun is outside Mon .. Fri
   null;
end Enumeration;
