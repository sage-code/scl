------------------------------------------------------------------------------
-- 09_access_types.adb — allocation, dereferencing, null exclusion.
--
-- Demonstrates: access types are typed references; .all dereferences;
-- "not null" moves the check to the call site; no manual free anywhere.
-- Compile: gnatmake 09_access_types.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Access_Types is

   --  An access-to-Integer type. The pointer itself is a value that
   --  lives like any variable (here, on the stack).
   type Int_Ptr is access Integer;

   P : Int_Ptr := new Integer'(42);   --  allocate + initialize on the heap
   Q : Int_Ptr;                       --  null by default
   N : aliased Integer := 7;          --  aliased: may be pointed at

   --  'all' in the type means P may also point at aliased VARIABLES,
   --  not just heap objects:
   type Var_Ptr is access all Integer;
   NP : Var_Ptr := N'Access;          --  points at the stack variable

   --  not null moves the check to the CALL SITE — the body is safe:
   procedure Show (Ptr : not null Int_Ptr) is
   begin
      Put_Line ("value = " & Integer'Image (Ptr.all));
   end Show;
begin
   Show (P);                          --  value = 42

   P.all := P.all + 1;                --  dereference: write through P
   Show (P);                          --  value = 43

   if Q = null then
      Put_Line ("Q points nowhere yet");
   end if;

   Put_Line ("via stack pointer: " & Integer'Image (NP.all));   --  7

   --  Show (Q);   --  run-time check fails: Q is null, contract violated
   --  There is no free(): the pool is reclaimed at scope finalization.
end Access_Types;
