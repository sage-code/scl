------------------------------------------------------------------------------
-- 18_containers.adb — Ada.Containers.Vectors and Hashed_Maps.
--
-- Demonstrates: instantiating generic containers for your element type,
-- appending, indexing, cursors, and maps. Compile: gnatmake 18_containers.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Containers.Vectors;
with Ada.Containers.Hashed_Maps;
with Ada.Strings.Unbounded; use Ada.Strings.Unbounded;
with Ada.Strings.Unbounded.Hash;

procedure Containers is

   --  A growable array of unbounded strings:
   package Name_Vectors is new Ada.Containers.Vectors
     (Index_Type => Positive, Element_Type => Unbounded_String);
   use Name_Vectors;
   Names : Vector;

   --  A map from string keys to integer values:
   package Age_Maps is new Ada.Containers.Hashed_Maps
     (Key_Type        => Unbounded_String,
      Element_Type    => Natural,
      Hash            => Hash,          --  from Ada.Strings.Unbounded
      Equivalent_Keys => "=");
   use Age_Maps;
   Ages : Map;
begin
   --  Vector: append, index, iterate
   Names.Append (To_Unbounded_String ("Ada"));
   Names.Append (To_Unbounded_String ("Jean"));
   Names.Append (To_Unbounded_String ("Tucker"));

   for I in Names.First_Index .. Names.Last_Index loop
      Put_Line (To_String (Names (I)));
   end loop;
   Put_Line (Natural'Image (Length (Names)) & " names");   --  3

   --  Map: insert, query with default, iterate
   Ages.Insert (To_Unbounded_String ("ada"), 212);   --  1815 + ...
   Ages.Insert (To_Unbounded_String ("grace"), 109);

   declare
      C : constant Cursor := Ages.Find (To_Unbounded_String ("ada"));
   begin
      if C /= No_Element then
         Put_Line ("ada found, age" & Natural'Image (Element (C)));
      end if;
   end;

   Put_Line (Natural'Image (Length (Ages)) & " entries");  --  2
end Containers;
