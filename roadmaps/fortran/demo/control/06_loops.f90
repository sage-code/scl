program loops
  ! The three loop families: counted DO, named loop with EXIT, and
  ! DO WHILE convergence. CYCLE skips one iteration; EXIT leaves the loop.
  implicit none
  integer :: i, first_negative
  integer :: data(10) = [3, 7, 2, -5, 9, 1, -2, 8, 4, 6]
  real :: x, err

  ! 1) counted DO with a step
  print '(a)', '--- counted do ---'
  do i = 1, 5, 2                 ! i = 1, 3, 5
     print '(a,i2)', 'step iteration i = ', i
  end do

  ! 2) named loop scanning for the first negative value
  print '(a)', '--- scan with exit ---'
  scan: do i = 1, size(data)
     if (data(i) < 0) then
        first_negative = data(i)
        exit scan                ! stop the named loop now
     end if
  end do scan
  print '(a,i0,a,i0)', 'first negative ', first_negative, ' at ', i

  ! 3) Newton iteration to sqrt(2) with a DO WHILE convergence test
  print '(a)', '--- convergence ---'
  x = 2.0
  err = huge(1.0)
  do while (err > 1.0e-5)
     x = 0.5 * (x + 2.0 / x)    ! the Newton step
     err = abs(x - sqrt(2.0))   ! measure how far we still are
     print '(f12.8)', x
  end do
end program loops