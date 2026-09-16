program expressions
  ! Operator precedence and division traps. Predict each printed value
  ! before running; the comments carry the answers.
  implicit none
  print *, 1 + 2*3**2     ! 19  (** binds tightest, right-associative)
  print *, 7 / 2          ! 3   (integer division truncates)
  print *, 7.0 / 2        ! 3.5 (the decimal point changes the result)
  print *, -2**2          ! -4  (unary minus binds BELOW **)
  print *, (-2)**2        ! 4   (parentheses fix the intent)
  print *, 7 / 2 * 2      ! 6   (left-to-right AFTER truncation!)
  print *, .true. .and. .not. .false.   ! T (not binds tightest of logicals)
  print *, 7 >= 7 .and. 2 /= 3          ! T (relational then logical)
end program expressions