program declarations
  ! Declaration syntax in full: type [,attributes] :: names.
  ! Attribute 'parameter' makes the value a named compile-time constant.
  implicit none
  integer, parameter :: n = 10        ! constant — cannot be assigned later
  real, parameter    :: pi = 3.14159_8   ! _8 suffix forces double precision
  real :: v(n)                        ! fixed-size array of ten reals
  integer :: i
  character(len=20) :: label = "fixed width"

  do i = 1, n
     v(i) = i * pi                  ! mixing integer i with real pi is fine
  end do
  print '(a,f8.4)', 'v(5) = ', v(5)
  print *, trim(label), len(label)  ! trimmed output, length still 20
end program declarations