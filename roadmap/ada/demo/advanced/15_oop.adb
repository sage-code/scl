------------------------------------------------------------------------------
-- 15_oop.adb — tagged types, overriding, class-wide dispatch.
--
-- Demonstrates: tagged records, the overriding keyword, class-wide
-- dispatch through a Shape'Class parameter, and abstract interfaces.
-- Compile: gnatmake 15_oop.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure OOP is

   --  The root of the family: a tagged record. It carries a hidden tag
   --  that dispatching calls read at run time.
   type Shape is tagged record
      X, Y : Float;
   end record;

   function Area (S : in Shape) return Float is (0.0);

   --  Descendants extend and may override primitives:
   type Circle is new Shape with record
      Radius : Float;
   end record;

   overriding
   function Area (C : in Circle) return Float is (3.14159 * C.Radius ** 2);

   type Rect is new Shape with record
      Width, Height : Float;
   end record;

   overriding
   function Area (R : in Rect) return Float is (R.Width * R.Height);

   --  A class-wide parameter dispatches: the tag of the ACTUAL argument
   --  decides which Area runs. This is the polymorphic entry point.
   procedure Show (S : in Shape'Class) is
   begin
      Put_Line ("area = " & Float'Image (Area (S)));   --  DISPATCH here
   end Show;

   C : Circle := (X | Y => 0.0, Radius => 2.0);
   R : Rect   := (X | Y => 1.0, Width => 3.0, Height => 4.0);
begin
   Show (C);    --  runs Circle.Area   -> 12.57
   Show (R);    --  runs Rect.Area     -> 12.00
   Show (Shape'(X | Y => 9.9));   --  runs Shape.Area -> 0.00

   --  Membership works on the family:
   if C in Circle then
      Put_Line ("C is a circle with radius" & Float'Image (C.Radius));
   end if;
end OOP;
