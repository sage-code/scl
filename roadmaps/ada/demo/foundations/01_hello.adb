------------------------------------------------------------------------------
-- 01_hello.adb — your first Ada program.
--
-- Every Ada unit has three regions: context clauses (with/use), a
-- declarative part (between "is" and "begin"), and a statement part.
-- Compile:  gnatmake 01_hello.adb    Run:  ./01_hello
------------------------------------------------------------------------------
with Ada.Text_IO;   --  make the standard text I/O library visible.
                    --  Ada.Text_IO is a package: its subprograms are
                    --  reached through the package name unless we "use" it.

procedure Hello is
   --  Declarative part: names are declared here, before use.
   --  Every name has a type — there are no implicit conversions.
   Greeting : constant String := "Hello, Ada!";  -- constant: never reassigned
begin
   --  Statement part: executable code.
   --  We write the qualified name because there is no "use" clause;
   --  with "use Ada.Text_IO;" we could write Put_Line directly.
   Ada.Text_IO.Put_Line (Greeting);

   --  Delay so that batching terminals keep the output visible (no-op here):
   null;   --  "null;" is the explicit empty statement
end Hello;
