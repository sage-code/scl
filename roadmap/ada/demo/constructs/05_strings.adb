------------------------------------------------------------------------------
-- 05_strings.adb — fixed strings, slices, and unbounded strings.
--
-- Demonstrates: String is an array of Character with a chosen index range,
-- slices read and write, Unbounded_String grows at run time.
-- Compile: gnatmake 05_strings.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Strings.Unbounded; use Ada.Strings.Unbounded;

procedure Strings is

   --  Fixed string: EXACTLY 10 characters, indices 1 .. 10.
   --  The length is part of the type — a length mismatch is an error.
   Name : String (1 .. 10);

   --  Unbounded string: grows and shrinks at run time, memory managed.
   Line : Unbounded_String := To_Unbounded_String ("Hello");
begin
   --  Name := "Ada";          --  compile error: length must be 10
   Name (1 .. 3) := "Ada";    --  slice WRITE: characters 1..3
   Name (4 .. 10) := "       ";  --  pad the rest (7 blanks)

   Put_Line (Name (1 .. 3));  --  slice READ: "Ada"
   Put_Line (Name);           --  whole thing, blanks included

   Append (Line, ", ");       --  grow: "Hello, "
   Append (Line, "world!");   --  "Hello, world!"
   Put_Line (To_String (Line));
   Put_Line ("length: " & Natural'Image (Length (Line)));   --  13

   --  Concatenation & and comparison work on all string types:
   if Name (1 .. 3) = "Ada" then
      Put_Line ("matched " & Name (1 .. 3));
   end if;
end Strings;
