; LLVM IR (SSA form): compute sum of integers 1..n.
; Every virtual register (%0, %i, %acc) is assigned exactly once.

define i32 @sum_to(i32 %n) {
entry:
  %cmp0 = icmp sle i32 %n, 0
  br i1 %cmp0, label %exit, label %loop

loop:
  ; phi nodes merge values arriving from predecessor basic blocks
  %i   = phi i32 [ 1, %entry ], [ %i_next, %loop ]
  %acc = phi i32 [ 0, %entry ], [ %acc_next, %loop ]
  %acc_next = add nsw i32 %acc, %i
  %i_next   = add nsw i32 %i, 1
  %cond     = icmp sle i32 %i_next, %n
  br i1 %cond, label %loop, label %exit

exit:
  %result = phi i32 [ 0, %entry ], [ %acc_next, %loop ]
  ret i32 %result
}
