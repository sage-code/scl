------------------------------------------------------------------------------
-- 17_tasking.adb — tasks and a protected bounded buffer.
--
-- Demonstrates: task types with discriminants, delay, and a protected
-- object with entry barriers — a correct producer/consumer queue with
-- no mutexes. Compile: gnatmake 17_tasking.adb
------------------------------------------------------------------------------
with Ada.Text_IO; use Ada.Text_IO;

procedure Tasking is

   --  PROTECTED OBJECT: mutual exclusion + conditions, language-checked.
   protected Buffer is
      entry Put (Item : in Integer);
      entry Get (Item : out Integer);
   private
      Cells : array (1 .. 4) of Integer;
      Count : Natural := 0;
   end Buffer;

   protected body Buffer is
      --  Barrier: Put callers QUEUE until Count < 8... here < 4:
      entry Put (Item : in Integer) when Count < 4 is
      begin
         Count := Count + 1;
         Cells (Count) := Item;   --  exclusive access guaranteed
      end Put;

      entry Get (Item : out Integer) when Count > 0 is
      begin
         Item := Cells (Count);
         Count := Count - 1;
      end Get;
   end Buffer;

   --  A task type: each instantiation is an independent thread.
   task type Producer (N : Natural);
   task body Producer is
   begin
      for I in 1 .. N loop
         Buffer.Put (I);
         Put_Line ("produced" & Integer'Image (I));
      end loop;
   end Producer;

   P1 : Producer (N => 3);        --  starts immediately at declaration
   P2 : Producer (N => 2);
begin
   delay 0.5;                     --  let the producers run
   loop
      declare
         Item : Integer;
      begin
         Buffer.Get (Item);
         Put_Line ("consumed" & Integer'Image (Item));
         exit when Buffer.Count = 0;   --  drain and stop
      end;
   end loop;
end Tasking;
