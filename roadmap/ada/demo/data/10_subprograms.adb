------------------------------------------------------------------------------
-- 10_subprograms.adb — procedures, functions, modes, overloading.
--
-- Demonstrates: in/out/in out parameter modes (compiler-checked),
-- overloading, expression functions, and recursion.
-- Compile: gnatmake 10_subprograms.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Subprograms is

   --  PROCEDURE: an action. FUNCTIONS: a value — never callable as statements.
   procedure Greet (Name : in String) is
   begin
      Put_Line ("Hello, " & Name & "!");
   end Greet;

   --  Parameter MODES: "in" is read-only (the default), "out" writes a
   --  result, "in out" updates in place. The compiler checks every mode.
   procedure Swap (A, B : in out Integer) is
      Tmp : constant Integer := A;
   begin
      A   := B;
      B   := Tmp;
   end Swap;

   --  Expression function: single-expression body.
   function Square (X : in Integer) return Integer is (X * X);

   --  Overloading: same name, different profiles — resolved by types.
   function Max (A, B : Integer) return Integer is
     (if A > B then A else B);
   function Max (A, B : Float)   return Float is
     (if A > B then A else B);

   --  Recursion: the return type bounds the domain naturally.
   function Factorial (N : Natural) return Natural is
     (if N <= 1 then 1 else N * Factorial (N - 1));

   X : Integer := 3;
   Y : Integer := 9;
begin
   Greet ("Ada");                                  --  a statement
   Put_Line (Integer'Image (Square (7)));          --  49, an expression
   Put_Line (Integer'Image (Max (3, 5)));          --  Integer version: 5
   Put_Line (Float'Image (Max (2.0, 9.5)));        --  Float version: 9.5
   Put_Line (Natural'Image (Factorial (5)));       --  120

   Swap (X, Y);
   Put_Line ("x =" & Integer'Image (X) & " y =" & Integer'Image (Y));  --  9, 3
end Subprograms;
