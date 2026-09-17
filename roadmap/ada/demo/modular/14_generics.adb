------------------------------------------------------------------------------
-- 14_generics.adb — a generic stack, instantiated for two element types.
--
-- Demonstrates: the generic formal part (type + discriminant-as-value),
-- instantiation producing independent checked packages, and private
-- types inside a generic. Compile: gnatmake 14_generics.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Generics is

   --  A generic package: a template parameterized by the element type
   --  and the stack depth. The body must compile against the formals
   --  ALONE — errors are found in the template, before instantiation.
   generic
      type Item_T is private;             --  any element type
      Depth : Positive;                   --  a value formal
   package Stacks is
      type Stack is private;              --  each instance gets its own type
      procedure Push (S : in out Stack; Item : in Item_T);
      function Pop (S : in Stack) return Item_T;
      function Length (S : Stack) return Natural;
   private
      type Cell_Array is array (1 .. Depth) of Item_T;
      type Stack is record
         Cells : Cell_Array;
         Top   : Natural := 0;
      end record;
   end Stacks;

   package body Stacks is
      procedure Push (S : in out Stack; Item : in Item_T) is
      begin
         S.Top := S.Top + 1;              --  overflow raises Constraint_Error
         S.Cells (S.Top) := Item;
      end Push;

      function Pop (S : in Stack) return Item_T is
      begin
         return S.Cells (S.Top);          --  caller checks Length first
      end Pop;

      function Length (S : Stack) return Natural is (S.Top);
   end Stacks;

   --  Two independent instantiations — separate code, separate types:
   package Int_Stacks is new Stacks (Integer, Depth => 8);
   package Str_Stacks is new Stacks (String, Depth => 4);

   use Int_Stacks;
   S : Int_Stacks.Stack;
begin
   Push (S, 10);
   Push (S, 20);
   Push (S, 30);
   Put_Line ("length =" & Natural'Image (Length (S)));   --  3
   Put_Line ("top    =" & Integer'Image (Pop (S)));      --  30
end Generics;
