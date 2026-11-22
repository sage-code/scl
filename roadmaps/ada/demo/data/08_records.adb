------------------------------------------------------------------------------
-- 08_records.adb — nested records, variant discriminants, defaults.
--
-- Demonstrates: record aggregates, dot access, and the checked variant
-- record (the C union done right). Compile: gnatmake 08_records.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Records is

   type Point is record
      X, Y : Float := 0.0;         --  default for every new object
   end record;

   type Shape_Kind is (Circle, Rectangle);

   --  Variant record: the discriminant Kind records which variant is
   --  active; fields of the other variant are compile errors.
   type Shape (Kind : Shape_Kind := Circle) is record
      Pos  : Point;
      case Kind is
         when Circle =>    Radius : Float;
         when Rectangle => Width, Height : Float;
      end case;
   end record;

   C : Shape;                                  --  Kind defaults to Circle
   R : Shape (Kind => Rectangle);              --  fixed Rectangle variant
begin
   C.Pos.X := 1.5;             --  nested dot access
   C.Radius := 2.0;            --  OK: C is a Circle
   R.Width := 3.0;             --  OK: R is a Rectangle
   --  R.Radius := 1.0;        --  compile error: no such field in this variant

   --  Aggregate construction with named associations:
   declare
      S : constant Shape := (Kind => Rectangle, Pos => (0.0, 0.0),
                             Width => 2.0, Height => 5.0);
   begin
      Put_Line ("height = " & Float'Image (S.Height));
   end;

   --  Defaults apply where the aggregate uses others => <>:
   declare
      D : constant Shape := (Kind => Circle, others => <>);
   begin
      Put_Line ("default radius = " & Float'Image (D.Radius));  --  0.0
   end;
end Records;
