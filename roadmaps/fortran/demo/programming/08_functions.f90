program functions
  ! A function returns one value; a subroutine acts. INTENT documents and
  ! enforces the data-flow contract on every dummy argument.
  implicit none
  real :: a = 3.0, b = 4.0

  print '(a,f8.3)', 'hypot2(a,b) = ', hypot2(a, b)
  call report(a, b)

contains
  real function hypot2(x, y)
    real, intent(in) :: x, y            ! read-only inputs
    hypot2 = sqrt(x*x + y*y)            ! the result value
  end function hypot2

  subroutine report(x, y)
    real, intent(in) :: x, y
    print '(a,2f6.2)', 'args were: ', x, y
  end subroutine report
end program functions