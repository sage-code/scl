------------------------------------------------------------------------------
-- 12_package_main.adb — a client of the Geometry package + exceptions.
--
-- Demonstrates: with/use of a local package, compiling multi-file units
-- (gnatmake finds geometry.ads/adb automatically), and handling a
-- precondition violation at the boundary.
-- Compile: gnatmake 12_package_main.adb   (needs 11_geometry.ads/.adb)
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;
with Geometry;                          --  name the dependency

procedure Package_Main is
   use Geometry;                        --  drop the "Geometry." prefix
begin
   declare
      S : constant Square := Make (2.0);
   begin
      Put_Line ("area = " & Float'Image (Area (S)));     --  4.0
      Put_Line ("side = " & Float'Image (Side_Of (S)));  --  2.0
   end;

   --  The precondition in geometry.ads makes THIS call a run-time
   --  failure — a caller bug, caught at the call site:
   declare
      Bad : Square;
   begin
      Bad := Make (-1.0);                --  violates Pre => Side > 0.0
      Put_Line ("never reached");
   exception
      when E : others =>
         Put_Line ("caught at boundary: " & Exception_Message (E));
   end;
end Package_Main;
